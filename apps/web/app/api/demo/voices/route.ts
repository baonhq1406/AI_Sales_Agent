import { NextResponse } from 'next/server';
import { getInternalApiKey, getInternalApiUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiUrl = getInternalApiUrl();
    const apiKey = getInternalApiKey();

    const response = await fetch(`${apiUrl}/voice-workflows/voices`, {
      headers: {
        'x-api-key': apiKey,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Không thể lấy danh sách giọng nói' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Demo voices error:', error);
    return NextResponse.json(
      { error: 'Lỗi kết nối máy chủ giọng nói' },
      { status: 502 },
    );
  }
}
