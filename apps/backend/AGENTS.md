# Backend App Notes

## Stack

- Fastify `^5.8.5` with TypeScript and ESM.
- Prisma `^7.8.0` with PostgreSQL through `@prisma/adapter-pg`.
- Zod `^4.4.3` with `fastify-type-provider-zod` for Fastify-native request/response validation.
- JWT authentication through `@fastify/jwt`.
- Swagger is exposed at `/docs`.
- Development logs use `pino-pretty`; production logs remain structured JSON.

## Documentation to consult

Use Context7/current documentation before changing library-specific behavior for:

- Fastify route definitions, plugins, hooks, schema validation, logger options, and type providers.
- Zod schema syntax and parsing behavior.
- Prisma Client, Prisma schema, migrations, and `@prisma/adapter-pg`.
- `@fastify/jwt`, `@fastify/swagger`, `@fastify/websocket`, and `@fastify/cors`.

Relevant current references used for the validation decision:

- Fastify Type Providers: https://fastify.dev/docs/v5.7.x/Reference/Type-Providers/
- Fastify v5 migration/schema validation notes: https://github.com/fastify/fastify/blob/main/docs/Guides/Migration-Guide-V5.md
- Zod `safeParse`: https://github.com/colinhacks/zod/blob/main/README.md
- Fastify + Zod provider: https://www.npmjs.com/package/fastify-type-provider-zod

## Zod and Fastify validation policy

The backend uses full Fastify + Zod integration through `fastify-type-provider-zod`.

Required integration points:

- Import Zod from `zod/v4` in route files that define Fastify schemas.
- Set `app.setValidatorCompiler(validatorCompiler)` once in `src/app.ts` before registering routes.
- Set `app.setSerializerCompiler(serializerCompiler)` once in `src/app.ts` before registering routes.
- Pass `jsonSchemaTransform` to `@fastify/swagger` so Zod schemas are reflected in OpenAPI output.
- Use `app.withTypeProvider<ZodTypeProvider>()` before declaring routes with Zod schemas.
- Put request validation in route `schema.body`, `schema.params`, or `schema.querystring` rather than calling `safeParse` manually for the same payload.
- Put response contracts in `schema.response` when practical.

Do not use handler-level `schema.safeParse(request.body)` for payloads already covered by Fastify route schemas. Validation should happen before route handlers.

Use handler-level Zod parsing only for data that does **not** come from Fastify request schemas, or for domain checks that cannot reasonably be expressed in route schemas.

Fastify schema validation failures are request-shape errors and may return `400`. Credential mismatches after a valid login payload should return `401` with the generic auth message.

## Auth route conventions

- Authentication endpoints live in `src/routes/auth.ts` under the `/auth` prefix.
- Public auth responses must expose only `{ token, user: { id, email, role } }`.
- Never return password hashes, timestamps, or raw Prisma `User` objects from auth responses.
- JWTs currently expire in `30d`.
- Login credential failures should keep using the generic Portuguese message `Credenciais inválidas` so callers cannot distinguish unknown email from wrong password.
- Registration may return specific validation errors such as `Email inválido`, `Senha deve ter no mínimo 6 caracteres`, and `Email já cadastrado`.

## Prisma and environment

- Prisma client lives in `src/prisma/client.ts`.
- Keep `import 'dotenv/config'` before creating the Prisma adapter. ESM imports are evaluated before module bodies, so relying only on `dotenv.config()` in `app.ts` can create the Prisma adapter before `DATABASE_URL` is loaded.
- The development Postgres from `docker-compose.yml` is exposed on `localhost:5433`.
- Use `.env.example` for documented variables. Do not commit real secrets.

## Logging

- Keep production logs as structured JSON.
- Use `pino-pretty` only outside production for readable terminal output.
- Prefer `app.log`/request logging over `console.log` in route handlers.

## Validation guidelines

Run these checks after backend code changes:

```bash
cd apps/backend
npm run typecheck
```

Run these when Prisma schema, migrations, seed data, or database connectivity changes:

```bash
cd apps/backend
docker compose up -d
npm run db:migrate
node --import tsx -e 'import prisma from "./src/prisma/client.ts"; await prisma.user.count(); await prisma.$disconnect(); console.log("Prisma database connection OK")'
```

Run these when changing runtime startup, Fastify plugins, logging, or Swagger behavior:

```bash
cd apps/backend
npm run build
```

Manual smoke checks for auth changes:

- Start dependencies: `docker compose up -d`.
- Start API: `npm run dev`.
- Confirm Swagger opens at `http://localhost:3000/docs`.
- Exercise `/auth/register` and `/auth/login` with a valid email/password.
- Confirm invalid login credentials return `401` with `Credenciais inválidas`, not a `500`.
- Confirm malformed request bodies fail before route handlers through Fastify/Zod schema validation.
