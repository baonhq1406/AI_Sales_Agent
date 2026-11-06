
#!/usr/bin/env bash
set -Eeuo pipefail

# =========================================================
# WF-10 OCR Document Extraction - Import & Deploy
# =========================================================

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="$ROOT_DIR/.env"
WORKFLOW_FILE="$ROOT_DIR/n8n/workflows/WF-10-ocr-document-extraction.json"

WF10_ID="wf10OcrExtract"

CONTAINER_CREDS="/tmp/wf10-creds.json"
CONTAINER_EXISTING_CREDS="/tmp/wf10-existing-creds.json"
CONTAINER_WORKFLOW="/tmp/wf10.json"

TMP_CREDS="$(mktemp)"

cleanup() {
    rm -f "$TMP_CREDS"

    docker compose exec -T n8n sh -c \
      "rm -f '$CONTAINER_CREDS' '$CONTAINER_EXISTING_CREDS' '$CONTAINER_WORKFLOW'" \
      >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "========== WF-10 DEPLOY =========="

# 1. Kiểm tra file
[ -f "$ENV_FILE" ] || {
    echo "ERROR: Khong tim thay file .env"
    exit 1
}

[ -f "$WORKFLOW_FILE" ] || {
    echo "ERROR: Khong tim thay workflow JSON"
    exit 1
}

# 2. Load .env
set -a
source "$ENV_FILE"
set +a

# 3. Kiểm tra Gemini API Key
if [[ -z "${GEMINI_API_KEY:-}" ]]; then
    echo "ERROR: Thieu GEMINI_API_KEY trong .env"
    exit 1
fi

# 4. Tạo webhook secret nếu chưa tồn tại
WF10_WEBHOOK_SECRET="${WF10_WEBHOOK_SECRET:-}"

if [[ -z "$WF10_WEBHOOK_SECRET" ]]; then

    command -v openssl >/dev/null 2>&1 || {
        echo "ERROR: Can cai openssl"
        exit 1
    }

    WF10_WEBHOOK_SECRET="$(openssl rand -hex 32)"

    printf -v ENV_VALUE '%q' "$WF10_WEBHOOK_SECRET"

    ENV_KEY="WF10_WEBHOOK_SECRET" ENV_VALUE="$ENV_VALUE" python3 <<'PY'
import os
from pathlib import Path

path = Path(".env")
key = os.environ["ENV_KEY"]
value = os.environ["ENV_VALUE"]

lines = path.read_text().splitlines()
new_lines = []
found = False

for line in lines:
    if line.startswith(key + "="):
        if not found:
            new_lines.append(f"{key}={value}")
            found = True
    else:
        new_lines.append(line)

if not found:
    new_lines.append(f"{key}={value}")

path.write_text("\n".join(new_lines) + "\n")
PY

    echo "Da tao va luu WF10_WEBHOOK_SECRET vao .env"

else
    echo "Da tim thay WF10_WEBHOOK_SECRET, giu nguyen secret cu."
fi

# 5. Kiểm tra credentials hiện có
echo "[1/6] Kiem tra credentials..."

docker compose exec -T n8n \
    n8n export:credentials --all \
    --output="$CONTAINER_EXISTING_CREDS"

EXISTING_CRED_IDS="$(
    docker compose exec -T n8n \
      sh -c "cat '$CONTAINER_EXISTING_CREDS'" |
    python3 -c '
import json, sys

data = json.load(sys.stdin)

if isinstance(data, list):
    items = data
elif isinstance(data, dict):
    items = data.get("data", data.get("credentials", []))
else:
    items = []

for item in items:
    if isinstance(item, dict) and item.get("id"):
        print(item["id"])
'
)"

has_credential() {
    grep -Fxq "$1" <<< "$EXISTING_CRED_IDS"
}

# 6. Kiểm tra credentials WF-10
NEED_WEBHOOK=0
NEED_VISION=0

if ! has_credential wf10WebhookKey; then
    NEED_WEBHOOK=1
else
    echo "Webhook credential da ton tai, bo qua."
fi

if ! has_credential wf10VisionKey; then
    NEED_VISION=1
else
    echo "Vision credential da ton tai, bo qua."
fi

# 7. Tạo credentials còn thiếu
export GEMINI_API_KEY WF10_WEBHOOK_SECRET
export NEED_WEBHOOK NEED_VISION

python3 - "$TMP_CREDS" <<'PY'
import json
import os
import sys

credentials = []

if os.environ["NEED_WEBHOOK"] == "1":
    credentials.append({
        "id": "wf10WebhookKey",
        "name": "WF-10 Webhook Secret",
        "type": "httpHeaderAuth",
        "data": {
            "name": "X-Webhook-Secret",
            "value": os.environ["WF10_WEBHOOK_SECRET"]
        }
    })

if os.environ["NEED_VISION"] == "1":
    credentials.append({
        "id": "wf10VisionKey",
        "name": "WF-10 Vision API Key",
        "type": "httpHeaderAuth",
        "data": {
            "name": "x-goog-api-key",
            "value": os.environ["GEMINI_API_KEY"]
        }
    })

with open(sys.argv[1], "w") as f:
    json.dump(credentials, f)
PY

# 8. Import credentials
if [[ "$NEED_WEBHOOK" == "1" || "$NEED_VISION" == "1" ]]; then

    echo "[2/6] Import credentials moi..."

    docker compose cp "$TMP_CREDS" "n8n:$CONTAINER_CREDS"

    docker compose exec -T n8n \
      n8n import:credentials --input="$CONTAINER_CREDS"

else
    echo "[2/6] Tat ca credentials da ton tai."
fi

# 9. Import workflow
echo "[3/6] Import WF-10 workflow..."

docker compose cp "$WORKFLOW_FILE" "n8n:$CONTAINER_WORKFLOW"

docker compose exec -T n8n \
    n8n import:workflow --input="$CONTAINER_WORKFLOW"

# 10. Publish bằng ID hardcode
echo "[4/6] Publish WF-10..."

docker compose exec -T n8n \
    n8n publish:workflow --id="$WF10_ID"

# 11. Restart n8n
echo "[5/6] Restart n8n..."

docker compose restart n8n

echo "[6/6] Hoan tat!"

echo
echo "=================================="
echo "WF-10 DEPLOY THANH CONG!"
echo "Workflow ID: $WF10_ID"
echo "=================================="
echo "Doi khoang 30 giay cho n8n khoi dong lai."
