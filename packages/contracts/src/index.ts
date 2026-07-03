import { z } from 'zod'

export const bicycleStatusValues = ['UNREGISTERED', 'AVAILABLE', 'RESERVED', 'IN_USE', 'ERROR'] as const

export const bicycleStatusSchema = z.enum(bicycleStatusValues)

export type BicycleStatus = z.infer<typeof bicycleStatusSchema>

export const rideStatusValues = ['RESERVED', 'IN_USE', 'COMPLETED', 'CANCELLED', 'EXPIRED'] as const

export const rideStatusSchema = z.enum(rideStatusValues)

export type RideStatus = z.infer<typeof rideStatusSchema>

export const nearbyBicycleSchema = z.object({
  id: z.string(),
  status: bicycleStatusSchema,
  latitude: z.number(),
  longitude: z.number(),
  distanceMeters: z.number(),
})

export type NearbyBicycle = z.infer<typeof nearbyBicycleSchema>

export const nearbyBicyclesResponseSchema = z.array(nearbyBicycleSchema)

export type NearbyBicyclesResponse = z.infer<typeof nearbyBicyclesResponseSchema>

export const bicycleSummarySchema = z.object({
  id: z.string(),
  status: bicycleStatusSchema,
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
})

export type BicycleSummary = z.infer<typeof bicycleSummarySchema>

export const startRideRequestSchema = z.object({
  bicycleId: z.string().min(1),
})

export type StartRideRequest = z.infer<typeof startRideRequestSchema>

export const rideWithBicycleSchema = z.object({
  id: z.string(),
  bicycleId: z.string(),
  status: rideStatusSchema,
  reservedAt: z.string().datetime(),
  startedAt: z.string().datetime().nullable(),
  endedAt: z.string().datetime().nullable(),
  bicycle: bicycleSummarySchema,
})

export type RideWithBicycle = z.infer<typeof rideWithBicycleSchema>

export const activeRideResponseSchema = rideWithBicycleSchema.nullable()

export type ActiveRideResponse = z.infer<typeof activeRideResponseSchema>

export const rideHistoryResponseSchema = z.array(rideWithBicycleSchema)

export type RideHistoryResponse = z.infer<typeof rideHistoryResponseSchema>

export const rideErrorCodeValues = [
  'BICYCLE_NOT_FOUND',
  'BICYCLE_NOT_AVAILABLE',
  'ACTIVE_RIDE_EXISTS',
  'ACTIVE_RIDE_NOT_FOUND',
  'COMMAND_PUBLISH_FAILED',
] as const

export const rideErrorCodeSchema = z.enum(rideErrorCodeValues)

export type RideErrorCode = z.infer<typeof rideErrorCodeSchema>

export const rideErrorResponseSchema = z.object({
  code: rideErrorCodeSchema,
  message: z.string(),
})

export type RideErrorResponse = z.infer<typeof rideErrorResponseSchema>
