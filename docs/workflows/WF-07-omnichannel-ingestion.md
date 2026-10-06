# WF-07 – Omnichannel Ingestion (Story U002)

Nhận tin từ mọi kênh (Webhook, Form, Email, Chat), chuẩn hóa về một định dạng duy nhất, lưu vào PostgreSQL qua Core API và đẩy sự kiện vào `event_outbox` để các workflow sau (WF-08, WF-13, WF-19…) xử lý bất đồng bộ.

- File workflow: `n8n/workflows/WF-07-omnichannel-ingestion.json` (id `wf07OmniIngest`)
- Form web: `apps/web/app/contact` (trang `/contact`) + proxy `apps/web/app/api/ingest/route.ts`
- Đã kiểm thử trên n8n 2.41.6 + PostgreSQL 16 + Core API ở nhánh `main` (commit `4c094ee`)

## 1. Trigger và input

| Node | Đường dẫn (production) | Xác thực | Dùng cho |
|---|---|---|---|
| `01a Webhook Ingest` | `POST /webhook/wf07/ingest` | Header `X-Webhook-Secret` (credential *WF-07 Webhook Secret*) | Hệ thống ngoài, chatbot (Zalo/Messenger), landing page |
| `01b Form Webhook` | `POST /webhook/wf07/form` | Không (chỉ để Next.js gọi nội bộ, **không** mở ra Internet) | Form `/contact` |
| `01c Email Trigger IMAP` | Hộp thư IMAP | Credential *WF-07 IMAP Inbox* | Email khách gửi đến. **Đang tắt**, bật khi có hộp thư thật |

URL test trong editor là `/webhook-test/...`, URL chạy thật là `/webhook/...` (chỉ có sau khi **Publish**).

Proxy Next.js gọi `http://n8n:5678/webhook/wf07/form` theo mặc định; đổi bằng biến môi trường `N8N_FORM_WEBHOOK_URL` của service `web` nếu cần (không bắt buộc, `docker-compose.yml` không phải sửa).

### Body cho `/ingest` (JSON)

```json
{
  "channel": "chat",
  "source": "zalo-oa",
  "contact": { "name": "Lan", "phone": "+84 912 345 678", "email": "lan@example.com", "companyName": "ABC" },
  "subject": "tuỳ chọn",
  "text": "Nội dung tin nhắn",
  "messageId": "id-tin-nhắn-từ-hệ-thống-gốc",
  "receivedAt": "2026-10-04T10:00:00Z",
  "organizationId": "uuid, tuỳ chọn, mặc định Demo Org"
}
```

Chấp nhận cả dạng phẳng (`fullName`, `email`, `phone`, `message`…). `channel` hợp lệ: `webhook | form | email | chat` (khác → `webhook`). Header `X-Correlation-Id` (UUID) được giữ nguyên nếu có.

### Body cho `/form`

`fullName, email, phone, companyName, message, submissionId, website, source`. Trường `website` là honeypot: có giá trị → bị từ chối. `organizationId` bị **bỏ qua** ở đường form, form công khai không được tự chọn tổ chức.

### Quy tắc chuẩn hóa và kiểm tra (node `02`)

- Email: trim, hạ chữ thường, kiểm tra định dạng. Điện thoại: bỏ ký tự thừa, `0901234567` → `+84901234567`, cần 9–15 chữ số.
- Bắt buộc: có email **hoặc** điện thoại hợp lệ, và có `message` hoặc `subject`.
- `identity` = `email:<email>` (ưu tiên) hoặc `phone:<số>`, dùng làm `externalId` của lead: cùng người nhắn qua nhiều kênh thì chỉ có một lead.
- `messageKey` = `<channel>:<messageId|submissionId|hash>`: khóa chống xử lý trùng.
- Mọi độ dài cắt theo kích thước cột trong `002_schema.sql`.

### Phản hồi

| HTTP | `status` | Khi nào |
|---|---|---|
| 202 | `accepted` | Xử lý xong, có `correlationId`, `leadId`, `interactionId`, `eventId` |
| 200 | `duplicate` | `messageKey` đã được xử lý và đã phát sự kiện, không làm lại |
| 422 | `rejected` | Sai dữ liệu hoặc spam, kèm `errors: [{field, code, message}]` |
| 403 | – | Sai/thiếu `X-Webhook-Secret` (chỉ `/ingest`) |
| 500 | – | Lỗi trong workflow (đã được ghi vào `workflow_runs`) |

## 2. Luồng theo quy ước 12 node của dự án

