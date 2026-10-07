# Sprint 3 — Voice AI Workflows Specification

Specification for Voice AI features owned by **Bảo** in Sprint 3 (26/10/2026 - 07/11/2026):
- **WF-01: Voice AI Outbound Calling Agent (U013)**
- **WF-02: Voice AI Inbound Receptionist (U014)**

---

## 1. WF-01: Voice AI Outbound Calling Agent (U013)

### User Story
> *Là nhân viên sale, tôi muốn AI tự động gọi điện đàm thoại với khách hàng, để tự động hóa việc tư vấn và chốt sale (WF-01).*

### Architecture & Node Chain (12-Node Convention)
1. **Header Sticky Note (`Note WF-01`)**: Overview, trigger info, credential setup guide.
2. **01 Trigger - Outbound Request**: Webhook `POST /webhook/wf01/outbound-call` nhận yêu cầu kích hoạt cuộc gọi.
3. **02 Validation & Phone Normalization**: Kiểm tra định dạng số điện thoại E.164 (`+84...`), kiểm tra `lead_id` hoặc thông tin khách.
4. **03 Auth & Timing Policy**: Xác thực `X-API-Key`, kiểm tra khung giờ gọi (8:00 - 20:00) tránh gọi đêm/làm phiền.
5. **04 Fetch Lead & Customer Context**: Truy vấn bảng `leads` & `customer_profiles` trong PostgreSQL để lấy ngữ cảnh cá nhân hóa (tên, công ty, sản phẩm quan tâm, điểm tiềm năng).
6. **05 Create Workflow Run**: Ghi nhận bản ghi `running` vào bảng `workflow_runs`.
7. **06 Voice AI Dialogue Generator**: LLM Agent sinh kịch bản đàm thoại cá nhân hóa theo hồ sơ khách hàng.
8. **07 TTS & Telephony Dispatch**: Khởi tạo cuộc gọi qua Voice Provider (Twilio API / Mock Telephony Engine cho local dev).
9. **08 Call Outcome & Sentiment Analysis**: Phân tích kết quả đàm thoại (thời lượng, ý định khách hàng, độ quan tâm, sentiment).
10. **09 Save Interaction**: Ghi nhận bản ghi tương tác vào bảng `interactions` trong PostgreSQL (`channel: 'voice'`, `direction: 'outbound'`, `transcript`, `metadata`).
11. **10 Update Lead & Outbox Event**: Cập nhật trạng thái lead (`contacted`) và phát sự kiện `call.outbound.completed` vào bảng `event_outbox`.
12. **11 PostgreSQL Update Run**: Cập nhật trạng thái `completed` vào `workflow_runs`.
13. **12 Success Log & Webhook Response**: Trả về HTTP 200 kèm `call_sid`, `transcript_summary`, `lead_status`, `workflow_run_id`.
14. **13 Error Trigger & Handling**: Tự động bắt lỗi và đánh dấu `failed` trong `workflow_runs`.

---

## 2. WF-02: Voice AI Inbound Receptionist (U014)

### User Story
> *Là khách hàng, tôi muốn gọi vào hotline và trò chuyện với lễ tân AI, để các câu hỏi của tôi được giải đáp ngay lập tức (WF-02).*

### Architecture & Node Chain (12-Node Convention)
1. **Header Sticky Note (`Note WF-02`)**: Overview, webhook path, routing logic.
2. **01 Trigger - Inbound Call Webhook**: Webhook `POST /webhook/wf02/inbound-call` nhận sự kiện cuộc gọi đến từ tổng đài viễn thông (Twilio Voice webhook).
3. **02 Caller Identification**: Trích xuất số điện thoại người gọi (`From`), truy vấn PostgreSQL nhận diện lead/khách hàng cũ.
4. **03 Create Workflow Run**: Ghi nhận bản ghi `running` vào bảng `workflow_runs`.
5. **04 Intent & Sentiment Analysis**: Phân tích câu nói của khách (`SpeechResult` hoặc text đầu vào) để nhận diện ý định (Hỏi giá, Tư vấn sản phẩm, Khiếu nại, Gặp tư vấn viên trực tiếp).
6. **05 Knowledge Base RAG Lookup**: Tìm kiếm thông tin giải đáp nhanh các câu hỏi thường gặp về sản phẩm/dịch vụ.
7. **06 Escalation Decision Gate**:
   - Nếu là ca phức tạp/khách yêu cầu gặp người ➔ Chuyển sang luồng chuyển máy (Transfer / Escalation).
   - Nếu là câu hỏi thường gặp ➔ Lễ tân AI trả lời trực tiếp.
8. **07 Generate Voice Response & TwiML**: Sinh câu trả lời giọng nói thân thiện (TTS) hoặc cú pháp TwiML `<Dial>` chuyển hướng cuộc gọi đến hotline nhân viên.
9. **08 Save Inbound Interaction**: Lưu toàn bộ lịch sử cuộc gọi vào bảng `interactions` (`channel: 'voice'`, `direction: 'inbound'`, `transcript`, `metadata`).
10. **09 Outbox Event Dispatch**: Phát sự kiện `voice.inbound.processed` hoặc `support.call.escalated` vào `event_outbox`.
11. **10 PostgreSQL Update Run**: Cập nhật trạng thái `completed` vào `workflow_runs`.
12. **11 Respond to Telephony Server**: Phản hồi HTTP 200 với nội dung TwiML/JSON cho tổng đài.
13. **12 Error Trigger & Handling**: Xử lý ngoại lệ, ghi log lỗi vào `workflow_runs`.
