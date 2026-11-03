import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiKey, getInternalApiUrl } from '@/lib/config';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Câu hỏi gửi lên không hợp lệ.' },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${getInternalApiUrl()}/knowledge/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getInternalApiKey(),
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
      cache: 'no-store',
    });
    return NextResponse.json(await response.json(), {
      status: response.status,
    });
  } catch (error) {
    console.error(
      '[wf09] cannot get knowledge answer:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'Không thể kết nối dịch vụ hỏi đáp lúc này.' },
      { status: 502 },
    );
  }
}
