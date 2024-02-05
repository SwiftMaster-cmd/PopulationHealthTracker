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

// Assuming Firebase has already been initialized elsewhere in your script

// Helper functions for UI interactions
function getSelectedESIContent() {
    const selectedButton = document.querySelector('.esi-btn.selected');
    return selectedButton ? selectedButton.getAttribute('data-value') : null;
}

function getSaleTypes() {
    const saleTypes = {};
    document.querySelectorAll('.sale-type-btn.selected').forEach(btn => {
        const value = btn.getAttribute('data-value');
        saleTypes[value] = true; // Mark the sale type as present
    });
    return saleTypes;
}

// Event listeners for UI elements
document.querySelectorAll('.esi-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.esi-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});

document.querySelectorAll('.sale-type-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('selected'));
});

document.getElementById('lead_id').addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    const numbers = text.match(/\d+/g);
    if (numbers) e.target.value = numbers.join('');
});

document.getElementById('lead_id').addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
});

document.getElementById('addSalesForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!userId) {
        alert('Please log in to add sales.');
        return;
    }

    const leadId = document.getElementById('lead_id').value.trim();
    if (!leadId || !getSelectedESIContent() || !Object.keys(getSaleTypesWithCommissionPoints()).length) {
        alert('Please fill in all required fields and select at least one sale type.');
        return;
    }

    const esiContent = getSelectedESIContent();
    const saleTypes = getSaleTypesWithCommissionPoints();
    const notes = document.getElementById('notes').value.trim();

    // Validate lead ID is not already used
    const existingSalesRef = ref(database, `sales/${userId}`);
    get(existingSalesRef).then((snapshot) => {
        let isDuplicate = false;
        snapshot.forEach((childSnapshot) => {
            if (childSnapshot.val().lead_id === leadId) {
                isDuplicate = true;
            }
        });

        if (isDuplicate) {
            alert('This lead ID has already been submitted.');
            return;
        } else {
            const saleData = {
                lead_id: leadId,
                esi_content: esiContent,
                sale_types: saleTypes,
                notes: notes,
                timestamp: new Date().toISOString()
            };

            // Pushing the new sale to Firebase
            push(ref(database, `sales/${userId}`), saleData)
                .then(() => {
                    document.getElementById('confirmationMessage').textContent = "Sale added successfully.";
                    document.getElementById('addSalesForm').reset(); // Reset form after successful submission
                    // Clear selected buttons
                    document.querySelectorAll('.esi-btn.selected').forEach(btn => btn.classList.remove('selected'));
                    document.querySelectorAll('.sale-type-btn.selected').forEach(btn => btn.classList.remove('selected'));
                })
                .catch(error => {
                    console.error('Error adding sale:', error);
                    alert('Failed to add sale.');
                });
        }
    }).catch(error => {
        console.error('Error fetching existing sales:', error);
    });
});

function getSaleTypesWithCommissionPoints() {
    const saleTypes = {};
    document.querySelectorAll('.sale-type-btn.selected').forEach(btn => {
        const value = btn.getAttribute('data-value');
        saleTypes[value] = 1; // Assign 1 commission point for each selected sale type
    });
    return saleTypes;
}


















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



























let currentSaleData; // Global variable to store the current sale data, including timestamp
let selectedSaleType = null; // Global variable to track the selected sale type
let selectedEsiContent = null; // Global variable to track the selected ESI content

function toggleButtonSelectedState() {
    this.classList.toggle('selected');
}

document.querySelectorAll('.edit-sale-type-btn').forEach(btn => {
    btn.removeEventListener('click', toggleButtonSelectedState); // Remove existing event listeners to prevent duplicates
    btn.addEventListener('click', function () {
        toggleButtonSelectedState.call(this); // Toggle the selected state of the button
        selectedSaleType = this.classList.contains('selected') ? this.getAttribute('data-value') : null;
        enableSubmitButton();
    });
});

document.querySelectorAll('.edit-esi-consent-btn').forEach(btn => {
    btn.removeEventListener('click', toggleButtonSelectedState);
    btn.addEventListener('click', function () {
        toggleButtonSelectedState.call(this);
        selectedEsiContent = this.classList.contains('selected') ? this.getAttribute('data-value') : null;
        enableSubmitButton();
    });
});

// Enable or disable the submit button based on the selected sale type and ESI content
function enableSubmitButton() {
    const submitButton = document.getElementById('editSaleSubmitBtn');
    submitButton.disabled = !(selectedSaleType && selectedEsiContent);
}

