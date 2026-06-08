(() => {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;

  let refreshed = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshed) return;
    refreshed = true;
    location.reload();
  });

  async function activateWaitingWorker(registration) {
    if (!registration?.waiting) return;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      await activateWaitingWorker(registration);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') activateWaitingWorker(registration);
        });
      });
    } catch (error) {
      console.warn(error);
    }
  });
})();
