importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyDSqlBGYOqgKjMf5ObnvkCE4mSxGqokfl0",
  authDomain: "project-c5fed922-e24c-4280-862.firebaseapp.com",
  projectId: "project-c5fed922-e24c-4280-862",
  storageBucket: "project-c5fed922-e24c-4280-862.firebasestorage.app",
  messagingSenderId: "394844522843",
  appId: "1:394844522843:web:73aa7d249b3488a204727e",
  measurementId: "G-PWKSVSKFEV"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title || 'Match Update';
  const notificationOptions = {
    body: payload.notification.body || 'New event occurred!',
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
