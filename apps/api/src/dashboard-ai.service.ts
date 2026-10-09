import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Injectable()
export class DashboardAiService {
  constructor(private readonly dashboard: DashboardService) {}

  async getInsights(organizationId: string) {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'GROQ_API_KEY is not configured',
      );
    }

    const [overview, charts] = await Promise.all([
      this.dashboard.getOverview(organizationId),
      this.dashboard.getCharts(organizationId),
    ]);

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          temperature: 0.3,
          max_completion_tokens: 1500,
          messages: [
            {
              role: 'system',
              content:
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
                'Không sử dụng bảng Markdown.',
            },
            {
              role: 'user',
              content: JSON.stringify({ overview, charts }),
            },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      },
    );

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Groq API request failed: ${response.status}`,
      );
    }

    const result = await response.json();

    return {
      insights:
        result.choices?.[0]?.message?.content ||
        'AI chưa trả về nội dung phân tích.',
      model: 'openai/gpt-oss-120b',
    };
  }
}
