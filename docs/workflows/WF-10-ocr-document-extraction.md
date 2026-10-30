# WF-10 – OCR Document Extraction (Story U015)

> *Là quản trị viên, tôi muốn bóc tách dữ liệu từ ảnh chụp danh thiếp/hợp đồng bằng OCR, để không phải nhập liệu thủ công.*

- File workflow: `n8n/workflows/WF-10-ocr-document-extraction.json` (id `wf10OcrExtract`)
- Ảnh/PDF mẫu để demo: `docs/samples/wf10/`
- Giao diện: tab **“Quét OCR Danh Thiếp/Hợp Đồng”** ở trang `/sales` (`apps/web/app/sales/OcrScanner.tsx`, proxy `apps/web/app/api/sales/ocr/route.ts`)
- Không sửa `002_schema.sql`, không đổi `api-contract.md` (chỉ dùng bảng và endpoint có sẵn)

## 1. Hiểu nhanh bằng ví dụ đời thường

Hãy hình dung một **nhân viên nhập liệu rất nhanh**. Bạn đưa cho họ tấm danh thiếp (hoặc trang hợp đồng chụp bằng điện thoại). Họ đọc, rồi gõ vào sổ: tên, chức danh, công ty, email, số điện thoại. Nếu là hợp đồng thì ghi: hai bên là ai, ký ngày nào, bao giờ hết hạn, trị giá bao nhiêu. Gặp tấm ảnh mờ quá, họ **không đoán bừa** mà đặt riêng ra một chỗ để người khác xem lại.

WF-10 làm đúng việc đó, nhưng “nhân viên” là AI đọc ảnh (Gemini Vision):

```text
ảnh/PDF ─► kiểm tra file ─► (đã đọc file này rồi? thì dừng) ─► AI đọc ảnh, trả JSON
        ─► kiểm tra & chuẩn hóa (email, SĐT +84, ngày YYYY-MM-DD)
        ─► lưu vào bảng documents
        ─► nếu là danh thiếp & đủ chắc chắn: tạo/cập nhật lead + ghi lịch sử (interactions) + báo WF-08 làm giàu
        ─► phát sự kiện document.extracted ─► trả kết quả cho người gửi
```

Sau khi bóc tách, danh thiếp trở thành một **lead** trong Customer 360 y như lead đến từ form liên hệ (WF-07), nên WF-08 tự động làm giàu thông tin tiếp.

## 2. Thế nào là “đạt” (Definition of Done)

1. Gửi `danh-thiep-mau.png` → trong DB có 1 dòng `documents`, 1 lead đúng tên/email/số điện thoại (SĐT dạng `+84905123456`), 1 dòng `interactions` (kênh `ocr`), sự kiện `lead.ingested` và `document.extracted`, `workflow_runs.status = success`.
2. Gửi `hop-dong-mau.png` hoặc `hop-dong-scan-mau.pdf` → có 1 dòng `documents` với `metadata.extraction.contract` (các bên, ngày ký, ngày hết hạn, giá trị), **không** tạo lead.
3. Gửi lại đúng file đó → trả `duplicate`, không tốn thêm lượt AI. Thêm `replace=true` thì làm lại thật.
4. Gửi `khong-phai-tai-lieu.png` (ảnh trời xanh) → bị từ chối `UNREADABLE_FILE`/`UNSUPPORTED_DOCUMENT`, không có dòng `documents`, `workflow_runs.status = rejected`.
5. Gửi file sai định dạng (`.txt`) → bị từ chối ngay `UNSUPPORTED_FILE_TYPE`, **chưa gọi AI**.
6. Kết quả AI không chắc chắn (độ tự tin < 0.6, thiếu tên, thiếu cả email lẫn SĐT…) → `status = needs_review`: lưu tài liệu nhưng **không tự tạo lead**.
7. Cố ý làm sai API key → `workflow_runs.status = failed` (có lỗi ghi lại), không để lại lead nửa vời.

