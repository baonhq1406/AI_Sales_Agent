import { NextRequest, NextResponse } from 'next/server';

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  context: Context
) {
  const token = request.cookies.get('sale_session')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Bạn cần đăng nhập' },
      { status: 401 }
    );
  }

  const apiKey = process.env.INTERNAL_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API Key chưa được cấu hình' },
      { status: 503 }
    );
  }

  const origin = request.headers.get('origin');
  const allowedOrigin = process.env.SALES_APP_ORIGIN;

  if (!allowedOrigin) {
    return NextResponse.json(
      { error: 'SALES_APP_ORIGIN chưa được cấu hình' },
      { status: 503 }
    );
  }

  if (origin !== allowedOrigin) {
    return NextResponse.json(
      { error: 'Nguồn yêu cầu không hợp lệ' },
      { status: 403 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Dữ liệu JSON không hợp lệ' },
      { status: 400 }
    );
  }

  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ' },
      { status: 400 }
    );
  }

  const data = body as Record<string, unknown>;

  if (
    data.status !== 'approved' &&
    data.status !== 'rejected'
  ) {
    return NextResponse.json(
      { error: 'Quyết định không hợp lệ' },
      { status: 400 }
    );
  }

  if (
    data.decisionNote !== undefined &&
    typeof data.decisionNote !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Ghi chú không hợp lệ' },
      { status: 400 }
    );
  }

  const { id } = await context.params;

  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return NextResponse.json(
      { error: 'ID báo giá không hợp lệ' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `http://api:3000/api/v1/approvals/${id}/decision`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: data.status,
          ...(data.decisionNote !== undefined
            ? { decisionNote: data.decisionNote }
            : {}),
        }),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Không thể xử lý quyết định báo giá' },
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
