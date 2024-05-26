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




// Function to fetch and display data from Firebase
function fetchAndDisplaySalesOutcomes() {
    const salesOutcomesRef = ref(database, 'salesOutcomes');
    onValue(salesOutcomesRef, (snapshot) => {
        const outcomes = snapshot.val();
        const outcomesList = document.getElementById('outcomes-list');
        outcomesList.innerHTML = ''; // Clear the list before adding new items

        for (const key in outcomes) {
            if (outcomes.hasOwnProperty(key)) {
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
    });
}

// Fetch and display sales outcomes when the page loads
document.addEventListener('DOMContentLoaded', fetchAndDisplaySalesOutcomes);