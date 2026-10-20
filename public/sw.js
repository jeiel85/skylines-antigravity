// Skylines Antigravity 서비스워커: 오프라인 실행·설치형 PWA 지원
// precache-manifest.js는 빌드 때 vite.config.js의 precacheManifest 플러그인이 생성한다.
// 빌드 산출물이 바뀌면 이 파일도 바뀌어 서비스워커가 갱신되고, 새 버전 캐시로 교체된다.
importScripts('./precache-manifest.js');

const BUILD_MANIFEST = self.__PRECACHE_MANIFEST;
const CACHE_PREFIX = 'skylines-antigravity-';
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_MANIFEST.version}`;
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  ...BUILD_MANIFEST.files
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = (await cache.match(request, { ignoreSearch: true }))
      || (await cache.match('./index.html'))
      || (await cache.match('./'));
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        return cache.put(request, response.clone()).then(() => response);
      }
      return response;
    });
  if (cached) {
    event.waitUntil(network.catch(() => undefined));
    return cached;
  }
  return network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(new URL('./', self.registration.scope).pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(event));
});
