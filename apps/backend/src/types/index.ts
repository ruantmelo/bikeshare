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
  | { type: 'telemetry'; bikeId: string; lat: number; lng: number; speed: number }
  | { type: 'event'; bikeId: string; event: string; status: string }

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
