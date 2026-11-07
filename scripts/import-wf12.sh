
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

: "${GEMINI_API_KEY:?❌ GEMINI_API_KEY chưa được cấu hình trong .env}"

WF12_ID="wf12Multilingual"
WORKFLOW_FILE="n8n/workflows/WF-12-multilingual-support.json"

TEMP_DIR="$(mktemp -d)"
EXISTING_CREDS="$TEMP_DIR/existing-creds.json"
CREDS_FILE="$TEMP_DIR/wf12-creds.json"

cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

echo "======================================"
echo "       DEPLOY WORKFLOW WF-12"
echo "======================================"

if [[ ! -f "$WORKFLOW_FILE" ]]; then
    echo "❌ Không tìm thấy workflow: $WORKFLOW_FILE"
    exit 1
fi

echo "🔍 Kiểm tra credentials hiện có..."

CONTAINER_CREDS="/tmp/wf12-existing-creds.json"

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
print("yes" if "wf12WebhookKey" in ids else "no")
PY
)

TRANSLATE_EXISTS=$(python3 - "$EXISTING_CREDS" <<'PY'
import json, sys

with open(sys.argv[1]) as f:
    data = json.load(f)

ids = {item.get("id") for item in data}
print("yes" if "wf12TranslateKey" in ids else "no")
PY
)

# Tránh tạo secret mới nếu credential cũ đã tồn tại.
if [[ "$WEBHOOK_EXISTS" == "yes" && -z "${WF12_WEBHOOK_SECRET:-}" ]]; then
    echo "❌ Credential wf12WebhookKey đã tồn tại nhưng WF12_WEBHOOK_SECRET đang trống."
    echo "Hãy khôi phục secret cũ vào .env hoặc cập nhật lại credential trong n8n."
    exit 1
fi

# Tạo và lưu webhook secret nếu chưa có.
if [[ -z "${WF12_WEBHOOK_SECRET:-}" ]]; then
    WF12_WEBHOOK_SECRET="$(openssl rand -hex 16)"

    python3 - "$ENV_FILE" "$WF12_WEBHOOK_SECRET" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
secret = sys.argv[2]
content = path.read_text()

if "WF12_WEBHOOK_SECRET=" in content:
    lines = content.splitlines()
    lines = [
        f"WF12_WEBHOOK_SECRET={secret}"
        if line.startswith("WF12_WEBHOOK_SECRET=")
        else line
        for line in lines
    ]
    content = "\n".join(lines) + "\n"
else:
    content += f"\nWF12_WEBHOOK_SECRET={secret}\n"

path.write_text(content)
PY

    echo "✅ Đã tạo và lưu WF12_WEBHOOK_SECRET vào .env"
fi

echo "🔧 Chuẩn bị credentials..."

python3 - "$CREDS_FILE" "$WEBHOOK_EXISTS" "$TRANSLATE_EXISTS" \
    "$WF12_WEBHOOK_SECRET" "$GEMINI_API_KEY" <<'PY'
import json, sys

output, webhook_exists, translate_exists, secret, gemini_key = sys.argv[1:]

credentials = []

if webhook_exists == "no":
    credentials.append({
        "id": "wf12WebhookKey",
        "name": "WF-12 Webhook Secret",
        "type": "httpHeaderAuth",
        "data": {
            "name": "X-Webhook-Secret",
            "value": secret
        }
    })

if translate_exists == "no":
    credentials.append({
        "id": "wf12TranslateKey",
        "name": "WF-12 Translation API Key",
        "type": "httpHeaderAuth",
        "data": {
            "name": "x-goog-api-key",
            "value": gemini_key
        }
    })

with open(output, "w") as f:
    json.dump(credentials, f, indent=2)
PY

if [[ "$WEBHOOK_EXISTS" == "no" || "$TRANSLATE_EXISTS" == "no" ]]; then
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
    n8n publish:workflow --id="$WF12_ID"

echo "🔄 Restart n8n..."

docker compose restart n8n

echo ""
echo "======================================"
echo "       WF-12 DEPLOY COMPLETED"
echo "======================================"
echo "Workflow ID: $WF12_ID"
echo "Webhook credential: wf12WebhookKey"
echo "Gemini credential: wf12TranslateKey"
