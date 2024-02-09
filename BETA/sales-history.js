
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

function calculateSalesTotals(salesArray) {
    let totalsBySaleType = {};

    salesArray.forEach(sale => {
        Object.keys(sale.sale_types || {}).forEach(type => {
            if (!totalsBySaleType[type]) {
                totalsBySaleType[type] = 0;
            }
            totalsBySaleType[type] += 1;
        });
    });

    return totalsBySaleType;
}


function updateSalesTotalsUI(totalsBySaleType) {
    const salesTotalsElement = document.getElementById('salesTotals');
    salesTotalsElement.innerHTML = '<h4>Sales Totals:</h4>';

    Object.entries(totalsBySaleType).forEach(([type, total]) => {
        const entry = document.createElement('div');
        entry.textContent = `${type}: ${total} Sales`;
        salesTotalsElement.appendChild(entry);
    });
}



f



function applyFilters(salesArray, timeFilter, saleTypeFilter, esiFilter, leadIdFilter) {
    return salesArray.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        const now = new Date();
        if (timeFilter === 'day' && saleDate.toDateString() !== now.toDateString()) return false;
        if (timeFilter === 'week' && (now - saleDate) / (1000 * 60 * 60 * 24) > 7) return false;
        if (timeFilter === 'month' && (saleDate.getMonth() !== now.getMonth() || saleDate.getFullYear() !== now.getFullYear())) return false;
        if (saleTypeFilter !== 'all' && (!sale.sale_types || !sale.sale_types[saleTypeFilter])) return false;
        if (esiFilter !== 'all' && sale.esi_content !== esiFilter) return false;
        if (leadIdFilter && sale.lead_id !== leadIdFilter) return false;
        return true;
    });
}

function fetchSalesHistory(timeFilter = 'all', saleTypeFilter = 'all', esiFilter = 'all', timeSort = 'newest', leadIdFilter = '') {
    if (!userId) {
        console.log("Attempted to fetch sales history without a valid user ID.");
        return;
    }

    const salesRef = ref(database, `sales/${userId}`);
    onValue(salesRef, (snapshot) => {
        const salesHistoryElement = document.getElementById('salesHistory');
        salesHistoryElement.innerHTML = '';

        let sales = snapshot.val();
        if (!sales) {
            salesHistoryElement.innerHTML = '<div>No sales history found.</div>';
            return;
        }

        let salesArray = Object.keys(sales).map(key => ({
            ...sales[key],
            id: key
        }));

        salesArray = applyFilters(salesArray, timeFilter, saleTypeFilter, esiFilter, leadIdFilter);

        // Calculate both sales totals and commissions
        let {totalsBySaleType, commissionsBySaleType} = calculateSalesTotalsAndCommissions(salesArray);
        updateSalesTotalsUI(totalsBySaleType, commissionsBySaleType); // Update to include commissions

        // Sort based on timeSort filter
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



document.getElementById('applyFilters').addEventListener('click', () => {
    const timeFilter = document.getElementById('timeFilter').value;
    const saleTypeFilter = document.getElementById('saleTypeFilter').value;
    const esiFilter = document.getElementById('esiFilter').value;
    const timeSort = document.getElementById('timeSortFilter').value;
    const leadIdFilter = document.getElementById('leadIdFilter').value.trim();

    fetchSalesHistory(timeFilter, saleTypeFilter, esiFilter, timeSort, leadIdFilter);
});

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



