# WF-04 — Agentic AI External API Orchestrator

## User Story U006
Agentic AI tự ra quyết định và gọi API bên ngoài, không phụ thuộc vào kịch bản cố định.

## Design
The workflow is agent-driven: the LLM decides whether external data is needed and which allowlisted tool to use. n8n remains the deterministic execution and safety layer.

### Node chain
1. Trigger - Agentic Request — receives organization_id, input, optional context and correlation ID.
2. Validation — validates required fields and UUID format.
3. Authentication — verifies X-API-Key.
4. Data Processing — normalizes context and injects the workflow/tool policy.
5. Create Workflow Run — persists a running record in workflow_runs.
6. AI Agent Planner — calls the LLM and requires structured JSON: action, tool_args, reason, confidence.
7. Decision & Plan — parses and validates the model output.
8. Decision Gate — branches between no_action and external-tool execution.
9. Tool Guard & URL Allowlist — converts tool arguments into a URL only for approved tools; arbitrary URLs from the model are rejected.
10. Execute External API — performs the selected external GET request with a short timeout.
11. Transformation — normalizes the agent decision and tool result.
12. PostgreSQL Update — marks workflow_runs successful and stores the result.
13. Success Log — creates a compact execution result for observability.
14. Respond to Webhook — returns the decision and tool result.
15. Error Trigger — catches workflow failures.
16. Error Handle & Retry — normalizes the failure for logging/retry policy.
17. Persist Error — marks the correlated workflow run as failed.

## Allowlisted tools for the demo
| Tool | Purpose | Parameters |
|---|---|---|
| exchange_rate | Retrieve current FX data | from, to |
| weather | Retrieve current weather | latitude, longitude |
| no_action | Answer using available context | none |

The model never receives permission to supply an arbitrary URL. The deterministic allowlist maps a tool name to an external endpoint.

## Example decisions

Example A — external call:

    {
      "action": "exchange_rate",
      "tool_args": { "from": "USD", "to": "EUR" },
      "reason": "The request requires a current exchange rate.",
      "confidence": 0.94
    }

Example B — no external call:

    {
      "action": "no_action",
      "tool_args": {},
      "reason": "The provided context is sufficient.",
      "confidence": 0.98
    }

## Security rules
- Internal webhook requires X-API-Key.
- Never trust an LLM-generated URL.
- Only the deterministic allowlist maps a tool name to an external endpoint.
- Validate currency codes and geographic coordinates before the HTTP call.
- Use a short external request timeout.
- Persist correlation_id and workflow_run_id.
- Never commit API keys into workflow exports.

## Acceptance criteria
- [ ] Agent chooses no_action or an allowlisted tool from the request context.
- [ ] Invalid/unsupported tool selection is rejected.
- [ ] Arbitrary URLs cannot be supplied by the model.
- [ ] External API result is persisted with the workflow run.
- [ ] Failure path records a failed workflow run.
- [ ] Response contains action, reason, confidence, tool_executed, and tool_result.
- [ ] Workflow contains at least the project-required 12-node convention.

Implementation note: the executable n8n JSON export is not committed by this step because the connected repository writer blocks creation of executable workflow JSON. The specification above is the source of truth for the importable workflow and avoids committing a misleading or incomplete export.
