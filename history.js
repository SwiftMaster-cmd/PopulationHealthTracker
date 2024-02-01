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
    historyElement.innerHTML = ''; // Clear existing content

    for (const [key, sale] of Object.entries(salesData)) {
        const saleDiv = document.createElement('div');
        saleDiv.classList.add('sale-item');

        const formattedTimestamp = formatTimestamp(sale.timestamp);

        saleDiv.innerHTML = `
            <p><strong>Lead ID:</strong> ${sale.lead_id}</p>
            <p><strong>ESI Content:</strong> ${sale.esi_content}</p>
            <p><strong>Sale Type:</strong> ${formatSaleTypes(sale.sale_types)}</p>
            <p><strong>Notes:</strong> ${sale.notes}</p>
            <p><strong>Timestamp:</strong> ${formattedTimestamp}</p>
        `;

        historyElement.appendChild(saleDiv);
    }
}

function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' });
    const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${formattedDate} ${formattedTime}`;
}
function formatSaleTypes(saleTypes) {
    if (!saleTypes) {
        return ''; // Return an empty string if saleTypes is undefined or null
    }

    let formattedSaleTypes = [];
    for (const [type, value] of Object.entries(saleTypes)) {
        if (value) {
            formattedSaleTypes.push(type.replace(/_/g, ' ').toUpperCase());
        }
    }
    return formattedSaleTypes.join(', ');
}

function displayNoDataMessage() {
    const historyElement = document.getElementById('salesHistory');
    historyElement.innerHTML = '<p>No sales history found.</p>';
}
