/* 读通鉴 Service Worker
 * 缓存策略:
 *   - App Shell / Icons / Next.js Static → Cache First
 *   - article-data.json → Stale While Revalidate(每周更新,优先用旧)
 *   - HTML 页面(导航 + 文章页)→ Network First,失败回缓存,最终回 /offline
 *   - /opengraph-image /feed.xml /sitemap.xml /robots.txt → 旁路(每次取新)
 */

const VERSION = 'v1';
const STATIC_CACHE = `dt-static-${VERSION}`;
const PAGES_CACHE = `dt-pages-${VERSION}`;
const DATA_CACHE = `dt-data-${VERSION}`;

// 安装时预缓存关键 shell(尽力而为,单个失败不影响 install)
const PRE_CACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/article-data.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Promise.allSettled 等价 — 任一失败不影响其他
      await Promise.allSettled(
        PRE_CACHE_URLS.map((u) =>
          cache.add(new Request(u, { cache: 'reload' })).catch(() => {})
        )
      );
      // 立即激活新 SW(否则用户得关掉所有 tab)
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, PAGES_CACHE, DATA_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      // 接管所有打开的 tab,无需刷新
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 跨域请求直接放行(字体 CDN、OG 静态资源等)
  if (url.origin !== self.location.origin) return;

  // Next.js 的 API route 不要缓存
  if (url.pathname.startsWith('/api/')) return;

  // OG 图 / RSS / sitemap / robots 不缓存,网络断了用不上反而占空间
  if (
    url.pathname === '/opengraph-image' ||
    url.pathname === '/feed.xml' ||
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/robots.txt' ||
    url.pathname.startsWith('/opengraph-image/')
  ) {
    return;
  }

  // HTML 页面导航请求 — Network First
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Next.js 打包后的静态资源(带 hash,immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Icons / manifest / favicon
  if (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 文章数据 — SWR
  if (url.pathname === '/article-data.json') {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }
});

// ---------- 缓存策略 ----------

async function networkFirstNavigation(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // 最终兜底:/offline
    const offlinePage = await caches.match('/offline');
    if (offlinePage) return offlinePage;
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || networkPromise;
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (_err) {
    return cached || new Response('Offline', { status: 503 });
  }
}

// 允许页面触发 SW 更新
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
