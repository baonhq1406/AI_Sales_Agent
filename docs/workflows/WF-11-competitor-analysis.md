# WF-11 – Competitor Analysis Agent (Story U008)

> *Là chuyên gia chiến lược, tôi muốn hệ thống tự động cào tin tức đối thủ và tóm tắt lại, để luôn có báo cáo chiến lược mới nhất.*

- File workflow: `n8n/workflows/WF-11-competitor-analysis.json` (id `wf11CompetitorAnalysis`)
- Không sửa `002_schema.sql`, không đổi `api-contract.md` (báo cáo lưu vào bảng `documents` sẵn có)

## 1. Hiểu nhanh bằng ví dụ đời thường

WF-11 làm việc của một **nhân viên đọc báo thuê**. Mỗi sáng thứ Hai, bạn ấy: (1) tra tin tuần qua về từng đối thủ, (2) bỏ tin trùng/quá cũ, (3) nếu không có tin mới so với báo cáo trước thì nghỉ, không làm lại cho tốn tiền, (4) đưa danh sách tiêu đề cho AI để viết **bản tóm tắt tiếng Việt**: đối thủ nào đang làm gì, mức đe dọa, cơ hội/rủi ro, nên làm gì, (5) cất bản báo cáo vào kho và **báo cho hệ thống** rằng đã có báo cáo mới.

```text
Lịch tuần / Webhook ─► chuẩn hóa ─► kiểm tra ─► Google News RSS (mỗi đối thủ 1 lần) ─► lọc & bỏ trùng
   ─► có tin mới? ─ không ─► ghi "skipped"
        │ có
        └► Groq tóm tắt (JSON) ─► kiểm tra kết quả AI ─► lưu báo cáo (documents) ─► phát sự kiện ─► ghi log thành công
```

## 2. Trigger và input

| Node | Cách kích hoạt | Xác thực |
|---|---|---|
| `01a Schedule Weekly` | Thứ Hai 07:00 (múi giờ của n8n) | – |
| `01b Webhook Manual Run` | `POST /webhook/wf11/run` | Header `X-Webhook-Secret` (credential *WF-11 Webhook Secret*) |

Body webhook (tất cả tùy chọn):

```json
{ "organizationId": "uuid", "competitors": ["HubSpot", { "name": "Zoho CRM", "keywords": ["Zoho"] }],
  "days": 7, "maxPerCompetitor": 5, "force": false }
```

`force: true` bỏ qua kiểm tra "không có tin mới". Không gửi `competitors` thì dùng danh sách trong khối `CONFIG` của node `02 Normalize Input`. Webhook trả ngay HTTP 202; kết quả xem ở `workflow_runs`. Giới hạn: tối đa 8 đối thủ, `days` 1–30, `maxPerCompetitor` 1–10.

## 3. Luồng theo quy ước 12 giai đoạn

| # | Giai đoạn | Node |
|---|---|---|
| 1 | Trigger | `01a`, `01b` |
| 2 | Data Processing | `02 Normalize Input`, `03 Log Run Start`, `06 Build Feed Requests`, `07 Fetch News RSS`, `08 Parse News` |
| 3 | Validation | `04 Valid Input?` → sai: `04b`; `05b Org Found?` → sai: `05c` |
| 4 | Authentication | Header Auth của `01b`; *Core API Key* (15); *WF-11 Groq API Key* (11) |
| 5 | Core API | `15` POST /events |
| 6 | AI/LLM | `10 Build AI Request`, `11 Groq Summarize` |
| 7 | Decision | `09 Decide`, `09b Has New News?` → không: `09c Log Run Skipped` |
| 8 | Transformation | `12 Parse AI Report`, `14 Build Event Body` |
| 9 | PostgreSQL Update | `05 Load Context` (đọc), `13 Save Report` (ghi `documents`) |
| 10 | Success Log | `16 Log Run Success` |
| 11 | Error Trigger | `E1 Error Trigger` |
| 12 | Error Handle/Retry | `E2 Mark Run Failed`; retry ở `07` và `11` |

Điểm thiết kế:

- **Nguồn tin:** Google News RSS (`news.google.com/rss/search`), không cần API key. Mỗi đối thủ một truy vấn `("tên" OR "từ khóa")` trong N ngày.
- **AI chỉ nhìn tiêu đề** (kèm báo, ngày). Mỗi bài có mã `A1, A2…`; AI chỉ được trích mã, workflow tự gắn URL thật, nên AI không thể bịa link. Đối thủ không có bằng chứng bị ép về mức `LOW`.
- **Chống tốn tiền:** `inputHash` (dấu vân tay danh sách bài) được so với báo cáo gần nhất; trùng thì `skipped` (`NO_NEW_ARTICLES`).
- **Một đối thủ lỗi feed không làm hỏng cả lượt:** lỗi được ghi vào `metadata.feedErrors`. Chỉ khi **tất cả** feed lỗi thì run `failed` (`ALL_FEEDS_FAILED`).

## 4. Dữ liệu được ghi

| Bảng | Thao tác | Ghi chú |
|---|---|---|
| `workflow_runs` | INSERT `running` → UPDATE `success / skipped / rejected / failed` | `workflow_key='WF-11'` |
| `documents` | INSERT 1 dòng mỗi báo cáo | `file_name='competitor-report-YYYY-MM-DD-xxxxxxxx.md'`, `mime_type='text/markdown'`, `extracted_text` = báo cáo Markdown |
| `event_outbox` | INSERT qua Core API | `competitor.report.generated` |

