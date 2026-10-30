import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiKey, getInternalApiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;
  if (!token) {
    return NextResponse.json(
      { error: 'Bạn cần đăng nhập để sử dụng Voice AI' },
      { status: 401 },
    );
  }

  const action = request.nextUrl.searchParams.get('action') || 'voices';
  const endpoint =
    action === 'status'
      ? '/voice-workflows/status'
      : action === 'retail-catalog' || action === 'retail_catalog'
        ? '/voice-workflows/retail-catalog'
        : '/voice-workflows/voices';

  try {
    const response = await fetch(`${getInternalApiUrl()}${endpoint}`, {
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
      { error: 'Không thể kết nối Core Backend API Gateway' },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sale_session')?.value;
  if (!token) {
    return NextResponse.json(
      { error: 'Bạn cần đăng nhập để thực thi Workflow' },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      action?: string;
      payload?: Record<string, unknown>;
    };
    const action = body.action || '';
    const payload = body.payload || {};

    let endpoint = '';
    let method: 'POST' | 'DELETE' = 'POST';

    switch (action) {
      case 'stt':
        endpoint = '/voice-workflows/stt';
        break;
      case 'tts':
        endpoint = '/voice-workflows/tts';
        break;
      case 'clone_voice':
        endpoint = '/voice-workflows/voices/clone';
        break;
      case 'delete_voice':
        endpoint = `/voice-workflows/voices/${encodeURIComponent(String(payload.id || ''))}`;
        method = 'DELETE';
        break;
      case 'wf01':
        endpoint = '/voice-workflows/wf01/outbound-call';
        break;
      case 'wf02':
        endpoint = '/voice-workflows/wf02/inbound-call';
        break;
      case 'wf03':
        endpoint = '/voice-workflows/wf03/orchestrate';
        break;
      case 'wf04':
        endpoint = '/voice-workflows/wf04/agentic-request';
        break;
      default:
        return NextResponse.json(
          { error: `Action không hợp lệ: ${action}` },
          { status: 400 },
        );
    }

    const response = await fetch(`${getInternalApiUrl()}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getInternalApiKey(),
        Authorization: `Bearer ${token}`,
      },
      body: method === 'POST' ? JSON.stringify(payload) : undefined,
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: 'Lỗi kết nối khi thực thi Voice AI Workflow' },
      { status: 502 },
    );
  }
}
