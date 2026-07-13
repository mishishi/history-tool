/**
 * lib/cover-prompt.mjs
 *
 * Cover prompt 共享工厂 — build-cover-prompts.mjs 和 publish-cover.mjs 都引用这里
 * 保证"prompt 模板"只有一个 source of truth,以后改一处就同步
 */

export const BAN_LIST = `
ABSOLUTELY NO TEXT OF ANY KIND ANYWHERE IN THE IMAGE.
No Chinese characters. No English letters. No Japanese characters.
No Korean characters. No Arabic. No Latin alphabet. No calligraphic
strokes. No seal stamps. No signets. No annotations. No writing on
walls, scrolls, banners, clothing, or anywhere. The image must be
completely free of any text, logograms, or written symbols.
`.trim();

export const STYLE_HEADER = `Chinese blue-green landscape painting qinglv shanshui,
Dunhuang Mogao cave mural inspired.`.replace(/\s+/g, ' ');

// 朝代色调 + mood(从 lib/dynasties.ts 同步,挑 cover 实际在用的)
export const DYNASTY_COLORS = {
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

export const DEFAULT_COLOR = { primary: 'cinnabar red, ochre, malachite', mood: 'historical, classical' };

const COMPOSITION = 'bird-eye panoramic view, foreground tiny lone figure in vermilion robes for scale and human reference, heavy gold contour outlines, flat mineral color fills, no atmospheric perspective, decorative cloud bands';

/**
 * 从 frontmatter 生成 cover prompt
 * @param {{title: string, subtitle: string, excerpt: string, dynasty: string, coverScene: string, coverColor: string, coverMood: string}} article
 * @returns {string} 统一 prompt
 */
export function buildCoverPrompt(article) {
  const { coverScene, coverColor, coverMood, dynasty, excerpt } = article;

  if (coverScene) {
    const color = coverColor || (DYNASTY_COLORS[dynasty] || DEFAULT_COLOR).primary;
    const mood = coverMood || (DYNASTY_COLORS[dynasty] || DEFAULT_COLOR).mood;
    return [
      `${STYLE_HEADER} ${color} mineral color palette. ${mood} quality.`,
      `SCENE: ${coverScene}.`,
      `COMPOSITION: ${COMPOSITION}.`,
      BAN_LIST,
    ].join(' ').replace(/\s+/g, ' ').trim();
  }

  // Fallback: 没有 coverScene 用 generic(对应没有该字段的旧文章)
  const colorSpec = DYNASTY_COLORS[dynasty] || DEFAULT_COLOR;
  const sceneHint = (excerpt || '').replace(/[「」『』"""'']/g, '').replace(/\s+/g, ' ').slice(0, 120).trim();
  const dynastyElement = pickDynastyElement(dynasty, excerpt || '');

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
  const isBattle = /战|攻|围|击|破|败|将军|兵|军|营|垒|阵/.test(excerpt);
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
  return {
    primary: 'a riverside pavilion or mountain monastery',
    detail: 'wooden verandas, ancient pines, scholars walking along a path',
    figure: 'scholar or hermit',
    pose: 'sitting by a window or leaning on a rail, gazing into the distance',
    background: 'misty mountains, winding river, drifting clouds',
  };
}

/**
 * 解析 markdown frontmatter(简化版,够 cover 用)
 * @param {string} md - markdown 全文
 * @returns {object|null}
 */
export function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const k = line.match(/^([\w-]+):\s*(.*)$/);
    if (!k) continue;
    let v = k[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      fm[k[1]] = v;
    } else {
      fm[k[1]] = v.replace(/^['"]|['"]$/g, '');
    }
  }
  return fm;
}
