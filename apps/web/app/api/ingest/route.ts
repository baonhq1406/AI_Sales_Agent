// WF-07 | Proxy từ form công khai tới webhook của n8n.
// Lý do có proxy: (1) trình duyệt không cần biết địa chỉ nội bộ của n8n, không dính CORS;
// (2) chỉ chuyển tiếp các trường được phép; (3) không lộ leadId/eventId ra ngoài.

import { getN8nFormWebhookUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

const MAX_BODY_CHARS = 20_000;
const UPSTREAM_TIMEOUT_MS = 15_000;

const LIMITS = {
  fullName: 200,
  email: 320,
  phone: 40,
  companyName: 200,
  message: 5000,
  submissionId: 100,
  website: 200,
} as const;

type Raw = Record<string, unknown>;

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

function reply(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_CHARS) {
    return reply(413, { status: 'error', message: 'Nội dung gửi lên quá lớn.' });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return reply(400, { status: 'error', message: 'Dữ liệu gửi lên không hợp lệ.' });
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return reply(400, { status: 'error', message: 'Dữ liệu gửi lên không hợp lệ.' });
  }
  const input = parsed as Raw;

  // Chỉ chuyển tiếp danh sách trắng. organizationId / source do server quyết định, không tin trình duyệt.
  const payload = {
    fullName: text(input.fullName, LIMITS.fullName),
    email: text(input.email, LIMITS.email),
    phone: text(input.phone, LIMITS.phone),
    companyName: text(input.companyName, LIMITS.companyName),
    message: text(input.message, LIMITS.message),
    // Khóa chống gửi trùng: nếu trình duyệt không gửi, tạo ngẫu nhiên để 2 tin giống nhau
    // ở hai thời điểm khác nhau không bị coi là một.
    submissionId: text(input.submissionId, LIMITS.submissionId) || crypto.randomUUID(),
    website: text(input.website, LIMITS.website), // honeypot
    source: 'web-contact-form',
  };

  const webhookUrl = getN8nFormWebhookUrl();

  let upstream: Response;
  try {
    upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[wf07] cannot reach n8n webhook:', error instanceof Error ? error.message : error);
    return reply(503, { status: 'error', message: 'Hệ thống tạm thời chưa nhận được yêu cầu. Vui lòng thử lại sau ít phút.' });
  }

  const data = (await upstream.json().catch(() => null)) as Raw | null;

  if (upstream.status === 200 || upstream.status === 202) {
    return reply(200, {
      status: data?.status === 'duplicate' ? 'duplicate' : 'accepted',
      correlationId: typeof data?.correlationId === 'string' ? data.correlationId : null,
    });
  }

  if (upstream.status === 422) {
    return reply(422, { status: 'rejected', errors: Array.isArray(data?.errors) ? data.errors : [] });
  }

  // 404 = workflow chưa Publish; 500 = lỗi trong workflow. Không lộ chi tiết nội bộ ra ngoài.
  console.error('[wf07] unexpected n8n response:', upstream.status, JSON.stringify(data));
  return reply(503, { status: 'error', message: 'Hệ thống tạm thời chưa nhận được yêu cầu. Vui lòng thử lại sau ít phút.' });
}
