
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






const commissionStructures = {
    "billable HRA": [
        { min: 0, max: 9, rate: 1.0 },
        { min: 10, max: 29, rate: 1.25 },
        { min: 20, max: 44, rate: 1.5 },
        { min: 45, max: 64, rate: 1.75 },
        { min: 65, max: Infinity, rate: 2.0 }
    ],
    "Transfer": [
        { min: 0, max: 9, rate: 3.0 },
        { min: 10, max: 14, rate: 3.5 },
        { min: 15, max: 34, rate: 4.0 },
        { min: 35, max: 54, rate: 4.5 },
        { min: 55, max: Infinity, rate: 5.0 }
    ],
    "Select RX": [
        { min: 0, max: 14, rate: 4.0 },
        { min: 15, max: 24, rate: 7.0 },
        { min: 25, max: 84, rate: 10.0 },
        { min: 85, max: 154, rate: 13.0 },
        { min: 155, max: Infinity, rate: 16.0 }
    ]
};


function calculateCommission(type, quantity) {
    const brackets = commissionStructures[type] || [];
    let commission = 0;

    for (let i = 0; i < brackets.length; i++) {
        const { min, max, rate } = brackets[i];
        if (quantity >= min && (quantity <= max || max === Infinity)) {
            commission = rate * quantity; // Corrected calculation: rate multiplied by quantity
            break; // Exit the loop once a matching bracket is found
        }
    }

    return commission;
}


// Assumes that this function is part of commissions.js or is being imported from there
export function updateCommissionTotalsUI(commissionsBySaleType) {
    const commissionTotalsElement = document.getElementById('commissionTotals');
    // Ensure the container is cleared or properly labeled before updating
    commissionTotalsElement.innerHTML = '<h4>Commission Totals:</h4>';

    // Iterate through each sale type's commission total and display it
    Object.entries(commissionsBySaleType).forEach(([type, commission]) => {
        // Create a new div for each sale type's commission total
        const entry = document.createElement('div');
        // Set the text to show the sale type and its total commission
        entry.textContent = `${type}: $${commission.toFixed(2)} Commission`;
        // Append the entry to the commission totals container
        commissionTotalsElement.appendChild(entry);
    });
}
