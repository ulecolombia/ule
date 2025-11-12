// Service Worker deshabilitado temporalmente para evitar problemas de cache
// Este archivo se regenerará automáticamente en la próxima build

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName)
        })
      )
    })
  )
  return self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // No cachear nada, dejar pasar todas las requests
  event.respondWith(fetch(event.request))
})
