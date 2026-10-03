# Development Guide

Use feature branches such as feat/wf-01-voice-outbound, feat/wf-13-lead-scoring and feat/wf-23-approval-ui.

Ownership:
- Bảo: apps/api, infra, n8n, shared platform contracts, WF-01..06.
- Hoàng: WF-07..12.
- Đức: WF-13..18.
- Khoa: WF-19..24.

Shared contract changes must update docs/api-contract.md and coordinate before editing infra/postgres/init/002_schema.sql.

Commit style: feat:, fix:, docs:, chore:.

Every workflow must document trigger/input, 12-node flow, PostgreSQL tables, events, credentials, retry strategy, approval requirement, success/error logging and demo scenario.
