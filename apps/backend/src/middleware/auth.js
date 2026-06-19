export async function authenticate(request, reply) {
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ error: 'Token inválido ou ausente' })
  }
}

export async function adminOnly(request, reply) {
  await authenticate(request, reply)
  if (request.user?.role !== 'admin') {
    reply.code(403).send({ error: 'Acesso restrito a administradores' })
  }
}
