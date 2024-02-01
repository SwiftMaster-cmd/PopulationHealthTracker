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

const OWNER_UID = 'your-owner-uid'; // Replace with the actual owner's UID

// Function to load and display manager access requests
function loadRequests() {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        const requestsContainer = document.getElementById('requestsContainer');
        requestsContainer.innerHTML = ''; // Clear existing entries

        for (const [userId, user] of Object.entries(users)) {
            if (user.requestedRole === 'manager') {
                const userElement = document.createElement('div');
                userElement.innerText = `Email: ${user.email} - Requested Role: ${user.requestedRole}`;
                const approveButton = document.createElement('button');
                approveButton.innerText = 'Approve';
                approveButton.onclick = () => approveManagerAccess(userId);

                userElement.appendChild(approveButton);
                requestsContainer.appendChild(userElement);
            }
        }
    });
}

// Function to approve manager access
function approveManagerAccess(userId) {
    const userRef = ref(database, `users/${userId}`);
    update(userRef, { role: 'manager', requestedRole: null })
        .then(() => {
            alert('Manager access granted.');
            // Optionally, remove the user's request from the UI here
        })
        .catch((error) => {
            alert('Error: ' + error.message);
            // Handle errors here
        });
}

// Ensure the owner is authenticated
onAuthStateChanged(auth, (user) => {
    if (user && user.uid === OWNER_UID) {
        loadRequests();
    } else {
        // Redirect to login page or show an error if not the owner
        console.error('Access denied. User is not the owner.');
        // Implement redirection or error display
    }
});
