import 'dotenv/config'

import bcrypt from 'bcrypt'
import { BikeStatus, PrismaClient, UserRole } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const password = await bcrypt.hash('123456', 10)

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password, role: UserRole.admin },
    create: {
      email: 'admin@example.com',
      password,
      role: UserRole.admin,
    },
  })

  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: { password, role: UserRole.user },
    create: {
      email: 'user@example.com',
      password,
      role: UserRole.user,
    },
  })

  const bikes = [
    { id: 'bike-available-1', status: BikeStatus.AVAILABLE },
    { id: 'bike-available-2', status: BikeStatus.AVAILABLE },
    { id: 'bike-available-3', status: BikeStatus.AVAILABLE },
    { id: 'bike-unregistered-1', status: BikeStatus.UNREGISTERED },
    { id: 'bike-in-use-1', status: BikeStatus.IN_USE },
    { id: 'bike-error-1', status: BikeStatus.ERROR },
  ]

  for (const bike of bikes) {
    await prisma.bike.upsert({
      where: { id: bike.id },
      update: { status: bike.status },
      create: bike,
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
