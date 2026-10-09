import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const apiUrl = process.env.INTERNAL_API_URL;
  const apiKey = process.env.INTERNAL_API_KEY;

  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: 'Dashboard API chưa được cấu hình' },
      { status: 503 },
    );
  }

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
