# Sprint 4 — Multi-Agent Orchestrator Specification

Specification for Orchestration & Autonomous Agent features owned by **Bảo** in Sprint 4 (09/11/2026 - 21/11/2026):
- **WF-03: Multi-Agent Orchestrator (U021)**

---

## 1. WF-03: Multi-Agent Orchestrator (U021)

### User Story
> *Là kiến trúc sư hệ thống, tôi muốn AI Nhạc trưởng phân tích ngữ cảnh sau cuộc gọi để điều phối luồng tiếp theo sao cho xuyên suốt (WF-03).*

### Vai trò trong Hệ sinh thái (Ecosystem Role)
WF-03 đóng vai trò là "Tổng đạo diễn / AI Nhạc trưởng" (Orchestrator). Sau khi bất kỳ kênh tương tác nào (Voice AI WF-01/WF-02, Chat, Email) hoàn tất, WF-03 tiếp nhận ngữ cảnh, phân tích lịch sử khách hàng (Lead 360) và tự động ra quyết định chọn hành động tối ưu tiếp theo (Next Best Action - NBA) thông qua cơ chế LLM Tool Calling:
1. **`tool_generate_quote` (Báo giá cá nhân hóa)**: Kích hoạt tạo báo giá PDF và gửi đề xuất (`WF-14 Quote Generator`).
2. **`tool_schedule_meeting` (Đặt lịch hẹn demo)**: Khởi tạo lịch hẹn demo sản phẩm với chuyên viên tư vấn (`WF-17 Meeting Agent`).
3. **`tool_followup_email` (Email bám đuổi)**: Kích hoạt chuỗi email chăm sóc định kỳ (`WF-21 Follow-up Agent`).
4. **`tool_escalate_support` (Chuyển tiếp hỗ trợ)**: Bắn cảnh báo escalation khẩn cấp qua ticket/Slack nếu khách gặp sự cố kỹ thuật hoặc khiếu nại.
5. **`tool_nurture_lead` (Nuôi dưỡng tiềm năng)**: Tự động điều chỉnh điểm lead, gắn tag nuôi dưỡng và cập nhật trạng thái CRM.

---

### Architecture & Node Chain (12-Node Convention)
1. **Header Sticky Note (`Note WF-03`)**: Tổng quan kiến trúc, hướng dẫn credential, endpoint và kịch bản routing.
2. **01 Trigger - Orchestration Request**: Webhook `POST /webhook/wf03/orchestrate` nhận payload sau tương tác.
3. **02 Context & Intent Extraction**: Chuẩn hóa UUID (`correlation_id`, `organization_id`, `lead_id`), trích xuất lịch sử tương tác, sentiment và ý định khách hàng.
4. **03 Auth & Policy Gate**: Xác thực `X-API-Key: change-this-core-api-key`, kiểm tra tính toàn vẹn của dữ liệu đầu vào.
5. **04 Fetch Lead & 360 Context**: Truy vấn PostgreSQL lấy thông tin chi tiết lead (họ tên, công ty, điểm số, status, metadata) và lịch sử tương tác gần nhất.
6. **05 Create Workflow Run**: Ghi nhận bản ghi `running` vào bảng `workflow_runs` (`workflow_key: 'WF-03'`).
7. **06 Context Analyzer & Next-Best-Action Engine**: Bộ não LLM Router đánh giá ngữ cảnh và quyết định công cụ/sub-agent tối ưu tiếp theo.
8. **07 Tool Calling & Sub-Agent Dispatcher**: Thực thi Tool tương ứng (gọi sub-workflow/API tích hợp và trả về kết quả hành động).
9. **08 Save Orchestration Interaction**: Ghi nhận bản ghi tương tác điều phối vào bảng `interactions` (`channel: 'system'`, `direction: 'internal'`, `interaction_type: 'orchestration_decision'`).
10. **09 Update Lead State & Lifecycle**: Cập nhật trạng thái lead trong `leads` (`next_action`, điều chỉnh điểm số `score`, cập nhật `metadata`).
11. **10 Outbox Event Dispatch**: Phát sự kiện `orchestration.decision.dispatched` vào bảng `event_outbox` để các service downstream xử lý.
12. **11 PostgreSQL Update Run**: Cập nhật trạng thái `completed` và output vào `workflow_runs`.
13. **12 Success Log**: Đóng gói payload phản hồi chuẩn hóa (`chosen_tool`, `action_result`, `lead_id`, `workflow_run_id`).
14. **13 Respond to Webhook**: Trả về HTTP 200 cho caller.
15. **14 Error Trigger & Handling**: Tự động bắt lỗi ngoại lệ, ghi log lỗi vào `workflow_runs` với trạng thái `failed`.

---

### API Endpoint & Contract
* **Method**: `POST`
* **Path**: `/webhook/wf03/orchestrate`
* **Header**: `X-API-Key: change-this-core-api-key`
* **Sample Payload**:
```json
{
  "lead_id": "c1735d29-7e64-417b-9d7b-a82bf1d76691",
  "phone": "+84987654321",
  "source_channel": "voice_outbound",
  "last_interaction": {
    "intent": "request_proposal",
    "sentiment": "positive",
    "summary": "Khách quan tâm gói Pro, yêu cầu gửi báo giá qua Zalo/Email."
  },
  "correlation_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
}
```
* **Sample Response (HTTP 200)**:
```json
{
  "status": "success",
  "data": {
    "lead_id": "c1735d29-7e64-417b-9d7b-a82bf1d76691",
    "customer_name": "Bao Nguyen",
    "decision": {
      "chosen_tool": "tool_generate_quote",
      "target_workflow": "WF-14",
      "confidence": 0.95,
      "reason": "Khách hàng có ý định request_proposal với sắc thái tích cực sau cuộc gọi tư vấn.",
      "action_summary": "Tạo báo giá gói Pro và kích hoạt đề xuất gửi khách hàng."
    },
    "action_result": {
      "status": "dispatched",
      "package_recommended": "Pro",
      "quote_amount": 5000000
    },
    "workflow_run_id": "...",
    "correlation_id": "..."
  }
}
```
