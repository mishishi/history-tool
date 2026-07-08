// GET /api/unsubscribe?token=... — 撤销订阅
import { NextRequest, NextResponse } from 'next/server';
import { unsubscribe } from '@/lib/store';
import { verifyToken } from '@/lib/email';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const fallback = req.nextUrl.searchParams.get('email'); // 让用户手动点也行
  const baseUrl = new URL(req.url).origin;

  if (token) {
    const v = verifyToken(token, 'unsub');
    if (v.ok && v.email) {
      await unsubscribe(v.email);
      return NextResponse.redirect(
        new URL(`/unsubscribe?email=${encodeURIComponent(v.email)}&done=1`, req.url)
      );
    }
    return NextResponse.redirect(
      new URL(`/unsubscribe?reason=invalid`, req.url)
    );
  }

  if (fallback) {
    // 直接进入撤销页(让用户确认)
    return NextResponse.redirect(new URL(`/unsubscribe?email=${encodeURIComponent(fallback)}`, req.url));
  }

  return NextResponse.redirect(new URL(`/unsubscribe`, req.url));
}

// POST 允许用户从撤销页主动撤销(token + email 已知)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || '').toString().trim();
    if (!email) {
      return NextResponse.json({ ok: false, error: 'missing email' }, { status: 400 });
    }
    const ok = await unsubscribe(email);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
