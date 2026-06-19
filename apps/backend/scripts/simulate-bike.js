import mqtt from 'mqtt'

const BIKE_ID = process.argv[2] || 'BIKE_001'
const BROKER = 'mqtt://localhost:1884'

// Área central de Maceió
const BASE_LAT = -9.6658
const BASE_LNG = -35.7350
const SPREAD = 0.01 // ~1km de raio

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
  console.log(`Bike ${BIKE_ID} conectada ao broker`)

  publish(`bikes/${BIKE_ID}/events`, {
    event: 'bike_online',
    status: 'available',
  })

  setInterval(() => {
    lat += randomDelta()
    lng += randomDelta()
    const speed = parseFloat((Math.random() * 25).toFixed(1))
    publish(`bikes/${BIKE_ID}/telemetry`, { lat, lng, speed })
  }, 3000)

  setTimeout(() => {
    publish(`bikes/${BIKE_ID}/events`, { event: 'ride_started', status: 'in_use' })
  }, 5000)

  setTimeout(() => {
    publish(`bikes/${BIKE_ID}/events`, { event: 'ride_ended', status: 'available' })
  }, 20000)
})

client.on('error', (err) => console.error('Erro:', err.message))