## 3. Trigger và input

Một cửa vào (webhook):

| Việc | Đường dẫn | Dạng gửi |
|---|---|---|
| Bóc tách tài liệu | `POST /webhook/wf10/extract` | `multipart/form-data` |

Trường gửi:

| Trường | Bắt buộc | Ý nghĩa |
|---|---|---|
| `file` | có | Ảnh JPG/PNG/WEBP hoặc PDF (kể cả PDF scan), tối đa 8 MB. Loại file được nhận bằng “chữ ký” đầu file, không tin đuôi file |
| `docType` | không | `auto` (mặc định, AI tự nhận biết), `business_card`, `contract` |
| `createLead` | không | `true` (mặc định) / `false`: có tự tạo lead từ danh thiếp không |
| `replace` | không | `true` để bóc tách lại file đã xử lý trước đó |
| `organizationId` | không | UUID, mặc định Demo Org |

Header bắt buộc: `X-Webhook-Secret: <giá trị của credential "WF-10 Webhook Secret">`. Header tùy chọn: `X-Correlation-Id` (UUID).

### Phản hồi

| HTTP | `status` | Khi nào |
|---|---|---|
| 201 | `extracted` | Đọc tốt. Trả `documentId`, `docType`, `confidence`, `data` (các trường đã bóc), `lead` (nếu có) |
| 201 | `needs_review` | Đã lưu nhưng cần người xem lại; `reviewReasons` nói lý do; **không** tạo lead |
| 200 | `duplicate` | Cùng nội dung file đã được bóc tách trước đó (trả `documentId` cũ) |
| 422 | `rejected` | `FILE_REQUIRED`, `EMPTY_FILE`, `UNSUPPORTED_FILE_TYPE`, `INVALID_DOC_TYPE`, `INVALID_ORGANIZATION`, `UNREADABLE_FILE`, `UNSUPPORTED_DOCUMENT` (không phải danh thiếp/hợp đồng), `BLOCKED_BY_PROVIDER` |
| 413 | `rejected` | `FILE_TOO_LARGE` (> 8 MB) |
| 502 | `error` | AI trả kết quả hỏng/cụt (`EMPTY_AI_RESPONSE`, `AI_BAD_JSON`, `AI_TRUNCATED`) |
| 403 | – | Sai/thiếu `X-Webhook-Secret` |
| 500 | – | Lỗi giữa chừng (API key sai, hết hạn mức, mạng…); `workflow_runs` được đánh dấu `failed` |

Ví dụ `data` của danh thiếp: `fullName, jobTitle, companyName, email, phone (+84…), phoneOther, website, address`.
Ví dụ `data` của hợp đồng: `title, contractNumber, signedDate, effectiveDate, expiryDate (YYYY-MM-DD), parties[{name, role, representative}], totalValue, currency, paymentTerms, renewalTerms, summary`.

## 4. Luồng theo quy ước 12 giai đoạn

| # | Giai đoạn | Node |
|---|---|---|
| 1 | Trigger | `01a Webhook Extract Document` |
| 2 | Data Processing | `02 Config and Mode`, `03 Validate Upload`, `09 Build Vision Request` |
| 3 | Validation | `04 Valid Upload?` (nhánh sai: `04b`, `04c`), kiểm tra kết quả AI trong `11`, `12 Extraction OK?` (nhánh sai: `12b`, `12c`) |
| 4 | Authentication | Header Auth của webhook; credential *WF-10 Vision API Key*, *Core API Key* |
| 5 | Core API | `17 Core API Upsert Lead` (`POST /leads`), `20 Publish Lead Event`, `22 Publish Document Event` (`POST /events`) |
| 6 | AI/LLM | `09`, `10 Gemini Vision OCR`, `11 Parse and Validate Result` |
| 7 | Decision | `07 Dedupe Decision`, `08 Already Handled?`, `14 Create Lead?` |
| 8 | Transformation | `16 Build Lead Body`, `19 Build Lead Event`, `21 Build Document Event` |
| 9 | PostgreSQL Update | `05 Log Run Start`, `06 Find Existing Document`, `13 Create Document Row`, `15 Load Existing Lead`, `18 Link Document and Log Interaction` |
| 10 | Success Log | `23 Log Run Success`, `24 Respond Extracted` |
| 11 | Error Trigger | `E1 Error Trigger` |
| 12 | Error Handle/Retry | `E2 Mark Run Failed`; retry theo mục 8 |

