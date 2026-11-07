#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

cd "$ROOT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ Không tìm thấy file .env"
    exit 1
fi

set -a
source "$ENV_FILE"
set +a

: "${GROQ_API_KEY:?❌ GROQ_API_KEY chưa được cấu hình trong .env}"

WF11_ID="wf11CompetitorAnalysis"
WORKFLOW_FILE="n8n/workflows/WF-11-competitor-analysis.json"

TEMP_DIR="$(mktemp -d)"
EXISTING_CREDS="$TEMP_DIR/existing-creds.json"
CREDS_FILE="$TEMP_DIR/wf11-creds.json"

cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

echo "======================================"
echo "       DEPLOY WORKFLOW WF-11"
echo "======================================"

if [[ ! -f "$WORKFLOW_FILE" ]]; then
    echo "❌ Không tìm thấy workflow: $WORKFLOW_FILE"
    exit 1
fi

echo "🔍 Kiểm tra credentials hiện có..."

CONTAINER_CREDS="/tmp/wf11-existing-creds.json"

docker compose exec -T n8n \
    n8n export:credentials --all --output="$CONTAINER_CREDS"

docker compose exec -T n8n \
    cat "$CONTAINER_CREDS" > "$EXISTING_CREDS"

docker compose exec -T n8n \
    rm -f "$CONTAINER_CREDS"

WEBHOOK_EXISTS=$(python3 - "$EXISTING_CREDS" <<'PY'
import json, sys

with open(sys.argv[1]) as f:
    data = json.load(f)

ids = {item.get("id") for item in data}
print("yes" if "wf11WebhookKey" in ids else "no")
PY
)

GROQ_EXISTS=$(python3 - "$EXISTING_CREDS" <<'PY'
import json, sys

with open(sys.argv[1]) as f:
    data = json.load(f)

ids = {item.get("id") for item in data}
print("yes" if "wf11GroqKey" in ids else "no")
PY
)

# Nếu webhook credential đã tồn tại nhưng .env chưa có secret,
# dừng lại để tránh tạo secret mới không khớp credential cũ.
if [[ "$WEBHOOK_EXISTS" == "yes" && -z "${WF11_WEBHOOK_SECRET:-}" ]]; then
    echo "❌ Credential wf11WebhookKey đã tồn tại nhưng WF11_WEBHOOK_SECRET đang trống."
    echo "Hãy khôi phục secret cũ vào .env hoặc cập nhật lại credential trong n8n."
    exit 1
fi

# Tạo secret nếu chưa có credential và chưa có secret.
if [[ -z "${WF11_WEBHOOK_SECRET:-}" ]]; then
    WF11_WEBHOOK_SECRET="$(openssl rand -hex 16)"

    python3 - "$ENV_FILE" "$WF11_WEBHOOK_SECRET" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
secret = sys.argv[2]
content = path.read_text()

if "WF11_WEBHOOK_SECRET=" in content:
    lines = content.splitlines()
    lines = [
        f"WF11_WEBHOOK_SECRET={secret}"
        if line.startswith("WF11_WEBHOOK_SECRET=")
        else line
        for line in lines
    ]
    content = "\n".join(lines) + "\n"
else:
    content += f"\nWF11_WEBHOOK_SECRET={secret}\n"

path.write_text(content)
PY

    echo "✅ Đã tạo và lưu WF11_WEBHOOK_SECRET vào .env"
fi

echo "🔧 Chuẩn bị credentials..."

python3 - "$CREDS_FILE" "$WEBHOOK_EXISTS" "$GROQ_EXISTS" \
    "$WF11_WEBHOOK_SECRET" "$GROQ_API_KEY" <<'PY'
import json, sys

output, webhook_exists, groq_exists, secret, groq_key = sys.argv[1:]

credentials = []

if webhook_exists == "no":
    credentials.append({
        "id": "wf11WebhookKey",
        "name": "WF-11 Webhook Secret",
        "type": "httpHeaderAuth",
        "data": {
            "name": "X-Webhook-Secret",
            "value": secret
        }
    })

if groq_exists == "no":
    credentials.append({
        "id": "wf11GroqKey",
        "name": "WF-11 Groq API Key",
        "type": "httpBearerAuth",
        "data": {
            "token": groq_key
        }
    })

with open(output, "w") as f:
    json.dump(credentials, f, indent=2)
PY

if [[ "$WEBHOOK_EXISTS" == "no" || "$GROQ_EXISTS" == "no" ]]; then
    echo "📥 Import credentials..."
    docker compose exec -T n8n \
        n8n import:credentials --input=/dev/stdin < "$CREDS_FILE"
else
    echo "ℹ️ Credentials đã tồn tại, bỏ qua import."
fi

echo "📥 Import workflow..."
docker compose exec -T n8n \
    n8n import:workflow --input=/dev/stdin < "$WORKFLOW_FILE"

echo "🚀 Publish workflow..."
docker compose exec -T n8n \
    n8n publish:workflow --id="$WF11_ID"

echo "🔄 Restart n8n..."
docker compose restart n8n

echo ""
echo "======================================"
echo "       WF-11 DEPLOY COMPLETED"
echo "======================================"
echo "Workflow ID: $WF11_ID"
echo "Webhook credential: wf11WebhookKey"
echo "Groq credential: wf11GroqKey"