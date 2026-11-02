import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiKey, getInternalApiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Bạn cần đăng nhập để xem trạng thái WF-08' },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(`${getInternalApiUrl()}/workflow-runs/wf08`, {
      headers: {
        'x-api-key': getInternalApiKey(),
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: 'Không thể kết nối Backend khi tải trạng thái WF-08' },
      { status: 502 },
    );
  }
}
