// GET /api/confirm?token=... — 确认订阅,成功后重定向到 /subscribed
import { NextRequest, NextResponse } from 'next/server';
import { confirmSubscription } from '@/lib/store';
import { verifyToken } from '@/lib/email';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/unsubscribe?reason=invalid', req.url));
  }

  const verified = verifyToken(token, 'confirm');
  if (!verified.ok || !verified.email) {
    return NextResponse.redirect(new URL('/unsubscribe?reason=invalid', req.url));
  }

  const ok = await confirmSubscription(token);
  if (!ok.ok) {
    return NextResponse.redirect(new URL('/unsubscribe?reason=expired', req.url));
  }

  return NextResponse.redirect(
    new URL(`/subscribed?email=${encodeURIComponent(ok.email!)}`, req.url)
  );
}