```text
01a Webhook ─► 02 Config ─► 03 Validate ─► 04 Valid? ─ sai ─► 04b Log ─► 04c 422
                                              │ đúng
              05 Log Run Start ─► 06 Find Existing ─► 07 Dedupe ─► 08 Đã xử lý? ─ có ─► 08b ─► 08c (200 duplicate)
                                                                      │ chưa
              09 Build Request ─► 10 Gemini Vision ─► 11 Parse & Validate ─► 12 OK? ─ không ─► 12b ─► 12c (422/502)
                                                                              │ có
              13 Create Document Row ─► 14 Tạo lead? ─ không ──────────────────────────────┐
                                           │ có                                            │
              15 Load Lead ─► 16 Build Body ─► 17 POST /leads ─► 18 Link + interaction ─► 19 ─► 20 lead.ingested ─┤
                                                                                                                  ▼
                                                              21 Build document.extracted ─► 22 POST /events ─► 23 Log Success ─► 24 201
E1 Error Trigger ─► E2 Mark Run Failed
```

## 5. Quy tắc nghiệp vụ

- **Không đoán bừa:** prompt yêu cầu AI để `null` khi không thấy giá trị; mọi giá trị còn được kiểm tra lại bằng code (email phải đúng dạng, SĐT 9–15 chữ số, ngày phải có thật).
- **Chuẩn hóa:** email chữ thường; SĐT Việt Nam `09xxxxxxxx` → `+849xxxxxxxx` (cùng quy tắc WF-07); ngày → `YYYY-MM-DD`; tiền → số.
- **Khi nào `needs_review`** (lưu nhưng không tạo lead): độ tự tin AI tự chấm < 0.6; danh thiếp thiếu họ tên hoặc thiếu cả email lẫn SĐT hợp lệ; hợp đồng không có bên nào / không có ngày nào / ngày hết hạn sớm hơn ngày bắt đầu; loại tài liệu AI nhận ra khác loại bạn chọn. Ngưỡng nằm ở `LIMITS.minConfidence` trong node `02`.
- **Lead dùng chung khóa với WF-07:** `external_source = 'omnichannel'`, `external_id = email:<email>` (hoặc `phone:<SĐT>` nếu không có email). Nhờ vậy danh thiếp và form liên hệ của cùng một người gộp thành **một** lead, không bị nhân đôi. Giá trị đã có (`source`, `metadata`…) được giữ lại vì `POST /leads` là upsert ghi đè thành NULL (xem mục 9 của tài liệu WF-07); `leads.source` chỉ đặt ở lần đầu.
- **Chống xử lý trùng:** dấu vân tay nội dung file (`metadata.fileHash`) được so trước khi gọi AI nên gửi lại cùng file không tốn thêm hạn mức.
- **File gốc không được lưu** (`documents.storage_url` để trống), chỉ lưu chữ đã đọc (`extracted_text`) và kết quả có cấu trúc.

## 6. Bảng PostgreSQL

| Bảng | Thao tác | Ghi chú |
|---|---|---|
| `workflow_runs` | INSERT `running` → UPDATE `success / skipped / rejected / failed` | `workflow_key = 'WF-10'`; `input` có `fileHash`, `docType`…; `rejected` = file/nội dung không đạt; `failed` = lỗi hệ thống hoặc AI hỏng |
| `documents` | SELECT (`06`), INSERT (`13`), UPDATE `lead_id` (`18`) | `mime_type` thật của file, `extracted_text` = chữ đọc được |
| `leads` | UPSERT qua Core API (`17`) | Ghi `metadata.ocr`; giữ nguyên key metadata cũ (ví dụ `ingestion` của WF-07) |
| `interactions` | INSERT (`18`) | `channel = 'ocr'`, `interaction_type = 'business_card_scanned'`, `transcript` = chữ đọc được |
| `event_outbox` | INSERT qua Core API (`20`, `22`) | `lead.ingested`, `document.extracted` |

