import { BicycleEventType, BikeStatus, RideStatus, type Prisma } from '@prisma/client'
import mqtt, { type MqttClient } from 'mqtt'
import dotenv from 'dotenv'
import { z } from 'zod/v4'
import prisma from '../prisma/client.js'
import type { BroadcastMessage } from '../types/index.js'

dotenv.config()

let mqttClient: MqttClient | null = null

const vectorSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
})

const telemetryPayloadSchema = z.object({
  protocolVersion: z.literal(1),
  bikeId: z.string().min(1),
  rideId: z.string().min(1).nullable().optional(),
  status: z.enum(BikeStatus),
  uptimeMs: z.number().int().nonnegative(),
  speedMetersPerSecond: z.number().nonnegative().nullable().optional(),
  gnss: z.object({
    valid: z.boolean(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    altitudeMeters: z.number().nullable().optional(),
    accuracyMeters: z.number().nonnegative().nullable().optional(),
  }),
  motion: z.object({
    valid: z.boolean(),
    moving: z.boolean().nullable().optional(),
    accel: vectorSchema.nullable().optional(),
    gyro: vectorSchema.nullable().optional(),
    temperatureCelsius: z.number().nullable().optional(),
  }),
})

const eventPayloadSchema = z.object({
  protocolVersion: z.literal(1),
  bikeId: z.string().min(1),
  rideId: z.string().min(1).nullable().optional(),
  event: z.enum(BicycleEventType),
  status: z.enum(BikeStatus).nullable().optional(),
  reason: z.string().nullable().optional(),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
})

type TelemetryPayload = z.infer<typeof telemetryPayloadSchema>
type EventPayload = z.infer<typeof eventPayloadSchema>

function parseTopic(topic: string) {
  const parts = topic.split('/')
  if (parts.length !== 3 || parts[0] !== 'bikes' || !parts[1]) return null
  if (parts[2] !== 'telemetry' && parts[2] !== 'events') return null
  return { bikeId: parts[1], type: parts[2] }
}

function normalizeRideId(rideId: string | null | undefined) {
  return rideId ?? undefined
}

async function findRideForForeignKey(bikeId: string, rideId: string | null | undefined) {
  if (!rideId) return null
  return prisma.ride.findFirst({
    where: { id: rideId, bikeId },
    select: { id: true },
  })
}

async function resolveActiveRide(bikeId: string, rideId: string | null | undefined) {
  if (rideId) {
    return prisma.ride.findFirst({
      where: {
        id: rideId,
        bikeId,
        status: { in: [RideStatus.RESERVED, RideStatus.IN_USE] },
        endedAt: null,
      },
    })
  }

  const activeRides = await prisma.ride.findMany({
    where: {
      bikeId,
      status: { in: [RideStatus.RESERVED, RideStatus.IN_USE] },
      endedAt: null,
    },
    take: 2,
  })

  return activeRides.length === 1 ? activeRides[0] : null
}

async function reconcileTelemetryRide(payload: TelemetryPayload, receivedAt: Date) {
  if (payload.status === BikeStatus.RESERVED) {
    if (!payload.rideId) return null

    const ride = await prisma.ride.findFirst({
      where: {
        id: payload.rideId,
        bikeId: payload.bikeId,
        status: RideStatus.RESERVED,
        endedAt: null,
      },
    })
    if (!ride) return null

    await prisma.bike.update({
      where: { id: payload.bikeId },
      data: { status: BikeStatus.RESERVED },
    })
    return ride
  }

  if (payload.status === BikeStatus.IN_USE) {
    const ride = await resolveActiveRide(payload.bikeId, payload.rideId)
    if (ride && ride.status === RideStatus.RESERVED) {
      await prisma.ride.update({
        where: { id: ride.id },
        data: { status: RideStatus.IN_USE, startedAt: receivedAt },
      })
      await prisma.bicycleEvent.create({
        data: {
          bikeId: payload.bikeId,
          rideId: ride.id,
          event: BicycleEventType.ride_started,
          status: BikeStatus.IN_USE,
          reason: 'telemetry_reconciliation',
          createdAt: receivedAt,
        },
      })
    }
    await prisma.bike.update({
      where: { id: payload.bikeId },
      data: { status: BikeStatus.IN_USE, reservedUntil: null },
    })
    return ride
  }

  if (payload.status === BikeStatus.AVAILABLE) {
    const ride = await resolveActiveRide(payload.bikeId, payload.rideId)
    if (ride) {
      const bike = await prisma.bike.findUnique({ where: { id: payload.bikeId } })
      const reservationExpired =
        ride.status === RideStatus.RESERVED &&
        bike?.reservedUntil !== null &&
        bike?.reservedUntil !== undefined &&
        bike.reservedUntil <= receivedAt

      await prisma.ride.update({
        where: { id: ride.id },
        data: {
          status: reservationExpired ? RideStatus.EXPIRED : RideStatus.COMPLETED,
          endedAt: receivedAt,
        },
      })
      await prisma.bicycleEvent.create({
        data: {
          bikeId: payload.bikeId,
          rideId: ride.id,
          event: reservationExpired ? BicycleEventType.reservation_expired : BicycleEventType.ride_ended,
          status: BikeStatus.AVAILABLE,
          reason: 'telemetry_reconciliation',
          createdAt: receivedAt,
        },
      })
    }

    await prisma.bike.update({
      where: { id: payload.bikeId },
      data: { status: BikeStatus.AVAILABLE, reservedUntil: null },
    })
    return ride
  }

  await prisma.bike.update({
    where: { id: payload.bikeId },
    data: { status: payload.status },
  })
  return null
}

async function handleTelemetry(payload: TelemetryPayload, broadcast: (data: BroadcastMessage) => void) {
  const receivedAt = new Date()
  const rideForForeignKey = await findRideForForeignKey(payload.bikeId, payload.rideId)
  const rideId = normalizeRideId(rideForForeignKey?.id)

  const telemetry = await prisma.telemetry.create({
    data: {
      bikeId: payload.bikeId,
      rideId,
      status: payload.status,
      uptimeMs: BigInt(payload.uptimeMs),
      speedMetersPerSecond: payload.speedMetersPerSecond ?? null,
      gnssValid: payload.gnss.valid,
      latitude: payload.gnss.latitude ?? null,
      longitude: payload.gnss.longitude ?? null,
      altitudeMeters: payload.gnss.altitudeMeters ?? null,
      accuracyMeters: payload.gnss.accuracyMeters ?? null,
      motionValid: payload.motion.valid,
      moving: payload.motion.moving ?? null,
      accelX: payload.motion.accel?.x ?? null,
      accelY: payload.motion.accel?.y ?? null,
      accelZ: payload.motion.accel?.z ?? null,
      gyroX: payload.motion.gyro?.x ?? null,
      gyroY: payload.motion.gyro?.y ?? null,
      gyroZ: payload.motion.gyro?.z ?? null,
      temperatureCelsius: payload.motion.temperatureCelsius ?? null,
      createdAt: receivedAt,
    },
  })

  await prisma.bike.update({
    where: { id: payload.bikeId },
    data: {
      latitude: payload.gnss.valid ? (payload.gnss.latitude ?? null) : undefined,
      longitude: payload.gnss.valid ? (payload.gnss.longitude ?? null) : undefined,
      speedMetersPerSecond: payload.speedMetersPerSecond ?? null,
      lastTelemetryAt: receivedAt,
    },
  })

  await reconcileTelemetryRide(payload, receivedAt)

  broadcast({
    type: 'telemetry',
    bikeId: payload.bikeId,
    rideId: payload.rideId ?? null,
    status: payload.status,
    latitude: telemetry.latitude,
    longitude: telemetry.longitude,
    speedMetersPerSecond: telemetry.speedMetersPerSecond,
  })
}

async function handleEvent(payload: EventPayload, broadcast: (data: BroadcastMessage) => void) {
  const receivedAt = new Date()
  const ride = await resolveActiveRide(payload.bikeId, payload.rideId)
  const rideForForeignKey = ride ?? (await findRideForForeignKey(payload.bikeId, payload.rideId))
  const rideId = rideForForeignKey?.id ?? null

  await prisma.bicycleEvent.create({
    data: {
      bikeId: payload.bikeId,
      rideId,
      event: payload.event,
      status: payload.status ?? null,
      reason: payload.reason ?? null,
      details: (payload.details ?? undefined) as Prisma.InputJsonValue | undefined,
      createdAt: receivedAt,
    },
  })

  if (payload.event === BicycleEventType.ride_started && ride) {
    await prisma.ride.update({
      where: { id: ride.id },
      data: { status: RideStatus.IN_USE, startedAt: receivedAt },
    })
    await prisma.bike.update({
      where: { id: payload.bikeId },
      data: { status: BikeStatus.IN_USE, reservedUntil: null },
    })
  }

  if (payload.event === BicycleEventType.ride_ended && ride) {
    await prisma.ride.update({
      where: { id: ride.id },
      data: { status: RideStatus.COMPLETED, endedAt: receivedAt },
    })
    await prisma.bike.update({
      where: { id: payload.bikeId },
      data: { status: BikeStatus.AVAILABLE, reservedUntil: null },
    })
  }

  if (payload.event === BicycleEventType.reservation_expired && ride) {
    await prisma.ride.update({
      where: { id: ride.id },
      data: { status: RideStatus.EXPIRED, endedAt: receivedAt },
    })
    await prisma.bike.update({
      where: { id: payload.bikeId },
      data: { status: BikeStatus.AVAILABLE, reservedUntil: null },
    })
  }

  if (payload.event === BicycleEventType.command_rejected) {
    if (ride && ride.status === RideStatus.RESERVED) {
      await prisma.ride.update({
        where: { id: ride.id },
        data: { status: RideStatus.CANCELLED, endedAt: receivedAt },
      })
    }
    await prisma.bike.update({
      where: { id: payload.bikeId },
      data: { status: payload.status ?? BikeStatus.AVAILABLE, reservedUntil: null },
    })
  }

  if (payload.event === BicycleEventType.bicycle_online && payload.status) {
    await prisma.bike.update({
      where: { id: payload.bikeId },
      data: { status: payload.status },
    })
  }

  broadcast({
    type: 'event',
    bikeId: payload.bikeId,
    rideId,
    event: payload.event,
    status: payload.status ?? null,
    reason: payload.reason ?? null,
  })
}

export async function publishBikeCommand(bikeId: string, command: object) {
  if (!mqttClient?.connected) {
    throw new Error('MQTT client is not connected')
  }

  await new Promise<void>((resolve, reject) => {
    mqttClient?.publish(`bikes/${bikeId}/commands`, JSON.stringify(command), { qos: 1 }, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

export function startMqttSubscriber(broadcast: (data: BroadcastMessage) => void) {
  mqttClient = mqtt.connect(process.env.MQTT_BROKER ?? '')

  mqttClient.on('connect', () => {
    console.log('MQTT conectado')
    mqttClient?.subscribe(['bikes/+/telemetry', 'bikes/+/events'])
  })

  mqttClient.on('message', async (topic, message) => {
    const topicParts = parseTopic(topic)
    if (!topicParts) {
      console.error('Tópico MQTT inválido:', topic)
      return
    }

    let rawPayload: unknown
    try {
      rawPayload = JSON.parse(message.toString())
    } catch {
      console.error('Payload MQTT inválido:', message.toString())
      return
    }

    const schema = topicParts.type === 'telemetry' ? telemetryPayloadSchema : eventPayloadSchema
    const parsed = schema.safeParse(rawPayload)
    if (!parsed.success) {
      console.error('Payload MQTT fora do protocolo:', parsed.error.issues)
      return
    }

    if (parsed.data.bikeId !== topicParts.bikeId) {
      console.error('Payload MQTT com bikeId divergente:', { topic, bikeId: parsed.data.bikeId })
      return
    }

    const bike = await prisma.bike.findUnique({ where: { id: topicParts.bikeId } })
    if (!bike) {
      console.error('Payload MQTT de bicicleta desconhecida:', topicParts.bikeId)
      return
    }

    if (topicParts.type === 'telemetry') {
      await handleTelemetry(parsed.data as TelemetryPayload, broadcast)
    } else {
      await handleEvent(parsed.data as EventPayload, broadcast)
    }
  })

  mqttClient.on('error', (err) => {
    console.error('Erro MQTT:', err.message)
  })
}
