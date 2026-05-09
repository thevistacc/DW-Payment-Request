const CACHE_NAME = 'dw-payment-v2';
const SHELL_URLS = ['/'];

// Install: cache app shell
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_URLS))
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// Fetch: Network-first for API/Supabase/OneSignal, Cache-first for shell
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always network for external APIs
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('onesignal.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('placehold.co') ||
    url.hostname.includes('cdn.onesignal.com')
  ) return;

  // Network-first for same-origin requests, fallback to cache
  if (e.request.method === 'GET' && url.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Cache fresh responses
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request).then(cached => cached || caches.match('/')))
    );
  }
});

// Push notifications
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