Quy ước của dự án là 12 *giai đoạn*; workflow có thêm vài node phụ để rẽ nhánh nên tổng cộng nhiều hơn 12 node.

| # | Giai đoạn | Node |
|---|---|---|
| 1 | Trigger | `01a`, `01b`, `01c` |
| 2 | Data Processing | `02 Normalize and Correlate`, `03 Log Run Start` |
| 3 | Validation | `04 Valid Input?` → nhánh sai: `04b Log Run Rejected`, `04c Respond 422` |
| 4 | Authentication | Header Auth của `01a`; credential *Core API Key* cho `07` và `13` |
| 5 | Core API | `07 Core API Upsert Lead` (`POST /leads`), `13 Core API Publish Event` (`POST /events`) |
| 6 | AI/LLM | `08 Classify Intent`: **luật từ khóa**, không gọi LLM (xem mục 9) |
| 7 | Decision | `09b Event Already Sent?`, `10 Support Request?` |
| 8 | Transformation | `06 Merge and Build Lead Body`, `11a/11b Set Event…`, `12 Build Event Body` |
| 9 | PostgreSQL Update | `05 Load Existing Lead`, `09 Save Interaction` |
| 10 | Success Log | `14 Log Run Success` (và `09c Log Run Duplicate`), `15 Respond 202`, `09d Respond 200` |
| 11 | Error Trigger | `E1 Error Trigger` |
| 12 | Error Handle/Retry | `E2 Mark Run Failed`; retry 3 lần ở `07` |

```text
Trigger ─► 02 Normalize ─► 03 Log Run Start ─► 04 Valid?
                                             │ sai ─► 04b ─► 04c (422)
                                             ▼ đúng
                 05 Load Lead ─► 06 Merge ─► 07 POST /leads ─► 08 Classify ─► 09 Save Interaction
                                                                               ▼
                                              09b Đã gửi event? ─ rồi ─► 09c ─► 09d (200 duplicate)
                                                                               │ chưa
                                              10 intent = support? ─► 11a / 11b ─► 12 ─► 13 POST /events ─► 14 ─► 15 (202)
E1 Error Trigger ─► E2 Mark Run Failed
```

Các điểm thiết kế cần biết:

- **Merge trước khi upsert:** `POST /leads` ghi đè trường thiếu bằng NULL (xem mục 9). Node `05`+`06` đọc lead cũ và gửi lại giá trị đã biết để không mất `company_name`, `phone`, `metadata`.
- **Chống trùng:** `interactions` không thêm nếu đã có `messageKey`; `09b` kiểm tra `event_outbox` đã có `messageKey` chưa. Nếu lần chạy trước đứt sau khi lưu interaction nhưng chưa phát sự kiện, lần gửi lại vẫn phát sự kiện bù.
- **Nguồn đầu tiên được giữ:** `leads.source` chỉ đặt ở lần đầu (first-touch). Kênh gần nhất nằm ở `metadata.ingestion.lastChannel`.

## 3. Bảng PostgreSQL

| Bảng | Thao tác | Ghi chú |
|---|---|---|
| `workflow_runs` | INSERT khi bắt đầu (`running`); UPDATE `success` / `failed` | `workflow_key='WF-07'`, `n8n_execution_id`, `correlation_id`, `input` (chỉ tóm tắt, **không** lưu header) |
| `leads` | SELECT (`05`) + upsert qua Core API | `external_source='omnichannel'`, `external_id=identity` |
| `interactions` | INSERT (`09`) | `direction='inbound'`, `interaction_type`=intent, `transcript`=nội dung, `metadata.messageKey` |
| `event_outbox` | INSERT qua Core API (`13`); SELECT kiểm tra trùng (`09`) | `status='pending'` |

## 4. Sự kiện phát ra (hợp đồng cho WF-08 trở đi)

- `eventName`: `lead.ingested` (mặc định) hoặc `support.requested` (khi `intent = support`)
- `aggregateType`: `lead`, `aggregateId`: id của lead, `correlationId`: dùng xuyên suốt các workflow

```json
{
  "schemaVersion": 1,
  "workflow": "WF-07",
  "leadId": "uuid",
  "interactionId": "uuid",
  "isNewInteraction": true,
  "channel": "form",
  "source": "form:web-contact-form",
  "intent": "sales_inquiry",
  "priority": "high",
  "language": "vi",
  "messageKey": "form:<submissionId>",
  "receivedAt": "2026-10-04T10:00:00.000Z",
  "contact": { "firstName": "…", "lastName": null, "companyName": "…", "email": "…", "phone": "+84…" },
  "subject": "",
  "messagePreview": "500 ký tự đầu"
}
```

