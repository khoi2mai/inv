const CACHE_NAME = 'tin-nhan-an-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './icon.png'
];

// 1. Cài đặt Service Worker
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. Lấy dữ liệu từ Cache khi offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});