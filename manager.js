import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

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

// Initialize Firebase
initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase();

onAuthStateChanged(auth, (user) => {
    if (user) {
        const userRef = ref(database, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            const managerAccessButton = document.getElementById('managerAccessButton');

            if (userData && userData.role === 'manager') {
                managerAccessButton.textContent = 'Manager Portal';
                managerAccessButton.onclick = () => {
                    window.location.href = 'manager-portal.html';
                };
            } else {
                managerAccessButton.textContent = 'Request Manager Access';
                managerAccessButton.onclick = () => requestManagerAccess(user.uid);
            }
        });
    }
});

function requestManagerAccess(userId) {
    const userRef = ref(database, 'users/' + userId);
    update(userRef, { requestedRole: 'manager' })
        .then(() => alert('Manager access requested.'))
        .catch((error) => alert('Error: ' + error.message));
}
