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

    firebase.initializeApp(firebaseConfig);

    document.getElementById('linkGoogleButton').addEventListener('click', async () => {
        const user = firebase.auth().currentUser;
        const provider = new firebase.auth.GoogleAuthProvider();

        try {
            if (user) {
                await user.linkWithPopup(provider);
                alert('Successfully linked to Google account.');
                loadUserData(user.uid);
            }
        } catch (error) {
            if (error.code === 'auth/credential-already-in-use') {
                const credential = firebase.auth.GoogleAuthProvider.credentialFromError(error);
                const result = await firebase.auth().signInWithCredential(credential);
                
                alert('Google account already linked, signed in.');
                loadUserData(result.user.uid);
            } else {
                console.error('Error linking Google account:', error);
                alert('Failed to link Google account. Please try again.');
            }
        }
    });

    async function loadUserData(uid) {
        const salesRef = firebase.database().ref('sales/' + uid);

        try {
            const snapshot = await salesRef.once('value');
            const salesData = snapshot.val();
            console.log('Sales data for linked account:', salesData);
            // Display the sales data as needed
        } catch (error) {
            console.error('Error fetching sales data:', error);
        }
    }
});