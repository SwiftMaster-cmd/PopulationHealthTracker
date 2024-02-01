import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

// Firebase configuration
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

// Your unique identifier for manager access
const MY_UNIQUE_IDENTIFIER = 'your-unique-id-or-identifier'; // Replace with your actual identifier

// Check for user authentication
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.uid === MY_UNIQUE_IDENTIFIER) {
            // Grant manager access directly for your account
            directManagerAccess();
        } else {
            // For other users, check their role
            checkUserRole(user.uid);
        }
    } else {
        // User is not logged in, redirect to login page
        window.location.href = 'login.html';
    }
});

function directManagerAccess() {
    const managerAccessButton = document.getElementById('managerAccessButton');
    managerAccessButton.textContent = 'Manager Portal';
    managerAccessButton.onclick = () => window.location.href = 'manager-portal.html';
}

function checkUserRole(userId) {
    const userRef = ref(database, 'users/' + userId);
    onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        const managerAccessButton = document.getElementById('managerAccessButton');

        if (userData && userData.role === 'manager') {
            // User is a manager, redirect to manager portal
            managerAccessButton.textContent = 'Manager Portal';
            managerAccessButton.onclick = () => window.location.href = 'manager-portal.html';
        } else {
            // User is not a manager, provide option to request manager access
            managerAccessButton.textContent = 'Request Manager Access';
            managerAccessButton.onclick = () => requestManagerAccess(userId);
        }
    });
}

function requestManagerAccess(userId) {
    const userRef = ref(database, 'users/' + userId);
    update(userRef, { requestedRole: 'manager' })
        .then(() => alert('Manager access requested.'))
        .catch((error) => alert('Error: ' + error.message));
}