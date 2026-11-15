// Service Worker mínimo: recebe push e mostra notificação local.
// Sem VAPID/push configurado, ainda funciona para notificações via postMessage.
self.addEventListener('install', () => { (self as any).skipWaiting?.(); });
self.addEventListener('activate', (e: any) => { e.waitUntil((self as any).clients.claim()); });

self.addEventListener('push', (e: any) => {
  const data = e.data ? e.data.json() : { title: 'PRISMA', body: 'Lembrete' };
  e.waitUntil(
    (self as any).registration.showNotification(data.title ?? 'PRISMA', {
      body: data.body ?? '',
      icon: '/icon.svg',
    })
  );
});

self.addEventListener('notificationclick', (e: any) => {
  e.notification.close();
  e.waitUntil((self as any).clients.openWindow('/dashboard'));
});
