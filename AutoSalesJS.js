// Import the Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

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
const provider = new GoogleAuthProvider();

// DOM elements
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const salesOutcomesContainer = document.getElementById('salesOutcomesContainer');

// Login function
loginButton.addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .then(result => {
            console.log('User signed in:', result.user.displayName);
        })
        .catch(error => {
            console.error('Error signing in:', error);
        });
});

// Logout function
logoutButton.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            console.log('User signed out');
        })
        .catch(error => {
            console.error('Error signing out:', error);
        });
});

// Auth state change listener
onAuthStateChanged(auth, user => {
    if (user) {
        console.log('User logged in:', user.displayName);
        loginButton.style.display = 'none';
        logoutButton.style.display = 'block';
        fetchSalesOutcomes(user.uid);
    } else {
        console.log('No user logged in');
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';
        salesOutcomesContainer.innerHTML = '';
    }
});

// Function to fetch and display sales outcomes
function fetchSalesOutcomes(userId) {
    const salesOutcomesRef = ref(database, `salesOutcomes/${userId}`);
    onValue(salesOutcomesRef, snapshot => {
        salesOutcomesContainer.innerHTML = ''; // Clear previous data
        const salesOutcomes = snapshot.val();
        if (salesOutcomes) {
            Object.keys(salesOutcomes).forEach(key => {
                const outcome = salesOutcomes[key];
                const outcomeElement = document.createElement('div');
                outcomeElement.classList.add('outcome-entry');
                outcomeElement.innerHTML = `
                    <div>Outcome Time: ${new Date(outcome.outcomeTime).toLocaleString()}</div>
                    <div>Assign Action: ${outcome.assignAction}</div>
                    <div>Notes: ${outcome.notesValue}</div>
                    <div>Account Number: ${outcome.accountNumber}</div>
                `;
                salesOutcomesContainer.appendChild(outcomeElement);
            });
        } else {
            salesOutcomesContainer.innerHTML = '<div>No sales outcomes found.</div>';
        }
    });
}