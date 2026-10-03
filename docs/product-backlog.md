# Product Backlog

## Sprint 1
| ID | Task | Status | Owner |
|---:|---|---|---|
| 1 | Khởi tạo source code và môi trường NestJS, NextJS, n8n | Done | Bảo |
| 2 | Docker + PostgreSQL + pgvector | Done | Bảo |
| 3 | Product Backlog + API Contract | Done | Bảo |

## Workflows
| ID | Workflow | Owner |
|---|---|---|
| WF-01 | Voice AI Outbound Calling Agent | Bảo |
| WF-02 | Voice AI Inbound Receptionist | Bảo |
| WF-03 | Multi-Agent Orchestrator | Bảo |
| WF-04 | Autonomous Workflow Agent | Bảo |
| WF-05 | Core Backend API Gateway | Bảo |
| WF-06 | Deployment & Architecture | Bảo |
| WF-07..12 | Data, RAG, OCR, competitor, multilingual | Hoàng |
| WF-13..18 | Scoring, quote, CRM, approval, meeting, renewal | Đức |
| WF-19..24 | Email, dashboard, follow-up, churn, HITL, monitoring | Khoa |

## Definition of Done
- 12-node architecture
- API Contract compliant
- PostgreSQL state persisted
- correlation_id propagated
- success logging
- Error Trigger + retry/error handling
- reproducible demo scenario
