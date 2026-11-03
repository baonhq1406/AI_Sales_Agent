import { NextRequest, NextResponse } from 'next/server';
import {
  getInternalApiKey,
  getInternalApiUrl,
  getN8nCompetitorAnalysisWebhookUrl,
  getWf11WebhookSecret,
} from '@/lib/config';

export const dynamic = 'force-dynamic';

type CompetitorSettings = { competitors?: unknown };

async function responseData(response: Response) {
  const body = await response.json();
  if (
    response.ok &&
    body &&
    typeof body === 'object' &&
    'data' in body
  ) {
    return body.data;
  }
  return body;
}

async function backendRequest(token: string, path: string, init?: RequestInit) {
  return fetch(`${getInternalApiUrl()}${path}`, {
    ...init,
    headers: {
      'x-api-key': getInternalApiKey(),
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  }

  try {
    const correlationId = request.nextUrl.searchParams.get('correlationId');
    if (correlationId) {
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          correlationId,
        )
      ) {
        return NextResponse.json({ error: 'Mã lượt chạy không hợp lệ.' }, { status: 400 });
      }
      const statusResponse = await backendRequest(
        token,
        `/workflow-runs/wf11/status/${encodeURIComponent(correlationId)}`,
      );
      return NextResponse.json(
        await responseData(statusResponse),
        { status: statusResponse.status },
      );
    }

    const response = await backendRequest(token, '/workflow-runs/wf11');
    return NextResponse.json(await responseData(response), { status: response.status });
  } catch (error) {
    console.error(
      '[wf11] cannot load competitor reports:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'Không thể tải dữ liệu phân tích đối thủ lúc này.' },
      { status: 502 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  }

  let settings: CompetitorSettings;
  try {
    settings = (await request.json()) as CompetitorSettings;
  } catch {
    return NextResponse.json({ error: 'Dữ liệu cấu hình không hợp lệ.' }, { status: 400 });
  }

  try {
    const response = await backendRequest(token, '/workflow-runs/wf11/competitors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return NextResponse.json(await responseData(response), { status: response.status });
  } catch (error) {
    console.error(
      '[wf11] cannot save competitor settings:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'Không thể lưu danh sách đối thủ lúc này.' },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  }

  const secret = getWf11WebhookSecret();
  if (!secret) {
    console.error('[wf11] WF11_WEBHOOK_SECRET chưa được cấu hình cho dịch vụ web');
    return NextResponse.json(
      { error: 'Chức năng chạy phân tích đối thủ chưa được cấu hình trên máy chủ.' },
      { status: 503 },
    );
  }

  let body: CompetitorSettings;
  try {
    body = (await request.json()) as CompetitorSettings;
  } catch {
    return NextResponse.json({ error: 'Dữ liệu chạy phân tích không hợp lệ.' }, { status: 400 });
  }

  const competitors = body.competitors;
  if (
    !Array.isArray(competitors) ||
    competitors.length === 0 ||
    competitors.length > 8 ||
    competitors.some(
      (name) =>
        typeof name !== 'string' ||
        !name.trim() ||
        name.trim().length > 80,
    )
  ) {
    return NextResponse.json(
      { error: 'Hãy nhập từ 1 đến 8 tên đối thủ, mỗi tên tối đa 80 ký tự.' },
      { status: 400 },
    );
  }
  const requestedDays = (body as CompetitorSettings & { days?: unknown }).days;
  if (
    requestedDays !== undefined &&
    (!Number.isInteger(requestedDays) ||
      Number(requestedDays) < 1 ||
      Number(requestedDays) > 30)
  ) {
    return NextResponse.json(
      { error: 'Khoảng thời gian phải từ 1 đến 30 ngày.' },
      { status: 400 },
    );
  }
  const requestedCorrelationId = (
    body as CompetitorSettings & { correlationId?: unknown }
  ).correlationId;
  const correlationId =
    typeof requestedCorrelationId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      requestedCorrelationId,
    )
      ? requestedCorrelationId
      : crypto.randomUUID();

  let organizationId: string;
  try {
    const meResponse = await backendRequest(token, '/auth/me');
    if (!meResponse.ok) {
      return NextResponse.json(
        { error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' },
        { status: 401 },
      );
    }
    const meResponseBody = (await meResponse.json()) as {
      organizationId?: string;
      data?: { organizationId?: string };
    };
    const me = meResponseBody.data || meResponseBody;
    organizationId = typeof me.organizationId === 'string' ? me.organizationId : '';
  } catch (error) {
    console.error(
      '[wf11] cannot authenticate manual run:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: 'Không thể xác thực phiên đăng nhập.' }, { status: 502 });
  }

  if (!organizationId) {
    return NextResponse.json(
      { error: 'Không xác định được tổ chức của tài khoản.' },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(getN8nCompetitorAnalysisWebhookUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': secret,
      },
      body: JSON.stringify({
        ...body,
        competitors: competitors.map((name) => name.trim()),
        organizationId,
        correlationId,
        force: true,
      }),
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      console.error('[wf11] n8n rejected manual run:', response.status);
      return NextResponse.json(
        { error: 'WF-11 không nhận được yêu cầu chạy. Kiểm tra workflow đã được kích hoạt.' },
        { status: response.status === 401 || response.status === 403 ? 503 : 502 },
      );
    }
    return NextResponse.json(result ?? { status: 'accepted' }, { status: 202 });
  } catch (error) {
    console.error(
      '[wf11] cannot start manual run:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'Không thể kết nối WF-11 lúc này. Vui lòng thử lại sau.' },
      { status: 503 },
    );
  }
}
