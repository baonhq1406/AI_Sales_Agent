# WF-09 – RAG Knowledge Base Pipeline (Story U007)

> *Là AI, tôi muốn đọc các file PDF và lưu dưới dạng vector trong pgvector, để xây dựng cơ sở tri thức RAG.*

- File workflow: `n8n/workflows/WF-09-rag-knowledge-base.json` (id `wf09RagKnowledge`)
- PDF mẫu để demo: `docs/samples/wf09/`
- Đã kiểm thử trên n8n 2.41.6 + PostgreSQL 16/pgvector + Core API ở nhánh `main`

## 1. Hiểu nhanh bằng ví dụ đời thường

Máy tính không "hiểu" PDF. WF-09 làm công việc của một **thủ thư**: nhận một cuốn tài liệu, đọc, chia thành từng đoạn ngắn, rồi dán cho mỗi đoạn một **"tọa độ ý nghĩa"** (gọi là *vector*, gồm 1536 con số). Đoạn nào có ý nghĩa gần nhau thì tọa độ nằm gần nhau. Khi khách hỏi *"đổi trả trong mấy ngày?"*, ta biến câu hỏi thành tọa độ rồi tìm các đoạn nằm gần nhất, kể cả khi đoạn đó không chứa đúng từ "mấy ngày". Đó là **RAG**: AI tra tài liệu của công ty trước, rồi mới trả lời, thay vì tự bịa.

```text
PDF ──► đọc chữ ──► cắt đoạn (~1000 ký tự, chồng lấp 150) ──► embedding (chữ → 1536 số) ──► lưu pgvector
Câu hỏi ──► embedding ──► tìm các đoạn gần nhất trong pgvector ──► trả về top-K đoạn (kèm trang)
```

## 2. Hai cửa vào (webhook, cùng một secret)

| Việc | Đường dẫn | Dạng gửi |
|---|---|---|
| **Nạp PDF** | `POST /webhook/wf09/ingest` | `multipart/form-data`: `file` (bắt buộc), `title`, `category`, `organizationId`, `replace` |
| **Hỏi thử kho tri thức** | `POST /webhook/wf09/search` | JSON: `query` (bắt buộc), `topK` (1–10, mặc định 4), `category`, `organizationId` |

Header bắt buộc: `X-Webhook-Secret: <giá trị của credential "WF-09 Webhook Secret">`. Header tùy chọn: `X-Correlation-Id` (UUID).

`category` hợp lệ: `product | policy | faq | pricing | general` (mặc định `general`). `organizationId` mặc định là Demo Org. `replace=true` để nạp lại tài liệu đã có.

### Phản hồi của `/ingest`

| HTTP | `status` | Khi nào |
|---|---|---|
| 201 | `indexed` | Thành công: trả `documentId`, `pages`, `chunkCount`, `embedding` |
| 200 | `duplicate` | Cùng nội dung chữ đã được nạp xong trước đó (không tốn thêm lượt embedding) |
| 409 | `busy` | Cùng nội dung đang được nạp dở (dưới 15 phút) |
| 422 | `rejected` | `FILE_REQUIRED`, `NOT_PDF`, `EMPTY_FILE`, `INVALID_CATEGORY`, `INVALID_ORGANIZATION`, `NO_TEXT` (PDF scan, cần OCR/WF-10), `PDF_ENCRYPTED`, `PDF_UNREADABLE` |
| 413 | `rejected` | `FILE_TOO_LARGE` (> 10 MB) hoặc `TOO_MANY_CHUNKS` (> 400 đoạn) |
| 403 | – | Sai/thiếu `X-Webhook-Secret` |
| 500 | – | Lỗi giữa chừng (nhà cung cấp embedding hỏng, sai số chiều…). Tài liệu được đánh dấu `failed` và các đoạn đã lưu dở bị xóa |

### Phản hồi của `/search`

