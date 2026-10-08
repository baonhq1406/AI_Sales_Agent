# WF-08 – Lead Enrichment & Research (Story U003)

Tự động làm giàu thông tin lead (chức danh, công ty, quy mô, ngành) bằng API ngoài **Hunter Combined Enrichment**, lưu vào PostgreSQL qua Core API và phát sự kiện `lead.enriched` cho các workflow sau (WF-13 chấm điểm, WF-14 báo giá…).

- File workflow: `n8n/workflows/WF-08-lead-enrichment.json` (id `wf08LeadEnrich`)
- Đầu vào: sự kiện `lead.ingested` do WF-07 phát, hoặc gọi tay qua webhook
- Không cần sửa `002_schema.sql`, không đổi `api-contract.md`

## 1. Trigger và input

| Node | Cách kích hoạt | Xác thực |
|---|---|---|
| `01a Schedule Poll Outbox` | Mỗi 1 phút đọc `event_outbox` (`lead.ingested`, 3 ngày gần nhất) | – |
| `01b Webhook Manual Enrich` | `POST /webhook/wf08/enrich` | Header `X-Webhook-Secret` (credential *WF-08 Webhook Secret*) |

Body webhook: `{ "leadId": "uuid", "organizationId": "uuid, tuỳ chọn", "force": false }`. `force: true` bỏ qua kiểm tra "đã làm giàu trong 30 ngày". Webhook trả ngay HTTP 202; kết quả xem ở `workflow_runs`.

**Chống trùng sự kiện (không đụng `event_outbox.status`):** `event_outbox` chỉ có một cột `status` nên nhiều workflow cùng đọc `lead.ingested` sẽ giẫm nhau nếu WF-08 đổi nó. WF-08 ghi `eventId` vào `workflow_runs.input` và coi sự kiện là "đã xử lý" khi có run `success | skipped | rejected`, hoặc `running` dưới 10 phút. Run `failed` được thử lại tối đa 3 lần. Mỗi lượt poll lấy tối đa 5 lead, mỗi lead một sự kiện mới nhất.

## 2. Luồng theo quy ước 12 giai đoạn

| # | Giai đoạn | Node |
|---|---|---|
| 1 | Trigger | `01a`, `01b` |
| 2 | Data Processing | `02a Fetch Pending Events`, `02 Normalize Input`, `03 Log Run Start` |
| 3 | Validation | `04 Valid Input?` → sai: `04b`; `05b Lead Found?` → sai: `05c` |
| 4 | Authentication | Header Auth của `01b`; *Core API Key* (05, 10, 13); *WF-08 Hunter API Key* (07) |
| 5 | Core API | `05` GET /leads/:id, `10` PATCH /leads/:id, `13` POST /events |
| 6 | AI/LLM | `07 Hunter Combined Enrich` (API làm giàu bên ngoài, **không** dùng LLM) |
| 7 | Decision | `06 Plan Enrichment` + `06b Needs Enrichment?` (skip nếu không có email hoặc đã làm giàu < 30 ngày) |
| 8 | Transformation | `09 Build Enrichment`, `12 Build Event Body` |
| 9 | PostgreSQL Update | `11 Upsert Customer Profile` (`customer_profiles.attributes.enrichment`) |
| 10 | Success Log | `14 Log Run Success` (và `06c Log Run Skipped`) |
| 11 | Error Trigger | `E1 Error Trigger` |
| 12 | Error Handle/Retry | `E2 Mark Run Failed`; retry theo mục 7 |

```text
01a Poll ─► 02a Fetch ─┐
                       ├─► 02 Normalize ─► 03 Log Start ─► 04 Valid? ─ sai ─► 04b
01b Webhook ───────────┘                                      │ đúng
                       05 GET lead ─► 05b Found? ─ không ─► 05c
                                          │ có
                       06 Plan ─► 06b Cần làm giàu? ─ không ─► 06c (skipped)
                                          │ có
                       07 Hunter Combined Enrich ─► 09 Build
   ─► 10 PATCH lead ─► 11 Upsert customer_profiles ─► 12 Build event ─► 13 POST /events ─► 14 Log Success
E1 Error Trigger ─► E2 Mark Run Failed
```