// Retrieves selected sale types for the edit form
function getEditSaleTypes() {
    const saleTypes = {};
    document.querySelectorAll('.edit-sale-type-btn.selected').forEach(btn => {
        const value = btn.getAttribute('data-value');
        saleTypes[value] = true;
    });
    return saleTypes;
}

// Setup ESI consent buttons with the current selection based on sale data
function setupEsiConsentButtons(esiContent) {
    const esiButtons = document.querySelectorAll('.edit-esi-consent-btn');
    esiButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.value === esiContent) {
            btn.classList.add('selected');
            selectedEsiContent = esiContent; // Set the selected ESI content
        }
    });
}

// Function to visually indicate the pre-selected state of buttons
function setupPreSelectedSaleTypes(saleTypesToSetup) {
    const saleTypeButtons = document.querySelectorAll('.edit-sale-type-btn');
    saleTypeButtons.forEach(btn => {
        const type = btn.getAttribute('data-value');
        if (saleTypesToSetup && saleTypesToSetup.hasOwnProperty(type)) {
            btn.classList.add('selected');
            selectedSaleType = type; // Set the selected sale type
        }
    });
}

function openEditModal(saleId) {
    if (!userId) {
        console.error("No user logged in.");
        return;
    }

    const saleRef = ref(database, `sales/${userId}/${saleId}`);
    get(saleRef)
        .then((snapshot) => {
            currentSaleData = snapshot.val();

            if (!currentSaleData) {
                console.error("Sale data not found.");
                return;
            }

            // Setup modal fields
            document.getElementById('editSaleId').value = saleId;
            document.getElementById('editLeadId').value = currentSaleData.lead_id || '';
            document.getElementById('editNotes').value = currentSaleData.notes || '';

            setupEsiConsentButtons(currentSaleData.esi_content);
            setupPreSelectedSaleTypes(currentSaleData.sale_types || {});

            document.getElementById('editSaleModal').style.display = 'block';

            // Enable or disable the submit button initially based on the pre-selected values
            enableSubmitButton();
        })
        .catch((error) => {
            console.error('Error fetching sale data:', error);
        });
}

// Rest of the code remains the same


// Apply numeric-only input rules to 'editLeadId'
document.getElementById('editLeadId').addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
});

document.getElementById('editSaleForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!userId) {
        console.error('No user logged in.');
        return;
    }

    // Get the lead ID entered in the form
    const editedLeadId = document.getElementById('editLeadId').value;
    const saleId = document.getElementById('editSaleId').value; // Get the current sale ID
    const existingSales = await getSalesData(userId);

    if (isLeadIdAlreadyExists(existingSales, editedLeadId, saleId)) {
        alert('Lead ID already exists in another sale. Please choose a different lead ID.');
        return;
    }

    // Proceed with the form submission if the edited lead ID is unique or unchanged
    const updatedSaleData = {
        lead_id: editedLeadId,
        esi_content: document.querySelector('.edit-esi-consent-btn.selected').dataset.value,
        notes: document.getElementById('editNotes').value,
        sale_types: getEditSaleTypes(),
        timestamp: currentSaleData.timestamp, // Assuming timestamp handling is correct
    };

    try {
        await set(ref(database, `sales/${userId}/${saleId}`), updatedSaleData);
        closeEditModal();
    } catch (error) {
        console.error('Error updating sale:', error);
    }
});

function closeEditModal() {
    document.getElementById('editSaleModal').style.display = 'none';
}

document.getElementById('salesHistory').addEventListener('click', async (event) => {
    const target = event.target;
    if (!userId) {
        console.error('No user logged in.');
        return;
    }

    const saleContainer = target.closest('.sales-history-entry');
    if (!saleContainer) return;

    const saleId = saleContainer.getAttribute('data-sale-id');
    if (target.classList.contains('edit-btn')) {
        openEditModal(saleId);
    } else if (target.classList.contains('delete-btn')) {
        if (confirm('Are you sure you want to delete this sale?')) {
            try {
                await remove(ref(database, `sales/${userId}/${saleId}`));
                saleContainer.remove(); // Reflect deletion in UI
            } catch (error) {
                console.error('Error deleting sale:', error);
            }
        }
    }
});

// Updated function to check if the edited lead ID already exists in other sales, excluding the current sale
function isLeadIdAlreadyExists(salesData, editedLeadId, currentSaleId) {
    return Object.entries(salesData).some(([saleId, sale]) => {
        return sale.lead_id === editedLeadId && saleId !== currentSaleId;
    });
}

// Function to retrieve sales data for the current user
async function getSalesData(userId) {
    const salesRef = ref(database, `sales/${userId}`);
    const snapshot = await get(salesRef);
    return snapshot.val() || {};
}