`documents.metadata`: `source='wf11'`, `type='competitor_report'`, `title`, `inputHash`, `period`, `competitors[]`, `articleCount`, `overallThreat`, `report` (JSON có cấu trúc: tóm tắt, từng đối thủ, cơ hội, rủi ro, hành động), `feedErrors`, `ai {provider, model, tokens}`, `trigger`, `n8nExecutionId`, `correlationId`, `generatedAt`.

Báo cáo **không có** `document_chunks` nên không lẫn vào kết quả tìm kiếm của WF-09. Muốn AI hỏi đáp được báo cáo, nạp chữ này qua WF-09 (việc mở rộng, chưa làm).

Sự kiện `competitor.report.generated` (`aggregateType: document`, `aggregateId`: id báo cáo):

```json
{ "schemaVersion": 1, "workflow": "WF-11", "documentId": "uuid", "fileName": "…md", "title": "…",
  "trigger": "schedule|webhook", "period": { "from": "2026-10-02", "to": "2026-10-09", "days": 7 },
  "competitorCount": 5, "articleCount": 17, "overallThreat": "LOW|MEDIUM|HIGH",
  "highThreatCompetitors": ["HubSpot"], "model": "openai/gpt-oss-120b" }
```

## 5. Credentials (tạo trong n8n, không commit)

| Tên | Loại | Giá trị |
|---|---|---|
| `Core API Key` | Header Auth | Có sẵn từ WF-07 |
| `Sales Agent Postgres` | Postgres | Có sẵn từ WF-07 |
| `WF-11 Groq API Key` | **Bearer Auth** | Token = API key Groq (console.groq.com) |
| `WF-11 Webhook Secret` | Header Auth | Name `X-Webhook-Secret`, Value = chuỗi ngẫu nhiên tự đặt |

## 6. Retry và xử lý lỗi

| Node | Chính sách | Lý do |
|---|---|---|
| `07` Fetch News RSS | Retry 2 lần, chờ 2 giây; lỗi mạng không dừng cả lượt | Mỗi đối thủ độc lập |
| `11` Groq | Retry 3 lần, chờ 4 giây | 429/5xx thường tự hết |
| `15` POST /events | **Không** retry | Không idempotent |
| Cả workflow | `E1` → `E2` đánh dấu `failed` | Điều kiện: Settings → Error workflow = chính workflow này |

## 7. Yêu cầu phê duyệt

Không cần human approval: WF-11 chỉ đọc tin công khai và ghi báo cáo nội bộ, không gửi gì cho khách.

## 8. Giới hạn đã biết

- Tóm tắt dựa trên **tiêu đề**, không đọc toàn văn bài (link Google News là link chuyển hướng, khó cào trực tiếp). Muốn sâu hơn: thêm RSS trực tiếp của từng báo/đối thủ hoặc node đọc trang.
- Google News và Groq có giới hạn lượt gọi; lượt chạy tuần/lần nằm xa dưới ngưỡng này.
- Lịch dùng múi giờ n8n (mặc định có thể là New York). Muốn 07:00 giờ Việt Nam cần đặt `GENERIC_TIMEZONE=Asia/Ho_Chi_Minh` cho service n8n (sửa `docker-compose.yml`, phối hợp Bảo).
- Chưa có giao diện xem báo cáo; hiện đọc bằng SQL (mục 9). Có thể thêm trang vào Next.js sau.
- Chưa thử trên n8n thật khi viết tài liệu: các node Code đã được chạy thử với dữ liệu giả; **việc đầu tiên khi chạy thật là gọi webhook với `force:true` và đọc báo cáo.**

## 9. Kịch bản demo

```bash
S=<WF11_SECRET>
# 1) Chạy thật
curl -s -X POST localhost:5678/webhook/wf11/run -H "X-Webhook-Secret: $S" -H 'Content-Type: application/json' \
  -d '{"competitors":["HubSpot","Zoho CRM"],"days":7,"force":true}'
# 2) Chạy lại không force -> skipped NO_NEW_ARTICLES
curl -s -X POST localhost:5678/webhook/wf11/run -H "X-Webhook-Secret: $S" -H 'Content-Type: application/json' \
  -d '{"competitors":["HubSpot","Zoho CRM"],"days":7}'
# 3) Dữ liệu sai -> rejected
curl -s -X POST localhost:5678/webhook/wf11/run -H "X-Webhook-Secret: $S" -H 'Content-Type: application/json' -d '{"days":99}'
# 4) Xem kết quả
docker compose exec -T postgres psql -U sales_agent -d ai_sales_agent -c \
 "SELECT status, output->>'reason' reason, output->>'overallThreat' threat FROM workflow_runs WHERE workflow_key='WF-11' ORDER BY started_at DESC LIMIT 5;" -c \
 "SELECT event_name, status FROM event_outbox WHERE event_name='competitor.report.generated';"
docker compose exec -T postgres psql -U sales_agent -d ai_sales_agent -At -c \
 "SELECT extracted_text FROM documents WHERE metadata->>'source'='wf11' ORDER BY created_at DESC LIMIT 1;"
```
