# WF-04 — Agentic AI External API Orchestrator

WF-04 lets an AI agent decide whether external data is needed, select an allowlisted tool, validate tool parameters, execute the external API call, persist the result, and record workflow success/failure.

## Security
- Internal requests require `X-API-Key`.
- The agent cannot provide arbitrary URLs.
- Tool execution is restricted to an allowlist maintained in the workflow.
- External calls use short timeouts.
- Workflow execution is correlated with `correlation_id` and recorded in `workflow_runs`.

## Allowed tools
- `exchange_rate` → Frankfurter API
- `weather` → Open-Meteo API
- `no_action` → no external call

## Test payload
```json
{
  "organization_id": "00000000-0000-0000-0000-000000000001",
  "input": "What is the EUR value of a USD 1000 quote?",
  "context": {}
}
```

The workflow is imported from `n8n/workflows/WF-04-agentic-external-api-orchestrator.json` and is intentionally inactive until OpenAI and n8n environment variables are configured.
