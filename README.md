# AI Sales Agent & Customer 360

Capstone project: n8n + NestJS + Next.js + PostgreSQL/pgvector + AI Agents + Voice AI + Human-in-the-loop + Monitoring.

## Structure
- apps/api: NestJS Core API Gateway
- apps/web: Next.js Dashboard / HITL UI
- infra/postgres/init: PostgreSQL + pgvector schema
- n8n/workflows: WF-01..WF-24 workflow exports
- docs: architecture, backlog, API contract, development guide

## Run
```bash
cp .env.example .env
docker compose up --build
```

Services: Next.js :3001, NestJS :3000, n8n :5678, PostgreSQL :5432.

## Team
- Bảo: Core API, infrastructure, n8n orchestration, WF-01..06
- Hoàng: WF-07..12
- Đức: WF-13..18
- Khoa: WF-19..24

PostgreSQL is the shared source of truth. API Contract is the integration boundary.
