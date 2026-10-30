import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    message: 'Đăng xuất thành công',
  });

  response.cookies.set('sale_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('sale_logged_in', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  return response;
}
