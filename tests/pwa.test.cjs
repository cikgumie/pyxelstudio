const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = readFileSync(path.join(__dirname, '../dist/sw.js'), 'utf8');
const manifest = JSON.parse(readFileSync(path.join(__dirname, '../dist/manifest.webmanifest'), 'utf8'));

function worker(scope) {
  const handlers = {}, stores = new Map(); let online = true, page = '<canvas id="art"></canvas>', claims = 0, skips = 0;
  const key = request => typeof request === 'string' ? request : request.url;
  const caches = {
    keys: async () => [...stores.keys()], delete: async name => stores.delete(name),
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return { put: async (request, response) => store.set(key(request), response.clone()),
        match: async request => store.get(key(request))?.clone() };
    }
  };
  const self = { registration: { scope }, location: new URL(scope),
    clients: { claim: async () => { claims++; } }, skipWaiting: () => { skips++; },
    addEventListener: (name, fn) => { handlers[name] = fn; } };
  vm.runInNewContext(source, { self, caches, URL, Response,
    fetch: async request => {
      if (!online) throw Error('offline');
      return new Response(key(request).includes('index.html') || request.mode === 'navigate' ? page : 'asset',
        { headers: { 'content-type': key(request).includes('index.html') || request.mode === 'navigate' ? 'text/html' : 'application/javascript' } });
    } });
  return { stores, handlers, set online(v) { online = v; }, set page(v) { page = v; },
    get claims() { return claims; }, get skips() { return skips; },
    async lifecycle(name) { let promise; handlers[name]({ waitUntil: p => { promise = p; } }); await promise; },
    async request(url, mode = 'navigate', method = 'GET') {
      let promise; handlers.fetch({ request: { url, mode, method }, respondWith: p => { promise = p; } });
      return promise ? await promise : undefined;
    } };
}
for (const scope of ['https://cikgumie.github.io/pyxelstudio/dist/', 'https://studio.example/']) {
  test('offline shell and all versioned assets work under ' + new URL(scope).pathname, async () => {
    const w = worker(scope); await w.lifecycle('install'); await w.lifecycle('activate');
    w.online = false;
    assert.match(await (await w.request(scope + '?v=0.4.0')).text(), /id="art"/);
    for (const file of ['app.js', 'gestures.js', 'pwa.js', 'style.css']) {
      assert.equal(await (await w.request(scope + file + '?v=0.4.0', 'same-origin')).text(), 'asset');
    }
    assert.equal(w.claims, 1); assert.equal(w.skips, 0);
  });
  test('manifest start URL, scope and icons stay inside ' + new URL(scope).pathname, () => {
    for (const relative of [manifest.start_url, manifest.scope, manifest.id, ...manifest.icons.map(i => i.src)]) {
      assert.ok(new URL(relative, scope + 'manifest.webmanifest').href.startsWith(scope));
    }
  });
}
test('newer network HTML cannot poison the installed offline shell', async () => {
  const scope = 'https://studio.example/'; const w = worker(scope); await w.lifecycle('install');
  w.page = '<canvas id="art"></canvas><script src="future.js"></script>';
  assert.match(await (await w.request(scope)).text(), /future.js/);
  w.online = false;
  assert.doesNotMatch(await (await w.request(scope)).text(), /future.js/);
});
test('authentication responses are not cached and cannot replace the editor shell', async () => {
  const scope = 'https://studio.example/'; const w = worker(scope); await w.lifecycle('install');
  w.page = '<h1>Sign in</h1>';
  assert.match(await (await w.request(scope)).text(), /Sign in/);
  w.online = false; assert.match(await (await w.request(scope)).text(), /id="art"/);
});
test('initial install refuses a sign-in page as the offline editor', async () => {
  const w = worker('https://studio.example/'); w.page = '<h1>Sign in</h1>';
  await assert.rejects(w.lifecycle('install'), /Cannot cache editor shell/);
});
test('worker ignores external requests, writes and unrelated assets', async () => {
  const w = worker('https://studio.example/');
  assert.equal(await w.request('https://fonts.example/font.woff', 'cors'), undefined);
  assert.equal(await w.request('https://studio.example/project', 'same-origin', 'POST'), undefined);
  assert.equal(await w.request('https://studio.example/project.pxweb', 'same-origin'), undefined);
});
test('activation cleans only this editor scope; updates need explicit action', async () => {
  const w = worker('https://studio.example/pyxel/');
  w.stores.set('pyxel-studio-shell-/pyxel/-old', new Map());
  w.stores.set('pyxel-studio-shell-/other/-old', new Map());
  await w.lifecycle('install'); await w.lifecycle('activate');
  assert.equal(w.stores.has('pyxel-studio-shell-/pyxel/-old'), false);
  assert.equal(w.stores.has('pyxel-studio-shell-/other/-old'), true);
  assert.equal(w.skips, 0); w.handlers.message({ data: { type: 'ACTIVATE_UPDATE' } }); assert.equal(w.skips, 1);
});