`intent`: `sales_inquiry | support | partnership | general`. `priority`: `high | normal`.

**Lưu ý cho WF-08:** Core API hiện chỉ có `POST /events` (ghi), chưa có endpoint đánh dấu sự kiện đã xử lý. WF-08 cần tự đọc `event_outbox WHERE status='pending'` và UPDATE trạng thái bằng node Postgres, hoặc nhờ Bảo bổ sung endpoint (đổi contract thì phải cập nhật `docs/api-contract.md`).

## 5. Credentials (tạo trong n8n, không commit)

| Tên | Loại | Giá trị |
|---|---|---|
| `Core API Key` | Header Auth | Name `X-API-Key`, Value = `INTERNAL_API_KEY` trong `.env` |
| `WF-07 Webhook Secret` | Header Auth | Name `X-Webhook-Secret`, Value = chuỗi ngẫu nhiên tự đặt |
| `Sales Agent Postgres` | Postgres | Host `postgres`, Port `5432`, DB/User/Password theo `.env`, SSL `disable` |
| `WF-07 IMAP Inbox` | IMAP | Chỉ cần khi bật node `01c` |

Workflow gọi Core API tại `http://api:3000/api/v1` (tên service trong Docker network). n8n 2.x chặn `$env` trong node mặc định nên **không** đọc `INTERNAL_API_KEY` bằng biểu thức, phải dùng credential.

## 6. Retry và xử lý lỗi

| Node | Chính sách | Lý do |
|---|---|---|
| `07 POST /leads` | Retry 3 lần, chờ 2 giây | Upsert idempotent theo `(organization_id, external_source, external_id)` |
| `13 POST /events` | **Không** retry | `POST /events` không idempotent; retry mù sẽ phát trùng sự kiện (đúng với `api-contract.md`) |
| Node còn lại | Không retry | Lỗi sẽ vào Error Trigger |

Khi bất kỳ node nào lỗi: `E1` bắt lỗi → `E2` cập nhật `workflow_runs` thành `failed` với `error = {code:'WORKFLOW_ERROR', message, node}`. Webhook trả HTTP 500 cho bên gọi, bên gọi có thể gửi lại cùng `messageId` an toàn nhờ cơ chế chống trùng.

Điều kiện để `E1` chạy: **Settings của workflow → Error workflow** phải trỏ về chính workflow này (xem mục 8: tự động nếu dùng cách CLI, hoặc bước 4 nếu import bằng giao diện).

## 7. Yêu cầu phê duyệt

Không cần human approval. WF-07 chỉ ghi nhận dữ liệu, không gửi gì ra ngoài cho khách.

## 8. Cài đặt và chạy

Điều kiện: làm theo README (`docker compose up -d --build`), đã tạo organization demo, đã tạo tài khoản owner n8n tại http://localhost:5678.

```bash
# 1. Organization demo (một lần)
docker compose exec -T postgres psql -U sales_agent -d ai_sales_agent -c \
"INSERT INTO organizations (id,name) VALUES ('11111111-1111-4111-8111-111111111111','Demo Org') ON CONFLICT DO NOTHING;"
```

**Cách nhanh (CLI), giữ nguyên id workflow và credential:**

```bash
set -a; . ./.env; set +a
WF07_SECRET=$(openssl rand -hex 16); echo "WF-07 webhook secret: $WF07_SECRET"
cat > /tmp/wf07-creds.json <<JSON
[
 {"id":"wf07CoreApiKey","name":"Core API Key","type":"httpHeaderAuth","data":{"name":"X-API-Key","value":"$INTERNAL_API_KEY"}},
 {"id":"wf07WebhookKey","name":"WF-07 Webhook Secret","type":"httpHeaderAuth","data":{"name":"X-Webhook-Secret","value":"$WF07_SECRET"}},
 {"id":"wf07Postgres","name":"Sales Agent Postgres","type":"postgres","data":{"host":"postgres","port":5432,"database":"$POSTGRES_DB","user":"$POSTGRES_USER","password":"$POSTGRES_PASSWORD","ssl":"disable","maxConnections":10,"allowUnauthorizedCerts":false,"sshTunnel":false}},
 {"id":"wf07Imap","name":"WF-07 IMAP Inbox","type":"imap","data":{"user":"demo@example.com","password":"demo","host":"imap.gmail.com","port":993,"secure":true,"allowUnauthorizedCerts":false}}
]
JSON
docker compose cp /tmp/wf07-creds.json n8n:/tmp/wf07-creds.json
docker compose cp n8n/workflows/WF-07-omnichannel-ingestion.json n8n:/tmp/wf07.json
docker compose exec n8n n8n import:credentials --input=/tmp/wf07-creds.json
docker compose exec n8n n8n import:workflow --input=/tmp/wf07.json
docker compose exec n8n n8n publish:workflow --id=wf07OmniIngest
docker compose restart n8n
docker compose exec n8n rm /tmp/wf07-creds.json; rm /tmp/wf07-creds.json
```

