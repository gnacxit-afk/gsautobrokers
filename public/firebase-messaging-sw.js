
// This service worker needs to be in the public directory.
// It handles background push notifications.

// IMPORTANT: Do not import from this file. It is a service worker
// and is not part of the application's module graph.

// Initialize the Firebase app in the service worker
// "self" is a global object in service workers
if (self.firebase) {
    self.firebase.initializeApp({
        apiKey: "AIzaSyBE77gLf2veDaSXXuOz33Cr4ubQyoMRSOQ",
        authDomain: "gs-auto-brokers.firebaseapp.com",
        projectId: "gs-auto-brokers",
        storageBucket: "gs-auto-brokers.firebasestorage.app",
        messagingSenderId: "423258761446",
        appId: "1:423258761446:web:fed9d2fafe1199720db327",
    });

    const messaging = self.firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log(
            "[firebase-messaging-sw.js] Received background message ",
            payload
        );

        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/icon-192x192.png' // Ensure you have an icon at this path in /public
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}
