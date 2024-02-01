import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, query, orderByChild, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

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

// Get references to Firebase services
const auth = getAuth();
const database = getDatabase();

// Check for user authentication
onAuthStateChanged(auth, user => {
    if (user) {
        fetchSalesHistory(user.uid);
    } else {
        console.log("User is not logged in. Redirecting to login page.");
        window.location.href = 'login.html'; // Redirect to login
    }
});

function fetchSalesHistory(userId) {
    const salesRef = ref(database, 'sales/' + userId);
    const salesQuery = query(salesRef, orderByChild('timestamp'));

    onValue(salesQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            displaySalesHistory(data);
        } else {
            console.log('No sales data found for this user.');
            displayNoDataMessage();
        }
    }, (error) => {
        console.error('Error fetching sales data:', error);
    });
}

function displaySalesHistory(salesData) {
    const historyElement = document.getElementById('salesHistory');
    let html = '<table>';
    html += '<tr><th>Lead ID</th><th>ESI Content</th><th>Sale Type</th><th>Notes</th></tr>';

    for (const [key, sale] of Object.entries(salesData)) {
        html += '<tr>';
        html += `<td>${sale.lead_id}</td>`;
        html += `<td>${sale.esi_content}</td>`;
        html += `<td>${formatSaleTypes(sale.sale_types)}</td>`;
        html += `<td>${sale.notes}</td>`;
        html += '</tr>';
    }

    html += '</table>';
    historyElement.innerHTML = html;
}

function formatSaleTypes(saleTypes) {
    let formattedSaleTypes = [];
    for (const [type, value] of Object.entries(saleTypes)) {
        if (value) {
            formattedSaleTypes.push(type.replace(/_/g, ' '));
        }
    }
    return formattedSaleTypes.join(', ');
}

function displayNoDataMessage() {
    const historyElement = document.getElementById('salesHistory');
    historyElement.innerHTML = '<p>No sales history found.</p>';
}