`documents.metadata`:

```json
{ "source": "wf10", "status": "extracted|needs_review", "docType": "business_card|contract", "fileHash": "…",
  "sizeBytes": 42543, "language": "vi", "confidence": 0.93, "needsReview": false, "reviewReasons": [], "warnings": [],
  "extraction": { "businessCard": { }, "contract": null },
  "provider": { "name": "gemini", "model": "…" }, "leadId": "uuid", "leadCreated": true,
  "n8nExecutionId": "…", "correlationId": "…", "scannedAt": "…" }
```

> WF-09 (RAG) chỉ tìm trong tài liệu có đoạn vector và `metadata.status = 'ready'`, nên tài liệu của WF-10 (`source = 'wf10'`) **không** lẫn vào kho tri thức.

## 7. Sự kiện phát ra (hợp đồng cho workflow khác)

**`lead.ingested`** (chỉ khi tạo/cập nhật lead): `aggregateType = lead`, `aggregateId` = id lead, `correlationId` giữ nguyên. Payload: `schemaVersion, workflow:'WF-10', leadId, interactionId, documentId, isNewLead, channel:'ocr', source:'ocr:business-card', receivedAt, contact{firstName,lastName,companyName,email,phone}, jobTitle`. WF-08 đọc sự kiện này theo `aggregate_id` nên tự làm giàu lead (email công ty).

**`document.extracted`**: `aggregateType = document`, `aggregateId` = id tài liệu. Payload: `schemaVersion, workflow:'WF-10', documentId, fileName, docType, status, confidence, language, needsReview, reviewReasons, leadId|null, businessCard|null, contract|null, provider`.
Với hợp đồng, `contract.expiryDate`, `contract.parties`, `contract.totalValue` là dữ liệu để **WF-18 (nhắc gia hạn)** hoặc WF-14 dùng; ngày luôn là `YYYY-MM-DD` hoặc `null`.

## 8. Retry và xử lý lỗi

| Node | Chính sách | Lý do |
|---|---|---|
| `10` Gemini | Retry 3 lần, chờ 5 giây, timeout 90 giây | Lỗi mạng/429/5xx thường tự hết; gọi lại cùng ảnh cho cùng kết quả nên an toàn |
| `17` POST /leads | Retry 3 lần, chờ 2 giây | Là upsert nên idempotent |
| `20`, `22` POST /events | **Không** retry | Không idempotent, retry sẽ phát trùng sự kiện |
| Cả workflow | `E1` → `E2` đánh dấu `failed` | Điều kiện để `E1` chạy: **Settings → Error workflow** của workflow phải chọn chính `WF-10 OCR Document Extraction` |

Muốn xử lý lại một file đã có `documents` nhưng chạy dở (ví dụ lỗi ở bước phát sự kiện): gửi lại với `replace=true`.

## 9. Yêu cầu phê duyệt

Không cần human approval để lưu dữ liệu: WF-10 chỉ đọc file do người dùng đăng nhập chủ động tải lên và không gửi gì cho khách. Trường hợp không chắc chắn thì dừng ở `needs_review` (chưa tạo lead) để người xem lại. **Chưa có màn hình duyệt/sửa kết quả `needs_review`**: hiện chỉ thấy lý do trong phản hồi và `documents.metadata`.

## 10. Credentials (tạo trong n8n, không commit)

