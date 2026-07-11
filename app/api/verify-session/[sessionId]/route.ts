// GET /api/verify-session/[sessionId] — 验证 Stripe Checkout 是否真的付了
// 成功页调用,后端查 Stripe API 来确认 payment_status === 'paid'
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

let stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripe = new Stripe(key, { apiVersion: '2026-06-24.dahlia' });
  return stripe;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const s = getStripe();
  if (!s) {
    return NextResponse.json(
      { ok: false, error: '支付服务暂未配置' },
      { status: 503 }
    );
  }

  try {
    const session = await s.checkout.sessions.retrieve(params.sessionId);
    const paid = session.payment_status === 'paid';
    return NextResponse.json({
      ok: true,
      paid,
      plan: session.metadata?.plan || null,
      product: session.metadata?.product || null,
      amount: session.amount_total ?? null,
      currency: session.currency ?? null,
      customerEmail: session.customer_details?.email ?? null,
      // 给前端做展示用
      // Stripe invoice 展开后才有 hosted_invoice_url;未展开时是 string id
      receiptUrl: typeof session.invoice === 'string' ? null : (session.invoice?.hosted_invoice_url ?? null),
    });
  } catch (err) {
    console.error('[api/verify-session] error:', err);
    // Stripe 真 404(资源不存在)— 才是"会话不存在"
    // 其他异常(网络/限流/5xx)— 提示用户稍后再试
    const stripeErr = err as { statusCode?: number; code?: string };
    const isStripeNotFound = stripeErr?.statusCode === 404 || stripeErr?.code === 'resource_missing';
    if (isStripeNotFound) {
      return NextResponse.json(
        { ok: false, error: '会话不存在或已过期' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { ok: false, error: '支付服务暂时不可达,几秒后重试', transient: true },
      {
        status: 503,
        headers: { 'Retry-After': '5' },
      }
    );
  }
}
