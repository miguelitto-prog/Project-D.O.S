// Service worker minimo: necessario para o navegador considerar o app
// "instalavel" (PWA). Nao faz cache agressivo para nao servir versoes
// antigas do app por engano - so garante que o navegador reconhece o site
// como um app instalavel.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Passa direto para a rede; sem cache customizado por enquanto.
  event.respondWith(fetch(event.request));
});
