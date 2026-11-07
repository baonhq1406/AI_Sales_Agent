// WF-12 | Proxy từ giao diện Sales tới webhook dịch đa ngôn ngữ của n8n.
// Vì sao có proxy: (1) secret của webhook không lộ ra trình duyệt; (2) chỉ người đã đăng nhập mới dùng được;
// (3) organizationId lấy từ phiên đăng nhập, không tin dữ liệu trình duyệt gửi lên.

import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiUrl, getN8nTranslateWebhookUrl, getWf12WebhookSecret } from '@/lib/config';

export const dynamic = 'force-dynamic';

const MAX_CHARS = 4000;
const UPSTREAM_TIMEOUT_MS = 120_000; // AI dịch thường vài giây, nhưng workflow có thể tự thử lại tới 3 lần
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LANG_RE = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i;

type Raw = Record<string, unknown>;

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập để dùng chức năng dịch' }, { status: 401 });
  }

  const secret = getWf12WebhookSecret();
  if (!secret) {
    console.error('[wf12] WF12_WEBHOOK_SECRET chưa được cấu hình cho dịch vụ web');
    return NextResponse.json({ error: 'Chức năng dịch đa ngôn ngữ chưa được cấu hình trên máy chủ.' }, { status: 503 });
  }

  // 1) Xác thực phiên và lấy organizationId
  let organizationId = '';
  try {
    const meRes = await fetch(`${getInternalApiUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!meRes.ok) {
      return NextResponse.json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' }, { status: 401 });
    }
    const me = await meRes.json();
    const user = me.data || me;
    organizationId = typeof user.organizationId === 'string' ? user.organizationId : '';
  } catch {
    return NextResponse.json({ error: 'Không thể kết nối Backend' }, { status: 502 });
  }

  // 2) Đọc và kiểm tra dữ liệu người dùng gửi lên
  let body: Raw;
  try {
    body = (await request.json()) as Raw;
  } catch {
    return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
  }
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return NextResponse.json({ error: 'Hãy nhập nội dung cần dịch.' }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: `Nội dung quá dài (tối đa ${MAX_CHARS} ký tự).` }, { status: 413 });
  }
  const direction = body.direction === 'outbound' ? 'outbound' : 'inbound';
  const leadId = typeof body.leadId === 'string' && UUID_RE.test(body.leadId) ? body.leadId : '';
  const targetLanguage = typeof body.targetLanguage === 'string' && LANG_RE.test(body.targetLanguage) ? body.targetLanguage.toLowerCase() : '';

  // 3) Chỉ chuyển tiếp danh sách trắng các trường
  const upstreamBody: Raw = { direction, text, channel: 'chat' };
  if (leadId) upstreamBody.leadId = leadId;
  if (targetLanguage) upstreamBody.targetLanguage = targetLanguage;
  if (organizationId) upstreamBody.organizationId = organizationId;

  let upstream: Response;
  try {
    upstream = await fetch(getN8nTranslateWebhookUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': secret },
      body: JSON.stringify(upstreamBody),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[wf12] cannot reach n8n webhook:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Hệ thống dịch tạm thời chưa phản hồi. Vui lòng thử lại sau ít phút.' }, { status: 503 });
  }

  const data = (await upstream.json().catch(() => null)) as Raw | null;

  if (upstream.status === 200 || upstream.status === 201) {
    return NextResponse.json(data ?? { status: 'translated' }, { status: 200 });
  }
  if (upstream.status === 422) {
    return NextResponse.json(data ?? { status: 'rejected', errors: [] }, { status: 422 });
  }
  // 403 = sai secret; 404 = workflow chưa Publish; 500/502 = lỗi trong workflow. Không lộ chi tiết nội bộ ra ngoài.
  console.error('[wf12] unexpected n8n response:', upstream.status, JSON.stringify(data));
  return NextResponse.json({ error: 'Không dịch được lúc này. Vui lòng thử lại sau.' }, { status: 503 });
}
