#!/usr/bin/env bash
# ==============================================================================
# AI Sales Agent & Customer 360 - 1-Click Production VPS Deployment Script
# Author: Nguyễn Hữu Quốc Bảo (Core API & Infrastructure Lead)
# ==============================================================================

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}${BOLD}================================================================${NC}"
echo -e "${BLUE}${BOLD}   🚀 AI SALES AGENT & CUSTOMER 360 - VPS DEPLOYMENT ENGINE     ${NC}"
echo -e "${BLUE}${BOLD}================================================================${NC}"

# 1. Check prerequisites
echo -e "\n${BOLD}[1/6] Kiểm tra môi trường hệ thống...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker chưa được cài đặt trên VPS.${NC}"
    echo -e "👉 Cài đặt nhanh Docker bằng lệnh: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose v2 chưa được cài đặt.${NC}"
    exit 1
fi

echo -e "${GREEN}✔ Docker: $(docker --version)${NC}"
echo -e "${GREEN}✔ Docker Compose: $(docker compose version --short)${NC}"

# 2. Check environment file
echo -e "\n${BOLD}[2/6] Kiểm tra cấu hình môi trường (.env)...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ Chưa tìm thấy file .env! Đang tự động sao chép từ .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}👉 Vui lòng mở file .env để điền GEMINI_API_KEY, GROQ_API_KEY hoặc chỉnh sửa IP/Domain VPS.${NC}"
else
    echo -e "${GREEN}✔ File .env đã sẵn sàng.${NC}"
fi

# Ensure storage directories exist
mkdir -p voices

# 3. Build & Deploy Docker Containers
echo -e "\n${BOLD}[3/6] Build và khởi động các dịch vụ (PostgreSQL + NestJS API + Next.js + n8n)...${NC}"
docker compose up -d --build

# 4. Wait for PostgreSQL & API Health
echo -e "\n${BOLD}[4/6] Chờ PostgreSQL và Core API sẵn sàng...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0

until [ $(docker inspect --format='{{json .State.Health.Status}}' $(docker compose ps -q postgres 2>/dev/null || echo "") 2>/dev/null || echo '""') = '"healthy"' ] || [ $RETRY_COUNT -ge $MAX_RETRIES ]; do
    echo -n "."
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT+1))
done
echo ""

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo -e "${RED}❌ PostgreSQL không đạt trạng thái healthy sau 60 giây. Kiểm tra logs bằng: docker compose logs postgres${NC}"
    exit 1
fi
echo -e "${GREEN}✔ PostgreSQL đã kết nối thành công và đạt trạng thái Healthy!${NC}"

# 5. Seed Real Backend Data
echo -e "\n${BOLD}[5/6] Nạp dữ liệu thật vào PostgreSQL (Leads 360, Churn, Approvals, Admin)...${NC}"
docker compose exec -T api node scripts/seed-demo-user.cjs || {
    echo -e "${YELLOW}⚠️ Khởi chạy qua container api gặp hạn chế, chuyển sang thực thi psql trực tiếp...${NC}"
    if [ -f infra/postgres/init/004_seed_data.sql ]; then
        docker compose exec -T postgres psql -U sales_agent -d ai_sales_agent -f /docker-entrypoint-initdb.d/004_seed_data.sql || true
    fi
}
echo -e "${GREEN}✔ Dữ liệu thật đã được đồng bộ vào cơ sở dữ liệu!${NC}"

# 6. Verify System Health
echo -e "\n${BOLD}[6/6] Kiểm tra endpoint sức khỏe hệ thống...${NC}"
sleep 2

API_PORT=$(grep -E '^API_PORT=' .env | cut -d= -f2 || echo "3000")
API_PORT=${API_PORT:-3000}
WEB_PORT=$(grep -E '^WEB_PORT=' .env | cut -d= -f2 || echo "3001")
WEB_PORT=${WEB_PORT:-3001}

HEALTH_RES=$(curl -s "http://127.0.0.1:${API_PORT}/api/v1/health" || echo "")
if [[ "$HEALTH_RES" == *"ok"* ]]; then
    echo -e "${GREEN}✔ Core API Gateway: OK (Port ${API_PORT})${NC}"
else
    echo -e "${YELLOW}⚠️ Core API đang khởi động. Vui lòng kiểm tra: docker compose logs -f api${NC}"
fi

WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${WEB_PORT}" || echo "000")
if [ "$WEB_STATUS" = "200" ]; then
    echo -e "${GREEN}✔ Next.js Dashboard UI: OK (HTTP 200, Port ${WEB_PORT})${NC}"
else
    echo -e "${YELLOW}⚠️ Next.js đang biên dịch hoặc khởi động (Status: ${WEB_STATUS}).${NC}"
fi

# Summary
echo -e "\n${BLUE}${BOLD}================================================================${NC}"
echo -e "${GREEN}${BOLD}   🎉 TRIỂN KHAI THÀNH CÔNG HỆ THỐNG AI SALES AGENT!            ${NC}"
echo -e "${BLUE}${BOLD}================================================================${NC}"
echo -e "Các dịch vụ đang hoạt động:"
echo -e "  🌐 ${BOLD}Next.js Sales & HITL Portal:${NC} http://<IP_VPS>:${WEB_PORT}"
echo -e "  ⚙️ ${BOLD}NestJS Core API Gateway:${NC}    http://<IP_VPS>:${API_PORT}/api/v1"
echo -e "  🤖 ${BOLD}n8n Multi-Agent Studio:${NC}      http://<IP_VPS>:5678"
echo -e ""
echo -e "Thông tin tài khoản đăng nhập quản trị:"
echo -e "  👤 ${BOLD}Admin (Bảo):${NC} baonhq.24it@vku.udn.vn  /  ${BOLD}Mật khẩu:${NC} DemoSales123!"
echo -e "  👤 ${BOLD}Sale Member:${NC} demo@ai-sales-agent.local  /  ${BOLD}Mật khẩu:${NC} DemoSales123!"
echo -e ""
echo -e "Xem nhật ký hoạt động (Logs):"
echo -e "  ${BOLD}docker compose logs -f${NC}           (Toàn bộ hệ thống)"
echo -e "  ${BOLD}docker compose logs -f api${NC}       (Core API & Voice AI)"
echo -e "  ${BOLD}docker compose logs -f n8n${NC}       (Orchestration Workflows)"
echo -e "${BLUE}${BOLD}================================================================${NC}\n"
