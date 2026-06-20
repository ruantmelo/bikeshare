import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod/v4";
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

const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.string(),
});

const authResponseSchema = z.object({
  token: z.string(),
  user: publicUserSchema,
});

const errorResponseSchema = z.object({
  error: z.string(),
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
  const zodApp = app.withTypeProvider<ZodTypeProvider>();

  zodApp.post(
    "/register",
    {
      schema: {
        body: credentialsSchema,
        response: {
          200: authResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return reply.code(400).send({ error: "Email já cadastrado" });

      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashed },
      });

      const publicUser = serializeUser(user);
      const token = app.jwt.sign(publicUser, { expiresIn: "30d" });
      return { token, user: publicUser };
    },
  );

  zodApp.post(
    "/login",
    {
      schema: {
        body: credentialsSchema,
        response: {
          200: authResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return reply.code(401).send({ error: "Credenciais inválidas" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return reply.code(401).send({ error: "Credenciais inválidas" });

      const publicUser = serializeUser(user);
      const token = app.jwt.sign(publicUser, { expiresIn: "30d" });
      return { token, user: publicUser };
    },
  );
}
