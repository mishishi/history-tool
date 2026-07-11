// Resend 邮件包装,没配置时降级到 console.log
import { Resend } from 'resend';
import { MAIL_FROM } from './site-config';

// 进程级 rate-limit map (放在 globalThis 跨 hot reload 保留)
declare global {
  // eslint-disable-next-line no-var
  var __rl_map: Map<string, number[]> | undefined;
}

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendResult {
  ok: boolean;
  id?: string;
  mode: 'sent' | 'logged';
  error?: string;
}

// 单例
let resend: Resend | null = null;
function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

const FROM = MAIL_FROM;

export async function sendEmail(params: EmailParams): Promise<SendResult> {
  const r = getResend();
  if (!r) {
    if (process.env.NODE_ENV !== 'production') {
      // dev fallback:打 console 让本地能调试
      console.log('\n[EMAIL/dev] ----');
      console.log('  to:', params.to);
      console.log('  subject:', params.subject);
      console.log('  --- text ---');
      console.log(params.text || params.html.replace(/<[^>]+>/g, ''));
      console.log('[EMAIL/dev] ----\n');
      return { ok: true, mode: 'logged' };
    }
    console.warn('[email] RESEND_API_KEY not set in production — skipping send for', params.to);
    return { ok: false, mode: 'logged', error: 'RESEND_API_KEY not configured' };
  }

  try {
    const result = await r.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if ('error' in result && result.error) {
      return { ok: false, mode: 'sent', error: String(result.error) };
    }
    // 走到这里 result 是 { data: CreateEmailResponseSuccess, error: null }
    const id = result.data && 'id' in result.data ? result.data.id : null;
    return { ok: true, id: id ?? undefined, mode: 'sent' };
  } catch (err) {
    return { ok: false, mode: 'sent', error: String(err) };
  }
}

// ---------- Token 工具(HMAC 签名,防伪造) ----------

import crypto from 'node:crypto';

const SECRET = () =>
  process.env.SUBSCRIBE_SECRET || process.env.RESEND_API_KEY || 'dev-fallback-secret-change-me';

export function generateToken(email: string, purpose: 'confirm' | 'unsub'): string {
  const payload = `${purpose}:${email.toLowerCase().trim()}:${Date.now()}:${crypto.randomBytes(8).toString('hex')}`;
  const sig = crypto.createHmac('sha256', SECRET()).update(payload).digest('hex').slice(0, 32);
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifyToken(
  token: string,
  purpose: 'confirm' | 'unsub'
): { ok: boolean; email?: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length < 4) return { ok: false };
    const [p, email, ts, nonce, sig] = parts;
    const payload = `${p}:${email}:${ts}:${nonce}`;
    const expectedSig = crypto
      .createHmac('sha256', SECRET())
      .update(payload)
      .digest('hex')
      .slice(0, 32);
    if (sig !== expectedSig) return { ok: false };
    if (p !== purpose) return { ok: false };
    return { ok: true, email };
  } catch {
    return { ok: false };
  }
}

// ---------- Rate limit (IP-based) ----------

const RATE_WINDOW_SEC = 10 * 60; // 10 分钟
const RATE_MAX = 5; // 同一 IP 最多 5 次/10 分钟

export async function checkRate(ip: string): Promise<{ ok: boolean; reset?: number }> {
  // 简单 in-memory rate limit(每个 serverless instance)
  // 严格 anti-abuse 需要 Redis,这里 demo 够用
  const key = `__rl:${ip}`;
  const now = Date.now();
  const windowMs = RATE_WINDOW_SEC * 1000;

  // 拿 process-level Map(单实例,跨 hot reload 保留)
  if (!globalThis.__rl_map) globalThis.__rl_map = new Map<string, number[]>();
  const map = globalThis.__rl_map;

  const list = (map.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= RATE_MAX) {
    return { ok: false, reset: windowMs - (now - list[0]) };
  }
  list.push(now);
  map.set(key, list);
  return { ok: true };
}
