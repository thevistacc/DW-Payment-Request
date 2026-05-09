const CACHE_NAME = 'dw-payment-v1';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });

self.addEventListener('push', e => {
  let data = {};
  try { data = e.data.json(); } catch(_) {
    data = { title: 'New Payment Request', body: e.data ? e.data.text() : '' };
  }
  e.waitUntil(
    self.registration.showNotification(data.title || 'New Payment Request', {
      body: data.body || '',
      icon: 'https://placehold.co/192x192/1a5fa8/ffffff?text=DW',
      badge: 'https://placehold.co/96x96/1a5fa8/ffffff?text=DW',
      data: { url: data.url || 'https://dw-payment-request.vercel.app' },
      requireInteraction: true,
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || 'https://dw-payment-request.vercel.app';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url === url && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
