import { NextRequest, NextResponse } from 'next/server';
import {
  getInternalApiKey,
  getInternalApiUrl,
  getN8nKnowledgeIngestUrl,
  getWf09WebhookSecret,
} from '@/lib/config';

export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const CATEGORIES = ['product', 'policy', 'faq', 'pricing', 'general'];
type ApiPayload = Record<string, unknown> | null;

async function getOrganizationId(token: string) {
  const response = await fetch(`${getInternalApiUrl()}/auth/me`, {
    headers: {
      'x-api-key': getInternalApiKey(),
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const json = (await response.json()) as { data?: { organizationId?: string } };
  return json.data?.organizationId || null;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  }

  try {
    const response = await fetch(`${getInternalApiUrl()}/knowledge/documents`, {
      headers: {
        'x-api-key': getInternalApiKey(),
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    console.error(
      '[wf09] cannot load documents:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'Không thể tải danh sách tài liệu lúc này.' },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  }

  const secret = getWf09WebhookSecret();
  if (!secret) {
    console.error('[wf09] WF09_WEBHOOK_SECRET chưa được cấu hình cho dịch vụ web');
    return NextResponse.json(
      { error: 'Chức năng nạp tài liệu chưa được cấu hình trên máy chủ.' },
      { status: 503 },
    );
  }

  let organizationId: string | null;
  let form: FormData;
  try {
    [organizationId, form] = await Promise.all([
      getOrganizationId(token),
      request.formData(),
    ]);
  } catch {
    return NextResponse.json(
      { error: 'Không thể xác thực phiên hoặc đọc dữ liệu tải lên.' },
      { status: 502 },
    );
  }
  if (!organizationId) {
    return NextResponse.json(
      { error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' },
      { status: 401 },
    );
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: 'Hãy chọn một file PDF có nội dung.' },
      { status: 400 },
    );
  }
  if (
    file.size > MAX_FILE_BYTES ||
    (!file.name.toLowerCase().endsWith('.pdf') &&
      file.type !== 'application/pdf')
  ) {
    return NextResponse.json(
      { error: 'Chỉ nhận file PDF có dung lượng tối đa 10 MB.' },
      { status: file.size > MAX_FILE_BYTES ? 413 : 400 },
    );
  }

  const categoryValue = String(form.get('category') || 'general');
  const category = CATEGORIES.includes(categoryValue)
    ? categoryValue
    : 'general';
  const title = String(form.get('title') || file.name).trim().slice(0, 200);
  const upstreamForm = new FormData();
  upstreamForm.append('file', file, file.name || 'upload.pdf');
  upstreamForm.append('title', title || file.name);
  upstreamForm.append('category', category);
  upstreamForm.append('organizationId', organizationId);
  upstreamForm.append(
    'replace',
    String(form.get('replace') || 'false') === 'true' ? 'true' : 'false',
  );

  let upstream: Response;
  try {
    upstream = await fetch(getN8nKnowledgeIngestUrl(), {
      method: 'POST',
      headers: { 'X-Webhook-Secret': secret },
      body: upstreamForm,
      signal: AbortSignal.timeout(120_000),
      cache: 'no-store',
    });
  } catch (error) {
    console.error(
      '[wf09] cannot reach n8n ingest webhook:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'WF-09 tạm thời chưa phản hồi. Vui lòng thử lại sau.' },
      { status: 503 },
    );
  }

  const payload = (await upstream.json().catch(() => null)) as ApiPayload;
  if ([200, 201, 409, 413, 422].includes(upstream.status)) {
    return NextResponse.json(payload ?? { status: 'error' }, {
      status: upstream.status,
    });
  }
  console.error(
    '[wf09] unexpected n8n ingest response:',
    upstream.status,
    JSON.stringify(payload),
  );
  return NextResponse.json(
    { error: 'Không xử lý được tài liệu lúc này. Vui lòng thử lại sau.' },
    { status: 503 },
  );
}
