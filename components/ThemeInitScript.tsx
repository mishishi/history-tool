// 防止主题切换闪烁 — 在首次 render 注入一段同步脚本
// 读取新的 dt-theme-mode(支持 auto/light/dark 三档),立即应用 dark class
//
// auto 模式解析顺序:
//   1) 系统暗色 → dark(用户 OS 偏好优先)
//   2) 否则按时间(21:00-7:00 视为暗色时段)→ dark
//   3) 否则 light
// 时间维度不暴露 UI — 默认启用,新用户/老用户"自然"在深夜进入沉浸模式

const SCRIPT = `
(function() {
  try {
    var mode = localStorage.getItem('dt-theme-mode');
    if (mode !== 'auto' && mode !== 'light' && mode !== 'dark') mode = 'auto';
    function isNight() {
      var h = new Date().getHours();
      return h >= 21 || h < 7;
    }
    var resolved = mode === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches || isNight() ? 'dark' : 'light')
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