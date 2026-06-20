# Bikeshare — Backend

API do sistema de bicicletas compartilhadas, escrita em **TypeScript** com [Fastify](https://fastify.dev/), [Prisma](https://www.prisma.io/) (PostgreSQL) e ingestão de telemetria via **MQTT**. Telemetria em tempo real é repassada ao dashboard por WebSocket.

## Pré-requisitos

- Node.js 20+
- Docker + Docker Compose (para PostgreSQL e o broker MQTT Mosquitto)

## 1. Instalar dependências

```bash
cd apps/backend
npm install
```

## 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e ajuste se necessário:

```bash
cp .env.example .env
```

| Variável       | Descrição                                    | Padrão (dev)                                               |
| -------------- | -------------------------------------------- | --------------------------------------------------------- |
| `DATABASE_URL` | String de conexão do Postgres usada pelo Prisma | `postgresql://bikeshare:bikeshare123@localhost:5433/bikeshare` |
| `JWT_SECRET`   | Segredo para assinar/verificar tokens JWT    | `change_me`                                                |
| `MQTT_BROKER`  | URL do broker MQTT                            | `mqtt://localhost:1884`                                    |
| `PORT`         | Porta HTTP da API                            | `3000`                                                     |

## 3. Subir a infraestrutura (Postgres + Mosquitto)

```bash
docker compose up -d
```

Isso sobe:
- **PostgreSQL 16** em `localhost:5433`
- **Mosquitto (MQTT)** em `localhost:1884`

## 4. Preparar o banco (Prisma)

Aplica as migrations e gera o Prisma Client:

```bash
npm run db:migrate
```

> O `prisma generate` roda automaticamente junto com o `migrate`. Para gerar o client manualmente: `npx prisma generate`.

## 5. Rodar o backend

```bash
# desenvolvimento (hot reload via tsx)
npm run dev

# produção: compila para dist/ e executa
npm run build
npm start
```

A API sobe em `http://localhost:3000`.

- **Swagger / docs:** http://localhost:3000/docs
- **WebSocket (dashboard):** ws://localhost:3000/ws

### Scripts disponíveis

| Comando             | O que faz                                            |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Roda em modo dev com hot reload (`tsx watch`)        |
| `npm run build`     | Compila o TypeScript para `dist/`                    |
| `npm start`         | Executa o build de produção (`node dist/server.js`)  |
| `npm run typecheck` | Checa tipos sem emitir arquivos (`tsc --noEmit`)     |
| `npm run db:migrate`| Aplica migrations de desenvolvimento                 |
| `npm run db:studio` | Abre o Prisma Studio                                 |

## Prisma Studio

Interface visual para inspecionar e editar os dados do banco:

```bash
npm run db:studio
```

Abre em `http://localhost:5555`. Requer o Postgres rodando (passo 3) e o `DATABASE_URL` configurado.

## Simulação de bikes (MQTT)

Os scripts em `scripts/` publicam telemetria e eventos no broker MQTT, simulando bicicletas reais. Útil para popular o mapa/dashboard sem hardware. Requerem o **Mosquitto rodando** (passo 3).

### Uma bike

```bash
node scripts/simulate-bike.js BIKE_001
```

- O ID da bike é opcional (padrão: `BIKE_001`).
- Publica posição inicial aleatória em Maceió, depois telemetria (`lat`, `lng`, `speed`) a cada 3s.
- Emite eventos: `bike_online` ao conectar, `ride_started` após ~5s e `ride_ended` após ~20s.

### Frota inteira

Sobe 5 bikes (`BIKE_001`..`BIKE_005`) em paralelo:

```bash
bash scripts/simulate-fleet.sh
```

> O script usa caminho absoluto (`~/git/bikeshare/apps/backend/scripts/...`). Ajuste-o se o repositório estiver em outro local. Pressione `Ctrl+C` para parar a frota.

## Estrutura

```
apps/backend
├── src/
│   ├── server.ts          # bootstrap / listen
│   ├── app.ts             # Fastify, plugins, WebSocket, broadcast
│   ├── routes/            # auth, bikes, rides
│   ├── middleware/        # authenticate, adminOnly (JWT)
│   ├── mqtt/              # subscriber de telemetria/eventos
│   ├── prisma/           # PrismaClient
│   └── types/            # tipos e augmentation do @fastify/jwt
├── prisma/schema.prisma   # modelos: User, Bike, Ride, Telemetry
├── scripts/              # simulação de bikes via MQTT
├── docker-compose.yml     # Postgres + Mosquitto
└── .env.example
```
