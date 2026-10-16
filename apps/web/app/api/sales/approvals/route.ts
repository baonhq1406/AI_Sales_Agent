import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiKey, getInternalApiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Bạn cần đăng nhập để xem báo giá' },
      { status: 401 }
    );
  }

  const apiKey = getInternalApiKey();
  const apiUrl = getInternalApiUrl();

  try {
    const response = await fetch(
      `${apiUrl}/approvals/pending`,
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
        { error: 'Không thể lấy danh sách phê duyệt' },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { error: 'Không thể kết nối Backend' },
      { status: 502 }
    );
  }
}
