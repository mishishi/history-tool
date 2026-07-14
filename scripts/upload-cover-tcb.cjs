/**
 * scripts/upload-cover-tcb.cjs
 *
 * 批量上传 public/covers/*.webp 到腾讯云 CloudBase (TCB) 存储桶
 * 减 Vercel 部署 size 27 MB + 国内 CDN 加速
 *
 * 用法:
 *   # .env.local 已配 TCB_SECRET_ID/KEY/BUCKET/DOMAIN
 *   node scripts/upload-cover-tcb.cjs          # 跑
 *   node scripts/upload-cover-tcb.cjs --dry-run  # 只列不传
 *
 * CommonJS 不用 .mjs:cos-sdk v3 ESM 模式 'client is not defined' bug
 * 路径前缀 KEY_PREFIX = 'history-tool/cover/'(多项目桶分桶)
 */

const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const COS = require('cos-nodejs-sdk-v5');

const COVER_DIR = path.join(process.cwd(), 'public', 'covers');
const BUCKET = process.env.TCB_BUCKET;
const REGION = process.env.TCB_REGION || 'ap-shanghai';
const SECRET_ID = process.env.TCB_SECRET_ID;
const SECRET_KEY = process.env.TCB_SECRET_KEY;
const TCB_DOMAIN = process.env.TCB_DOMAIN;

const DRY_RUN = process.argv.includes('--dry-run');
const CONCURRENCY = 10;
const KEY_PREFIX = 'history-tool/cover/';

if (!SECRET_ID || !SECRET_KEY || !BUCKET) {
  console.error('❌ 缺少 TCB 配置:TCB_SECRET_ID, TCB_SECRET_KEY, TCB_BUCKET 必须 set');
  process.exit(1);
}

const client = new COS({ SecretId: SECRET_ID, SecretKey: SECRET_KEY });

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
  const localPath = path.join(COVER_DIR, `${slug}.webp`);
  const key = `${KEY_PREFIX}${slug}.webp`;
  const localSize = fs.statSync(localPath).size;

  if (DRY_RUN) return { slug, status: 'dry-run', localSize };

  const remote = await getRemoteMeta(key);
  if (remote.exists && remote.size === localSize) {
    return { slug, status: 'skipped', localSize, remoteSize: remote.size };
  }

  await client.putObject({
    Bucket: BUCKET,
    Region: REGION,
    Key: key,
    Body: fs.createReadStream(localPath),
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable',
  });

  return { slug, status: 'uploaded', localSize };
}

async function main() {
  console.log(`🔍 列 ${COVER_DIR}/*.webp ...`);
  const files = fs.readdirSync(COVER_DIR).filter((f) => f.endsWith('.webp'));
  console.log(`   找到 ${files.length} 个 webp`);

  if (DRY_RUN) {
    console.log('🧪 DRY RUN — 不实际上传');
  }

  const slugs = files.map((f) => f.replace(/\.webp$/, ''));

  const results = [];
  let uploaded = 0, skipped = 0, failed = 0;

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

  const sample = slugs[0];
  console.log(`\n📋 Sample URL: https://${TCB_DOMAIN}/${KEY_PREFIX}${sample}.webp`);
  console.log('   复制这个到浏览器验证可访问');
}

main().catch((err) => {
  console.error('💥 Fatal:', err);
  process.exit(1);
});