```json
{ "status": "ok", "query": "...", "topK": 4, "count": 2,
  "results": [ { "rank": 1, "score": 0.8123, "documentId": "…", "title": "…", "category": "policy",
                 "fileName": "…pdf", "chunkIndex": 0, "page": 1, "content": "…" } ] }
```
`score` = độ giống (1 là giống hệt; càng cao càng liên quan). Chỉ tìm trong tài liệu `status = ready` của đúng `organizationId`.

## 3. Luồng theo quy ước 12 giai đoạn

| # | Giai đoạn | Node |
|---|---|---|
| 1 | Trigger | `01a Webhook Ingest PDF`, `01b Webhook Search Knowledge` |
| 2 | Data Processing | `02 Config and Mode`, `04 Validate Upload`, `06 Extract PDF Text`, `07 Chunk Text` |
| 3 | Validation | `05 Valid Upload?`, `08 Content OK?` (nhánh sai: `05b/05c`, `08b/08c`), `S2/S3` cho tìm kiếm |
| 4 | Authentication | Header Auth của 2 webhook; credential *Embedding API Key*, *Core API Key* |
| 5 | Core API / dịch vụ ngoài | `15 Embed Chunks` (gọi embedding), `20 Publish Document Event` (`POST /events`) |
| 6 | AI | `14 Prepare Embedding Batches`, `15 Embed Chunks`, `16 Map Vectors` (+ `S4..S6` cho câu hỏi) |
| 7 | Decision | `11 Dedupe Decision`, `12 Already Handled?` |
| 8 | Transformation | `07 Chunk Text`, `14`, `16`, `S8 Build Search Response` |
| 9 | PostgreSQL Update | `13 Create Document Row`, `17 Insert Chunks`, `18 Finalize Document`, `S7 Vector Search` |
| 10 | Success Log | `19 Assert Indexed`, `21 Log Run Success`, `22 Respond Indexed` |
| 11 | Error Trigger | `E1 Error Trigger` |
| 12 | Error Handle/Retry | `E2 Mark Failed and Clean Up`; retry 4 lần ở nhà cung cấp embedding |

Điểm thiết kế quan trọng:

- **Vì sao không dùng node LangChain/PGVector có sẵn của n8n?** Node đó tự tạo bảng riêng với cột riêng, không điền được `document_id`, `chunk_index`… mà bảng `document_chunks` của nhóm bắt buộc (`NOT NULL`). Workflow tự cắt đoạn bằng Code node và ghi thẳng vào đúng bảng của schema, để WF-02 và các workflow khác dùng chung.
- **Chống nạp trùng:** dấu vân tay của nội dung chữ (`metadata.textHash`) được so sánh trước khi tốn tiền embedding.
- **An toàn khi lỗi:** tài liệu có `status = processing` cho đến khi **tất cả** đoạn đã lưu và đếm đủ; chỉ khi đó mới thành `ready`. Lỗi ở bất kỳ bước nào → `failed` + xóa đoạn lưu dở. Truy vấn tìm kiếm luôn lọc `ready` nên không bao giờ đọc phải dữ liệu dở.
- **Mỗi đoạn được embedding kèm tiêu đề tài liệu** (`title + dòng trống + nội dung`), vì đoạn kiểu "Điều 3: …" đứng một mình thiếu ngữ cảnh. Nội dung lưu trong `content` vẫn là đoạn gốc.
- Số trang được lưu cho từng đoạn (`pageStart`/`pageEnd`) để AI có thể trích dẫn "xem trang 3".

## 4. Dữ liệu được ghi (hợp đồng cho WF-02 và các workflow sau)

**`documents`**: một dòng cho mỗi PDF. `file_name`, `mime_type = application/pdf`, `extracted_text` (tối đa 1 triệu ký tự), `storage_url` để trống (file PDF gốc **không** được lưu). `metadata`:

