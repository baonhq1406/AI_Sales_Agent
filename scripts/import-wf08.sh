
#!/usr/bin/env bash
set -Eeuo pipefail

# =========================================================
# WF-08 Lead Enrichment - Import & Deploy
# =========================================================

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="$ROOT_DIR/.env"
WORKFLOW_FILE="$ROOT_DIR/n8n/workflows/WF-08-lead-enrichment.json"

CONTAINER_CREDS="/tmp/wf08-creds.json"
CONTAINER_EXISTING_CREDS="/tmp/wf08-existing-creds.json"
CONTAINER_WORKFLOW="/tmp/wf08.json"

WF08_ID="wf08LeadEnrich"
TMP_CREDS="$(mktemp)"

cleanup() {
    rm -f "$TMP_CREDS"
    docker compose exec -T n8n sh -c \
      "rm -f '$CONTAINER_CREDS' '$CONTAINER_EXISTING_CREDS' '$CONTAINER_WORKFLOW'" \
      >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "========== WF-08 DEPLOY =========="

# 1. Kiểm tra file
[ -f "$ENV_FILE" ] || {
    echo "ERROR: Khong tim thay file .env"
    exit 1
}

[ -f "$WORKFLOW_FILE" ] || {
    echo "ERROR: Khong tim thay workflow JSON"
    exit 1
}

# 2. Load môi trường
set -a
source "$ENV_FILE"
set +a

if [[ -z "${HUNTER_API_KEY:-}" ]]; then
    echo "ERROR: Thieu HUNTER_API_KEY trong .env"
    exit 1
fi

# 3. Tạo webhook secret nếu chưa có
WF08_WEBHOOK_SECRET="${WF08_WEBHOOK_SECRET:-${WF08_SECRET:-}}"

if [[ -z "$WF08_WEBHOOK_SECRET" ]]; then
    command -v openssl >/dev/null 2>&1 || {
        echo "ERROR: Can cai openssl"
        exit 1
    }

    WF08_WEBHOOK_SECRET="$(openssl rand -hex 32)"

    printf -v ENV_VALUE '%q' "$WF08_WEBHOOK_SECRET"

    ENV_KEY="WF08_WEBHOOK_SECRET" ENV_VALUE="$ENV_VALUE" python3 <<'PY'
import os
from pathlib import Path

path = Path(".env")
key = os.environ["ENV_KEY"]
value = os.environ["ENV_VALUE"]

lines = path.read_text().splitlines()
lines = [line for line in lines if not line.startswith(key + "=")]
lines.append(f"{key}={value}")

path.write_text("\n".join(lines) + "\n")
PY

    echo "Da tao va luu WF08_WEBHOOK_SECRET vao .env"
else
    echo "Da tim thay webhook secret cu, giu nguyen."
fi

# 4. Kiểm tra credentials WF-07
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

for id in wf07CoreApiKey wf07Postgres; do
    if ! has_credential "$id"; then
        echo "ERROR: Chua co credential $id"
        echo "Hay deploy WF-07 truoc."
        exit 1
    fi
done

echo "Da tim thay credentials WF-07."

# 5. Chỉ tạo credentials WF-08 còn thiếu
NEED_HUNTER=0
NEED_WEBHOOK=0

if ! has_credential wf08HunterKey; then
    NEED_HUNTER=1
else
    echo "Hunter credential da ton tai, bo qua."
fi

if ! has_credential wf08WebhookKey; then
    NEED_WEBHOOK=1
else
    echo "Webhook credential da ton tai, bo qua."
fi

export HUNTER_API_KEY WF08_WEBHOOK_SECRET
export NEED_HUNTER NEED_WEBHOOK

python3 - "$TMP_CREDS" <<'PY'
import json
import os
import sys

credentials = []

if os.environ["NEED_HUNTER"] == "1":
    credentials.append({
        "id": "wf08HunterKey",
        "name": "WF-08 Hunter API Key",
        "type": "httpQueryAuth",
        "data": {
            "name": "api_key",
            "value": os.environ["HUNTER_API_KEY"]
        }
    })

if os.environ["NEED_WEBHOOK"] == "1":
    credentials.append({
        "id": "wf08WebhookKey",
        "name": "WF-08 Webhook Secret",
        "type": "httpHeaderAuth",
        "data": {
            "name": "X-Webhook-Secret",
            "value": os.environ["WF08_WEBHOOK_SECRET"]
        }
    })

with open(sys.argv[1], "w") as f:
    json.dump(credentials, f)
PY

if [[ "$NEED_HUNTER" == "1" || "$NEED_WEBHOOK" == "1" ]]; then
    echo "[2/6] Import credentials moi..."

    docker compose cp "$TMP_CREDS" "n8n:$CONTAINER_CREDS"

    docker compose exec -T n8n \
      n8n import:credentials --input="$CONTAINER_CREDS"
else
    echo "[2/6] Tat ca credentials da ton tai."
fi

# 6. Import workflow
echo "[3/6] Import WF-08 workflow..."

docker compose cp "$WORKFLOW_FILE" "n8n:$CONTAINER_WORKFLOW"

docker compose exec -T n8n \
    n8n import:workflow --input="$CONTAINER_WORKFLOW"

# 7. Publish bằng ID hardcode
echo "[4/6] Publish WF-08..."

docker compose exec -T n8n \
    n8n publish:workflow --id="$WF08_ID"

# 8. Restart
echo "[5/6] Restart n8n..."

docker compose restart n8n

echo "[6/6] Hoan tat!"

echo
echo "=================================="
echo "WF-08 DEPLOY THANH CONG!"
echo "Workflow ID: $WF08_ID"
echo "=================================="
echo "Doi khoang 30 giay cho n8n khoi dong lai."
