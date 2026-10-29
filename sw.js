/* Service worker : met l'application en cache pour qu'elle fonctionne hors-ligne.
   Les fichiers sont servis depuis le cache puis mis à jour en arrière-plan. */
const CACHE = "planning-tracker-v3";
const FILES = ["./", "index.html", "css/style.css", "js/app.js", "js/pwa.js", "js/templates.js", "plannings/herdtech.js",
  "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(cached => {
    const net = fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => cached || (req.mode === "navigate" ? caches.match("index.html") : undefined));
    return cached || net;
  }));
});