```json
{ "source": "wf09", "status": "ready|processing|failed", "textHash": "…", "title": "…", "category": "policy",
  "pages": 3, "chunkCount": 17, "charCount": 15000, "sizeBytes": 48165,
  "embedding": { "provider": "gemini", "model": "gemini-embedding-001", "dimensions": 1536, "inputTemplate": "title + blank line + chunk" },
  "n8nExecutionId": "…", "correlationId": "…", "uploadedAt": "…", "indexedAt": "…" }
```

**`document_chunks`**: `chunk_index` (0,1,2… liên tục), `content`, `embedding VECTOR(1536)`, `metadata = {pageStart, pageEnd, chars, approxTokens}`.

**`event_outbox`**: `knowledge.document.indexed` (`aggregateType = document`) với `documentId, fileName, title, category, pages, chunkCount, embedding`.

**`workflow_runs`**: `workflow_key = 'WF-09'`, trạng thái `running → success|failed`; các yêu cầu bị từ chối ghi một dòng `failed` (không tạo `documents`).

### Cách WF-02 (Knowledge Base RAG Lookup) dùng kho này

Cách 1, gọi webhook `/webhook/wf09/search` (đơn giản nhất). Cách 2, tự truy vấn:

```sql
SELECT c.content, c.metadata->>'pageStart' AS page, d.metadata->>'title' AS title,
       1 - (c.embedding <=> $1::vector) AS score
FROM document_chunks c JOIN documents d ON d.id = c.document_id
WHERE d.organization_id = $2::uuid AND d.metadata->>'status' = 'ready'
ORDER BY c.embedding <=> $1::vector
LIMIT 4;
```

**Luật bắt buộc:** `$1` phải được tạo bằng **đúng nhà cung cấp, đúng model, đúng số chiều** ghi ở `documents.metadata.embedding` (với Gemini dùng `taskType = RETRIEVAL_QUERY` cho câu hỏi). Trộn model khác nhau thì kết quả vô nghĩa mà không báo lỗi. Muốn đổi model phải nạp lại toàn bộ tài liệu (`replace=true`).

## 5. Cấu hình nhà cung cấp embedding

Mọi cấu hình nằm ở **một khối duy nhất** đầu node `02 Config and Mode`:

| Nhà cung cấp | `provider` / `model` | Credential *Embedding API Key* (Header Auth) |
|---|---|---|
| **Gemini** (mặc định, có gói miễn phí) | `gemini` / `gemini-embedding-001` | Name `x-goog-api-key`, Value = API key (lấy ở Google AI Studio) |
| OpenAI (trả phí, rất rẻ) | `openai` / `text-embedding-3-small` | Name `Authorization`, Value = `Bearer sk-…` |

`dimensions` phải là **1536** (cột `VECTOR(1536)`). Gói miễn phí của Gemini có giới hạn số lượt/phút và token/phút (khi viết tài liệu này khoảng 100 lượt/phút, 30.000 token/phút, nhưng con số có thể đổi: kiểm tra trang hạn mức của Google). Workflow gửi 10 đoạn mỗi lần, cách nhau 6 giây và tự thử lại 4 lần khi bị giới hạn, nên tài liệu cỡ vài chục trang nạp trong chừng một phút.

## 6. Cài đặt và chạy

Điều kiện: đã làm xong phần cài đặt WF-07 (credential *Core API Key* và *Sales Agent Postgres* đã có trong n8n, có organization demo).

```bash
cd ~/Project/AI_Sales_Agent
read -rsp "Dán Gemini API key rồi Enter: " GEMINI_API_KEY; echo
WF09_SECRET=$(openssl rand -hex 16); echo "WF-09 webhook secret: $WF09_SECRET"   # ghi lại để dùng khi gọi
cat > /tmp/wf09-creds.json <<JSON
[
 {"id":"wf09WebhookKey","name":"WF-09 Webhook Secret","type":"httpHeaderAuth","data":{"name":"X-Webhook-Secret","value":"$WF09_SECRET"}},
 {"id":"wf09EmbedKey","name":"Embedding API Key","type":"httpHeaderAuth","data":{"name":"x-goog-api-key","value":"$GEMINI_API_KEY"}}
]
JSON
docker compose exec -T n8n n8n import:credentials --input=/dev/stdin < /tmp/wf09-creds.json
docker compose exec -T n8n n8n import:workflow    --input=/dev/stdin < n8n/workflows/WF-09-rag-knowledge-base.json
docker compose exec n8n n8n publish:workflow --id=wf09RagKnowledge
docker compose restart n8n
rm /tmp/wf09-creds.json    # file chứa khóa bí mật, xóa ngay
```

