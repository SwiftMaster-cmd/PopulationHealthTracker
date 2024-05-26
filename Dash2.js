import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

function fetchAndDisplaySalesOutcomes() {
    console.log("Attempting to fetch sales outcomes...");
    const salesOutcomesRef = ref(database, 'salesOutcomes');

    onValue(salesOutcomesRef, (snapshot) => {
        if (snapshot.exists()) {
            console.log("Data fetched successfully!");
            const outcomes = snapshot.val();
            displayOutcomes(outcomes);
        } else {
            console.log("No data available!");
        }
    }, (error) => {
        console.error("Failed to fetch data: ", error);
    });
}

function displayOutcomes(outcomes) {
    const outcomesList = document.getElementById('outcomes-list');
    outcomesList.innerHTML = ''; // Clear the list before adding new items

    for (const key in outcomes) {
        const outcome = outcomes[key];
        const outcomeItem = document.createElement('div');
        outcomeItem.className = 'outcome-item';

        const details = `
            <p><strong>Account Number:</strong> ${outcome.accountNumber}</p>
            <p><strong>Assign Action:</strong> ${outcome.assignAction}</p>
            <p><strong>Notes Value:</strong> ${outcome.notesValue}</p>
            <p><strong>Outcome Time:</strong> ${new Date(outcome.outcomeTime).toLocaleString()}</p>
            <p><strong>User ID:</strong> ${outcome.userId}</p>
        `;

        outcomeItem.innerHTML = details;
        outcomesList.appendChild(outcomeItem);
    }
}

function authenticateAndFetchData() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('Authenticated user:', user.displayName);
            fetchAndDisplaySalesOutcomes();
        } else {
            console.log("No authenticated user found, prompting sign-in...");
            const provider = new GoogleAuthProvider();
            signInWithPopup(auth, provider)
                .then((result) => {
                    console.log('User signed in:', result.user.displayName);
                    fetchAndDisplaySalesOutcomes();
                })
                .catch((error) => {
                    console.error('Sign-in error:', error);
                });
        }
    });
}

document.addEventListener('DOMContentLoaded', authenticateAndFetchData);