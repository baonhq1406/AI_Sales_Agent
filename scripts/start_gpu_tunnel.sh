#!/usr/bin/env bash
# Tự động kết nối Card RTX 4060 GPU ở máy local lên VPS qua SSH Reverse Tunnel (Systemd Auto-Healing Services)
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
mkdir -p "$SYSTEMD_USER_DIR"

cat > "$SYSTEMD_USER_DIR/ai-sale-rvc-tts.service" <<EOF
[Unit]
Description=AI Sales Agent - Local RTX 4060 RVC v2 Celebrity TTS Server (Port 8008)
After=network.target

[Service]
Type=simple
WorkingDirectory=$DIR
ExecStart=$DIR/services/rvc/.venv/bin/python -m uvicorn services.tts.server:app --host 0.0.0.0 --port 8008
Restart=always
RestartSec=2
StandardOutput=append:$DIR/rvc_gpu.log
StandardError=append:$DIR/rvc_gpu.log

[Install]
WantedBy=default.target
EOF

cat > "$SYSTEMD_USER_DIR/ai-sale-gpu-tunnel.service" <<EOF
[Unit]
Description=AI Sales Agent - Auto-Healing SSH Reverse Tunnel to VPS (Port 8008)
After=network-online.target ai-sale-rvc-tts.service

[Service]
Type=simple
WorkingDirectory=$DIR
ExecStartPre=/usr/bin/ssh -o StrictHostKeyChecking=no -i %h/.ssh/id_ed25519_vps root@ai-sale-vku.duckdns.org "fuser -k 8008/tcp 2>/dev/null || true"
ExecStart=/usr/bin/ssh -o StrictHostKeyChecking=no -o ExitOnForwardFailure=yes -o ServerAliveInterval=15 -o ServerAliveCountMax=2 -i %h/.ssh/id_ed25519_vps -R 0.0.0.0:8008:127.0.0.1:8008 -N root@ai-sale-vku.duckdns.org
Restart=always
RestartSec=3
StandardOutput=append:$DIR/gpu_tunnel.log
StandardError=append:$DIR/gpu_tunnel.log

[Install]
WantedBy=default.target
EOF

echo "=== [1/3] Cấu hình SSH GatewayPorts & KeepAlive trên VPS ==="
ssh -o StrictHostKeyChecking=no -i ~/.ssh/id_ed25519_vps root@ai-sale-vku.duckdns.org \
  "printf 'GatewayPorts yes\nClientAliveInterval 15\nClientAliveCountMax 2\n' > /etc/ssh/sshd_config.d/99-gatewayports.conf && (systemctl reload ssh 2>/dev/null || systemctl reload sshd 2>/dev/null || true)"

echo "=== [2/3] Khởi động Systemd Auto-Healing Services (RVC GPU + Reverse Tunnel) ==="
systemctl --user daemon-reload
systemctl --user enable --now ai-sale-rvc-tts.service ai-sale-gpu-tunnel.service
systemctl --user restart ai-sale-rvc-tts.service ai-sale-gpu-tunnel.service

for _ in {1..20}; do
  if curl -s http://127.0.0.1:8008/health > /dev/null; then
    break
  fi
  sleep 1
done
sleep 2

echo "=== [3/3] Kiểm tra kết nối GPU từ VPS ==="
ssh -i ~/.ssh/id_ed25519_vps root@ai-sale-vku.duckdns.org "curl -s http://127.0.0.1:8008/health"
echo ""
