import Fastify from 'fastify'
import fjwt from '@fastify/jwt'
import fws, { type WebSocket } from '@fastify/websocket'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import dotenv from 'dotenv'
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

import authRoutes from './routes/auth.js'
import bikeRoutes from './routes/bikes.js'
import rideRoutes from './routes/rides.js'
import { startMqttSubscriber } from './mqtt/subscriber.js'
import type { BroadcastMessage } from './types/index.js'

dotenv.config()

const app = Fastify({
  logger:
    process.env.NODE_ENV === 'production'
      ? true
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        },
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(cors, { origin: '*' })
app.register(fjwt, { secret: process.env.JWT_SECRET ?? '' })
app.register(fws)

await app.register(swagger, {
  transform: jsonSchemaTransform,
  openapi: {
    info: {
      title: 'Bikeshare API',
      description: 'Backend do sistema de bicicletas compartilhadas',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
})

await app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: { docExpansion: 'list' },
})

app.register(authRoutes, { prefix: '/auth' })
app.register(bikeRoutes, { prefix: '/bikes' })
app.register(rideRoutes, { prefix: '/rides' })

app.get('/ws', { websocket: true }, (socket) => {
  app.log.info('Dashboard conectado via WebSocket')
  app.wsClients = app.wsClients ?? new Set<WebSocket>()
  app.wsClients.add(socket)
  socket.on('close', () => app.wsClients?.delete(socket))
})

export function broadcast(data: BroadcastMessage) {
  if (!app.wsClients) return
  const msg = JSON.stringify(data)
  for (const client of app.wsClients) {
    if (client.readyState === 1) client.send(msg)
  }
}

startMqttSubscriber(broadcast)

export default app