## 3. Quy tắc làm giàu

- Hunter tìm theo **email** của lead và trả cả thông tin người (chức danh, cấp bậc) lẫn công ty (tên, quy mô, ngành, năm thành lập, quốc gia) trong một lần gọi.
- Email miễn phí (gmail, yahoo…) thường chỉ ra thông tin người hoặc không có gì, nên kết quả thường là `partial`/`not_found`.
- `enrichment.status`: `enriched` (có thông tin công ty), `partial` (chỉ có chức danh), `not_found` (không có gì). `not_found` vẫn được lưu để không gọi lại trong 30 ngày.
- `leads.company_name` chỉ được điền khi đang trống.
- HTTP 404 là "không tìm thấy" (bình thường). Mã khác 200/404 (401, 429, 5xx) làm run `failed`.

## 4. Bảng PostgreSQL

| Bảng | Thao tác | Ghi chú |
|---|---|---|
| `event_outbox` | SELECT (`02a`); INSERT qua Core API (`13`) | Chỉ đọc `lead.ingested`; không sửa `status` |
| `workflow_runs` | INSERT `running` → UPDATE `success/skipped/rejected/failed` | `workflow_key='WF-08'`, `input.eventId` dùng để chống trùng |
| `leads` | GET/PATCH qua Core API | Ghi `metadata.enrichment`; giữ nguyên các key metadata cũ (PATCH ghi đè cả `metadata`) |
| `customer_profiles` | UPSERT (`11`) theo `lead_id` | `attributes.enrichment`; tạo mới với `lifecycle_stage='lead'` |

Cấu trúc `enrichment` (dùng chung cho `leads.metadata` và `customer_profiles.attributes`):

```json
{
  "status": "enriched", "provider": "hunter", "enrichedAt": "2026-10-08T03:00:00.000Z",
  "jobTitle": "Chief Technology Officer", "seniority": "executive",
  "company": { "name": "…", "domain": "…", "size": "201-500", "employeeCount": 350, "industry": "…",
               "founded": 2010, "type": "private", "linkedinUrl": "…",
               "location": { "city": "…", "country": "…" } }
}
```

## 5. Sự kiện phát ra (hợp đồng cho WF-13 trở đi)

`eventName: lead.enriched`, `aggregateType: lead`, `aggregateId`: id lead, `correlationId`: giữ nguyên từ `lead.ingested`.

```json
{ "schemaVersion": 1, "workflow": "WF-08", "leadId": "uuid", "sourceEventId": "uuid|null",
  "trigger": "schedule|webhook", "customerProfileId": "uuid", "enrichmentStatus": "enriched|partial|not_found",
  "provider": "hunter", "enrichedAt": "ISO-8601",
  "jobTitle": "…|null", "seniority": "…|null",
  "company": { "name": "…", "domain": "…", "size": "…", "employeeCount": 0, "industry": "…" } }
```

Sự kiện luôn được phát, kể cả `not_found`, để workflow sau biết lead đã qua bước làm giàu. Run bị `skipped` thì **không** phát.

## 6. Credentials (tạo trong n8n, không commit)

| Tên | Loại | Giá trị |
|---|---|---|
| `Core API Key` | Header Auth | Có sẵn từ WF-07 |
| `Sales Agent Postgres` | Postgres | Có sẵn từ WF-07 |
| `WF-08 Hunter API Key` | **Query Auth** | Name `api_key`, Value = API key Hunter (hunter.io/api_keys) |
| `WF-08 Webhook Secret` | Header Auth | Name `X-Webhook-Secret`, Value = chuỗi ngẫu nhiên tự đặt |

