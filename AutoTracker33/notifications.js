document.addEventListener('DOMContentLoaded', () => {
    const leaderboardSection = document.getElementById('leaderboard-section');

    // Set up Firebase listeners for new sales
    const salesCountsRef = firebase.database().ref('salesCounts');
    const usersRef = firebase.database().ref('users');

    salesCountsRef.on('child_added', snapshot => {
        const newSale = snapshot.val();
        const userId = snapshot.key;

        usersRef.child(userId).once('value', userSnapshot => {
            const userData = userSnapshot.val();
            if (userData && userData.name) {
                showNotification(`${userData.name} just made a sale!`);
            } else {
                showNotification('A user just made a sale!');
            }
        });
    });
});

function showNotification(message) {
    // Check if notifications are supported by the browser
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(message);
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(message);
            }
        });
    } else {
        // Fallback to using a custom notification UI
        const notificationElement = createCustomNotification(message);
        const headerContainer = document.querySelector('.header-container');
        headerContainer.appendChild(notificationElement);

        // Automatically remove the notification after 5 seconds
        setTimeout(() => {
            headerContainer.removeChild(notificationElement);
        }, 5000);
    }
}

function createCustomNotification(message) {
    const notificationDiv = document.createElement('div');
    notificationDiv.classList.add('custom-notification');
    notificationDiv.textContent = message;

    return notificationDiv;
}
