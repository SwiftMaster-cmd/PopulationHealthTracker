// Firebase App (the core Firebase SDK) is always required and must be listed first
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

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

// Auth state change event listener
onAuthStateChanged(auth, user => {
    if (user) {
        fetchSalesHistory(user.uid);
    } else {
        console.log("User is not logged in. Redirecting to login page.");
        window.location.href = 'login.html';
    }
});

function fetchSalesHistory(userId) {
    const salesRef = ref(database, 'sales/' + userId);
    onValue(salesRef, (snapshot) => {
        const sales = snapshot.val();
        const salesHistoryElement = document.getElementById('salesHistory');
        salesHistoryElement.innerHTML = ''; // Clear existing content

        if (sales) {
            const salesArray = Object.keys(sales).map(key => ({
                ...sales[key],
                id: key
            })).sort((a, b) => {
                const timestampA = a.timestamp || '0000-00-00T00:00:00Z';
                const timestampB = b.timestamp || '0000-00-00T00:00:00Z';
                return timestampB.localeCompare(timestampA);
            });

            salesArray.forEach(sale => {
                const saleContainer = document.createElement('div');
                saleContainer.className = 'sales-history-entry';
                saleContainer.setAttribute('data-sale-id', sale.id);

                const saleTypesHtml = Object.keys(sale.sale_types || {}).map(type => 
                    `<span class="sale-type-span">${type.replace(/_/g, ' ')}</span>`
                ).join('');

                const formHtml = `
                    <div class="sale-info">
                        <div class="sale-data lead-id">Lead ID: ${sale.lead_id}</div>
                        <div class="sale-data sale-type">${saleTypesHtml}</div>
                        <div class="sale-data notes">${sale.notes}</div>
                    </div>
                    <div class="sale-actions">
                        <button class="edit-btn" data-sale-id="${sale.id}">Edit</button>
                        <button class="delete-btn" data-sale-id="${sale.id}">Delete</button>
                    </div>
                `;
                saleContainer.innerHTML = formHtml;

                salesHistoryElement.appendChild(saleContainer);
            });
        } else {
            salesHistoryElement.innerHTML = '<div>No sales history found.</div>';
        }
    }, {
        onlyOnce: true
    });
}

// Event listener for dynamically added edit and delete buttons
document.getElementById('salesHistory').addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-btn')) {
        // Handle edit button click
        const saleId = event.target.getAttribute('data-sale-id');
        editSale(saleId, event.target.closest('.sales-history-entry'));
    } else if (event.target.classList.contains('delete-btn')) {
        // Handle delete button click
        const saleId = event.target.getAttribute('data-sale-id');
        deleteSale(saleId);
    }
});

async function editSale(saleId, saleContainer) {
    const saleRef = ref(database, `sales/${auth.currentUser.uid}/${saleId}`);
    const snapshot = await get(saleRef);
    if (snapshot.exists()) {
        const saleData = snapshot.val();
        const editFormHtml = generateEditFormHtml(saleData, saleId);
        saleContainer.innerHTML = editFormHtml;
        attachSaleTypeButtonListeners(saleContainer);
        attachSaveButtonListener(saleContainer, saleId);
    }
}

function generateEditFormHtml(saleData, saleId) {
    // Similar to previously described, generate form with pre-filled data and sale type buttons
}

function attachSaleTypeButtonListeners(container) {
    // Similar to previously described, add click listeners to sale type buttons
}

function attachSaveButtonListener(container, saleId) {
    // Similar to previously described, save updated sale data
}

async function deleteSale(saleId) {
    if (confirm('Are you sure you want to delete this sale?')) {
        await remove(ref(database, `sales/${auth.currentUser.uid}/${saleId}`));
        // Optionally, refresh the sales history to reflect the deletion
        fetchSalesHistory(auth.currentUser.uid);
    }
}
