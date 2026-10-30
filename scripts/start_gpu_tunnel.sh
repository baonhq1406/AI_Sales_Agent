#!/usr/bin/env bash
# Tự động kết nối Card RTX 4060 GPU ở máy local lên VPS qua SSH Reverse Tunnel
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== [1/2] Kiểm tra RVC GPU Server (port 8008) ==="
if ! curl -s http://127.0.0.1:8008/health > /dev/null; then
  echo "Khởi động RVC GPU Server..."
  nohup "$DIR/services/rvc/.venv/bin/python" -m uvicorn services.tts.server:app --host 0.0.0.0 --port 8008 > "$DIR/rvc_gpu.log" 2>&1 &
  sleep 4
fi

echo "=== [2/2] Thiết lập SSH Reverse Tunnel lên VPS (ai-sale-vku.duckdns.org) ==="
if pgrep -f "ssh.*-R.*8008:127.0.0.1:8008" > /dev/null; then
  echo "Tunnel đã hoạt động sẵn sàng."
else
  ssh -o StrictHostKeyChecking=no -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 \
    -i ~/.ssh/id_ed25519_vps -R 0.0.0.0:8008:127.0.0.1:8008 -N -f root@ai-sale-vku.duckdns.org
  echo "Đã mở Reverse Tunnel thành công: VPS -> Local GPU (RTX 4060)"
fi

echo "Kiểm tra kết nối GPU từ VPS:"
ssh -i ~/.ssh/id_ed25519_vps root@ai-sale-vku.duckdns.org "curl -s http://127.0.0.1:8008/health"