Đợi khoảng 30 giây cho n8n khởi động xong rồi mới gọi (gọi quá sớm có thể gặp lỗi 500 hoặc 404). Mỗi lần `import:workflow` lại, n8n bỏ trạng thái Publish, nên phải chạy lại `publish:workflow` và `restart`.

## 7. Kịch bản demo

```bash
S=<WF09_SECRET>
# 1) Nạp PDF
curl -s -X POST localhost:5678/webhook/wf09/ingest -H "X-Webhook-Secret: $S" \
  -F "file=@docs/samples/wf09/chinh-sach-doi-tra.pdf" -F "title=Chính sách đổi trả và bảo hành" -F "category=policy"
# 2) Hỏi thử
curl -s -X POST localhost:5678/webhook/wf09/search -H "X-Webhook-Secret: $S" -H 'Content-Type: application/json' \
  -d '{"query":"Đổi trả sản phẩm trong bao nhiêu ngày?","topK":3}'
# 3) Nạp lại cùng file -> status "duplicate"; thêm  -F "replace=true"  để nạp lại thật
# 4) Kiểm tra trong DB
docker compose exec -T postgres psql -U sales_agent -d ai_sales_agent -c \
 "SELECT metadata->>'title' t, metadata->>'status' s, metadata->>'chunkCount' n FROM documents;" -c \
 "SELECT chunk_index, vector_dims(embedding) dims, left(content,50) FROM document_chunks ORDER BY chunk_index LIMIT 5;"
```

Gợi ý trình tự khi demo: nạp 2 PDF (chính sách, bảng giá) → hỏi 2 câu khác chủ đề → nạp lại file cũ (duplicate) → nạp `scan-khong-co-chu.pdf` (bị từ chối `NO_TEXT`) → xem `workflow_runs` và `event_outbox`.

## 8. Giới hạn đã biết

- **Chưa gọi nhà cung cấp thật khi kiểm thử.** Môi trường thử không có Internet nên Gemini/OpenAI được thay bằng server giả lập đúng định dạng yêu cầu/phản hồi theo tài liệu công khai. Chất lượng tìm kiếm với embedding thật (nhất là tiếng Việt) và hạn mức miễn phí chưa được đo. **Việc đầu tiên khi có API key: nạp 2 PDF mẫu và hỏi vài câu.**
- **PDF dạng ảnh/scan** không có chữ để đọc → bị từ chối `NO_TEXT`; cần OCR (WF-10) rồi nạp lại.
- **Không lưu file PDF gốc** (`storage_url` trống), chỉ lưu chữ đã trích. Cột này để dành nếu nhóm bổ sung kho lưu file.
- **Chưa có index vector.** Với dưới vài chục nghìn đoạn thì quét tuần tự vẫn nhanh. Khi lớn hơn, nhờ Bảo thêm vào `002_schema.sql`: `CREATE INDEX idx_document_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops);`
- **Hai file giống hệt gửi đúng cùng lúc** có thể cùng lọt qua bước kiểm tra trùng (chưa có ràng buộc unique trên `textHash`; thêm cần phối hợp Bảo vì đụng schema).
- Thứ tự cột trang dựa vào cách `pdf.js` đọc; PDF nhiều cột/bảng phức tạp có thể ra chữ xen kẽ.
- Các endpoint chỉ có xác thực bằng secret dùng chung, chưa có phân quyền theo người dùng. Không công khai cổng n8n ra Internet.