## 7. Retry và xử lý lỗi

| Node | Chính sách | Lý do |
|---|---|---|
| `07` Hunter | Retry 2 lần, chờ 2 giây (chỉ khi lỗi mạng/timeout) | Response 4xx/5xx không ném lỗi tại node mà do `09` kiểm tra |
| `10` PATCH lead | Retry 3 lần, chờ 2 giây | PATCH cùng nội dung nên idempotent |
| `13` POST /events | **Không** retry | Không idempotent, retry sẽ phát trùng sự kiện |
| Cả workflow | `E1` → `E2` đánh dấu `failed`; poller thử lại tối đa 3 lần | 429/5xx thường tự hết sau vài phút |

Điều kiện để `E1` chạy: **Settings → Error workflow** của workflow phải chọn chính `WF-08 Lead Enrichment & Research`.

## 8. Yêu cầu phê duyệt

Không cần human approval. WF-08 chỉ đọc dữ liệu ngoài và ghi vào hồ sơ lead, không gửi gì cho khách.

## 9. Kịch bản demo

```bash
# 1. Tạo lead qua WF-07 (email dạng công ty)
curl -s -X POST localhost:3001/api/ingest -H 'Content-Type: application/json' -d '{
 "fullName":"Nguyễn Văn A","email":"a@fpt.com","message":"Cần báo giá gói 50 tài khoản"}'

# 2. Chờ ≤ 1 phút rồi kiểm tra
docker compose exec -T postgres psql -U sales_agent -d ai_sales_agent -c \
"SELECT status, input->>'trigger' trig, output, error FROM workflow_runs WHERE workflow_key='WF-08' ORDER BY started_at DESC LIMIT 5;" -c \
"SELECT email, company_name, metadata->'enrichment'->>'status' st, metadata->'enrichment'->>'provider' prov, metadata->'enrichment'->>'jobTitle' title, metadata->'enrichment'->'company'->>'size' size FROM leads ORDER BY updated_at DESC LIMIT 5;" -c \
"SELECT event_name, payload->>'enrichmentStatus' st FROM event_outbox WHERE event_name='lead.enriched' ORDER BY created_at DESC LIMIT 5;" -c \
"SELECT lead_id, attributes->'enrichment'->>'status' st FROM customer_profiles ORDER BY updated_at DESC LIMIT 5;"

# 3. Gọi tay (force làm lại)
curl -s -X POST localhost:5678/webhook/wf08/enrich -H 'Content-Type: application/json' \
  -H "X-Webhook-Secret: <SECRET>" -d '{"leadId":"<LEAD_ID>","force":true}'
```

Trình tự: lead mới → `success` → gửi lại tin cùng lead → `skipped` (`RECENTLY_ENRICHED`) → webhook `force:true` làm lại → lead không email → `skipped` (`NO_EMAIL`) → webhook sai `leadId` → `rejected` → sai API key → `failed`, sau 3 lần poller dừng.

## 10. Giới hạn đã biết

- Hunter free: khoảng 25–50 search credit/tháng (tuỳ gói hiện hành), mỗi lần gọi enrichment tốn 1 credit. Khi kích hoạt lần đầu, poller xử lý các lead có sự kiện trong 3 ngày gần nhất nên có thể dùng hết credit.
- Tên trường trong response Hunter (`employment.title`, `metrics.employeesRange`, `category.industry`…) được viết theo tài liệu, chưa chạy với key thật. Nếu `enrichment` ra `not_found` dù biết công ty có thật, mở execution node `07`, xem `body`, rồi chỉnh phần parse trong `09`.
- Hai lần PATCH `/leads` đồng thời (WF-07 và WF-08) có thể ghi đè metadata của nhau vì Core API thay cả `metadata`; cách sửa gốc là để Core API merge JSONB (báo Bảo).
- `Idempotency-Key` được gửi đi nhưng Core API hiện chưa xử lý header này.
