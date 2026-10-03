# API Contract

Base URL: /api/v1

## Headers
Content-Type: application/json
X-Request-Id: unique request ID
Idempotency-Key: unique retry key for retryable operations
X-Correlation-Id: UUID

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | /health | API health |
| GET | /health/db | DB health |
| POST | /leads | Create/upsert lead |
| GET | /leads/:id | Read lead |
| PATCH | /leads/:id | Update lead |
| POST | /events | Publish application event |
| GET | /workflow-runs/:id | Workflow status |
| POST | /approvals/:id/decision | Human approval decision |

Sprint 1 implements the health endpoints; the other endpoints are reserved contracts.

## Lead
POST /leads:
{"organizationId":"uuid","externalSource":"linkedin","externalId":"lead-001","firstName":"An","lastName":"Nguyen","companyName":"Acme","email":"an@acme.example","phone":"+84...","source":"linkedin"}

externalSource + externalId should make ingestion idempotent.

## Event
POST /events:
{"eventName":"lead.created","aggregateType":"lead","aggregateId":"uuid","organizationId":"uuid","correlationId":"uuid","payload":{"leadId":"uuid"}}

Initial events: lead.created, lead.enriched, lead.scored, customer.interaction.received, quote.created, quote.approval.requested, quote.approval.completed, voice.call.started, voice.call.completed, workflow.failed.

## Workflow status
running | waiting | succeeded | failed | cancelled

## Approval
POST /approvals/:id/decision:
{"status":"approved","approvedBy":"uuid","decisionNote":"Approved for sending"}

Allowed decisions: approved | rejected.

## HTTP errors
400 validation, 401 authentication, 403 permission, 404 not found, 409 conflict/idempotency, 422 business rule, 429 rate limit, 500 server error, 503 dependency unavailable.

Do not blindly retry non-idempotent actions.
