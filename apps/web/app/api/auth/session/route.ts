import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;

  if (!token) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }

  try {
    const apiUrl = getInternalApiUrl();
    const response = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const resJson = await response.json();
    const user = resJson.data || resJson;

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch {
    // If backend is unreachable but token is present in cookie
    return NextResponse.json({
      authenticated: true,
      user: {
        displayName: 'Chuyên viên Bán hàng',
        role: 'sale',
      },
    });
  }
}