| Tên | Loại | Giá trị |
|---|---|---|
| `Core API Key` | Header Auth | Có sẵn từ WF-07 |
| `Sales Agent Postgres` | Postgres | Có sẵn từ WF-07 |
| `WF-10 Vision API Key` | Header Auth | Name `x-goog-api-key`, Value = Gemini API key (cùng key đang dùng cho WF-09/WF-01) |
| `WF-10 Webhook Secret` | Header Auth | Name `X-Webhook-Secret`, Value = chuỗi ngẫu nhiên tự đặt |

## 11. Cài đặt và chạy

Điều kiện: đã chạy được WF-07 (có credential *Core API Key*, *Sales Agent Postgres* và organization demo) và đã có `GEMINI_API_KEY` trong `.env`.

```bash
cd ~/Project/AI_Sales_Agent
GEMINI_API_KEY=$(grep '^GEMINI_API_KEY=' .env | cut -d= -f2-)      # hoặc dán key tay nếu .env chưa có
WF10_SECRET=$(openssl rand -hex 16); echo "WF-10 webhook secret: $WF10_SECRET"   # GHI LẠI
cat > /tmp/wf10-creds.json <<JSON
[
 {"id":"wf10WebhookKey","name":"WF-10 Webhook Secret","type":"httpHeaderAuth","data":{"name":"X-Webhook-Secret","value":"$WF10_SECRET"}},
 {"id":"wf10VisionKey","name":"WF-10 Vision API Key","type":"httpHeaderAuth","data":{"name":"x-goog-api-key","value":"$GEMINI_API_KEY"}}
]
JSON
docker compose exec -T n8n n8n import:credentials --input=/dev/stdin < /tmp/wf10-creds.json
docker compose exec -T n8n n8n import:workflow    --input=/dev/stdin < n8n/workflows/WF-10-ocr-document-extraction.json
docker compose exec n8n n8n publish:workflow --id=wf10OcrExtract
docker compose restart n8n
rm /tmp/wf10-creds.json    # file chứa khóa bí mật, xóa ngay
```

Đợi ~30 giây cho n8n khởi động rồi mới gọi. Mỗi lần `import:workflow` lại, n8n bỏ trạng thái Publish nên phải chạy lại `publish:workflow` và `restart`.

Giao diện web: thêm vào `.env` dòng `WF10_WEBHOOK_SECRET=<đúng giá trị $WF10_SECRET ở trên>` rồi `docker compose up -d --build web`.

Model đọc ảnh lấy từ biến `GEMINI_MODEL` (cùng model của WF-01/02); cấu hình ở khối đầu node `02 Config and Mode`.

## 12. Kịch bản demo

```bash
S=<WF10_SECRET>
# 1) Danh thiếp -> tạo lead
curl -s -X POST localhost:5678/webhook/wf10/extract -H "X-Webhook-Secret: $S" \
  -F "file=@docs/samples/wf10/danh-thiep-mau.png" -F "docType=business_card"
# 2) Hợp đồng (ảnh) và hợp đồng scan PDF -> chỉ lưu documents
curl -s -X POST localhost:5678/webhook/wf10/extract -H "X-Webhook-Secret: $S" -F "file=@docs/samples/wf10/hop-dong-mau.png"
curl -s -X POST localhost:5678/webhook/wf10/extract -H "X-Webhook-Secret: $S" -F "file=@docs/samples/wf10/hop-dong-scan-mau.pdf"
# 3) Gửi lại danh thiếp -> duplicate;   thêm  -F "replace=true"  để làm lại thật
# 4) Ảnh không phải tài liệu -> bị từ chối
curl -s -X POST localhost:5678/webhook/wf10/extract -H "X-Webhook-Secret: $S" -F "file=@docs/samples/wf10/khong-phai-tai-lieu.png"
# 5) File sai định dạng -> từ chối ngay, chưa gọi AI
echo hello > /tmp/a.txt; curl -s -X POST localhost:5678/webhook/wf10/extract -H "X-Webhook-Secret: $S" -F "file=@/tmp/a.txt"
# 6) Kiểm tra DB
docker compose exec -T postgres psql -U sales_agent -d ai_sales_agent -c \
 "SELECT status, input->>'fileHash' h, output, error FROM workflow_runs WHERE workflow_key='WF-10' ORDER BY started_at DESC LIMIT 6;" -c \
 "SELECT file_name, mime_type, metadata->>'status' st, metadata->>'docType' t, metadata->>'confidence' conf, lead_id FROM documents WHERE metadata->>'source'='wf10' ORDER BY created_at DESC;" -c \
 "SELECT first_name, email, phone, company_name, source, metadata->'ocr'->>'jobTitle' title FROM leads ORDER BY updated_at DESC LIMIT 3;" -c \
 "SELECT channel, interaction_type, subject FROM interactions WHERE channel='ocr';" -c \
 "SELECT event_name, aggregate_type FROM event_outbox WHERE event_name IN ('lead.ingested','document.extracted') ORDER BY created_at DESC LIMIT 6;"
```

