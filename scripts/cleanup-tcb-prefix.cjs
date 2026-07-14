/**
 * scripts/cleanup-tcb-prefix.cjs
 *
 * 删 TCB bucket 里指定 prefix 的所有对象(用 COS SDK)
 * 用途:upload 后清理旧 prefix 残留(避免占空间 / 跨项目混)
 *
 * 用法:
 *   node scripts/cleanup-tcb-prefix.cjs <prefix>             # 删 prefix 开头所有对象
 *   node scripts/cleanup-tcb-prefix.cjs <prefix> --dry-run    # 列出但不删
 *
 * 例:node scripts/cleanup-tcb-prefix.cjs audio/ --dry-run
 *
 * 注意:用 .cjs(CommonJS)而不是 .mjs(ESM) ——
 *   cos-nodejs-sdk-v5 v3 在 ESM 模式下 callback "client is not defined" 内部 bug
 */

const COS = require('cos-nodejs-sdk-v5');
require('dotenv').config({ path: '.env.local' });

const BUCKET = process.env.TCB_BUCKET;
const REGION = process.env.TCB_REGION || 'ap-shanghai';
const SECRET_ID = process.env.TCB_SECRET_ID;
const SECRET_KEY = process.env.TCB_SECRET_KEY;

const DRY_RUN = process.argv.includes('--dry-run');
// 跳过 node 路径(0) 和 script 路径(1),找第 1 个非 flag 参数
const prefix = process.argv[2] && !process.argv[2].startsWith('-')
  ? process.argv[2]
  : null;

if (!prefix) {
  console.error('用法: node scripts/cleanup-tcb-prefix.cjs <prefix> [--dry-run]');
  console.error('例:   node scripts/cleanup-tcb-prefix.cjs audio/');
  process.exit(1);
}
if (!SECRET_ID || !SECRET_KEY || !BUCKET) {
  console.error('❌ 缺少 TCB 配置(TCB_SECRET_ID/SECRET_KEY/BUCKET)');
  process.exit(1);
}

const client = new COS({ SecretId: SECRET_ID, SecretKey: SECRET_KEY });

async function listAll(prefix) {
  // COS 单次 getBucket 最多 1000 key,1000 个对象应该 1 次拉完
  const r = await client.getBucket({
    Bucket: BUCKET,
    Region: REGION,
    Prefix: prefix,
    MaxKeys: 1000,
  });
  return r.Contents || [];
}

async function deleteBatch(keys) {
  // COS SDK v3:deleteMultiObject → deleteMultipleObject
  const r = await client.deleteMultipleObject({
    Bucket: BUCKET,
    Region: REGION,
    Objects: keys.map((k) => ({ Key: k })),
    Quiet: true,
  });
  return r.Error || [];
}

async function main() {
  console.log(`🔍 列 ${BUCKET} prefix="${prefix}" ...`);
  const objs = await listAll(prefix);
  console.log(`   找到 ${objs.length} 个对象`);

  if (objs.length === 0) {
    console.log('✅ 干净,无残留');
    return;
  }

  if (DRY_RUN) {
    console.log('🧪 DRY RUN — 列出但不删:');
    objs.slice(0, 10).forEach((o) => console.log(`   ${o.Key}  (${o.Size} bytes)`));
    if (objs.length > 10) console.log(`   ... 还有 ${objs.length - 10} 个`);
    return;
  }

  const keys = objs.map((o) => o.Key);
  console.log(`🗑️  删 ${keys.length} 个对象(batch 每 1000 个)...`);

  const BATCH = 1000;
  let deleted = 0, failed = 0;
  for (let i = 0; i < keys.length; i += BATCH) {
    const batch = keys.slice(i, i + BATCH);
    const errors = await deleteBatch(batch);
    deleted += batch.length - errors.length;
    failed += errors.length;
    if (errors.length > 0) {
      errors.forEach((e) => console.error(`   ❌ ${e.Key}: ${e.Code || e.Message}`));
    }
    process.stdout.write(`\r  ${Math.min(i + BATCH, keys.length)}/${keys.length}`);
  }
  console.log(`\n✅ 删完成: deleted=${deleted} failed=${failed}`);
}

main().catch((err) => {
  console.error('💥 Fatal:', err);
  process.exit(1);
});
