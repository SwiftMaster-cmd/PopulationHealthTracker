// notifications.js

document.addEventListener('firebaseInitialized', function() {
    const auth = firebase.auth();
    const database = firebase.database();

    let currentUserId = null;
    let notificationsData = {};

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            initializeNotifications();
        }
    });

    function initializeNotifications() {
        const notificationsRef = database.ref(`notifications/${currentUserId}`);
        notificationsRef.on('value', snapshot => {
            notificationsData = snapshot.val() || {};
            renderNotifications();
        });
    }

    function renderNotifications() {
        const notificationsContainer = document.getElementById('notificationsContainer');
        notificationsContainer.innerHTML = ''; // Clear existing notifications

        const notificationsArray = [];

        // Convert notificationsData object to an array and sort by timestamp descending
        for (const notificationId in notificationsData) {
            const notification = notificationsData[notificationId];
            notificationsArray.push({ id: notificationId, ...notification });
        }

        notificationsArray.sort((a, b) => b.timestamp - a.timestamp);

        // Render notifications
        notificationsArray.forEach(notification => {
            const notificationDiv = document.createElement('div');
            notificationDiv.classList.add('notification');

            const time = new Date(notification.timestamp).toLocaleString();

            notificationDiv.innerHTML = `
                <p>${notification.message}</p>
                <p class="notification-time">${time}</p>
            `;

            notificationsContainer.appendChild(notificationDiv);
        });
    }
    

    // Optional: Function to mark notifications as read or clear them
    document.getElementById('clearNotificationsButton').addEventListener('click', () => {
        const notificationsRef = database.ref(`notifications/${currentUserId}`);
        notificationsRef.remove().catch(error => {
            console.error('Error clearing notifications:', error);
        });
    });
});
