const CACHE_NAME = 'empath-cache-v1';

// 當 App 安裝時，把核心檔案存入快取
self.addEventListener('install', (event) => {
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

// 攔截網頁請求，如果沒有網路就從快取拿資料 (支援離線體驗)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
