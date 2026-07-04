import { BicycleEventType, BikeStatus, RideStatus } from '@prisma/client'
import type { FastifyBaseLogger } from 'fastify'
import prisma from '../prisma/client.js'

const RESERVATION_EXPIRATION_INTERVAL_MS = 10_000

async function expireOverdueReservations(log: FastifyBaseLogger) {
  const now = new Date()
  const overdueBikes = await prisma.bike.findMany({
    where: {
      status: BikeStatus.RESERVED,
      reservedUntil: { lte: now },
    },
    select: { id: true },
  })

  let expiredCount = 0
  for (const bike of overdueBikes) {
    await prisma.$transaction(async (tx) => {
      const expiredBike = await tx.bike.updateMany({
        where: {
          id: bike.id,
          status: BikeStatus.RESERVED,
          reservedUntil: { lte: now },
        },
        data: { status: BikeStatus.AVAILABLE, reservedUntil: null },
      })
      if (expiredBike.count === 0) return

      const pendingRide = await tx.ride.findFirst({
        where: {
          bikeId: bike.id,
          status: RideStatus.RESERVED,
          endedAt: null,
        },
        orderBy: { reservedAt: 'desc' },
      })

      if (pendingRide) {
        await tx.ride.update({
          where: { id: pendingRide.id },
          data: { status: RideStatus.EXPIRED, endedAt: now },
        })
      }

      await tx.bicycleEvent.create({
        data: {
          bikeId: bike.id,
          rideId: pendingRide?.id ?? null,
          event: BicycleEventType.reservation_expired,
          status: BikeStatus.AVAILABLE,
          reason: 'reservation_timeout',
          createdAt: now,
        },
      })
      expiredCount += 1
    })
  }

  if (expiredCount > 0) {
    log.info({ count: expiredCount }, 'Reservas expiradas')
  }
}

export function startReservationExpirationWorker(log: FastifyBaseLogger) {
  const interval = setInterval(() => {
    expireOverdueReservations(log).catch((error: unknown) => {
      log.error({ err: error }, 'Erro ao expirar reservas')
    })
  }, RESERVATION_EXPIRATION_INTERVAL_MS)

  interval.unref()
  return interval
}
