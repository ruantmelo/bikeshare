import {
  activeRideResponseSchema,
  rideErrorResponseSchema,
  rideHistoryResponseSchema,
  rideWithBicycleSchema,
  startRideRequestSchema,
  type RideErrorResponse,
  type RideWithBicycle,
} from '@bikeshare/contracts'
import { BikeStatus } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import prisma from '../prisma/client.js'
import { authenticate } from '../middleware/auth.js'

type RideWithBike = Awaited<ReturnType<typeof findRideWithBike>>

function rideError(code: RideErrorResponse['code'], message: string): RideErrorResponse {
  return { code, message }
}

function toRideWithBicycle(ride: NonNullable<RideWithBike>): RideWithBicycle {
  return {
    id: ride.id,
    bicycleId: ride.bikeId,
    startedAt: ride.startedAt.toISOString(),
    endedAt: ride.endedAt?.toISOString() ?? null,
    bicycle: {
      id: ride.bike.id,
      status: ride.bike.status,
      latitude: ride.bike.lat,
      longitude: ride.bike.lng,
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
        where: { userId, endedAt: null },
      })
      if (activeRide) return reply.code(400).send(rideError('ACTIVE_RIDE_EXISTS', 'Você já tem uma corrida ativa'))

      const ride = await prisma.ride.create({
        data: { userId, bikeId: bicycleId },
      })

      const updatedBike = await prisma.bike.update({
        where: { id: bicycleId },
        data: { status: BikeStatus.IN_USE },
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
        where: { userId, endedAt: null },
      })
      if (!ride) return reply.code(404).send(rideError('ACTIVE_RIDE_NOT_FOUND', 'Nenhuma corrida ativa'))

      const updated = await prisma.ride.update({
        where: { id: ride.id },
        data: { endedAt: new Date() },
      })

      const updatedBike = await prisma.bike.update({
        where: { id: ride.bikeId },
        data: { status: BikeStatus.AVAILABLE },
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
        where: { userId, endedAt: null },
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
        orderBy: { startedAt: 'desc' },
        include: { bike: true },
      })

      return rides.map(toRideWithBicycle)
    },
  )
}
