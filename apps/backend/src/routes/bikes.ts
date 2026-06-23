import { BikeStatus } from '@prisma/client'
import { nearbyBicyclesResponseSchema } from '@bikeshare/contracts'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import prisma from '../prisma/client.js'
import { authenticate, adminOnly } from '../middleware/auth.js'

interface CreateBikeBody {
  id: string
}

// Posição do usuário: lat e lng devem ser informados juntos (ou nenhum).
const listBikesQuerySchema = z
  .object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
  })
  .refine((q) => (q.lat === undefined) === (q.lng === undefined), {
    message: 'Informe lat e lng juntos',
  })

const nearbyBikesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
})

const bikeListItemSchema = z.object({
  id: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  status: z.enum(BikeStatus),
  distance: z.number().nullable().optional(),
})

/** Distância em metros entre dois pontos (fórmula de Haversine). */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000 // raio da Terra em metros
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Gera um número determinístico entre 0 e 1 a partir de uma string. */
function hashToUnitInterval(value: string): number {
  let hash = 2_166_136_261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }

  return (hash >>> 0) / 4_294_967_295
}

/** Posiciona a bike entre 100 e 1.000 metros do usuário. */
function generateNearbyPosition(userLat: number, userLng: number, bikeId: string) {
  const earthRadiusMeters = 6_371_000
  const minDistanceMeters = 100
  const maxDistanceMeters = 1_000
  const distance =
    minDistanceMeters +
    hashToUnitInterval(`${bikeId}:distance`) * (maxDistanceMeters - minDistanceMeters)
  const bearing = hashToUnitInterval(`${bikeId}:bearing`) * 2 * Math.PI
  const angularDistance = distance / earthRadiusMeters
  const lat1 = (userLat * Math.PI) / 180
  const lng1 = (userLng * Math.PI) / 180

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
  )
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    )

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: ((((lng2 * 180) / Math.PI + 180) % 360) + 360) % 360 - 180,
    distance: Math.round(distance),
  }
}

export default async function bikeRoutes(app: FastifyInstance) {
  const zodApp = app.withTypeProvider<ZodTypeProvider>()

  zodApp.get(
    '/nearby',
    {
      preHandler: authenticate,
      schema: {
        security: [{ bearerAuth: [] }],
        querystring: nearbyBikesQuerySchema,
        response: { 200: nearbyBicyclesResponseSchema },
      },
    },
    async (request) => {
      const { lat, lng } = request.query
      const bikes = await prisma.bike.findMany({
        where: { status: BikeStatus.AVAILABLE },
        select: { id: true, status: true },
      })

      return bikes
        .map((bike) => ({
          id: bike.id,
          status: bike.status,
          ...(() => {
            const { lat: latitude, lng: longitude, distance: distanceMeters } =
              generateNearbyPosition(lat, lng, bike.id)
            return { latitude, longitude, distanceMeters }
          })(),
        }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
    },
  )

  zodApp.get(
    '/',
    {
      preHandler: authenticate,
      schema: {
        security: [{ bearerAuth: [] }],
        querystring: listBikesQuerySchema,
        response: { 200: z.array(bikeListItemSchema) },
      },
    },
    async (request) => {
      const { lat, lng } = request.query

      const bikes = await prisma.bike.findMany({
        where: { status: BikeStatus.AVAILABLE },
        select: { id: true, lat: true, lng: true, status: true },
      })

      // Sem posição do usuário: retorna a lista como está.
      if (lat === undefined || lng === undefined) {
        return bikes
      }

      // Com posição: calcula a distância de cada bike e ordena da mais próxima.
      return bikes
        .map((bike) => ({
          ...bike,
          distance:
            bike.lat !== null && bike.lng !== null
              ? Math.round(haversineMeters(lat, lng, bike.lat, bike.lng))
              : null,
        }))
        .sort((a, b) => {
          if (a.distance === null) return 1
          if (b.distance === null) return -1
          return a.distance - b.distance
        })
    },
  )

  app.post<{ Body: CreateBikeBody }>('/', { preHandler: adminOnly, schema: { security: [{ bearerAuth: [] }] } }, async (request, reply) => {
    const { id } = request.body

    if (!id) return reply.code(400).send({ error: 'ID da bike é obrigatório' })

    const existing = await prisma.bike.findUnique({ where: { id } })
    if (existing) return reply.code(400).send({ error: 'Bike já cadastrada' })

    const bike = await prisma.bike.create({
      data: { id, status: BikeStatus.AVAILABLE },
    })

    return bike
  })

  app.get('/admin', { preHandler: adminOnly, schema: { security: [{ bearerAuth: [] }] } }, async () => {
    return prisma.bike.findMany({
      include: { _count: { select: { rides: true } } },
    })
  })

  app.get<{ Params: { bikeId: string } }>(
    '/admin/:bikeId/telemetry',
    { preHandler: adminOnly, schema: { security: [{ bearerAuth: [] }] } },
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
    { preHandler: adminOnly, schema: { security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { bikeId } = request.params

      const bike = await prisma.bike.findUnique({ where: { id: bikeId } })
      if (!bike) return reply.code(404).send({ error: 'Bike não encontrada' })
      if (bike.status === BikeStatus.IN_USE) return reply.code(400).send({ error: 'Bike em uso' })

      await prisma.bike.delete({ where: { id: bikeId } })
      return { message: 'Bike removida com sucesso' }
    },
  )
}
