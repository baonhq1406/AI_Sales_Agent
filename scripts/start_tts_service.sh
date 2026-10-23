#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export TTS_PORT=${TTS_PORT:-8008}
export VOICES_DIR="$DIR/voices"
VENV_PY="$DIR/services/tts/.venv/bin/python"

if [ ! -f "$VENV_PY" ]; then
  echo "Virtualenv not found, using uv..."
  exec uv run --python 3.11 "$DIR/services/tts/server.py"
fi

exec "$VENV_PY" "$DIR/services/tts/server.py"
