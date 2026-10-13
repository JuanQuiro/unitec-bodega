const CACHE_NAME = 'mi-bodega-v2';
const STATIC_ASSETS = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Solo cachear GET http(s) con respuesta OK.
// Esto evita los errores con chrome-extension:// y opaque responses.
function putInCache(request, response) {
  try {
    if (
      request.method !== 'GET' ||
      !request.url.startsWith('http') ||
      !response ||
      !response.ok
    ) {
      return;
    }
    const clone = response.clone();
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.put(request, clone).catch(() => {}))
      .catch(() => {});
  } catch (_) {
    // Nunca romper la navegación por un fallo de cache
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Dejar pasar todo lo que no sea GET http(s): POST, chrome-extension, etc.
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // Network-first para navegaciones
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          putInCache(request, response);
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first para assets estáticos versionados
  if (
    request.destination === 'image' ||
    request.destination === 'script' ||
    request.destination === 'style'
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            putInCache(request, response);
            return response;
          })
      )
    );
    return;
  }

  // Network-first para todo lo demás (API, etc.)
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
