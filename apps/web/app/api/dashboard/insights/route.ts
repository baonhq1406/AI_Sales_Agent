import { NextResponse } from 'next/server';
import { getInternalApiKey, getInternalApiUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST() {
  const apiUrl = getInternalApiUrl();
  const apiKey = getInternalApiKey();

  try {
    const response = await fetch(`${apiUrl}/dashboard/insights`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(40000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Không thể lấy phân tích AI' },
        { status: response.status },
      );
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Không thể kết nối đến AI Insights' },
      { status: 503 },
    );
  }
}
