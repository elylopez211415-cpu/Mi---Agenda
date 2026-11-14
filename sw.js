const CACHE = "mi-agenda-v2";
const ARCHIVOS = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
];

self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)));
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches
            .keys()
            .then((claves) =>
                Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
            )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (e) => {
    if (e.request.method !== "GET") return;
    e.respondWith(
        caches.match(e.request).then(
            (cacheado) =>
                cacheado ||
                fetch(e.request)
                    .then((resp) => {
                        const copia = resp.clone();
                        caches.open(CACHE).then((c) => c.put(e.request, copia));
                        return resp;
                    })
                    .catch(() => caches.match("./index.html"))
        )
    );
});
