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
        // User is not logged in
        console.log("User is not logged in. Redirecting to login page.");
        window.location.href = 'login.html'; // Redirect to login
    }
});

function fetchSalesHistory(userId) {
    const salesRef = ref(database, 'sales/' + userId);

    // Use a query if you need to order or filter the results
    const salesQuery = query(salesRef, orderByChild('timestamp'));

    onValue(salesQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            displaySalesHistory(data);
        } else {
            // No sales data found
            console.log('No sales data found for this user.');
            displayNoDataMessage();
        }
    }, (error) => {
        console.error('Error fetching sales data:', error);
    });
}

function displaySalesHistory(salesData) {
    // Logic to display sales history on the page
    const historyElement = document.getElementById('salesHistory');
    let html = '';
    for (const [key, sale] of Object.entries(salesData)) {
        html += `<div class="sale-record">
            <p>Lead ID: ${sale.lead_id}</p>
            <p>ESI Content: ${sale.esi_content}</p>
            <p>Sale Type: ${sale.sale_type}</p>
            <p>Notes: ${sale.notes}</p>
        </div>`;
    }
    historyElement.innerHTML = html;
}

function displayNoDataMessage() {
    // Display a message if no data is found
    const historyElement = document.getElementById('salesHistory');
    historyElement.innerHTML = '<p>No sales history found.</p>';
}
