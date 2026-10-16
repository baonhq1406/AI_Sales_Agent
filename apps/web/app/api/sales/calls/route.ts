import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiKey, getInternalApiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Bạn cần đăng nhập để xem nhật ký cuộc gọi' },
      { status: 401 }
    );
  }

  const apiKey = getInternalApiKey();
  const apiUrl = getInternalApiUrl();

  try {
    const response = await fetch(
      `${apiUrl}/interactions?channel=voice`,
      {
        headers: {
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Không thể tải lịch sử cuộc gọi Voice AI' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Không thể kết nối Backend' },
      { status: 502 }
    );
  }
}
