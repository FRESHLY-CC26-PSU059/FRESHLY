// Firebase Cloud Messaging SW. Config comes from query params so the same
// bundle can target multiple Firebase projects.

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const DEV_FALLBACK = {
  apiKey: 'AIzaSyB6NvTbciKa7Ov59gxGhu3KSAStE1P0wJU',
  authDomain: 'freshly-43dcf.firebaseapp.com',
  projectId: 'freshly-43dcf',
  storageBucket: 'freshly-43dcf.firebasestorage.app',
  messagingSenderId: '865345967806',
  appId: '1:865345967806:web:94f8a4871a0940470230ef',
};

const readConfigFromSearch = () => {
  try {
    const params = new URL(self.location.href).searchParams;
    const config = {};
    ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'].forEach((key) => {
      const value = params.get(key);
      if (value) config[key] = value;
    });
    return Object.keys(config).length ? config : null;
  } catch (_) {
    return null;
  }
};

const firebaseConfig = readConfigFromSearch() || DEV_FALLBACK;

try {
  firebase.initializeApp(firebaseConfig);
} catch (_) { /* init errors surface below */ }

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = (payload.notification && payload.notification.title) || 'New Notification';
  const notificationOptions = {
    body: (payload.notification && payload.notification.body) || 'You have a new message',
    icon: (payload.notification && payload.notification.icon) || '/logo.png',
    badge: '/badge.png',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetPath = event.notification.data && event.notification.data.link ? event.notification.data.link : '/';
  const urlToOpen = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
      return undefined;
    })
  );
});
