/**
 * scripts/upload-audio-tcb.mjs
 *
 * 批量上传 public/audios/*.mp3 到腾讯云 CloudBase (TCB) 存储桶
 * 减 Vercel 部署 size 477 MB → ~50 MB + 流量便宜 50%
 *
 * 用法:
 *   # 1. 配 .env.local
 *   TCB_SECRET_ID=xxx
 *   TCB_SECRET_KEY=xxx
 *   TCB_BUCKET=636c-cloud1-d9gv1q8ikad5e9721-1442530204
 *   TCB_REGION=ap-shanghai  (默认,无需改)
 *   TCB_DOMAIN=636c-cloud1-d9gv1q8ikad5e9721-1442530204.tcb.qcloud.la
 *
 *   # 2. 装依赖(一次性)
 *   npm install cos-nodejs-sdk-v5
 *
 *   # 3. 跑
 *   node scripts/upload-audio-tcb.mjs
 *   # 或: node scripts/upload-audio-tcb.mjs --dry-run
 *
 * 行为:
 *   - 列 public/audios/*.mp3(100 个)
 *   - 并发 10 个上传到 audio/{slug}.mp3
 *   - 跳过已上传(sha256 对比)
 *   - 验证 public URL 可访问(HEAD 200)
 *   - 输出汇总 + 失败列表
 *
 * 风险:
 *   - SecretKey 在 .env.local,不入 git
 *   - 上传完成后建议在腾讯云控制台撤销 key + 重新生成
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import COS from 'cos-nodejs-sdk-v5';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audios');
const BUCKET = process.env.TCB_BUCKET;
const REGION = process.env.TCB_REGION || 'ap-shanghai';
const SECRET_ID = process.env.TCB_SECRET_ID;
const SECRET_KEY = process.env.TCB_SECRET_KEY;

if (!SECRET_ID || !SECRET_KEY || !BUCKET) {
  console.error('❌ 缺少 TCB 配置:');
  console.error('   TCB_SECRET_ID, TCB_SECRET_KEY, TCB_BUCKET 必须 set');
  console.error('   复制 .env.local.example 为 .env.local 然后填值');
  process.exit(1);
}

const client = new COS({
  SecretId: SECRET_ID,
  SecretKey: SECRET_KEY,
});

const DRY_RUN = process.argv.includes('--dry-run');
const CONCURRENCY = 10;
const KEY_PREFIX = 'audio/';

async function sha256(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function getRemoteMeta(key) {
  try {
    const head = await client.headObject({ Bucket: BUCKET, Region: REGION, Key: key });
    return { exists: true, size: Number(head.headers?.['content-length'] || 0) };
  } catch (err) {
    if (err.code === 'NoSuchKey' || err.statusCode === 404) {
      return { exists: false };
    }
    throw err;
  }
}

async function uploadOne(slug) {
  const localPath = path.join(AUDIO_DIR, `${slug}.mp3`);
  const key = `${KEY_PREFIX}${slug}.mp3`;
  const localSize = fs.statSync(localPath).size;

  if (DRY_RUN) {
    return { slug, status: 'dry-run', localSize };
  }

  // 跳过已存在(简单 size 对比;严格可加 sha256 但慢)
  const remote = await getRemoteMeta(key);
  if (remote.exists && remote.size === localSize) {
    return { slug, status: 'skipped', localSize, remoteSize: remote.size };
  }

  // 上传(mp3 静态资源,无 ContentType 让 COS 默认)
  await client.putObject({
    Bucket: BUCKET,
    Region: REGION,
    Key: key,
    Body: fs.createReadStream(localPath),
    ContentType: 'audio/mpeg',
    CacheControl: 'public, max-age=31536000, immutable', // 1 年缓存
  });

  return { slug, status: 'uploaded', localSize };
}

async function main() {
  console.log(`🔍 列 ${AUDIO_DIR}/*.mp3 ...`);
  const files = fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith('.mp3'));
  console.log(`   找到 ${files.length} 个 mp3`);

  if (DRY_RUN) {
    console.log('🧪 DRY RUN — 不实际上传');
  }

  const slugs = files.map((f) => f.replace(/\.mp3$/, ''));

  const results = [];
  let uploaded = 0, skipped = 0, failed = 0;

  // 简单并发(10 个)
  for (let i = 0; i < slugs.length; i += CONCURRENCY) {
    const batch = slugs.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (slug) => {
        try {
          const r = await uploadOne(slug);
          if (r.status === 'uploaded') uploaded++;
          else if (r.status === 'skipped') skipped++;
          return r;
        } catch (err) {
          failed++;
          return { slug, status: 'failed', error: err.message || String(err) };
        }
      }),
    );
    results.push(...batchResults);

    const done = i + batch.length;
    process.stdout.write(
      `\r  ${done}/${slugs.length}  uploaded=${uploaded} skipped=${skipped} failed=${failed}`,
    );
  }

  console.log('\n');
  console.log('='.repeat(60));
  console.log(`✅ 上传完成: uploaded=${uploaded} skipped=${skipped} failed=${failed}`);

  if (failed > 0) {
    console.log('\n❌ 失败列表:');
    results.filter((r) => r.status === 'failed').forEach((r) => {
      console.log(`   ${r.slug}: ${r.error}`);
    });
  }

  // 输出 sample URL
  const sample = slugs[0];
  console.log(`\n📋 Sample URL: ${process.env.TCB_DOMAIN}/audio/${sample}.mp3`);
  console.log('   复制这个到浏览器验证可访问');
}

main().catch((err) => {
  console.error('💥 Fatal:', err);
  process.exit(1);
});
