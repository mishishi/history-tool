#!/usr/bin/env node
/**
 * 字体子集化
 * - Noto Serif SC:从 variable font 实例化 4 个 weight(400/500/600/700),各 subset 到 scripts/fonts/chars.txt
 * - LXGW WenKai TC:Regular 1 个 weight,subset 到 chars.txt
 *
 * 输入:scripts/fonts/sources/{NotoSerifSC-VF.ttf, LXGWWenKai-Regular.ttf}
 * 输出:scripts/fonts/out/{noto-serif-sc-400.woff2, ...-500.woff2, ...-600.woff2, ...-700.woff2, lxgw-wenkai-400.woff2}
 */

const fs = require('fs');
const path = require('path');
const subsetFont = require('subset-font').default || require('subset-font');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'scripts', 'fonts', 'sources');
const OUT = path.join(ROOT, 'scripts', 'fonts', 'out');
const CHARS = fs.readFileSync(path.join(ROOT, 'scripts', 'fonts', 'chars.txt'), 'utf8');

fs.mkdirSync(OUT, { recursive: true });

async function run() {
  console.log(`[chars] ${CHARS.length} unique characters`);

  // === Noto Serif SC: variable font → 4 weights ===
  const notoSrc = path.join(SRC, 'NotoSerifSC-VF.ttf');
  if (!fs.existsSync(notoSrc)) {
    console.error(`Not found: ${notoSrc}`);
    process.exit(1);
  }
  const notoBuf = fs.readFileSync(notoSrc);

  for (const weight of [400, 500, 600, 700]) {
    const t0 = Date.now();
    const out = await subsetFont(notoBuf, CHARS, {
      targetFormat: 'woff2',
      variationAxes: { wght: weight },
    });
    const dst = path.join(OUT, `noto-serif-sc-${weight}.woff2`);
    fs.writeFileSync(dst, out);
    const dt = Date.now() - t0;
    console.log(`  Noto Serif SC ${weight}: ${(out.length / 1024).toFixed(1)} KB (${dt}ms) → ${path.basename(dst)}`);
  }

  // === LXGW WenKai: Regular ===
  const wenkaiSrc = path.join(SRC, 'LXGWWenKai-Regular.ttf');
  if (!fs.existsSync(wenkaiSrc)) {
    console.error(`Not found: ${wenkaiSrc}`);
    process.exit(1);
  }
  const wenkaiBuf = fs.readFileSync(wenkaiSrc);

  {
    const t0 = Date.now();
    const out = await subsetFont(wenkaiBuf, CHARS, {
      targetFormat: 'woff2',
    });
    const dst = path.join(OUT, 'lxgw-wenkai-400.woff2');
    fs.writeFileSync(dst, out);
    const dt = Date.now() - t0;
    console.log(`  LXGW WenKai 400: ${(out.length / 1024).toFixed(1)} KB (${dt}ms) → ${path.basename(dst)}`);
  }

  console.log('\n[done]');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
