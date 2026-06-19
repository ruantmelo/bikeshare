import app from './app.js'
import dotenv from 'dotenv'

dotenv.config()

try {
  await app.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
