const CACHE_NAME = 'webr-cache-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Check if the request is for WebR binaries or R packages
    const isWebRAsset = 
        url.pathname.includes('/webr_repo_v6/') ||
        url.pathname.includes('/webr_core_v3/') ||
        url.hostname === 'repo.r-wasm.org' ||
        url.hostname === 'sem-in-r.r-universe.dev' ||
        url.hostname === 'ropensci.r-universe.dev' ||
        url.pathname.endsWith('.wasm') ||
        url.pathname.endsWith('.RData') ||
        url.pathname.endsWith('.so');

    if (isWebRAsset && event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(event.request).then((networkResponse) => {
                    // Only cache successful GET responses
                    if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch((err) => {
                    console.error('[ServiceWorker] Fetch failed for', url.href, err);
                    throw err;
                });
            })
        );
    }
});
