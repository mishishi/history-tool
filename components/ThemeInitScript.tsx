// 防止主题切换闪烁 — 在首次 render 注入一段同步脚本
// (浏览器第一次 paint 之前,根据 localStorage / 系统偏好设 .dark class)

const SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('dt-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function ThemeInitScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
