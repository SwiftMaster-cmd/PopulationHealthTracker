
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




// Assuming Firebase has already been initialized elsewhere in your script

// Placeholder for user's ID
let userId;

// Auth state change listener to handle user login and logout
onAuthStateChanged(auth, (user) => {
    if (user) {
        userId = user.uid; // Set the userId when the user is logged in
        fetchSalesHistory(); // Fetch sales history for the logged-in user
    } else {
        console.log("User is not logged in.");
        userId = null; // Clear userId if no user is signed in
    }
}); 





// Modified fetchSalesHistory to include filtering and sorting, now with lead ID filtering
function fetchSalesHistory(timeFilter = 'all', saleTypeFilter = 'all', esiFilter = 'all', timeSort = 'newest', leadIdFilter = '') {
    if (!userId) {
        console.log("Attempted to fetch sales history without a valid user ID.");
        return;
    }

    const salesRef = ref(database, `sales/${userId}`);
    onValue(salesRef, (snapshot) => {
        const salesHistoryElement = document.getElementById('salesHistory');
        salesHistoryElement.innerHTML = ''; // Clear existing content

        let sales = snapshot.val();
        if (!sales) {
            salesHistoryElement.innerHTML = '<div>No sales history found.</div>';
            return;
        }

        // Convert sales object to an array for filtering
        let salesArray = Object.keys(sales).map(key => ({
            ...sales[key],
            id: key
        }));

        // Apply filters including lead ID
        salesArray = applyFilters(salesArray, timeFilter, saleTypeFilter, esiFilter, leadIdFilter);

        // Sort sales based on timeSort value
        if (timeSort === 'newest') {
            salesArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } else if (timeSort === 'oldest') {
            salesArray.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }

        salesArray.forEach(sale => {
            const formattedTimestamp = sale.timestamp ? new Date(sale.timestamp).toLocaleString() : 'Unknown';
            const saleTypesDisplay = sale.sale_types ? Object.keys(sale.sale_types).filter(type => sale.sale_types[type]).join(', ') : 'None';
            const saleContainer = document.createElement('div');
            saleContainer.className = 'sales-history-entry';
            saleContainer.setAttribute('data-sale-id', sale.id);
            saleContainer.innerHTML = generateSaleEntryHTML(sale, formattedTimestamp, saleTypesDisplay);
            salesHistoryElement.appendChild(saleContainer);
        });
    });
}

// Listen to the apply filters button click, including lead ID filter
document.getElementById('applyFilters').addEventListener('click', () => {
    const timeFilter = document.getElementById('timeFilter').value;
    const saleTypeFilter = document.getElementById('saleTypeFilter').value;
    const esiFilter = document.getElementById('esiFilter').value;
    const timeSort = document.getElementById('timeSortFilter').value;
    const leadIdFilter = document.getElementById('leadIdFilter').value.trim(); // Get the lead ID filter

    fetchSalesHistory(timeFilter, saleTypeFilter, esiFilter, timeSort, leadIdFilter);
});

function applyFilters(salesArray, timeFilter, saleTypeFilter, esiFilter, leadIdFilter) {
    const now = new Date();
    return salesArray.filter(sale => {
        // Time filter
        const saleDate = new Date(sale.timestamp);
        if (timeFilter === 'day' && saleDate.toDateString() !== now.toDateString()) return false;
        if (timeFilter === 'week' && (now - saleDate) / (1000 * 60 * 60 * 24) > 7) return false;
        if (timeFilter === 'month' && (saleDate.getMonth() !== now.getMonth() || saleDate.getFullYear() !== now.getFullYear())) return false;

        // Sale type filter
        if (saleTypeFilter !== 'all' && (!sale.sale_types || !sale.sale_types[saleTypeFilter])) return false;

        // ESI filter
        if (esiFilter !== 'all' && sale.esi_content !== esiFilter) return false;

        // Lead ID filter
        if (leadIdFilter && sale.lead_id !== leadIdFilter) return false;

        return true; // Include sale if all filters match
    });
}

function generateSaleEntryHTML(sale, formattedTimestamp, saleTypesDisplay) {
    return `
        <div class="sale-info">
            <div class="sale-data">Lead ID: ${sale.lead_id}</div>
            <div class="sale-data">ESI: ${sale.esi_content || 'N/A'}</div>
            <div class="sale-data">Sale Types: ${saleTypesDisplay}</div>
            <div class="sale-data">Notes: ${sale.notes}</div>
            <div class="sale-data">Timestamp: ${formattedTimestamp}</div>
            <div class="sale-actions">
                <button class="edit-btn" data-sale-id="${sale.id}">Edit</button>
                <button class="delete-btn" data-sale-id="${sale.id}">Delete</button>
            </div>
        </div>
    `;
}
