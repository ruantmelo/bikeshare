import type { FastifyInstance } from 'fastify'
import prisma from '../prisma/client.js'
import { authenticate, adminOnly } from '../middleware/auth.js'

interface CreateBikeBody {
  id: string
}

export default async function bikeRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: authenticate }, async () => {
    return prisma.bike.findMany({
      where: { status: 'available' },
      select: { id: true, lat: true, lng: true, status: true },
    })
  })

  app.post<{ Body: CreateBikeBody }>('/', { preHandler: adminOnly }, async (request, reply) => {
    const { id } = request.body

    if (!id) return reply.code(400).send({ error: 'ID da bike é obrigatório' })

    const existing = await prisma.bike.findUnique({ where: { id } })
    if (existing) return reply.code(400).send({ error: 'Bike já cadastrada' })

    const bike = await prisma.bike.create({
      data: { id, status: 'available' },
    })

    return bike
  })

  app.get('/admin', { preHandler: adminOnly }, async () => {
    return prisma.bike.findMany({
      include: { _count: { select: { rides: true } } },
    })
  })

  app.get<{ Params: { bikeId: string } }>(
    '/admin/:bikeId/telemetry',
    { preHandler: adminOnly },
    async (request) => {
      const { bikeId } = request.params
      return prisma.telemetry.findMany({
        where: { bikeId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    },
  )

  app.delete<{ Params: { bikeId: string } }>(
    '/:bikeId',
    { preHandler: adminOnly },
    async (request, reply) => {
      const { bikeId } = request.params

      const bike = await prisma.bike.findUnique({ where: { id: bikeId } })
      if (!bike) return reply.code(404).send({ error: 'Bike não encontrada' })
      if (bike.status === 'in_use') return reply.code(400).send({ error: 'Bike em uso' })

      await prisma.bike.delete({ where: { id: bikeId } })
      return { message: 'Bike removida com sucesso' }
    },
  )
}
