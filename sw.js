const CACHE_NAME = 'empath-cache-v2'; // 版本號升級到 v2

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
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 網路優先 (Network First) 策略：適合還要持續更新的產品
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
