# API Contract

Base URL: /api/v1

## Authentication

Core endpoints require:
X-API-Key: <INTERNAL_API_KEY>

Health endpoints remain public:
- GET /health
- GET /health/db

## Request headers
- Content-Type: application/json
- X-Request-Id: optional; generated when absent
- X-Correlation-Id: optional; generated when absent
- Idempotency-Key: recommended for retryable operations
- X-API-Key: required for protected core endpoints

## Implemented endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | /health | API health |
| GET | /health/db | DB health |
| POST | /leads | Create/upsert lead |
| GET | /leads/:id | Read lead |
| PATCH | /leads/:id | Update lead |
| POST | /events | Publish event to PostgreSQL outbox |
| GET | /workflow-runs/:id | Read n8n workflow status |
| POST | /approvals/:id/decision | Persist human approval decision |

## Lead
POST /leads accepts organizationId plus lead fields. externalSource + externalId use the database unique constraint for idempotent upsert behavior.

## Event
POST /events writes an application event to the PostgreSQL outbox for asynchronous n8n processing.

## Approval
POST /approvals/:id/decision accepts status approved or rejected and only changes pending approvals.

## Errors
400 validation, 401 authentication, 403 permission, 404 not found, 409 conflict/idempotency, 422 business rule, 429 rate limit, 500 server error, 503 dependency unavailable.

Retry policy belongs to n8n. Do not blindly retry non-idempotent actions.
