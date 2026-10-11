import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiKey, getInternalApiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Bạn cần đăng nhập để xem khách hàng' },
      { status: 401 }
    );
  }

  const apiKey = getInternalApiKey();
  const apiUrl = getInternalApiUrl();

  try {
    const response = await fetch(
      `${apiUrl}/leads`,
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

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Bạn cần đăng nhập để tạo khách hàng' },
      { status: 401 }
    );
  }

  const apiKey = getInternalApiKey();
  const apiUrl = getInternalApiUrl();

  try {
    // 1. Get user profile to get organizationId
    const meRes = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!meRes.ok) {
      return NextResponse.json(
        { error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' },
        { status: 401 }
      );
    }

    const meData = await meRes.json();
    const user = meData.data || meData;
    const organizationId = user.organizationId;

    const body = await request.json();

    const response = await fetch(`${apiUrl}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        organizationId,
        firstName: body.firstName || '',
        lastName: body.lastName || '',
        companyName: body.companyName || '',
        email: body.email || undefined,
        phone: body.phone || undefined,
        source: body.source || 'sales_workspace',
        metadata: body.metadata || {},
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || 'Không thể tạo khách hàng' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Không thể kết nối Backend' },
      { status: 502 }
    );
  }
}
