

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

function generateSaleEntryHTML(sale, formattedTimestamp, saleTypesDisplay, totalsBySaleType) {
    let saleTypesText = sale.sale_types ? Object.keys(sale.sale_types).map(type => {
        // Assuming each sale contributes "1" to the type it belongs to
        return `${type} (Contributes 1 to ${totalsBySaleType[type] || 0} Total Sales)`;
    }).join(', ') : 'None';

    return `
        <div class="sale-info">
            <div class="sale-data">Lead ID: ${sale.lead_id}</div>
            <div class="sale-data">ESI: ${sale.esi_content || 'N/A'}</div>
            <div class="sale-data">Sale Types: ${saleTypesText}</div>
            <div class="sale-data">Notes: ${sale.notes}</div>
            <div class="sale-data">Timestamp: ${formattedTimestamp}</div>
            <div class="sale-actions">
                <button class="edit-btn" data-sale-id="${sale.id}">Edit</button>
                <button class="delete-btn" data-sale-id="${sale.id}">Delete</button>
            </div>
        </div>
    `;
}
