// Firebase App (the core Firebase SDK) is always required and must be listed first
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

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

// Function to get the value of the selected ESI content button
function getSelectedESIContent() {
    const selectedButton = document.querySelector('.esi-btn.selected');
    return selectedButton ? selectedButton.getAttribute('data-value') : null;
}

// Function to get the selected sale types
function getSaleTypes() {
    const saleTypes = {};
    document.querySelectorAll('.sale-type-btn.selected').forEach(btn => {
        const value = btn.getAttribute('data-value');
        saleTypes[value] = true;
    });
    return saleTypes;
}

// Setup event listeners for dynamic elements
function setupEventListeners() {
    document.addEventListener('click', function(e) {
        if (e.target.matches('.edit-btn')) {
            handleEdit(e.target.closest('.sale-container'));
        } else if (e.target.matches('.delete-btn')) {
            const saleId = e.target.closest('.sale-container').getAttribute('data-sale-id');
            deleteSale(saleId);
        } else if (e.target.matches('.save-btn')) {
            const saleContainer = e.target.closest('.sale-container');
            saveSale(saleContainer);
        } else if (e.target.matches('.cancel-btn')) {
            fetchSalesHistory(auth.currentUser.uid); // Re-fetch sales to reset edit state
        }
    });
}

    // Toggle sale type buttons
    document.querySelectorAll('.sale-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });

    // Form submission event listener
    const addSalesForm = document.getElementById('addSalesForm');
    if (addSalesForm) {
        addSalesForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const currentUser = auth.currentUser;
            if (!currentUser) {
                alert('Please log in to add sales.');
                return;
            }

            const leadId = document.getElementById('lead_id').value.trim();
            const esiContent = getSelectedESIContent();
            const saleTypes = getSaleTypes();
            const notes = document.getElementById('notes').value.trim();
            const saleData = {
                lead_id: leadId,
                esi_content: esiContent,
                sale_types: saleTypes,
                notes: notes,
                user_id: currentUser.uid,
                timestamp: new Date().toISOString()
            };

            try {
                const newSaleRef = push(ref(database, 'sales/' + currentUser.uid));
                await set(newSaleRef, saleData);
                event.target.reset();
                document.querySelectorAll('.sale-type-btn').forEach(btn => btn.classList.remove('selected'));
                document.querySelectorAll('.esi-btn').forEach(btn => btn.classList.remove('selected'));
                document.getElementById('confirmationMessage').textContent = "Sale with Lead ID " + leadId + " added successfully.";
            } catch (error) {
                console.error('Error adding sale:', error);
                alert('Failed to add sale.');
            }
        });
    }

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
            })).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

            salesArray.forEach(sale => {
                const saleContainer = document.createElement('div');
                saleContainer.className = 'sale-container';
                saleContainer.setAttribute('data-sale-id', sale.id);

                // Create HTML for sale details, including edit and delete buttons
                const formHtml = `
                    <div class="sale-detail"><strong>Lead ID:</strong> <span class="editable" data-name="lead_id">${sale.lead_id}</span></div>
                    <div class="sale-detail"><strong>ESI Content:</strong> <span class="editable" data-name="esi_content">${sale.esi_content}</span></div>
                    <div class="sale-detail"><strong>Notes:</strong> <span class="editable" data-name="notes">${sale.notes}</span></div>
                    <div class="sale-detail"><strong>Sale Types:</strong> <span class="editable" data-name="sale_types">${Object.keys(sale.sale_types || {}).join(', ')}</span></div>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                    <button class="save-btn" style="display:none;">Save</button>
                    <button class="cancel-btn" style="display:none;">Cancel</button>
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
// Handle edit action
function handleEdit(saleContainer) {
    // Implementation as described earlier
}

// Delete sale
function deleteSale(saleId) {
    // Implementation as described earlier
}

// Save edited sale
function saveSale(saleContainer) {
    // Implementation as described earlier
}
