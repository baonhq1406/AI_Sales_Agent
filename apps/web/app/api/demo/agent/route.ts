import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiKey, getInternalApiUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = typeof body.input === 'string' ? body.input.trim() : '';

    if (!input) {
      return NextResponse.json(
        { error: 'Vui lòng nhập lệnh tác tử' },
        { status: 400 },
      );
    }

    const apiUrl = getInternalApiUrl();
    const apiKey = getInternalApiKey();

    const response = await fetch(`${apiUrl}/voice-workflows/wf04/agentic-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ input }),
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || 'Không thể thực thi Tác tử Tự chủ' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Demo agent error:', error);
    return NextResponse.json(
      { error: 'Hệ thống Đa Tác Tử đang bận. Vui lòng thử lại sau.' },
      { status: 502 },
    );
  }
}
