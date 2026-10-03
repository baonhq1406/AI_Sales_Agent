# System Architecture

Channels / External Systems -> n8n -> NestJS API Gateway -> PostgreSQL/pgvector -> AI/Agent services.
n8n also connects to CRM, Voice providers, notifications and human approval. Next.js provides Dashboard, Customer 360 and HITL UI.

PostgreSQL is the shared system of record for leads, customer profiles, interactions, documents/vector chunks, agent tasks, approvals, workflow runs and events.

Cross-team rules: stable UUIDs, correlation_id propagation, idempotent retryable actions and documented API contracts.
