import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.INTERNAL_API_KEY;
  const apiUrl = process.env.INTERNAL_API_URL;

  if (!apiKey || !apiUrl) {
    return NextResponse.json(
      { error: 'Dashboard API is not configured' },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      `${apiUrl}/dashboard/overview`,
      {
        headers: {
          'x-api-key': apiKey,
        },
        cache: 'no-store',
      }
    );

    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { error: 'Cannot connect to Dashboard API' },
      { status: 502 }
    );
  }
}
