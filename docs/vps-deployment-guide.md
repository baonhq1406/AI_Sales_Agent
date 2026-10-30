# Hướng Dẫn Triển Khai Hệ Thống AI Sales Agent Lên VPS

> **Dành cho:** Nguyễn Hữu Quốc Bảo (Core API, Infrastructure & n8n Orchestration Lead)  
> **Phiên bản:** v1.0 Production  
> **Kiến trúc:** Next.js + NestJS + PostgreSQL (pgvector) + n8n Multi-Agent + Voice AI  

---

## 1. Yêu Cầu Cấu Hình VPS

| Thành phần | Cấu hình tối thiểu | Cấu hình khuyến nghị |
|---|---|---|
| **Hệ điều hành** | Ubuntu 22.04 LTS / 24.04 LTS | Ubuntu 24.04 LTS (x86_64) |
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | 4 GB | 8 GB (chạy mượt n8n + AI Whisper/Gemini) |
| **Ổ cứng (SSD)** | 40 GB NVMe | 80 GB NVMe |
| **Băng thông** | 100 Mbps | 1 Gbps |

---

## 2. Chuẩn Bị Môi Trường Trên VPS (Chạy 1 lần)

Đăng nhập vào VPS qua SSH:
```bash
ssh root@<IP_VPS>
```

### 2.1. Cập nhật hệ thống & cài đặt công cụ cần thiết:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget ufw jq ca-certificates gnupg
```

### 2.2. Cài đặt Docker & Docker Compose v2 chính thức:
```bash
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo systemctl start docker
docker compose version
```

### 2.3. Cấu hình Tường lửa (UFW Firewall):
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Web / Nginx)
sudo ufw allow 443/tcp   # HTTPS (SSL)
sudo ufw allow 3001/tcp  # Next.js UI (khi chưa cấu hình domain reverse proxy)
sudo ufw allow 3000/tcp  # NestJS Core API
sudo ufw allow 5678/tcp  # n8n Workflow Studio
sudo ufw enable
```

---

## 3. Đưa Mã Nguồn Lên VPS

### 3.1. Clone nhánh làm việc `bao`:
```bash
cd /opt
git clone -b bao https://github.com/baonhq1406/AI_Sales_Agent.git
cd AI_Sales_Agent
```

*(Nếu repo ở chế độ Private, bạn sử dụng Personal Access Token của GitHub hoặc cấu hình SSH Key).*

---

## 4. Cấu Hình File Môi Trường (`.env`) Trên VPS

Tạo file `.env` từ file mẫu:
```bash
cp .env.example .env
nano .env
```

**Các biến quan trọng cần cập nhật trên VPS:**
```env
# 1. Cấu hình IP / Domain VPS (Ví dụ: IP là 103.20.12.34 hoặc domain your-domain.com)
SALES_APP_ORIGIN=http://<IP_HOAC_DOMAIN_VPS>:3001
CORS_ORIGIN=http://<IP_HOAC_DOMAIN_VPS>:3001
NEXT_PUBLIC_API_URL=http://<IP_HOAC_DOMAIN_VPS>:3000/api/v1
N8N_WEBHOOK_BASE_URL=http://n8n:5678

# 2. Bảo mật - Đổi chuỗi bí mật ngẫu nhiên
POSTGRES_PASSWORD=MatKhauManhPostgres_2026!
N8N_ENCRYPTION_KEY=N8nKeySuperSecret32CharsLongValue!
INTERNAL_API_KEY=vku-sales-core-internal-secure-key
JWT_SECRET=vku-sales-jwt-secret-at-least-32-chars-long!

# 3. AI Model Keys
GEMINI_API_KEY=AIzaSy... (API Key Google AI Studio)
GEMINI_MODEL=gemini-3.8-flash
GROQ_API_KEY=gsk_... (Dùng cho Whisper STT & Llama)
GROQ_STT_MODEL=whisper-large-v3-turbo

# 4. Tài khoản Quản trị mặc định
DEMO_USER_EMAIL=baonhq.24it@vku.udn.vn
DEMO_USER_PASSWORD=DemoSales123!
```

---

## 5. Khởi Chạy 1-Click Với Dữ Liệu Backend Thật

Toàn bộ quá trình build, khởi động 4 container (PostgreSQL, NestJS API, Next.js Web, n8n), chờ kết nối cơ sở dữ liệu và nạp dữ liệu thật (Leads, Customer 360, Churn Risk, Báo giá cần duyệt, Voice AI profiles) đã được tự động hóa hoàn toàn:

```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### Dữ liệu backend thật được nạp tự động gồm:
1. **Organization chuẩn:** `VKU AI Enterprise` (ID: `11111111-1111-4111-8111-111111111111`).
2. **Tài khoản quản trị Bảo:** `baonhq.24it@vku.udn.vn` (Mật khẩu: `DemoSales123!`).
3. **Tài khoản Sale Member:** `demo@ai-sales-agent.local` (Mật khẩu: `DemoSales123!`).
4. **Hồ sơ Leads thật:** 8 khách hàng tiêu biểu (An Phát Logistics, Hưng Thịnh Real Estate, Mai Group Retail, Minh Tech AI, Yen Beauty Spa, VKU Innovation Lab...).
5. **Customer 360 Profiles:** Điểm sức khỏe khách hàng (Health Score) và cảnh báo nguy cơ rời bỏ (Churn Risk >= 70%) kết nối trực tiếp với biểu đồ Dashboard.
6. **Báo giá cần duyệt (WF-23 HITL):** Các báo giá chiết khấu đặc biệt đang chờ Sale Manager phê duyệt.
7. **RAG Knowledge Base (WF-02 & WF-09):** Dữ liệu vector tài liệu chính sách, gói giá đã được nạp vào pgvector.

---

## 6. (Khuyến Nghị) Cấu Hình Tên Miền & SSL Miễn Phí (Nginx + Let's Encrypt)

Nếu bạn có tên miền trỏ về VPS (ví dụ: `sales.yourdomain.com`):

### 6.1. Cài đặt Nginx & Certbot:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 6.2. Kích hoạt cấu hình mẫu từ thư mục `infra/nginx`:
```bash
sudo cp infra/nginx/sales-agent.conf /etc/nginx/sites-available/
sudo sed -i 's/your-domain.com/sales.yourdomain.com/g' /etc/nginx/sites-available/sales-agent.conf
sudo ln -s /etc/nginx/sites-available/sales-agent.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6.3. Cấp chứng chỉ SSL HTTPS miễn phí:
```bash
sudo certbot --nginx -d sales.yourdomain.com
```

Certbot sẽ tự động cấu hình HTTPS và tự động gia hạn khi hết hạn.

---

## 7. Các Lệnh Vận Hành & Giám Sát Hàng Ngày

| Thao tác | Câu lệnh |
|---|---|
| **Xem trạng thái container** | `docker compose ps` |
| **Xem logs toàn bộ hệ thống** | `docker compose logs -f` |
| **Xem logs Core API** | `docker compose logs -f api` |
| **Xem logs n8n** | `docker compose logs -f n8n` |
| **Nạp lại dữ liệu mẫu** | `docker compose exec api node scripts/seed-demo-user.cjs` |
| **Cập nhật code mới từ GitHub** | `git pull origin bao && docker compose up -d --build` |
| **Khởi động lại toàn bộ** | `docker compose restart` |
| **Dừng hệ thống** | `docker compose down` |
