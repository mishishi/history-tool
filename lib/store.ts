// Upstash Redis 存储包装 — 真实的 KV,Upstash 免费层每天 10K 请求
// 没配置时降级到内存 + console.log(只在本地 dev 用,prod 没配会写入丢失,后台警告)

import { Redis } from '@upstash/redis';

export interface Subscriber {
  email: string;
  createdAt: number;
  confirmedAt: number | null;
  ip?: string;
  userAgent?: string;
}

// 单例
let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

const isMemMode = () => process.env.NODE_ENV !== 'production' && !getRedis();

// 内存降级(只 dev 用)
const memorySubs = new Map<string, Subscriber>();
const memoryTokens = new Map<string, string>(); // token → email

// ---------- Key helpers ----------

const emailKey = (email: string) => email.toLowerCase().trim();
const subKey = (email: string) => `sub:email:${emailKey(email)}`;
const tokenKey = (token: string) => `sub:confirm:${token}`;
const CONFIRMED_SET = 'sub:confirmed';

// 注意:@upstash/redis SDK 自带 sadd/srem/scard,无需类型扩展

// ---------- 公开 API ----------

/**
 * 写入一个待确认的订阅请求(返回是否成功 + 是否已是已确认订阅者)
 */
export async function savePendingSubscription(
  email: string,
  token: string,
  meta: { ip?: string; userAgent?: string }
): Promise<{ ok: boolean; reason?: 'already_confirmed' | 'no_storage' }> {
  const r = getRedis();
  const now = Date.now();
  const sub: Subscriber = {
    email: emailKey(email),
    createdAt: now,
    confirmedAt: null,
    ip: meta.ip,
    userAgent: meta.userAgent,
  };

  if (r) {
    // 已是已确认订阅者? 直接拒绝(避免重复发邮件)
    const existing = (await r.get<Subscriber>(subKey(email))) || null;
    if (existing && existing.confirmedAt) {
      return { ok: false, reason: 'already_confirmed' };
    }
    // 7 天过期(token 一致化)
    const ttl = 7 * 24 * 60 * 60;
    // 写入 sub(覆盖旧的 pending)
    await r.set(subKey(email), sub, { ex: ttl });
    // 写入 token → email
    await r.set(tokenKey(token), emailKey(email), { ex: ttl });
    return { ok: true };
  } else if (isMemMode()) {
    const existing = memorySubs.get(emailKey(email));
    if (existing && existing.confirmedAt) {
      return { ok: false, reason: 'already_confirmed' };
    }
    memorySubs.set(emailKey(email), sub);
    memoryTokens.set(token, emailKey(email));
    // eslint-disable-next-line no-console
    console.log(`[store/dev] pending subscription:`, emailKey(email));
    return { ok: true };
  }

  console.warn('[store] UPSTASH_REDIS_REST_URL not set in production; subscribers cannot be saved.');
  return { ok: false, reason: 'no_storage' };
}

/**
 * 通过 token 确认订阅
 */
export async function confirmSubscription(
  token: string
): Promise<{ ok: boolean; email?: string }> {
  const r = getRedis();
  if (r) {
    const email = await r.get<string>(tokenKey(token));
    if (!email) return { ok: false };
    const sub: Subscriber = {
      email,
      createdAt: Date.now(),
      confirmedAt: Date.now(),
    };
    // 已确认订阅者:不设过期(直到取消)
    await r.set(subKey(email), sub);
    await r.del(tokenKey(token));
    await r.sadd(CONFIRMED_SET, email);
    return { ok: true, email };
  } else if (isMemMode()) {
    const email = memoryTokens.get(token);
    if (!email) return { ok: false };
    const sub = memorySubs.get(email);
    if (!sub) return { ok: false };
    sub.confirmedAt = Date.now();
    memoryTokens.delete(token);
    // eslint-disable-next-line no-console
    console.log(`[store/dev] confirmed:`, email);
    return { ok: true, email };
  }
  return { ok: false };
}

/**
 * 取消订阅
 */
export async function unsubscribe(email: string): Promise<boolean> {
  const r = getRedis();
  const e = emailKey(email);
  if (r) {
    const had = await r.del(subKey(e));
    await r.srem(CONFIRMED_SET, e);
    return had > 0;
  } else if (isMemMode()) {
    const had = memorySubs.delete(e);
    // eslint-disable-next-line no-console
    if (had) console.log(`[store/dev] unsubscribed:`, e);
    return had;
  }
  return false;
}

/**
 * 查订阅者
 */
export async function getSubscriber(email: string): Promise<Subscriber | null> {
  const r = getRedis();
  const e = emailKey(email);
  if (r) {
    return (await r.get<Subscriber>(subKey(e))) || null;
  } else if (isMemMode()) {
    return memorySubs.get(e) || null;
  }
  return null;
}

/**
 * 已确认订阅者总数(给 footer 展示)
 */
export async function getConfirmedCount(): Promise<number> {
  const r = getRedis();
  if (r) return await r.scard(CONFIRMED_SET);
  if (isMemMode()) {
    let n = 0;
    for (const v of memorySubs.values()) {
      if (v.confirmedAt) n++;
    }
    return n;
  }
  return 0;
}
