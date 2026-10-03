# n8n Workflows

WF-01..WF-24 exports will be stored here.

Every production workflow follows the project 12-node convention:
1 Trigger
2 Data Processing
3 Validation
4 Authentication
5 Core API
6 AI/LLM
7 Decision
8 Transformation
9 PostgreSQL Update
10 Success Log
11 Error Trigger
12 Error Handle/Retry

Use PostgreSQL for shared state, API Contract for integration, correlation_id for tracing, workflow_runs for execution history and event_outbox for event hand-off. Never commit provider secrets in workflow JSON.
