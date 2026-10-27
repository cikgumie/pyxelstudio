const VERSION = '0.4.1';
const CACHE_PREFIX = 'pyxel-studio-shell-' + new URL(self.registration.scope).pathname + '-';
const CACHE = CACHE_PREFIX + VERSION;
const scopeURL = path => new URL(path, self.registration.scope).href;
const INDEX = scopeURL('index.html');
const SHELL = ['index.html', 'style.css?v=0.4.1', 'app.js?v=0.4.1',
  'gestures.js?v=0.4.1', 'pwa.js?v=0.4.1', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'];

async function isEditor(response) {
  return response.ok && !response.redirected &&
    (response.headers.get('content-type') || '').includes('text/html') &&
    (await response.clone().text()).includes('id="art"');
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const asset of SHELL) {
      const url = scopeURL(asset), response = await fetch(url, { cache: 'reload' });
      if (!response.ok || response.redirected || (url === INDEX && !(await isEditor(response)))) {
        throw new Error('Cannot cache editor shell: ' + asset);
      }
      await cache.put(url, response);
    }
    // Updates wait for user action; never reload an active drawing automatically.
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(CACHE_PREFIX) && name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      !url.href.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (await isEditor(response)) {
          // Keep the installed offline shell immutable until the next worker activates.
          // A newer network page may reference assets belonging to a waiting update.
          return response;
        }
        if (response.status < 500) return response; // Preserve authentication/access responses.
      } catch {}
      return (await (await caches.open(CACHE)).match(INDEX)) || Response.error();
    })());
    return;
  }
  // Cache only the known shell. Project files and external requests are untouched.
  if (!SHELL.some(asset => scopeURL(asset) === url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE), saved = await cache.match(request);
    return saved || fetch(request);
  })());
});