Trình tự gợi ý khi demo: danh thiếp → mở tab Khách Hàng thấy lead mới → chờ ≤ 1 phút WF-08 làm giàu (nếu có key Hunter) → hợp đồng → gửi lại (duplicate) → ảnh trời xanh (từ chối) → file `.txt` (từ chối) → xem `workflow_runs`.

## 13. Giới hạn đã biết

- **Chưa chạy với n8n thật và Gemini thật khi viết tài liệu này.** Môi trường làm việc không có n8n/Internet tới Google. Đã kiểm tra: JSON workflow hợp lệ, các liên kết node, cú pháp toàn bộ code/biểu thức, logic từng Code node bằng dữ liệu giả, và toàn bộ câu SQL chạy thật trên PostgreSQL với schema của nhóm. **Việc đầu tiên khi có key: chạy kịch bản mục 12 và đối chiếu.**
- Tên model và định dạng yêu cầu/phản hồi Gemini (`inline_data`, `responseSchema`, `candidates[0].content.parts[0].text`) viết theo tài liệu công khai. Nếu node `10` báo 400, mở execution xem `body` lỗi (thường là tên model sai hoặc schema bị từ chối) rồi chỉnh node `02`/`09`.
- Model đang dùng là model chung của dự án (thường thiên về nhanh/rẻ). Nếu chữ tiếng Việt có dấu đọc sai nhiều, đổi sang model mạnh hơn.
- “Độ tự tin” là con số **AI tự chấm**, không phải xác suất đo được; vì vậy còn các luật kiểm tra bằng code ở mục 5.
- Hạn mức miễn phí của Gemini có giới hạn lượt/phút và lượt/ngày (kiểm tra trang hạn mức của Google). Bị giới hạn thì node `10` tự thử lại 3 lần rồi báo lỗi.
- **Quyền riêng tư:** ảnh danh thiếp/hợp đồng được gửi sang Google để đọc. Không dùng cho hợp đồng mật khi chưa được phép.
- Ảnh iPhone định dạng HEIC chưa được nhận; chuyển sang JPG trước. PDF nhiều trang: gửi cả file, nhưng file lớn/nhiều trang tốn nhiều token.
- Chưa có màn hình sửa tay kết quả `needs_review`; chưa lưu file gốc; chưa có unique index trên `metadata.fileHash` nên hai file giống hệt gửi **đúng cùng lúc** có thể cùng lọt qua bước kiểm tra trùng (thêm index cần phối hợp Bảo vì đụng schema).
- Lưu `saveDataSuccessExecution = all` để demo xem lại được, nên mỗi lần chạy giữ cả ảnh (dạng base64, tối đa ~11 MB) trong lịch sử thực thi của n8n. Khi chạy thật, đổi sang `none` hoặc giảm thời gian lưu.
- Endpoint webhook chỉ có xác thực bằng secret dùng chung, chưa phân quyền theo người dùng. Không công khai cổng n8n ra Internet.
