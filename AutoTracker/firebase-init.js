document.addEventListener('DOMContentLoaded', function() {
    const firebaseConfig = {
        apiKey: "AIzaSyBhSqBwrg8GYyaqpYHOZS8HtFlcXZ09OJA",
        authDomain: "track-dac15.firebaseapp.com",
        databaseURL: "https://track-dac15-default-rtdb.firebaseio.com",
        projectId: "track-dac15",
        storageBucket: "track-dac15.appspot.com",
        messagingSenderId: "495156821305",
        appId: "1:495156821305:web:7cbb86d257ddf9f0c3bce8",
        measurementId: "G-RVBYB0RR06"
    };

    // Check if Firebase has been initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    } else {
        firebase.app();
    }

    // Check Google link status
    firebase.auth().onAuthStateChanged(async user => {
        if (user) {
            const userRef = firebase.database().ref('users/' + user.uid);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val();

            if (userData && userData.googleLinked) {
                console.log('Google account is already linked.');
            } else {
                console.log('Google account is not linked.');
            }
        } else {
            console.error('No user is signed in.');
        }
    });

    // Dispatch custom event to notify other scripts
    document.dispatchEvent(new Event('firebaseInitialized'));
});


async function setPassword(newPassword) {
    try {
        const user = auth.currentUser;
        if (user) {
            await updatePassword(user, newPassword);
            alert('Password updated successfully. You can now log in using your email and password.');
        } else {
            alert('No user is currently signed in.');
        }
    } catch (error) {
        console.error('Error setting password:', error);
        if (error.code === 'auth/requires-recent-login') {
            alert('Please re-authenticate and try again.');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('setPasswordButton').addEventListener('click', () => {
        const newPassword = document.getElementById('setPassword').value;
        setPassword(newPassword);
    });
});