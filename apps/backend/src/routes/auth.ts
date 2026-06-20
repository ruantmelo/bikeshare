import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";
import prisma from "../prisma/client.js";

interface PublicUser {
  id: string;
  email: string;
  role: string;
}

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type Credentials = z.infer<typeof credentialsSchema>;

function serializeUser(user: {
  id: string;
  email: string;
  role: string;
}): PublicUser {
  return { id: user.id, email: user.email, role: user.role };
}

export default async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: Credentials }>("/register", async (request, reply) => {
    const result = credentialsSchema.safeParse(request.body);
    if (!result.success) {
      return reply
        .code(400)
        .send({ error: result.error.issues[0]?.message ?? "Dados inválidos" });
    }

    const { email, password } = result.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return reply.code(400).send({ error: "Email já cadastrado" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed },
    });

    const publicUser = serializeUser(user);
    const token = app.jwt.sign(publicUser, { expiresIn: "30d" });
    return { token, user: publicUser };
  });

  app.post<{ Body: Credentials }>("/login", async (request, reply) => {
    const result = credentialsSchema.safeParse(request.body);

    if (!result.success) {
      return reply.code(401).send({ error: "Credenciais inválidas" });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.code(401).send({ error: "Credenciais inválidas" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return reply.code(401).send({ error: "Credenciais inválidas" });

    const publicUser = serializeUser(user);
    const token = app.jwt.sign(publicUser, { expiresIn: "30d" });
    return { token, user: publicUser };
  });
}
