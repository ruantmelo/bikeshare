import bcrypt from 'bcrypt'
import prisma from '../prisma/client.js'

export default async function authRoutes(app) {
  app.post('/register', async (request, reply) => {
    const { email, password } = request.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return reply.code(400).send({ error: 'Email já cadastrado' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, password: hashed },
    })

    const token = app.jwt.sign({ id: user.id, email: user.email, role: user.role })
    return { token }
  })

  app.post('/login', async (request, reply) => {
    const { email, password } = request.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return reply.code(401).send({ error: 'Credenciais inválidas' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return reply.code(401).send({ error: 'Credenciais inválidas' })

    const token = app.jwt.sign({ id: user.id, email: user.email, role: user.role })
    return { token }
  })
}
