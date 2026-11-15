// ============================================================
// Notificações — Notification API + Service Worker + Web Push
// Chave VAPID pública vem de VITE_VAPID_PUBLIC_KEY (Vercel env).
// Sem chave configurada, cai para notificações in-app locais.
// ============================================================

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied';
  if (Notification.permission === 'default') return Notification.requestPermission();
  return Notification.permission;
}

/** Registra o Service Worker (public/sw.js). */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}

const VAPID_PUBLIC = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/** Assina push (Web Push) se houver VAPID key; senão, retorna null. */
export async function subscribePush(): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC) return null;
  const reg = await registerServiceWorker();
  if (!reg) return null;
  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
    });
    return sub;
  } catch {
    return null;
  }
}

/** Notificação local imediata (fallback sem push). */
export function localNotification(title: string, body: string): void {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/icon.svg' });
}
