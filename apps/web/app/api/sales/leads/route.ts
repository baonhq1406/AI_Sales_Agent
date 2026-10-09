import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Bạn cần đăng nhập để xem khách hàng' },
      { status: 401 }
    );
  }

  const apiKey = process.env.INTERNAL_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'INTERNAL_API_KEY chưa được cấu hình' },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      'http://api:3000/api/v1/leads',
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
        { error: 'Không thể lấy danh sách khách hàng' },
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
