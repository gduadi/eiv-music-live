/* EIV Music — Service Worker
   מטרה: לאפשר התקנה כאפליקציה + מעטפת בסיסית שנפתחת גם בלי אינטרנט.
   הערה: השירים והשידור (AzuraCast / Supabase) תמיד דורשים רשת — לא נשמרים במטמון. */

const CACHE = 'eiv-shell-v3';

// קבצים סטטיים שנשמרים מראש (מעטפת האפליקציה)
const SHELL = [
  './',
  './index.html',
  './eiv-player-v3.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  // לא נוגעים בבקשות לרשתות חיצוניות (סטרים, Supabase, fonts וכו') — מעבירים כמו שהן
  if (url.origin !== self.location.origin) return;

  // ניווט/דפי HTML → network-first (תמיד גרסה עדכנית, ואם אין רשת — מהמטמון)
  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // נכסים סטטיים (אייקונים וכו') → cache-first
  e.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => cached)
    )
  );
});
