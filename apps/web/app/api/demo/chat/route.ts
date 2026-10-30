import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiKey, getInternalApiUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const voice_id = typeof body.voice_id === 'string' ? body.voice_id : 'vn-trucly-female';
    const caller_name = typeof body.caller_name === 'string' ? body.caller_name : 'Khách hàng Trải nghiệm';

    if (!query) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp nội dung câu hỏi' },
        { status: 400 },
      );
    }

    const apiUrl = getInternalApiUrl();
    const apiKey = getInternalApiKey();

    const response = await fetch(`${apiUrl}/voice-workflows/wf02/inbound-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        speech: query,
        voice_id,
        caller_name,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || 'Không thể kết nối đến Trợ lý Voice AI' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Demo chat error:', error);
    return NextResponse.json(
      { error: 'Hệ thống Voice AI đang bận. Vui lòng thử lại sau ít giây.' },
      { status: 502 },
    );
  }
}
