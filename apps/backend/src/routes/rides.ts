import type { FastifyInstance } from 'fastify'
import prisma from '../prisma/client.js'
import { authenticate } from '../middleware/auth.js'

interface StartRideBody {
  bikeId: string
}

export default async function rideRoutes(app: FastifyInstance) {
  app.post<{ Body: StartRideBody }>('/start', { preHandler: authenticate }, async (request, reply) => {
    const { bikeId } = request.body
    const userId = request.user.id

    const bike = await prisma.bike.findUnique({ where: { id: bikeId } })
    if (!bike) return reply.code(404).send({ error: 'Bike não encontrada' })
    if (bike.status !== 'available') return reply.code(400).send({ error: 'Bike não disponível' })

    const activeRide = await prisma.ride.findFirst({
      where: { userId, endedAt: null },
    })
    if (activeRide) return reply.code(400).send({ error: 'Você já tem uma corrida ativa' })

    const ride = await prisma.ride.create({
      data: { userId, bikeId },
    })

    await prisma.bike.update({
      where: { id: bikeId },
      data: { status: 'in_use' },
    })

    return ride
  })

  app.post('/end', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.user.id

    const ride = await prisma.ride.findFirst({
      where: { userId, endedAt: null },
    })
    if (!ride) return reply.code(404).send({ error: 'Nenhuma corrida ativa' })

    const updated = await prisma.ride.update({
      where: { id: ride.id },
      data: { endedAt: new Date() },
    })

    await prisma.bike.update({
      where: { id: ride.bikeId },
      data: { status: 'available' },
    })

    return updated
  })

  app.get('/active', { preHandler: authenticate }, async (request) => {
    const userId = request.user.id
    return prisma.ride.findFirst({
      where: { userId, endedAt: null },
      include: { bike: true },
    })
  })

  app.get('/history', { preHandler: authenticate }, async (request) => {
    const userId = request.user.id
    return prisma.ride.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      include: { bike: true },
    })
  })
}
