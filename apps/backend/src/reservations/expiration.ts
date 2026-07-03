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
    include: {
      rides: {
        where: {
          status: RideStatus.RESERVED,
          endedAt: null,
        },
        orderBy: { reservedAt: 'desc' },
        take: 1,
      },
    },
  })

  for (const bike of overdueBikes) {
    const pendingRide = bike.rides[0]

    await prisma.$transaction(async (tx) => {
      await tx.bike.update({
        where: { id: bike.id },
        data: { status: BikeStatus.AVAILABLE, reservedUntil: null },
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
    })
  }

  if (overdueBikes.length > 0) {
    log.info({ count: overdueBikes.length }, 'Reservas expiradas')
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
