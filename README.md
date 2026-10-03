# AI Sales Agent & Customer 360

Capstone project: n8n + NestJS + Next.js + PostgreSQL/pgvector + AI Agents + Voice AI + Human-in-the-loop + Monitoring.

## Structure

- `apps/api`: NestJS Core API Gateway
- `apps/web`: Next.js Dashboard / HITL UI
- `infra/postgres/init`: PostgreSQL + pgvector schema
- `n8n/workflows`: WF-01..WF-24 workflow exports
- `docs`: architecture, backlog, API contract, development guide

## Getting Started

### 1. Prerequisites

Install:

- Docker
- Docker Compose (Docker Compose v2 is recommended)
- Git

Check:

```bash
docker --version
docker compose version
git --version
```

### 2. Clone repository

```bash
git clone https://github.com/baonhq1406/AI_Sales_Agent.git
cd AI_Sales_Agent
```

### 3. Create environment file

```bash
cp .env.example .env
```

For local development, the values in `.env.example` can be used directly. Before deployment, replace all development/default secrets with real values.

Important variables:

```env
POSTGRES_USER=sales_agent
POSTGRES_PASSWORD=sales_agent_dev
POSTGRES_DB=ai_sales_agent
N8N_ENCRYPTION_KEY=change-this-local-development-key
INTERNAL_API_KEY=change-this-core-api-key
CORS_ORIGIN=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Never commit the real `.env` file.

### 4. Start the system

Build and start all services:

```bash
docker compose up --build
```

Run in background:

```bash
docker compose up -d --build
```

Services:

| Service | URL | Purpose |
|---|---|---|
| Next.js | http://localhost:3001 | Dashboard / HITL UI |
| NestJS API | http://localhost:3000 | Core API Gateway |
| API Health | http://localhost:3000/api/v1/health | API health check |
| DB Health | http://localhost:3000/api/v1/health/db | PostgreSQL health check |
| n8n | http://localhost:5678 | Workflow orchestration |
| PostgreSQL | localhost:5432 | Shared database |

### 5. Verify the system

Check running containers:

```bash
docker compose ps
```

Check API health:

```curl
curl http://localhost:3000/api/v1/health
```

Check PostgreSQL health:

```bash
curl http://localhost:3000/api/v1/health/db
```

A healthy API should return a JSON response with `status: "ok"`.

### 6. Test a protected Core API

Protected endpoints require the `X-API-Key` header.

Example:

```bash
curl -H "X-API-Key: $INTERNAL_API_KEY"   http://localhost:3000/api/v1/leads/00000000-0000-0000-0000-000000000000
```

For a normal local shell, load the value from `.env` or replace the header value with your local `INTERNAL_API_KEY`.

### 7. View logs

All services:

```bash
docker compose logs -f
```

API only:

```bash
docker compose logs -f api
```

n8n only:

```bash
docker compose logs -f n8n
```

PostgreSQL only:

```bash
docker compose logs -f postgres
```

### 8. Stop the system

Stop containers:

```bash
docker compose down
```

Stop containers and delete database/n8n volumes:

```bash
docker compose down -v
```

The second command permanently removes the local PostgreSQL and n8n data volumes. Use it only when a clean local environment is needed.

### 9. Development workflow

Team members work on their assigned branches:

```text
Bảo    -> bao
Hoàng  -> hoang
Đức    -> duc
Khoa   -> khoa
```

Do not push directly to `main`.

Normal flow:

```text
feature work
    -> personal/team branch
    -> Pull Request
    -> review
    -> merge into main
```

`main` is the shared integration branch.

## Team

- Bảo: Core API, infrastructure, n8n orchestration, WF-01..06
- Hoàng: WF-07..12
- Đức: WF-13..18
- Khoa: WF-19..24

PostgreSQL is the shared source of truth. API Contract is the integration boundary.
