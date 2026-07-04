import { BicycleEventType, BikeStatus, RideStatus, type Prisma } from '@prisma/client'
import mqtt, { type IClientOptions, type MqttClient } from 'mqtt'
import dotenv from 'dotenv'
import type { FastifyBaseLogger } from 'fastify'
import { z } from 'zod/v4'
import prisma from '../prisma/client.js'
import type { BroadcastMessage } from '../types/index.js'
import { decodeFirmwareRideId } from './ride-id.js'

dotenv.config()

let mqttClient: MqttClient | null = null

const DEFAULT_MQTT_BROKER = 'mqtt://localhost:1884'

function optionalEnv(name: string) {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

function numberEnv(name: string, fallback: number) {
  const raw = optionalEnv(name)
  if (!raw) return fallback

  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function booleanEnv(name: string, fallback: boolean) {
  const raw = optionalEnv(name)
  if (!raw) return fallback

  if (['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())) return true
  if (['0', 'false', 'no', 'off'].includes(raw.toLowerCase())) return false
  return fallback
}

function buildMqttOptions(): IClientOptions {
  const username = optionalEnv('MQTT_USERNAME')
  const password = optionalEnv('MQTT_PASSWORD')

  return {
    clientId: optionalEnv('MQTT_CLIENT_ID') ?? `bikeshare-backend-${process.pid}`,
    clean: booleanEnv('MQTT_CLEAN', true),
    connectTimeout: numberEnv('MQTT_CONNECT_TIMEOUT_MS', 30_000),
    keepalive: numberEnv('MQTT_KEEPALIVE_SECONDS', 60),
    reconnectPeriod: numberEnv('MQTT_RECONNECT_PERIOD_MS', 5_000),
    rejectUnauthorized: booleanEnv('MQTT_REJECT_UNAUTHORIZED', true),
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
  }
}

const vectorSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
})

const telemetryPayloadSchema = z.object({
  protocolVersion: z.literal(1),
  bikeId: z.string().min(1),
  rideId: z.string().min(1).nullable().optional(),
  rental_id: z.string().min(1).nullable().optional(),
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
  rental_id: z.string().min(1).nullable().optional(),
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
  return rideId ? decodeFirmwareRideId(rideId) : undefined
}

function nullableRideId(rideId: string | null | undefined) {
  return rideId ? decodeFirmwareRideId(rideId) : null
}

function payloadRideId(payload: { rideId?: string | null; rental_id?: string | null }) {
  return payload.rideId ?? payload.rental_id
}

async function findRideForForeignKey(bikeId: string, rideId: string | null | undefined) {
  const normalizedRideId = normalizeRideId(rideId)
  if (!normalizedRideId) return null
  return prisma.ride.findFirst({
    where: { id: normalizedRideId, bikeId },
    select: { id: true },
  })
}

async function resolveActiveRide(bikeId: string, rideId: string | null | undefined) {
  const normalizedRideId = normalizeRideId(rideId)
  if (normalizedRideId) {
    return prisma.ride.findFirst({
      where: {
        id: normalizedRideId,
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
  const payloadRide = payloadRideId(payload)

  if (payload.status === BikeStatus.RESERVED) {
    const ride = await resolveActiveRide(payload.bikeId, payloadRide)
    if (!ride) return null

    await prisma.bike.update({
      where: { id: payload.bikeId },
      data: { status: BikeStatus.RESERVED },
    })
    return ride
  }

  if (payload.status === BikeStatus.IN_USE) {
    const ride = await resolveActiveRide(payload.bikeId, payloadRide)
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
    const ride = await resolveActiveRide(payload.bikeId, payloadRide)
    if (ride) {
      const bike = await prisma.bike.findUnique({ where: { id: payload.bikeId } })
      const reservationExpired =
        ride.status === RideStatus.RESERVED &&
        bike?.reservedUntil !== null &&
        bike?.reservedUntil !== undefined &&
        bike.reservedUntil <= receivedAt

      if (ride.status === RideStatus.RESERVED && !reservationExpired) {
        await prisma.bike.update({
          where: { id: payload.bikeId },
          data: { status: BikeStatus.RESERVED },
        })
        return ride
      }

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
  const rideForForeignKey = await findRideForForeignKey(payload.bikeId, payloadRideId(payload))
  const rideId = normalizeRideId(rideForForeignKey?.id)
  const gnss = payload.gnss.valid
    ? {
        latitude: payload.gnss.latitude ?? null,
        longitude: payload.gnss.longitude ?? null,
        altitudeMeters: payload.gnss.altitudeMeters ?? null,
        accuracyMeters: payload.gnss.accuracyMeters ?? null,
      }
    : {
        latitude: null,
        longitude: null,
        altitudeMeters: null,
        accuracyMeters: null,
      }

  const telemetry = await prisma.telemetry.create({
    data: {
      bikeId: payload.bikeId,
      rideId,
      status: payload.status,
      uptimeMs: BigInt(payload.uptimeMs),
      speedMetersPerSecond: payload.speedMetersPerSecond ?? null,
      gnssValid: payload.gnss.valid,
      latitude: gnss.latitude,
      longitude: gnss.longitude,
      altitudeMeters: gnss.altitudeMeters,
      accuracyMeters: gnss.accuracyMeters,
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
      latitude: gnss.latitude,
      longitude: gnss.longitude,
      speedMetersPerSecond: payload.speedMetersPerSecond ?? null,
      lastTelemetryAt: receivedAt,
    },
  })

  await reconcileTelemetryRide(payload, receivedAt)

  broadcast({
    type: 'telemetry',
    bikeId: payload.bikeId,
    rideId: nullableRideId(rideId),
    status: payload.status,
    latitude: telemetry.latitude,
    longitude: telemetry.longitude,
    speedMetersPerSecond: telemetry.speedMetersPerSecond,
  })
}

async function handleEvent(payload: EventPayload, broadcast: (data: BroadcastMessage) => void) {
  const receivedAt = new Date()
  const ride = await resolveActiveRide(payload.bikeId, payloadRideId(payload))
  const rideForForeignKey = ride ?? (await findRideForForeignKey(payload.bikeId, payloadRideId(payload)))
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

export function startMqttSubscriber(broadcast: (data: BroadcastMessage) => void, log: FastifyBaseLogger) {
  const brokerUrl = optionalEnv('MQTT_BROKER') ?? DEFAULT_MQTT_BROKER
  const mqttOptions = buildMqttOptions()

  mqttClient = mqtt.connect(brokerUrl, mqttOptions)

  mqttClient.on('connect', () => {
    log.info({ brokerUrl, clientId: mqttOptions.clientId }, 'MQTT conectado')
    mqttClient?.subscribe(['bikes/+/telemetry', 'bikes/+/events'], { qos: 1 }, (error, granted) => {
      if (error) {
        log.error({ err: error }, 'Erro ao assinar tópicos MQTT')
        return
      }

      log.info({ topics: granted?.map((topic) => topic.topic) }, 'Tópicos MQTT assinados')
    })
  })

  mqttClient.on('reconnect', () => {
    log.info({ brokerUrl, clientId: mqttOptions.clientId }, 'Reconectando ao MQTT')
  })

  mqttClient.on('offline', () => {
    log.warn({ brokerUrl, clientId: mqttOptions.clientId }, 'MQTT offline')
  })

  mqttClient.on('close', () => {
    log.warn({ brokerUrl, clientId: mqttOptions.clientId }, 'Conexão MQTT fechada')
  })

  mqttClient.on('message', async (topic, message) => {
    const topicParts = parseTopic(topic)
    if (!topicParts) {
      log.error({ topic }, 'Tópico MQTT inválido')
      return
    }

    let rawPayload: unknown
    try {
      rawPayload = JSON.parse(message.toString())
    } catch {
      log.error({ payload: message.toString() }, 'Payload MQTT inválido')
      return
    }

    const schema = topicParts.type === 'telemetry' ? telemetryPayloadSchema : eventPayloadSchema
    const parsed = schema.safeParse(rawPayload)
    if (!parsed.success) {
      log.error({ issues: parsed.error.issues }, 'Payload MQTT fora do protocolo')
      return
    }

    if (parsed.data.bikeId !== topicParts.bikeId) {
      log.error({ topic, bikeId: parsed.data.bikeId }, 'Payload MQTT com bikeId divergente')
      return
    }

    const bike = await prisma.bike.findUnique({ where: { id: topicParts.bikeId } })
    if (!bike) {
      log.error({ bikeId: topicParts.bikeId }, 'Payload MQTT de bicicleta desconhecida')
      return
    }

    try {
      if (topicParts.type === 'telemetry') {
        await handleTelemetry(parsed.data as TelemetryPayload, broadcast)
      } else {
        await handleEvent(parsed.data as EventPayload, broadcast)
      }
    } catch (error) {
      log.error({ err: error, topic }, 'Erro ao processar mensagem MQTT')
    }
  })

  mqttClient.on('error', (err) => {
    log.error({ err, brokerUrl, clientId: mqttOptions.clientId }, 'Erro MQTT')
  })
}
