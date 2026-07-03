import '@fastify/jwt'
import type { WebSocket } from '@fastify/websocket'

/** JWT payload stored in tokens and exposed as `request.user`. */
export interface AuthUser {
  id: string
  email: string
  role: string
}

/** Message pushed to dashboard WebSocket clients. */
export type BroadcastMessage =
  | {
      type: 'telemetry'
      bikeId: string
      rideId: string | null
      status: string
      latitude: number | null
      longitude: number | null
      speedMetersPerSecond: number | null
    }
  | {
      type: 'event'
      bikeId: string
      rideId: string | null
      event: string
      status: string | null
      reason: string | null
    }

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser
    user: AuthUser
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    wsClients?: Set<WebSocket>
  }
}
