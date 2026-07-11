// 防止阅读偏好切换时正文区「瞬变」— 在首次 render 注入一段同步脚本
// 读取 dt-reading-prefs,立即应用 data-* 到 <html>,CSS 变量与 prose-article 同步生效
//
// 跟 ThemeInitScript 同思路:必须在任何 CSS / 文本绘制前执行,放 <head>。

const SCRIPT = `
(function() {
  try {
    var raw = localStorage.getItem('dt-reading-prefs');
    var prefs = raw ? JSON.parse(raw) : null;
    if (!prefs || typeof prefs !== 'object') return;
    var html = document.documentElement;
    if (prefs.fontSize === 'sm' || prefs.fontSize === 'base' || prefs.fontSize === 'lg') {
      html.dataset.fontSize = prefs.fontSize;
    }
    if (prefs.lineHeight === 'tight' || prefs.lineHeight === 'normal' || prefs.lineHeight === 'loose') {
      html.dataset.lineHeight = prefs.lineHeight;
    }
    if (prefs.fontFamily === 'serif' || prefs.fontFamily === 'kai' || prefs.fontFamily === 'sans') {
      html.dataset.fontFamily = prefs.fontFamily;
    }
  } catch (e) {}
})();
`;

export default function ReadingPrefsScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
