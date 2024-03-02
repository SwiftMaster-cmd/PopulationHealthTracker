// Firebase App (the core Firebase SDK) is always required and must be listed first
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

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

// Function to check if the user is authenticated and redirect if not the owner
function validateOwner() {
    onAuthStateChanged(auth, user => {
        if (user) {
            // Assuming the UID of the owner is known and stored securely
            const OWNER_UID = 'wNpqlW2HCWR1awF1x95hUUp3ryw1';
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
}

// Load and display all active users
// Load and display all active users under the "sales" node
// Load and display all active users under the "sales" node
function loadActiveUsers() {
    const salesRef = ref(database, 'sales/');
    onValue(salesRef, snapshot => {
        const sales = snapshot.val();
        if (sales) {
            const usersContainer = document.getElementById('ownerDataContainer');
            usersContainer.innerHTML = ''; // Clear existing content
            Object.values(sales).forEach(sale => {
                const user_id = sale.user_id;
                if (user_id) {
                    // Assuming you have a separate "users" node where user information is stored
                    const userRef = ref(database, `users/${user_id}`);
                    // Fetch user information
                    get(userRef).then(userSnapshot => {
                        const userData = userSnapshot.val();
                        if (userData) {
                            const userElement = document.createElement('div');
                            userElement.textContent = `Email: ${userData.email}, IsActive: ${userData.isActive}`;
                            usersContainer.appendChild(userElement);
                        }
                    }).catch(error => {
                        console.error("Error fetching user data:", error);
                    });
                }
            });
        }
    });
}



// Call the validateOwner function when the page loads to ensure authentication
validateOwner();
