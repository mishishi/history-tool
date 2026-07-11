#!/usr/bin/env node
/**
 * scripts/build-cover-prompts.mjs
 *
 * 读 content/articles/*.md 的 frontmatter,生成 50 张 cover prompt JSON
 *
 * Prompt 模板:统一青绿山水 + 敦煌壁画风,每篇从 excerpt 提取场景
 * - 朝代色调从 lib/dynasties.ts 拿
 * - 主体:俯瞰 + 朱红小人物(可叠加印章/标题)
 * - 强化 ban list 防 matrix 自加文字
 *
 * 输出:tmp/cover-prompts.jsonl (每行 {slug, prompt})
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// --- 朝代色调 + motif(从 lib/dynasties.ts 同步) ---
const DYNASTY_COLORS = {
  '战国':         { primary: 'cinnabar red, charcoal black', mood: 'warring, fierce, ink-wash battlefields' },
  '战国中后期':   { primary: 'cinnabar red, charcoal black', mood: 'warring, fierce, ink-wash battlefields' },
  '战国末':       { primary: 'cinnabar red, charcoal black', mood: 'warring, fierce, ink-wash battlefields' },
  '秦汉':         { primary: 'cinnabar red, charcoal black', mood: 'imperial, monumental, columned halls' },
  '秦':           { primary: 'cinnabar red, charcoal black', mood: 'imperial, monumental, columned halls' },
  '西汉→新':     { primary: 'cinnabar red, charcoal black', mood: 'imperial, monumental, columned halls' },
  '西汉':         { primary: 'cinnabar red, charcoal black', mood: 'imperial, monumental, columned halls' },
  '东汉':         { primary: 'cinnabar red, charcoal black', mood: 'imperial, monumental, columned halls' },
  '三国':         { primary: 'iron blue-grey, cinnabar, charcoal', mood: 'heroic, smoky battlefields, cold' },
  '蜀汉':         { primary: 'iron blue-grey, cinnabar, charcoal', mood: 'heroic, smoky battlefields, cold' },
  '两晋':         { primary: 'slate blue-grey, malachite, ash', mood: 'melancholic, misty, scholarly' },
  '南北朝':       { primary: 'indigo blue, malachite, gold', mood: 'mountainous, misty, Buddhist' },
  '隋':           { primary: 'gold, cinnabar, malachite', mood: 'imperial, ornate, golden age' },
  '唐':           { primary: 'gold, cinnabar, malachite', mood: 'imperial, ornate, golden age' },
  '唐末':         { primary: 'gold, cinnabar, malachite', mood: 'imperial, ornate, golden age' },
  '隋唐':         { primary: 'gold, cinnabar, malachite', mood: 'imperial, ornate, golden age' },
  '五代':         { primary: 'ash grey, cinnabar, ochre', mood: 'chaotic, sparse, fractured' },
  '宋':           { primary: 'slate blue, malachite, gold', mood: 'scholarly, refined, misty' },
  '北宋':         { primary: 'slate blue, malachite, gold', mood: 'scholarly, refined, misty' },
  '北宋末':       { primary: 'slate blue, cinnabar, ash', mood: 'stormy, dark, impending' },
  '南宋':         { primary: 'slate blue, cinnabar, ash', mood: 'defiant, misty, river-bound' },
  '元':           { primary: 'cinnabar, malachite, ochre', mood: 'vast, grassland, Mongol' },
  '明':           { primary: 'cinnabar, gold, charcoal', mood: 'imperial, court, Forbidden City' },
  '明末':         { primary: 'cinnabar, ash, charcoal', mood: 'turbulent, late court' },
  '清':           { primary: 'cinnabar, gold, malachite', mood: 'imperial, ornate, Forbidden City' },
  '清初':         { primary: 'cinnabar, gold, malachite', mood: 'imperial, ornate, Forbidden City' },
  '清末':         { primary: 'ash, cinnabar, charcoal', mood: 'turbulent, late Qing' },
  '中华民国':     { primary: 'charcoal, ash, cinnabar', mood: 'republican, transitional' },
  '民国':         { primary: 'charcoal, ash, cinnabar', mood: 'republican, transitional' },
  '中华人民共和国':{ primary: 'cinnabar, gold, slate', mood: 'modern, industrial, national' },
};

const DEFAULT_COLOR = { primary: 'cinnabar red, ochre, malachite', mood: 'historical, classical' };

// --- prompt 拼接 ---
const BAN_LIST = `
ABSOLUTELY NO TEXT OF ANY KIND ANYWHERE IN THE IMAGE.
No Chinese characters. No English letters. No Japanese characters.
No Korean characters. No Arabic. No Latin alphabet. No calligraphic
strokes. No seal stamps. No signets. No annotations. No writing on
walls, scrolls, banners, clothing, or anywhere. The image must be
completely free of any text, logograms, or written symbols.
`.trim();

const STYLE_HEADER = `Chinese blue-green landscape painting qinglv shanshui,
Dunhuang Mogao cave mural inspired.`.replace(/\s+/g, ' ');

function buildPrompt(article) {
  const { title, subtitle, excerpt, dynasty } = article;
  const colorSpec = DYNASTY_COLORS[dynasty] || DEFAULT_COLOR;

  // 场景从 excerpt 提取(取前 80 字作为"场景关键词")
  const sceneHint = excerpt
    .replace(/[「」『』"""'']/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 120)
    .trim();

  // 朝代专有元素
  const dynastyElement = pickDynastyElement(dynasty, excerpt);

  return [
    STYLE_HEADER,
    `${dynasty} historical period, China. ${sceneHint}.`,
    `Bird-eye view of ${dynastyElement.primary} with ${dynastyElement.detail}.`,
    `Foreground: a tiny lone ${dynastyElement.figure} in vermilion robes ${dynastyElement.pose}.`,
    `Background: ${dynastyElement.background}.`,
    `Style: gold outline contour, flat mineral color fills (${colorSpec.primary}),`,
    `heavy contour lines, no atmospheric perspective. ${capitalize(colorSpec.mood)} quality.`,
    BAN_LIST,
  ].join(' ').replace(/\s+/g, ' ').trim();
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function pickDynastyElement(dynasty, excerpt) {
  const d = dynasty || '';
  // 战役关键词检测
  const isBattle = /战|攻|围|击|破|败|将军|兵|军|营|营|垒|阵/.test(excerpt);
  // 改革/会议关键词
  const isReform = /变法|改革|新法|政|令|朝|廷|殿|帝|王|皇/.test(excerpt);

  if (isBattle) {
    return {
      primary: 'a vast battlefield or fortified camp, banners flying',
      detail: 'rows of tents or wooden palisades, dust clouds, distant cavalry',
      figure: 'general or strategist',
      pose: 'on horseback or atop a watchtower surveying the field',
      background: 'smoke, dust, and a setting sun over distant mountains',
    };
  }
  if (isReform) {
    return {
      primary: 'an imperial palace complex or court hall',
      detail: 'vermilion columns, jade balustrades, ceremonial bronze vessels',
      figure: 'courtier or chancellor',
      pose: 'kneeling or standing at the foot of the throne stairs',
      background: 'layered palace rooftops and auspicious clouds',
    };
  }
  // 山水/文人/思想
  return {
    primary: 'a riverside pavilion or mountain monastery',
    detail: 'wooden verandas, ancient pines, scholars walking along a path',
    figure: 'scholar or hermit',
    pose: 'sitting by a window or leaning on a rail, gazing into the distance',
    background: 'misty mountains, winding river, drifting clouds',
  };
}

// --- frontmatter 解析 ---
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const k = line.match(/^([\w-]+):\s*(.*)$/);
    if (!k) continue;
    let v = k[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      // YAML 数组(用于 tags) — 保留为 array
      v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      fm[k[1]] = v;
    } else {
      // 标量值(字符串/数字) — 去前后引号
      fm[k[1]] = v.replace(/^['"]|['"]$/g, '');
    }
  }
  return fm;
}

// --- 主流程 ---
const ARTICLES_DIR = path.join(ROOT, 'content/articles');
const OUT = path.join(ROOT, 'tmp/cover-prompts.jsonl');

fs.mkdirSync(path.dirname(OUT), { recursive: true });

const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md')).sort();
console.error(`[build-cover-prompts] found ${files.length} articles`);

const out = fs.createWriteStream(OUT);
let skipped = 0;
for (const f of files) {
  const md = fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8');
  const fm = parseFrontmatter(md);
  if (!fm || !fm.slug || !fm.title || !fm.excerpt) {
    console.error(`[skip] ${f} (missing frontmatter)`);
    skipped++;
    continue;
  }
  const prompt = buildPrompt(fm);
  out.write(JSON.stringify({ slug: fm.slug, dynasty: fm.dynasty, episode: fm.episode, prompt }) + '\n');
}
out.end();

out.on('finish', () => {
  console.error(`[build-cover-prompts] wrote ${files.length - skipped} prompts to ${OUT}`);
});
