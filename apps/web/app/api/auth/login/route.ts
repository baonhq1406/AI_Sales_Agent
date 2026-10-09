import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiUrl } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (
      typeof body.email !== 'string' ||
      typeof body.password !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không hợp lệ' },
        { status: 400 }
      );
    }

    const apiUrl = getInternalApiUrl();
    const response = await fetch(
      `${apiUrl}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: body.email,
          password: body.password,
        }),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    const result = await response.json();
    const data = result.data ?? result;
    const token = data.accessToken;

    if (typeof token !== 'string' || !token) {
      return NextResponse.json(
        { error: 'Backend không trả về JWT' },
        { status: 502 }
      );
    }

    const res = NextResponse.json({
      message: 'Đăng nhập thành công',
      user: data.user,
    });

    res.cookies.set('sale_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60,
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: 'Không thể kết nối hệ thống đăng nhập' },
      { status: 502 }
    );
  }
}
