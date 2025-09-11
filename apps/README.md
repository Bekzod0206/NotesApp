# Notes API

A simple **NestJS + Prisma + PostgreSQL + Redis** Notes application.  
Supports **JWT authentication**, **refresh tokens**, and **caching**.  

Runs fully via **Docker Compose**.

---

## Quick start

### 1. Clone & configure
```bash
git clone <your-repo-url>
cd NotesApp/apps/api
cp .env.example .env
```

### 2. Run with Docker
```bash
docker compose up -d --build
```

### 3. Verify health
```bash
curl http://localhost:3000/health/ready
```
you should see
```json
{ "ok": true, "db": "up", "redis": "up", "status": 200 }
```

### API Overview

Base URL: http://localhost:3000

### Health
```bash
GET /health/live → { ok: true, status: "live" }
GET /health/ready → { ok: true, db: "up", redis: "up" }
```

### Auth
```bash
POST /auth/sign-up → { email, password }
POST /auth/log-in → { email, password } → { accessToken, refreshToken }
POST /auth/refresh → { refreshToken }
POST /auth/logout → { refreshToken }
POST /auth/logout-all (requires Bearer token)
```

### Notes (Bearer token required)
```bash
POST /notes → { title, content? }
GET /notes?limit=10&cursor=&sort=desc&query=
GET /notes/:id
PATCH /notes/:id → { title?, content? }
DELETE /notes/:id
```

### Local development (without Docker)
```bash
# Start Postgres + Redis via Docker Compose
docker compose up -d postgres redis

# Install deps
npm install

# Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate deploy

# Start dev server
npm run start:dev
```

### Environment variables
Copy .env.example to .env.
For Docker Compose use:

```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/notesdb
REDIS_URL=redis://redis:6379
```

### Handy commands
```bash
# Start containers
npm run docker:up

# Stop containers
npm run docker:down

# View logs
npm run docker:logs

# Apply DB migrations
npm run docker:migrate
```

Make it your own
Change JWT_SECRET in .env
Adjust rate limits in .env
After adding Swagger, check http://localhost:3000/docs for API documentation

After adding Swagger, check /docs for API documentation