import { NextResponse } from 'next/server';
import { handleOAuth } from '@/lib/server/oauth';

const STATUS = {
  unauthenticated: 401,
  'invalid-argument': 400,
  'not-found': 404,
  'failed-precondition': 412,
  unavailable: 503,
};

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const header = request.headers.get('authorization') || '';
    const idToken = header.startsWith('Bearer ') ? header.slice(7) : '';
    const result = await handleOAuth(idToken, body);
    return NextResponse.json(result);
  } catch (err) {
    const code = err.code || 'internal';
    return NextResponse.json(
      { code, message: err.message || 'Request failed' },
      { status: STATUS[code] || 500 }
    );
  }
}
