// Firebase App (the core Firebase SDK) is always required and must be listed first
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, remove, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

// Your app's Firebase project configuration
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


// Function to load owner-specific data
function loadOwnerData(ownerUid) {
    const ownerRef = ref(database, `owners/${ownerUid}`);
    onValue(ownerRef, (snapshot) => {
        const ownerData = snapshot.val();
        // Handle owner data, update UI, etc.
    });
}

// Function to perform owner-specific actions
function performOwnerAction(actionData) {
    // Example action: Update owner's profile
    const ownerUid = auth.currentUser.uid;
    const ownerRef = ref(database, `owners/${ownerUid}`);
    // Perform the necessary database operation, such as updating the owner's profile
}

// Function to check if the user is authenticated and redirect if not the owner
function validateOwner() {
    onAuthStateChanged(auth, user => {
        if (user) {
            // Assuming the UID of the owner is known and stored securely
            const OWNER_UID = 'your-owner-uid-here';
            if (user.uid === OWNER_UID) {
                loadActiveUsers();
            } else {
                // Not the owner, redirect
                window.location.href = 'index.html';
            }
        } else {
            // No user is signed in, redirect to index.html
            window.location.href = 'index.html';
        }
    });
    
    // Load and display all active users
    function loadActiveUsers() {
        const activeUsersRef = ref(database, 'users/'); // Assuming you have a users node
        onValue(activeUsersRef, snapshot => {
            const users = snapshot.val();
            const activeUsers = Object.values(users).filter(user => user.isActive); // Assuming an isActive flag indicates active users
            displayActiveUsers(activeUsers);
        });
    }
}

// Call the validateOwner function when the page loads to ensure authentication
validateOwner();

// Export functions for use in other modules
export { loadOwnerData, performOwnerAction };