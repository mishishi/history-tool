// POST /api/checkout — 创建 Stripe Checkout Session(目前只支持单期 ¥9.9 那档)
// 用户点 "试读一篇" 按钮 → 前端 fetch 这里 → 拿 url → 跳转
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { SITE_URL } from '@/lib/site-config';

export const runtime = 'nodejs';

let stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripe = new Stripe(key, { apiVersion: '2026-06-24.dahlia' });
  return stripe;
}

// 单期价格(USD) — 1.40 ≈ ¥9.9
const SINGLE_PRICE_USD = 140; // cents

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const plan = body.plan || 'single';

  if (plan !== 'single') {
    return NextResponse.json(
      {
        ok: false,
        error: '该订阅方案暂未开通(年付/三年方案需要用户系统,还没接)',
      },
      { status: 400 }
    );
  }

  const s = getStripe();
  if (!s) {
    return NextResponse.json(
      {
        ok: false,
        error: '支付暂未配置。请把 STRIPE_SECRET_KEY 加到 Vercel 环境变量。',
      },
      { status: 503 }
    );
  }

  // baseUrl 优先级:env > SITE_URL > host header(本地开发)
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    SITE_URL ||
    (req.headers.get('host') ? `https://${req.headers.get('host')}` : 'http://localhost:3000');

  try {
    const session = await s.checkout.sessions.create({
      mode: 'payment', // 一次性付,不是订阅
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '读通鉴 · 单期精读',
              description:
                '任选 1 篇深度解读,永久阅读。主理人每周邮件寄信。同时你的支持让这个项目跑得下去。',
              images: [`${SITE_URL}/icons/icon-512.png`],
            },
            unit_amount: SINGLE_PRICE_USD,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/unlock/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/unlock?cancelled=1`,
      // metadata 让后续查 session 时能拿到 plan(无 webhook 时也能用)
      metadata: {
        plan: 'single',
        product: 'tongjian-single-article',
        source: 'history-tool-web',
      },
      // 支付成功后,把收据发给买家(Stripe 自动)
      // 我们不向用户索要邮箱 — Stripe Checkout 会自动收集
      locale: 'zh',
    });

    return NextResponse.json({ ok: true, url: session.url, id: session.id });
  } catch (err) {
    console.error('[api/checkout] stripe error:', err);
    return NextResponse.json(
      { ok: false, error: '支付服务异常,请稍后重试' },
      { status: 500 }
    );
  }
}
