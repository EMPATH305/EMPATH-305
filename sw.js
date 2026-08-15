const CACHE_NAME = 'empath-cache-v4'; // Firebase 穩定性修正版

self.addEventListener('install', (event) => {
    self.skipWaiting(); // 強制立即更新守護者
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                './',
                './index.html',
                './og-image.png'
            ]);
        })
    );
});

self.addEventListener('activate', (event) => {
    // 清除舊版的快取，確保拿到最新畫面
    event.waitUntil(
        Promise.all([
            caches.keys().then((cacheNames) => Promise.all(
                cacheNames.map((cacheName) => cacheName !== CACHE_NAME ? caches.delete(cacheName) : Promise.resolve())
            )),
            self.clients.claim()
        ])
    );
});

// 網路優先 (Network First) 策略：適合還要持續更新的產品
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        fetch(event.request).then((response) => {
            if (response && response.ok && event.request.mode === 'navigate') {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
            }
            return response;
        }).catch(async () => {
            if (event.request.mode === 'navigate') {
                return (await caches.match('./index.html')) || (await caches.match('./'));
            }
            return caches.match(event.request, { ignoreSearch: true });
        })
    );
});