Các lệnh `import:*`/`publish:workflow` đã chạy thành công trên n8n 2.41.6 ngoài Docker; chưa chạy trong container.

**Cách thủ công (giao diện):**

1. n8n → *Credentials* → tạo 3 credential ở mục 5 (và IMAP nếu cần).
2. *Workflows → Import from file* → chọn `WF-07-omnichannel-ingestion.json`.
3. Mở từng node có biểu tượng cảnh báo (`01a`, các node Postgres, `07`, `13`) và chọn đúng credential.
4. Mở *Settings* (⋯ ở góc trên phải) → **Error workflow** = `WF-07 Omnichannel Ingestion` → Save.
5. Bấm **Publish**.

Sau khi publish, đợi vài giây cho webhook đăng ký rồi chạy kịch bản demo.

## 9. Kịch bản demo

```bash
# Form (qua Next.js)
curl -s -X POST localhost:3001/api/ingest -H 'Content-Type: application/json' -d '{
 "fullName":"Phạm Thu Hà","email":"ha@bluewave.vn","phone":"0987654321","companyName":"BlueWave",
 "message":"Bên mình cần báo giá gói 20 tài khoản, có demo không?"}'
# => {"status":"accepted","correlationId":"…"}

# Webhook + chat (cần secret)
curl -s -X POST localhost:5678/webhook/wf07/ingest \
  -H 'Content-Type: application/json' -H "X-Webhook-Secret: $WF07_SECRET" -d '{
 "channel":"chat","source":"zalo-oa","contact":{"name":"Lan","phone":"0912345678"},
 "text":"Ứng dụng bị lỗi, cần hỗ trợ gấp","messageId":"zalo-1"}'

# Kiểm tra
docker compose exec -T postgres psql -U sales_agent -d ai_sales_agent -c \
"SELECT event_name, payload->>'intent' intent, payload->>'priority' priority, status FROM event_outbox ORDER BY created_at DESC LIMIT 5;" -c \
"SELECT status, output FROM workflow_runs WHERE workflow_key='WF-07' ORDER BY started_at DESC LIMIT 5;"
```

Trình tự thể hiện khi demo: gửi form hợp lệ (202) → gửi lại đúng tin (200 duplicate, không thêm dòng) → gửi sai (422) → tin chat "lỗi" sinh `support.requested` → tắt `api` rồi gửi (500, `workflow_runs` = `failed`) → bật lại `api`, gửi lại (202).

## 10. Giới hạn đã biết

- **Lỗi của Core API cần báo Bảo:** `POST /leads` (upsert) ghi đè các trường không gửi thành NULL (`company_name`, `phone`, `metadata`…). WF-07 đã tránh bằng bước merge, nhưng workflow khác gọi endpoint này sẽ dính. Cách sửa gợi ý: `COALESCE(EXCLUDED.x, leads.x)`.
- **Phân loại intent bằng luật từ khóa** (node `08`), chưa dùng LLM. Hiểu ngữ nghĩa sâu do WF-12/13/19 đảm nhiệm. Từ khóa nằm trong code node, dễ chỉnh.
- **Race condition:** hai tin giống hệt gửi *đồng thời* có thể cùng lọt qua bước kiểm tra trùng, vì `interactions` chưa có unique index trên `metadata->>'messageKey'`. Thêm index cần phối hợp với Bảo (đụng `002_schema.sql`).
- **Email IMAP** mới đối chiếu với mã nguồn node của n8n (tên field `from`, `subject`, `textPlain`, `metadata['message-id']`), chưa thử với hộp thư thật.
- **Chưa có rate limit** cho `/api/ingest`; hiện chỉ có honeypot, giới hạn kích thước và độ dài trường.
- Webhook `/form` không có xác thực: ở môi trường thật chỉ cho Next.js truy cập (không publish cổng 5678 ra Internet).
