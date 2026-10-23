import { Injectable } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Injectable()
export class DashboardAiService {
  constructor(private readonly dashboard: DashboardService) {}

  async getInsights(organizationId: string) {
    const [overview, charts] = await Promise.all([
      this.dashboard.getOverview(organizationId),
      this.dashboard.getCharts(organizationId),
    ]);

    const systemRule =
      'Bạn là chuyên gia phân tích dữ liệu kinh doanh. ' +
      'Chỉ sử dụng các số liệu được cung cấp. ' +
      'Trả lời bằng tiếng Việt, ngắn gọn và rõ ràng. ' +
      'QUY TẮC BẮT BUỘC: ' +
      'total_leads là số khách hàng tiềm năng; ' +
      'high_churn_customers là số khách hàng có nguy cơ rời bỏ cao. ' +
      'Đây là hai chỉ số độc lập, không được lấy ' +
      'high_churn_customers chia cho total_leads. ' +
      'Không tự tính phần trăm nếu không có mẫu số phù hợp. ' +
      'Không bịa doanh thu, tỷ lệ chuyển đổi hoặc xu hướng tăng giảm. ' +
      'Không coi null là 0. ' +
      'Dữ liệu ít thì phải nói rõ kết luận chỉ mang tính tham khảo. ' +
      'Chỉ viết ba mục: Tình hình hiện tại, Cảnh báo, ' +
      'Đề xuất hành động. Mỗi mục tối đa ba ý. ' +
      'Không sử dụng bảng Markdown.';

    // Ưu tiên 1: Gemini Flash (chỉ truyền Text siêu tiết kiệm token)
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const geminiModel =
      process.env.GEMINI_MODEL?.trim() || 'gemini-3-flash-preview';

    if (geminiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemRule }] },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: JSON.stringify({ overview, charts }) }],
                },
              ],
            }),
            signal: AbortSignal.timeout(25000),
          },
        );
        if (res.ok) {
          const data = (await res.json()) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };
          const out =
            data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
          if (out) {
            return {
              insights: out,
              model: geminiModel,
            };
          }
        }
      } catch {
        // Fallback to Groq or SQL analytics below
      }
    }

    // Ưu tiên 2: Groq API
    const groqKey = process.env.GROQ_API_KEY?.trim();
    if (groqKey) {
      try {
        const response = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'openai/gpt-oss-120b',
              temperature: 0.3,
              max_completion_tokens: 1500,
              messages: [
                { role: 'system', content: systemRule },
                { role: 'user', content: JSON.stringify({ overview, charts }) },
              ],
            }),
            signal: AbortSignal.timeout(25000),
          },
        );
        if (response.ok) {
          const result = await response.json();
          return {
            insights:
              result.choices?.[0]?.message?.content ||
              'AI chưa trả về nội dung phân tích.',
            model: 'openai/gpt-oss-120b',
          };
        }
      } catch {
        // Fallback to SQL analytics below
      }
    }

    // Phân tích tự động từ số liệu PostgreSQL thực tế khi chưa điền API Key vào .env
    const totalLeads = overview.total_leads ?? 0;
    const avgScore =
      overview.avg_lead_score !== null ? `${overview.avg_lead_score}/100` : 'Chưa có';
    const highChurn = overview.high_churn_customers ?? 0;
    const topChannel =
      charts.interactions_by_channel?.[0]?.channel || 'voice';
    const topChannelCount =
      charts.interactions_by_channel?.[0]?.total ?? 0;

    return {
      insights:
        `### Tình hình hiện tại\n` +
        `- Hệ thống đang ghi nhận tổng cộng **${totalLeads} khách hàng tiềm năng (Leads)** trong PostgreSQL với điểm tiềm năng trung bình đạt **${avgScore}**.\n` +
        `- Kênh tương tác chủ lực hiện tại là **${topChannel.toUpperCase()}** với **${topChannelCount} phiên tương tác** đã được ghi nhận.\n\n` +
        `### Cảnh báo\n` +
        `- Hiện có **${highChurn} hồ sơ khách hàng** có chỉ số rủi ro rời bỏ (Churn Risk >= 70%) cần đội ngũ CSKH kiểm tra kịch bản giữ chân (WF-22).\n` +
        `- Bạn có thể điền thêm \`GEMINI_API_KEY\` vào file \`.env\` để kích hoạt mô hình \`gemini-3.8-flash\` phân tích chuyên sâu.\n\n` +
        `### Đề xuất hành động\n` +
        `- Sử dụng **Tổng đài Voice AI Outbound (WF-01)** gọi ngay cho nhóm Lead có điểm số >= 75 để chốt lịch Demo.\n` +
        `- Kích hoạt **Multi-Agent Orchestrator (WF-03)** để tự động đẩy báo giá sang hàng đợi Phê duyệt Báo giá (HITL).`,
      model: 'postgresql-live-analytics (Chờ thêm GEMINI_API_KEY vào .env)',
    };
  }
}
