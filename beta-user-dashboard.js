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

function updateSalesTotalsUI(totalsBySaleType, commissionsBySaleType) {
    const salesTotalsElement = document.getElementById('salesTotals');
    salesTotalsElement.innerHTML = '<h4>Sales Totals and Commissions:</h4>';

    Object.entries(totalsBySaleType).forEach(([type, total]) => {
        const entry = document.createElement('div');
        const commission = commissionsBySaleType[type] || 0;
        entry.textContent = `${type}: ${total} Sales, $${commission.toFixed(2)} Commission`;
        salesTotalsElement.appendChild(entry);
    });
}





const commissionStructures = {
    "Billable HRA": [{min: 0, max: 9, rate: 1.0}, {min: 10, max: 29, rate: 1.25}, {min: 20, max: 44, rate: 1.5}, {min: 45, max: 64, rate: 1.75}, {min: 65, max: Infinity, rate: 2.0}],
    "Transfer/Schedule": [{min: 0, max: 9, rate: 3.0}, {min: 10, max: 14, rate: 3.5}, {min: 15, max: 34, rate: 4.0}, {min: 35, max: 54, rate: 4.5}, {min: 55, max: Infinity, rate: 5.0}],
    "Select RX & MMP": [{min: 0, max: 14, rate: 4.0}, {min: 15, max: 24, rate: 7.0}, {min: 25, max: 84, rate: 10.0}, {min: 85, max: 154, rate: 13.0}, {min: 155, max: Infinity, rate: 16.0}]
};

function calculateSalesTotalsAndCommissions(salesArray) {
    let totalsBySaleType = {};
    let commissionsBySaleType = {};

    salesArray.forEach(sale => {
        Object.keys(sale.sale_types || {}).forEach(type => {
            if (!totalsBySaleType[type]) {
                totalsBySaleType[type] = 0;
                commissionsBySaleType[type] = 0;
            }
            totalsBySaleType[type] += 1;
            const commissionRate = findCommissionRate(type, totalsBySaleType[type]);
            commissionsBySaleType[type] += commissionRate; // Calculate commission for each sale
        });
    });

    return {totalsBySaleType, commissionsBySaleType};
}

function findCommissionRate(type, quantity) {
    const brackets = commissionStructures[type] || [];
    for (let {min, max, rate} of brackets) {
        if (quantity >= min && quantity <= max) {
            return rate;
        }
    }
    return 0; // Default rate if no bracket fits
}




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


























































































// Global variable to store the current sale data, including timestamp
let currentSaleData;

// Global variable to track the selected sale types
let selectedSaleTypes = {};

// Global variable to track the selected ESI content
let selectedEsiContent;

// Function to toggle the selected state of a button
function toggleButtonSelectedState() {
    this.classList.toggle('selected');
}

// Event listeners for edit sale type buttons
document.querySelectorAll('.edit-sale-type-btn').forEach(btn => {
    btn.removeEventListener('click', toggleButtonSelectedState); // Remove existing event listeners to prevent duplicates
    btn.addEventListener('click', function () {
        toggleButtonSelectedState.call(this); // Toggle the selected state of the button
        
        // Get the value of the clicked button
        const value = this.getAttribute('data-value');
        
        // Adjusted to support multiple selections
        if (this.classList.contains('selected')) {
            selectedSaleTypes[value] = true; // Add to the selection
        } else {
            delete selectedSaleTypes[value]; // Remove from the selection
        }
        
        // Enable or disable the submit button based on the selections
        enableSubmitButton();
    });
});

// Event listeners for edit ESI consent buttons
document.querySelectorAll('.edit-esi-consent-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        // First, remove 'selected' class from all ESI consent buttons
        document.querySelectorAll('.edit-esi-consent-btn').forEach(otherBtn => {
            otherBtn.classList.remove('selected');
        });
        
        // Then, toggle the 'selected' class for the clicked button
        this.classList.add('selected');
        
        // Directly set the selected ESI content, since only one can be selected
        selectedEsiContent = this.getAttribute('data-value');
        
        // Update submit button state
        enableSubmitButton();
    });
});

// Function to enable or disable the submit button based on the selections
function enableSubmitButton() {
    const submitButton = document.getElementById('editSaleSubmitBtn');
    
    // Check if any sale type is selected and if ESI content is selected
    const isAnySaleTypeSelected = Object.keys(selectedSaleTypes).length > 0;
    submitButton.disabled = !(isAnySaleTypeSelected && selectedEsiContent);
}

// Function to retrieve selected sale types for the edit form
function getEditSaleTypes() {
    return selectedSaleTypes; // Directly return the adjusted selectedSaleTypes object
}

// Function to setup ESI consent buttons with the current selection based on sale data
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
    
    // Clear any previous selections in the global variable
    selectedSaleTypes = {};

    saleTypeButtons.forEach(btn => {
        const type = btn.getAttribute('data-value');
        
        // Check if this type is in the saleTypesToSetup and is true
        if (saleTypesToSetup && saleTypesToSetup[type]) {
            btn.classList.add('selected');
            selectedSaleTypes[type] = true; // Ensure global tracking of selected sale types
        } else {
            btn.classList.remove('selected');
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

            // Call setup functions to set sale types and ESI content
            setupEsiConsentButtons(currentSaleData.esi_content);

            // Call setupPreSelectedSaleTypes to set selected sale types based on currentSaleData
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
        esi_content: selectedEsiContent,
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

document.getElementById('cancelEditSale').addEventListener('click', function() {
    // Clear selections and any input fields as needed
    document.querySelectorAll('.edit-sale-type-btn.selected, .edit-esi-consent-btn.selected').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Clear global variables or reset them to their default states
    selectedSaleTypes = {};
    selectedEsiContent = null;
    
    // Optionally, clear input fields if necessary
    document.getElementById('editSaleId').value = '';
    document.getElementById('editLeadId').value = '';
    document.getElementById('editNotes').value = '';

    // Hide the modal
    document.getElementById('editSaleModal').style.display = 'none';
});
