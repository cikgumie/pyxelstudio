(() => {
  let installPrompt = null, registration = null, requestedUpdate = false;
  const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const installButtons = [document.getElementById('install-app'), document.getElementById('menu-install')];
  const updateButtons = [document.getElementById('update-app'), document.getElementById('menu-update')];
  function refreshInstall() { installButtons.forEach(button => { button.hidden = installed(); }); }
  function showUpdate() { updateButtons.forEach(button => { button.hidden = !registration?.waiting; }); }
  function status(ready = false) {
    const text = !navigator.onLine ? '● Offline · editing on this device' : ready ? '● Ready for offline use' : '● Online';
    document.getElementById('pwa-status').textContent = text;
  }
  async function install() {
    closeMobileUI();
    if (installPrompt) {
      const prompt = installPrompt; installPrompt = null;
      await prompt.prompt(); await prompt.userChoice;
    } else document.getElementById('install-dialog').showModal();
  }
  installButtons.forEach(button => { button.onclick = install; });
  updateButtons.forEach(button => { button.onclick = () => {
    if (!registration?.waiting) return;
    endStroke(); autosave(); requestedUpdate = true;
    registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
  }; });
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
  window.addEventListener('appinstalled', () => { installPrompt = null; refreshInstall(); toast('Pyxel Studio installed.'); });
  matchMedia('(display-mode: standalone)').addEventListener('change', refreshInstall);
  window.addEventListener('online', () => status(Boolean(registration?.active)));
  window.addEventListener('offline', () => status());
  refreshInstall(); status();
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (requestedUpdate) location.reload();
  });
  window.addEventListener('load', async () => {
    try {
      registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
      showUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') {
            if (navigator.serviceWorker.controller) showUpdate();
            else status(true);
          }
        });
      });
      await navigator.serviceWorker.ready;
      status(true);
    } catch {
      document.getElementById('pwa-status').textContent = 'Offline setup unavailable · use Save project for a backup';
    }
  });
})();
