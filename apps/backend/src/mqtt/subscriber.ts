import mqtt from 'mqtt'
import dotenv from 'dotenv'
import prisma from '../prisma/client.js'
import type { BroadcastMessage } from '../types/index.js'

dotenv.config()

interface TelemetryPayload {
  lat: number
  lng: number
  speed: number
}

interface EventPayload {
  event: string
  status: string
}

export function startMqttSubscriber(broadcast: (data: BroadcastMessage) => void) {
  const client = mqtt.connect(process.env.MQTT_BROKER ?? '')

  client.on('connect', () => {
    console.log('MQTT conectado')
    client.subscribe('bikes/+/telemetry')
    client.subscribe('bikes/+/events')
  })

  client.on('message', async (topic, message) => {
    const parts = topic.split('/')
    const bikeId = parts[1]
    const type = parts[2]

    let payload: unknown
    try {
      payload = JSON.parse(message.toString())
    } catch {
      console.error('Payload MQTT inválido:', message.toString())
      return
    }

    if (type === 'telemetry') {
      const { lat, lng, speed } = payload as TelemetryPayload

      await prisma.bike.upsert({
        where: { id: bikeId },
        update: { lat, lng, speed },
        create: { id: bikeId, lat, lng, speed, status: 'available' },
      })

      await prisma.telemetry.create({
        data: { bikeId, lat, lng, speed },
      })

      broadcast({ type: 'telemetry', bikeId, lat, lng, speed })
    }

    if (type === 'events') {
      const { event, status } = payload as EventPayload

      await prisma.bike.upsert({
        where: { id: bikeId },
        update: { status },
        create: { id: bikeId, status },
      })

      broadcast({ type: 'event', bikeId, event, status })
    }
  })

  client.on('error', (err) => {
    console.error('Erro MQTT:', err.message)
  })
}
