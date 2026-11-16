/* Vyral: copia dell'app sul dispositivo, così si apre subito.
   I dati (GitHub) arrivano sempre freschi: l'app ne tiene una copia sua. */
const SHELL = 'vyral-shell-v1', FONTS = 'vyral-fonts-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'assets/logo.svg', 'assets/apple-touch-icon.png', 'assets/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(CORE)).catch(() => { }));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('vyral-') && k !== SHELL && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const put = (name, req, res) => {
  if (res && (res.ok || res.type === 'opaque')) {
    const copy = res.clone();
    caches.open(name).then(async c => {
      await c.put(req, copy);
      // tolgo le versioni vecchie dello stesso file (es. style.css?v=8 quando arriva ?v=9)
      const u = new URL(typeof req === 'string' ? req : req.url, location.href);
      if (u.search && name === SHELL) for (const k of await c.keys()) { const o = new URL(k.url); if (o.pathname === u.pathname && o.search !== u.search) c.delete(k); }
    });
  }
  return res;
};

/* la pagina: dalla rete se risponde in fretta (così vedi subito le novità), altrimenti la copia salvata */
async function page(req) {
  const cached = await caches.match('index.html');
  const net = fetch(req).then(r => put(SHELL, 'index.html', r));
  if (!cached) return net;
  const timeout = new Promise(r => setTimeout(() => r(cached), 1200));
  return Promise.race([net.catch(() => cached), timeout]);
}
/* file dell'app: subito dalla copia, e intanto aggiorno la copia */
async function staleWhileRevalidate(req, name) {
  const cached = await caches.match(req);
  const net = fetch(req).then(r => put(name, req, r)).catch(() => cached);
  return cached || net;
}
/* font: non cambiano mai */
async function cacheFirst(req) {
  return (await caches.match(req)) || fetch(req).then(r => put(FONTS, req, r));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'api.github.com' || url.hostname === 'raw.githubusercontent.com') return; // dati: sempre dalla rete
  if (req.mode === 'navigate' && url.origin === location.origin) return e.respondWith(page(req));
  if (url.origin === location.origin && !url.pathname.endsWith('sw.js')) return e.respondWith(staleWhileRevalidate(req, SHELL));
  if (url.hostname === 'fonts.gstatic.com') return e.respondWith(cacheFirst(req));
  if (url.hostname === 'fonts.googleapis.com') return e.respondWith(staleWhileRevalidate(req, FONTS));
});
