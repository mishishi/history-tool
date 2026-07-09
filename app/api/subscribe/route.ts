// POST /api/subscribe  — 接收邮件订阅,发确认邮件
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { savePendingSubscription } from '@/lib/store';
import { checkRate, generateToken, sendEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/site-config';

export const runtime = 'nodejs'; // 我们用 node:crypto

// 邮件 HTML 品牌色(light 主题)— 邮件客户端不支持 CSS 变量,直接写 hex
const BRAND = {
  cinnabar: '#B23A3A',
  paper: '#F5F0E8',
  ink: '#1A1A1A',
} as const;

const BodySchema = z.object({
  email: z.string().email('请输入有效的邮箱地址').max(120),
  // 反垃圾:honeypot 字段 — 真人看不到,机器人会填
  website: z.string().max(0).optional().or(z.literal('')),
  consent: z.boolean().refine((v) => v === true, { message: '请同意隐私条款' }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || '输入有误' },
        { status: 400 }
      );
    }

    // Honeypot — 填了字段说明是 bot,假装成功但不做任何事
    if (parsed.data.website && parsed.data.website.length > 0) {
      return NextResponse.json({ ok: true, mode: 'silent' });
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const ua = req.headers.get('user-agent') || '';

    const rl = await checkRate(ip);
    if (!rl.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `请求过于频繁,请 ${Math.ceil((rl.reset! / 1000) / 60)} 分钟后再试`,
        },
        { status: 429 }
      );
    }

    const token = generateToken(parsed.data.email, 'confirm');
    const result = await savePendingSubscription(parsed.data.email, token, {
      ip,
      userAgent: ua,
    });

    if (!result.ok) {
      const msg =
        result.reason === 'already_confirmed'
          ? '这个邮箱已经订阅过了'
          : '邮件服务暂未配置,请稍后再试(我们已在修)';
      const status = result.reason === 'already_confirmed' ? 409 : 503;
      return NextResponse.json({ ok: false, error: msg }, { status });
    }

    // 构造确认邮件 + 发送
    // baseUrl 优先级:env > SITE_URL > host header(本地开发)
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      SITE_URL ||
      (req.headers.get('host') ? `https://${req.headers.get('host')}` : 'http://localhost:3000');
    const confirmUrl = `${baseUrl}/api/confirm?token=${encodeURIComponent(token)}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:${BRAND.paper};font-family:'Helvetica Neue',Arial,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;padding:10px 16px;background:${BRAND.cinnabar};color:${BRAND.paper};font-weight:bold;letter-spacing:0.1em;">读通鉴 · DU TONGJIAN</div>
    </div>

    <h1 style="font-size:22px;color:${BRAND.ink};margin:24px 0 12px;line-height:1.4;">
      再点一下,我们就交个朋友
    </h1>
    <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
      收到了你 <strong style="color:${BRAND.ink};">${parsed.data.email}</strong> 的订阅请求。
      点击下面的按钮,确认是我本人、不是机器人,然后我就能在每周三把新写的解读送到你信箱。
    </p>
    <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 24px;">
      发来的不是营销内容,就是文章本身。一周一封,坚持这一条规矩。
    </p>

    <div style="text-align:center;margin:36px 0;">
      <a href="${confirmUrl}"
         style="display:inline-block;padding:14px 28px;background:${BRAND.cinnabar};color:${BRAND.paper};text-decoration:none;font-weight:bold;border-radius:6px;letter-spacing:0.05em;font-size:15px;">
        确认订阅读通鉴
      </a>
    </div>

    <p style="font-size:13px;line-height:1.7;color:#8A8A8A;margin:32px 0 0;">
      如果按钮点不开,把这个链接复制到浏览器打开:
      <br /><a href="${confirmUrl}" style="color:${BRAND.cinnabar};word-break:break-all;">${confirmUrl}</a>
    </p>

    <hr style="border:none;border-top:1px solid #E8E4DC;margin:32px 0;" />

    <p style="font-size:12px;line-height:1.6;color:#8A8A8A;margin:0;">
      读通鉴 · 主编 Jason<br />
      由 AI 辅助生产,人类编辑校对。<br />
      <a href="${baseUrl}" style="color:#8A8A8A;">${SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>
    </p>
  </div>
</body>
</html>
    `.trim();

    const sendResult = await sendEmail({
      to: parsed.data.email,
      subject: '再点一下,确认你是真人 — 读通鉴',
      html,
      text: `收到你的订阅请求,点这里确认:\n\n${confirmUrl}\n\n— 读通鉴`,
    });

    return NextResponse.json({
      ok: true,
      emailMode: sendResult.mode,
    });
  } catch (err) {
    console.error('[api/subscribe] error:', err);
    return NextResponse.json({ ok: false, error: '服务异常,请稍后重试' }, { status: 500 });
  }
}
