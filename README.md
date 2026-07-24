# Car Portal Backend

Node.js + TypeScript REST API for the Car Portal driver dashboard. Uses raw SQL repositories on PostgreSQL, cookie-based web auth, and mobile refresh-token auth.

## Prerequisites

- Node.js 22+
- PostgreSQL 17+ (local install or the stack from [carportal-infra](https://github.com/ICS-Vortex/carportal-infra))

## Quick start (Docker stack)

The recommended local setup runs backend, PostgreSQL, nginx, and the reminder worker together from the [carportal-infra](https://github.com/ICS-Vortex/carportal-infra) repo:

```bash
git clone git@github.com:ICS-Vortex/carportal-infra.git car-portal
cd car-portal
git clone git@github.com:ICS-Vortex/carportal-backend.git backend
cp .env.example .env
docker compose up -d
```

Health check: `http://api.carmain.localhost.com/v1/health`

See the [infra README](https://github.com/ICS-Vortex/carportal-infra#local-setup) for hosts file entries and full stack details.

## Standalone development

Use this when you want to run the API directly on your machine instead of inside Docker.

1. Start PostgreSQL and create a database, or point at the Docker postgres service on `localhost:5432` if you expose it.

2. Create a `.env` file in this directory:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://car_portal:car_portal@localhost:5432/car_portal
FRONTEND_ORIGIN=http://carmain.localhost.com
API_ORIGIN=http://api.carmain.localhost.com
APP_BASE_URL=http://carmain.localhost.com
JWT_SECRET=replace-with-a-long-random-secret
COOKIE_DOMAIN=
COOKIE_SECURE=false
UPLOADS_DIR=./uploads
GOOGLE_CLIENT_ID=
```

3. Install dependencies and run migrations:

```bash
npm install
npm run db:migrate
```

4. Start the API with hot reload:

```bash
npm run dev
```

The server listens on port `4000`.

5. In a second terminal, start the reminder worker (optional but needed for email/in-app reminder delivery):

```bash
npm run worker:dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | API with `tsx watch` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled API |
| `npm run worker:dev` | Reminder worker with hot reload |
| `npm run worker:start` | Run compiled worker |
| `npm run db:migrate` | Apply SQL migrations from `src/db/migrations` |
| `npm run test:contracts` | Run OpenAPI contract tests |

## Migrations

Schema changes live in `src/db/migrations` as plain SQL files. The migration runner tracks applied files in a `schema_migrations` table.

```bash
npm run db:migrate
```

## API docs

- OpenAPI contract: [`docs/api/openapi.yaml`](https://github.com/ICS-Vortex/carportal-infra/blob/main/docs/api/openapi.yaml)
- Versioning policy: [`docs/api/versioning.md`](https://github.com/ICS-Vortex/carportal-infra/blob/main/docs/api/versioning.md)

## Production build

```bash
npm run build
npm run db:migrate:start
npm run start
```

Or use the production compose file from [carportal-infra](https://github.com/ICS-Vortex/carportal-infra):

```bash
docker compose -f docker-compose.prod.yml up --build -d
```
