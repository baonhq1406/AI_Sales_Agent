// WF-10 | Proxy từ giao diện Sales tới webhook OCR của n8n.
// Vì sao có proxy: (1) secret của webhook không lộ ra trình duyệt; (2) chỉ người đã đăng nhập mới dùng được;
// (3) organizationId lấy từ phiên đăng nhập, không tin dữ liệu trình duyệt gửi lên.

import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiUrl, getN8nOcrWebhookUrl, getWf10WebhookSecret } from '@/lib/config';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 120_000; // AI đọc ảnh có thể mất vài chục giây
const DOC_TYPES = ['auto', 'business_card', 'contract'];

type Raw = Record<string, unknown>;

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập để quét tài liệu' }, { status: 401 });
  }

  const secret = getWf10WebhookSecret();
  if (!secret) {
    console.error('[wf10] WF10_WEBHOOK_SECRET chưa được cấu hình cho dịch vụ web');
    return NextResponse.json({ error: 'Chức năng quét OCR chưa được cấu hình trên máy chủ.' }, { status: 503 });
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

  // 2) Đọc file người dùng gửi lên
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Hãy chọn một ảnh danh thiếp/hợp đồng hoặc file PDF.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File quá lớn (tối đa 8 MB).' }, { status: 413 });
  }

  const docTypeRaw = String(form.get('docType') || 'auto');
  const docType = DOC_TYPES.includes(docTypeRaw) ? docTypeRaw : 'auto';

  // 3) Chỉ chuyển tiếp danh sách trắng các trường
  const upstreamForm = new FormData();
  upstreamForm.append('file', file, file.name || 'upload');
  upstreamForm.append('docType', docType);
  upstreamForm.append('createLead', String(form.get('createLead') ?? 'true') === 'false' ? 'false' : 'true');
  upstreamForm.append('replace', String(form.get('replace') ?? 'false') === 'true' ? 'true' : 'false');
  if (organizationId) upstreamForm.append('organizationId', organizationId);

  let upstream: Response;
  try {
    upstream = await fetch(getN8nOcrWebhookUrl(), {
      method: 'POST',
      headers: { 'X-Webhook-Secret': secret },
      body: upstreamForm,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[wf10] cannot reach n8n webhook:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Hệ thống OCR tạm thời chưa phản hồi. Vui lòng thử lại sau ít phút.' }, { status: 503 });
  }

  const data = (await upstream.json().catch(() => null)) as Raw | null;

  if (upstream.status === 200 || upstream.status === 201) {
    return NextResponse.json(data ?? { status: 'extracted' }, { status: 200 });
  }
  if (upstream.status === 422 || upstream.status === 413) {
    return NextResponse.json(data ?? { status: 'rejected', errors: [] }, { status: 422 });
  }
  // 403 = sai secret; 404 = workflow chưa Publish; 500/502 = lỗi trong workflow. Không lộ chi tiết nội bộ ra ngoài.
  console.error('[wf10] unexpected n8n response:', upstream.status, JSON.stringify(data));
  return NextResponse.json({ error: 'Không xử lý được file lúc này. Vui lòng thử lại sau.' }, { status: 503 });
}
