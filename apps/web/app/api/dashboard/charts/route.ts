import { NextResponse } from 'next/server';
import { getInternalApiKey, getInternalApiUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = getInternalApiKey();
  const apiUrl = getInternalApiUrl();

  try {
    const response = await fetch(
      `${apiUrl}/dashboard/charts`,
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
