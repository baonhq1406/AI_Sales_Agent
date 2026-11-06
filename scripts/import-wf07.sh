
#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

# =========================================================
# 1. Xác định thư mục gốc project
# =========================================================

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

ENV_FILE="$ROOT_DIR/.env"
WORKFLOW_FILE="$ROOT_DIR/n8n/workflows/WF-07-omnichannel-ingestion.json"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERROR: Không tìm thấy file .env tại $ENV_FILE"
    exit 1
fi

if [[ ! -f "$WORKFLOW_FILE" ]]; then
    echo "ERROR: Không tìm thấy workflow tại $WORKFLOW_FILE"
    exit 1
fi

# =========================================================
# 2. Load biến môi trường từ .env
# =========================================================

set -a
source "$ENV_FILE"
set +a

: "${INTERNAL_API_KEY:?Thiếu INTERNAL_API_KEY trong .env}"
: "${POSTGRES_DB:?Thiếu POSTGRES_DB trong .env}"
: "${POSTGRES_USER:?Thiếu POSTGRES_USER trong .env}"
: "${POSTGRES_PASSWORD:?Thiếu POSTGRES_PASSWORD trong .env}"

# =========================================================
# 3. Sinh WF07 secret nếu chưa tồn tại
# =========================================================

if [[ -z "${WF07_WEBHOOK_SECRET:-}" ]]; then

    WF07_WEBHOOK_SECRET="$(openssl rand -hex 32)"

    if grep -q '^WF07_WEBHOOK_SECRET=' "$ENV_FILE"; then
        sed -i "s|^WF07_WEBHOOK_SECRET=.*|WF07_WEBHOOK_SECRET=$WF07_WEBHOOK_SECRET|" "$ENV_FILE"
    else
        printf '\nWF07_WEBHOOK_SECRET=%s\n' "$WF07_WEBHOOK_SECRET" >> "$ENV_FILE"
    fi

    export WF07_WEBHOOK_SECRET

    echo "Đã tạo WF07_WEBHOOK_SECRET và lưu vào .env."
else
    export WF07_WEBHOOK_SECRET
    echo "Đang sử dụng WF07_WEBHOOK_SECRET hiện có."
fi

# =========================================================
# 4. Tạo file credentials JSON
# =========================================================

TMP_CREDS="$(mktemp)"

cleanup() {
    rm -f "$TMP_CREDS"
    docker compose exec -T n8n \
        rm -f /tmp/wf07-creds.json /tmp/wf07.json \
        >/dev/null 2>&1 || true
}

trap cleanup EXIT

python3 - "$TMP_CREDS" <<'PY'
import json
import os
import sys

credentials = [
    {
        "id": "wf07CoreApiKey",
        "name": "Core API Key",
        "type": "httpHeaderAuth",
        "data": {
            "name": "X-API-Key",
            "value": os.environ["INTERNAL_API_KEY"]
        }
    },
    {
        "id": "wf07WebhookKey",
        "name": "WF-07 Webhook Secret",
        "type": "httpHeaderAuth",
        "data": {
            "name": "X-Webhook-Secret",
            "value": os.environ["WF07_WEBHOOK_SECRET"]
        }
    },
    {
        "id": "wf07Postgres",
        "name": "Sales Agent Postgres",
        "type": "postgres",
        "data": {
            "host": "postgres",
            "port": 5432,
            "database": os.environ["POSTGRES_DB"],
            "user": os.environ["POSTGRES_USER"],
            "password": os.environ["POSTGRES_PASSWORD"],
            "ssl": "disable",
            "maxConnections": 10,
            "allowUnauthorizedCerts": False,
            "sshTunnel": False
        }
    },
    {
        "id": "wf07Imap",
        "name": "WF-07 IMAP Inbox",
        "type": "imap",
        "data": {
            "user": "demo@example.com",
            "password": "demo",
            "host": "imap.gmail.com",
            "port": 993,
            "secure": True,
            "allowUnauthorizedCerts": False
        }
    }
]

with open(sys.argv[1], "w", encoding="utf-8") as f:
    json.dump(credentials, f, ensure_ascii=False, indent=2)
PY

echo "Đã tạo credentials JSON."

# =========================================================
# 5. Copy file vào container n8n
# =========================================================

docker compose cp "$TMP_CREDS" n8n:/tmp/wf07-creds.json

docker compose cp \
    "$WORKFLOW_FILE" \
    n8n:/tmp/wf07.json

# =========================================================
# 6. Import credentials
# =========================================================

echo "Importing WF-07 credentials..."

docker compose exec -T n8n \
    n8n import:credentials --input=/tmp/wf07-creds.json

# =========================================================
# 7. Import workflow
# =========================================================

echo "Importing WF-07 workflow..."

docker compose exec -T n8n \
    n8n import:workflow --input=/tmp/wf07.json

# =========================================================
# 8. Publish workflow
# =========================================================

echo "Publishing WF-07..."

docker compose exec -T n8n \
    n8n publish:workflow --id=wf07OmniIngest

# =========================================================
# 9. Restart n8n
# =========================================================

docker compose restart n8n

echo ""
echo "=========================================="
echo " WF-07 IMPORT COMPLETED SUCCESSFULLY"
echo "=========================================="
