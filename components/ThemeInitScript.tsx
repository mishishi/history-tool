// 防止主题切换闪烁 — 在首次 render 注入一段同步脚本
// 读取新的 dt-theme-mode(支持 auto/light/dark 三档),立即应用 dark class

const SCRIPT = `
(function() {
  try {
    var mode = localStorage.getItem('dt-theme-mode');
    if (mode !== 'auto' && mode !== 'light' && mode !== 'dark') mode = 'auto';
    var resolved = mode === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    }
    document.documentElement.dataset.themeMode = mode;
    document.documentElement.dataset.themeResolved = resolved;
  } catch (e) {}
})();
`;

export default function ThemeInitScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}