const CACHE_NAME = '21days-study-v1';
const ASSETS_TO_CACHE = [
  '/login.html',
  '/app.html',
  '/day.html',
  '/app.js',
  '/login.js',
  '/day.js',
  '/manifest.json',
  '/icon.svg',
  '/translations/fr.js',
  '/translations/en.js',
  '/translations/sp.js',
  '/translations/de.js',
  '/translations/index.js'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  // Gérer la redirection de la racine vers login.html
  if (event.request.url.endsWith('/') || event.request.url.endsWith('/index.html')) {
    event.respondWith(
      caches.match('/login.html')
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch('/login.html');
        })
    );
    return;
  }

  // Ne pas mettre en cache les requêtes API
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/login') || 
      event.request.url.includes('/program-content')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner la réponse du cache si elle existe
        if (response) {
          return response;
        }

        // Sinon, faire la requête réseau
        return fetch(event.request)
          .then((response) => {
            // Ne pas mettre en cache si la réponse n'est pas valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cloner la réponse car elle ne peut être utilisée qu'une fois
            const responseToCache = response.clone();

            // Mettre en cache la nouvelle réponse
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // En cas d'erreur, retourner une page d'erreur ou une réponse par défaut
        return new Response('Erreur de connexion', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});

// Gestion des messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 