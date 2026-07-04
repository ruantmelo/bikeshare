import {
  activeRideResponseSchema,
  rideErrorResponseSchema,
  rideHistoryResponseSchema,
  rideWithBicycleSchema,
  startRideRequestSchema,
  type RideErrorResponse,
  type RideWithBicycle,
} from '@bikeshare/contracts'
import { BicycleEventType, BikeStatus, RideStatus } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import prisma from '../prisma/client.js'
import { authenticate } from '../middleware/auth.js'
import { publishBikeCommand } from '../mqtt/subscriber.js'

type RideWithBike = Awaited<ReturnType<typeof findRideWithBike>>

function rideError(code: RideErrorResponse['code'], message: string): RideErrorResponse {
  return { code, message }
}

function toRideWithBicycle(ride: NonNullable<RideWithBike>): RideWithBicycle {
  return {
    id: ride.id,
    bicycleId: ride.bikeId,
    status: ride.status,
    reservedAt: ride.reservedAt.toISOString(),
    startedAt: ride.startedAt?.toISOString() ?? null,
    endedAt: ride.endedAt?.toISOString() ?? null,
    bicycle: {
      id: ride.bike.id,
      status: ride.bike.status,
      latitude: ride.bike.latitude,
      longitude: ride.bike.longitude,
    },
  }
}

async function findRideWithBike(rideId: string) {
  return prisma.ride.findUnique({
    where: { id: rideId },
    include: { bike: true },
  })
}

export default async function rideRoutes(app: FastifyInstance) {
  const zodApp = app.withTypeProvider<ZodTypeProvider>()

  zodApp.post(
    '/start',
    {
      preHandler: authenticate,
      schema: {
        security: [{ bearerAuth: [] }],
        body: startRideRequestSchema,
        response: {
          200: rideWithBicycleSchema,
          400: rideErrorResponseSchema,
          404: rideErrorResponseSchema,
          502: rideErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { bicycleId } = request.body
      const userId = request.user.id

      const bike = await prisma.bike.findUnique({ where: { id: bicycleId } })
      if (!bike) return reply.code(404).send(rideError('BICYCLE_NOT_FOUND', 'Bicicleta não encontrada'))
      if (bike.status !== BikeStatus.AVAILABLE) {
        return reply.code(400).send(rideError('BICYCLE_NOT_AVAILABLE', 'Bicicleta não disponível'))
      }

      const activeRide = await prisma.ride.findFirst({
        where: { userId, status: { in: [RideStatus.RESERVED, RideStatus.IN_USE] }, endedAt: null },
      })
      if (activeRide) return reply.code(400).send(rideError('ACTIVE_RIDE_EXISTS', 'Você já tem uma corrida ativa'))

      const reservedAt = new Date()
      const reservedUntil = new Date(reservedAt.getTime() + 60_000)

      const { ride, updatedBike } = await prisma.$transaction(async (tx) => {
        const claimedBike = await tx.bike.updateMany({
          where: { id: bicycleId, status: BikeStatus.AVAILABLE },
          data: { status: BikeStatus.RESERVED, reservedUntil },
        })

        if (claimedBike.count === 0) return { ride: null, updatedBike: null }

        const ride = await tx.ride.create({
          data: { userId, bikeId: bicycleId, status: RideStatus.RESERVED, reservedAt },
        })
        const updatedBike = await tx.bike.findUniqueOrThrow({ where: { id: bicycleId } })

        return { ride, updatedBike }
      })
      if (!ride || !updatedBike) {
        return reply.code(400).send(rideError('BICYCLE_NOT_AVAILABLE', 'Bicicleta não disponível'))
      }

      try {
        await publishBikeCommand(bicycleId, {
          protocolVersion: 1,
          type: 'rent_authorize',
          rental_id: ride.id,
        })
      } catch {
        const failedAt = new Date()
        await prisma.ride.update({
          where: { id: ride.id },
          data: { status: RideStatus.CANCELLED, endedAt: failedAt },
        })
        await prisma.bike.update({
          where: { id: bicycleId },
          data: { status: BikeStatus.AVAILABLE, reservedUntil: null },
        })
        await prisma.bicycleEvent.create({
          data: {
            bikeId: bicycleId,
            rideId: ride.id,
            event: BicycleEventType.command_publish_failed,
            status: BikeStatus.AVAILABLE,
            reason: 'mqtt_publish_failed',
            createdAt: failedAt,
          },
        })
        return reply
          .code(502)
          .send(rideError('COMMAND_PUBLISH_FAILED', 'Não foi possível autorizar a bicicleta'))
      }

      await prisma.bicycleEvent.create({
        data: {
          bikeId: bicycleId,
          rideId: ride.id,
          event: BicycleEventType.reservation_started,
          status: BikeStatus.RESERVED,
          createdAt: reservedAt,
        },
      })

      return toRideWithBicycle({ ...ride, bike: updatedBike })
    },
  )

  zodApp.post(
    '/end',
    {
      preHandler: authenticate,
      schema: {
        security: [{ bearerAuth: [] }],
        response: {
          200: rideWithBicycleSchema,
          404: rideErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.id

      const ride = await prisma.ride.findFirst({
        where: { userId, status: { in: [RideStatus.RESERVED, RideStatus.IN_USE] }, endedAt: null },
      })
      if (!ride) return reply.code(404).send(rideError('ACTIVE_RIDE_NOT_FOUND', 'Nenhuma corrida ativa'))

      const endedAt = new Date()
      const nextRideStatus = ride.status === RideStatus.RESERVED ? RideStatus.CANCELLED : RideStatus.COMPLETED
      const updated = await prisma.ride.update({
        where: { id: ride.id },
        data: { status: nextRideStatus, endedAt },
      })

      const updatedBike = await prisma.bike.update({
        where: { id: ride.bikeId },
        data: { status: BikeStatus.AVAILABLE, reservedUntil: null },
      })

      return toRideWithBicycle({ ...updated, bike: updatedBike })
    },
  )

  zodApp.get(
    '/active',
    {
      preHandler: authenticate,
      schema: {
        security: [{ bearerAuth: [] }],
        response: { 200: activeRideResponseSchema },
      },
    },
    async (request) => {
      const userId = request.user.id
      const ride = await prisma.ride.findFirst({
        where: { userId, status: { in: [RideStatus.RESERVED, RideStatus.IN_USE] }, endedAt: null },
        include: { bike: true },
      })

      return ride ? toRideWithBicycle(ride) : null
    },
  )

  zodApp.get(
    '/history',
    {
      preHandler: authenticate,
      schema: {
        security: [{ bearerAuth: [] }],
        response: { 200: rideHistoryResponseSchema },
      },
    },
    async (request) => {
      const userId = request.user.id
      const rides = await prisma.ride.findMany({
        where: { userId },
        orderBy: { reservedAt: 'desc' },
        include: { bike: true },
      })

      return rides.map(toRideWithBicycle)
    },
  )
}
