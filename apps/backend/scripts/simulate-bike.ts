import mqtt from 'mqtt'
import { BikeStatus } from '@prisma/client'

const BIKE_ID = process.argv[2] || 'bike-available-1'
const BROKER = process.env.MQTT_BROKER ?? 'mqtt://localhost:1884'

const bikes = [
  { id: 'bike-available-1', status: BikeStatus.AVAILABLE },
  { id: 'bike-available-2', status: BikeStatus.AVAILABLE },
  { id: 'bike-available-3', status: BikeStatus.AVAILABLE },
  { id: 'bike-unregistered-1', status: BikeStatus.UNREGISTERED },
  { id: 'bike-in-use-1', status: BikeStatus.IN_USE },
  { id: 'bike-error-1', status: BikeStatus.ERROR },
]

// Maceió
const BASE_LAT = -9.6658
const BASE_LNG = -35.7350
const SPREAD = 0.01

const seeded = bikes.find((bike) => bike.id === BIKE_ID)
const status = seeded?.status ?? 'AVAILABLE'

// Posição inicial aleatória dentro da área
let lat = BASE_LAT + (Math.random() - 0.5) * SPREAD
let lng = BASE_LNG + (Math.random() - 0.5) * SPREAD

const client = mqtt.connect(BROKER)

function randomDelta() {
  return (Math.random() - 0.5) * 0.0005
}

function publish(topic, payload) {
  client.publish(topic, JSON.stringify(payload))
  console.log(`[${BIKE_ID}] → ${topic}:`, payload)
}

client.on('connect', () => {
  console.log(`Bike ${BIKE_ID} (${status}) conectada ao broker`)

  publish(`bikes/${BIKE_ID}/events`, { event: 'bike_online', status })

  setInterval(() => {
    lat += randomDelta()
    lng += randomDelta()
    const speed = parseFloat((Math.random() * 25).toFixed(1))
    publish(`bikes/${BIKE_ID}/telemetry`, { lat, lng, speed })
  }, 3000)

  if (status === 'AVAILABLE') {
    setTimeout(() => {
      publish(`bikes/${BIKE_ID}/events`, { event: 'ride_started', status: 'IN_USE' })
    }, 5000)

    setTimeout(() => {
      publish(`bikes/${BIKE_ID}/events`, { event: 'ride_ended', status: 'AVAILABLE' })
    }, 20000)
  }
})

client.on('error', (err) => console.error('Erro:', err.message))
