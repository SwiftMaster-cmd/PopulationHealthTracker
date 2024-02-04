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

// Helper functions for UI interactions
function getSelectedESIContent() {
    const selectedButton = document.querySelector('.esi-btn.selected');
    return selectedButton ? selectedButton.getAttribute('data-value') : null;
}

function getSaleTypes() {
    const saleTypes = {};
    document.querySelectorAll('.sale-type-btn.selected').forEach(btn => {
        const value = btn.getAttribute('data-value');
        saleTypes[value] = true; // Adjusted to simply mark the sale type as present
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

    // Collecting form data
    const leadId = document.getElementById('lead_id').value.trim();
    const esiContent = getSelectedESIContent();
    // Update saleTypes to include commission points for each sale type
    const saleTypes = getSaleTypesWithCommissionPoints();
    const notes = document.getElementById('notes').value.trim();

    // Creating the sale data object with commission points for sale types
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
});

function getSaleTypesWithCommissionPoints() {
    const saleTypes = {};
    document.querySelectorAll('.sale-type-btn.selected').forEach(btn => {
        const value = btn.getAttribute('data-value');
        saleTypes[value] = 1; // Assign 1 commission point for each selected sale type
    });
    return saleTypes;
}




















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

// Modified fetchSalesHistory to include filtering and sorting
function fetchSalesHistory(timeFilter = 'all', saleTypeFilter = 'all', esiFilter = 'all', timeSort = 'newest') {
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

        // Apply filters
        salesArray = applyFilters(salesArray, timeFilter, saleTypeFilter, esiFilter);

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

// Listen to the apply filters button click
document.getElementById('applyFilters').addEventListener('click', () => {
    const timeFilter = document.getElementById('timeFilter').value;
    const saleTypeFilter = document.getElementById('saleTypeFilter').value;
    const esiFilter = document.getElementById('esiFilter').value;
    const timeSort = document.getElementById('timeSortFilter').value; // Get the selected time sort option

    fetchSalesHistory(timeFilter, saleTypeFilter, esiFilter, timeSort);
});

function applyFilters(salesArray, timeFilter, saleTypeFilter, esiFilter) {
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
            <div class="sale-data hidden">Sale ID: ${sale.id}</div> <!-- Hidden sale ID -->
        </div>
        <div class="sale-actions">
            <button class="edit-btn" data-sale-id="${sale.id}">Edit</button>
            <button class="delete-btn" data-sale-id="${sale.id}">Delete</button>
        </div>
    `;
}








































document.addEventListener('DOMContentLoaded', function() {
    // Toggle button selected state
    document.querySelectorAll('.edit-sale-type-btn, .edit-esi-consent-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('selected');
            // For ESI buttons, ensure only one can be selected at a time
            if (this.classList.contains('edit-esi-consent-btn')) {
                document.querySelectorAll('.edit-esi-consent-btn').forEach(otherBtn => {
                    if (otherBtn !== this) {
                        otherBtn.classList.remove('selected');
                    }
                });
            }
        });
    });

    // Open Edit Modal - Ensure this function is correctly fetching and opening the modal
    // This placeholder function should be replaced with your actual implementation
    window.openEditModal = async function(saleId) {
        // Your existing openEditModal implementation
    };

    // Close Edit Modal
    function closeEditModal() {
        document.getElementById('editSaleModal').style.display = 'none';
    }

    // Attach event listener to the cancel button without using inline JavaScript
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);

    // Form submission with validation
    document.getElementById('editSaleForm').addEventListener('submit', function(event) {
        event.preventDefault();

        // Validation for ESI Consent
        const esiSelected = document.querySelector('.edit-esi-consent-btn.selected') !== null;
        // Validation for at least one sale type selected
        const saleTypeSelected = document.querySelector('.edit-sale-type-btn.selected') !== null;
        
        if (!esiSelected || !saleTypeSelected) {
            alert('Please select at least one option for ESI Consent and Sale Types.');
            return; // Stop the form submission
        }

        // Prepare data for submission
        const saleId = document.getElementById('editSaleId').value;
        const updatedSaleData = {
            lead_id: document.getElementById('editLeadId').value,
            esi_content: document.querySelector('.edit-esi-consent-btn.selected').getAttribute('data-value'),
            notes: document.getElementById('editNotes').value,
            sale_types: getEditSaleTypes(),
            // Use the timestamp from the currentSaleData or get the current timestamp
            timestamp: currentSaleData ? currentSaleData.timestamp : new Date().toISOString(),
        };

        // Proceed with updating the sale data
        updateSaleData(saleId, updatedSaleData); // Placeholder for your update function
    });

    // Retrieves selected sale types for the edit form
    function getEditSaleTypes() {
        const saleTypes = {};
        document.querySelectorAll('.edit-sale-type-btn.selected').forEach(btn => {
            const value = btn.getAttribute('data-value');
            saleTypes[value] = true;
        });
        return saleTypes;
    }

    // Placeholder function to simulate updating sale data
    // Replace this with your actual Firebase set/update call
    async function updateSaleData(saleId, saleData) {
        console.log('Updating sale data for saleId:', saleId, 'with data:', saleData);
        // Simulate async operation, e.g., Firebase set/update
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        closeEditModal(); // Close modal after update
        // Optionally, refresh or update UI to reflect changes
    }
});
