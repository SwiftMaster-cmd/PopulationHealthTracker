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

// Handling form submission for adding new sales
// Handling form submission for adding new sales
document.getElementById('addSalesForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userId) {
        alert('Please log in to add sales.');
        return;
    }

    // Collecting form data
    const leadId = document.getElementById('lead_id').value.trim();
    const esiContent = getSelectedESIContent();
    const saleTypes = getSaleTypes();
    const notes = document.getElementById('notes').value.trim();

    // Creating the sale data object
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

// Firebase Authentication state change listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        userId = user.uid;
        console.log("User logged in:", userId);
        // Optionally call updateCommissionSummary() here if needed
    } else {
        userId = null;
        console.log("User not logged in");
    }
});





















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

// Modified fetchSalesHistory to include filtering
function fetchSalesHistory(timeFilter = 'all', saleTypeFilter = 'all', esiFilter = 'all') {
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

    fetchSalesHistory(timeFilter, saleTypeFilter, esiFilter);
});

// Utility function to apply filters to the sales array
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

// Utility function to generate HTML for a sale entry
function generateSaleEntryHTML(sale, formattedTimestamp, saleTypesDisplay) {
    return `
        <div class="sale-info">
            <div class="sale-data">Sale ID: ${sale.id}</div>
            <div class="sale-data">ESI: ${sale.esi_content || 'N/A'}</div>
            <div class="sale-data">Lead ID: ${sale.lead_id}</div>
            <div class="sale-data">Sale Types: ${saleTypesDisplay}</div>
            <div class="sale-data">Notes: ${sale.notes}</div>
            <div class="sale-data">Timestamp: ${formattedTimestamp}</div>
        </div>
        <div class="sale-actions">
            <button class="edit-btn" data-sale-id="${sale.id}">Edit</button>
            <button class="delete-btn" data-sale-id="${sale.id}">Delete</button>
        </div>
    `;
}









// Define your commission structures
const commissionStructures = [
    {
      category: "Billable HRA",
      rates: [
        { min: 0, max: 9, rate: 1.0 },
        { min: 10, max: 29, rate: 1.25 },
        { min: 30, max: 44, rate: 1.5 },
        { min: 45, max: 64, rate: 1.75 },
        { min: 65, max: Infinity, rate: 2.0 },
      ],
    },
    {
      category: "Transfer/Schedule",
      rates: [
        { min: 0, max: 9, rate: 3.0 },
        { min: 10, max: 14, rate: 3.5 },
        { min: 15, max: 34, rate: 4.0 },
        { min: 35, max: 54, rate: 4.5 },
        { min: 55, max: Infinity, rate: 5.0 },
      ],
    },
    {
      category: "Select RX & MMP",
      rates: [
        { min: 0, max: 14, rate: 4.0 },
        { min: 15, max: 24, rate: 7.0 },
        { min: 25, max: 84, rate: 10.0 },
        { min: 85, max: 154, rate: 13.0 },
        { min: 155, max: Infinity, rate: 16.0 },
      ],
    },
  ];
  
  // Function to calculate commission
  function calculateCommission(sales, category) {
    const structure = commissionStructures.find(s => s.category === category);
    if (!structure) {
      throw new Error("Invalid category");
    }
  
    const rateInfo = structure.rates.find(rate => sales >= rate.min && sales <= rate.max);
    if (!rateInfo) {
      throw new Error("Sales out of range");
    }
  
    return sales * rateInfo.rate;
  }
  async function updateCommissionSummary() {
    if (!userId) {
        console.log("User not logged in.");
        return;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Reference to the user's sales in the database
    const salesRef = ref(database, `sales/${userId}`);

    // Listen for value changes at the sales reference
    onValue(salesRef, (snapshot) => {
        const sales = snapshot.val(); // Get the sales data from the snapshot
        if (!sales) {
            console.log("No sales data found.");
            return; // Exit if there are no sales
        }

        let totalCommission = 0; // Initialize total commission
        document.getElementById('commissionSummary').innerHTML = ''; // Clear existing commission summary content

        // Iterate over each commission structure to calculate commissions
        commissionStructures.forEach(structure => {
            let salesCount = 0; // Initialize sales count for the current commission structure

            // Filter sales for the current structure based on date and category
            Object.values(sales).forEach(sale => {
                const saleDate = new Date(sale.timestamp);
                if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
                    // Check if the sale's types include the current structure category
                    if (sale.sale_types && sale.sale_types[structure.category]) {
                        salesCount++; // Increment sales count for the category
                    }
                }
            });

            // Calculate commission for the current structure based on sales count
            const commission = calculateCommission(salesCount, structure.category);
            totalCommission += commission; // Add to total commission

            // Create and append a new element for this commission category to the summary
            const commissionElement = document.createElement('div');
            commissionElement.textContent = `${structure.category}: $${commission.toFixed(2)} (Sales Count: ${salesCount})`;
            document.getElementById('commissionSummary').appendChild(commissionElement);
        });

        // Display total commission
        const totalCommissionElement = document.createElement('div');
        totalCommissionElement.textContent = `Total Commission: $${totalCommission.toFixed(2)}`;
        document.getElementById('commissionSummary').appendChild(totalCommissionElement);
    });
}

  















let currentSaleData; // Global variable to store the current sale data, including timestamp

// Toggles the 'selected' class on button click
function toggleButtonSelectedState() {
    this.classList.toggle('selected');
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
        }
        btn.addEventListener('click', function() {
            esiButtons.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

// Function to visually indicate the pre-selected state of buttons
function setupPreSelectedSaleTypes(saleTypes) {
    const saleTypeButtons = document.querySelectorAll('.edit-sale-type-btn');
    saleTypeButtons.forEach(btn => {
        const type = btn.getAttribute('data-value');
        if (saleTypes[type]) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
        btn.addEventListener('click', toggleButtonSelectedState);
    });
}

// Populates the edit modal with data for editing a sale
async function openEditModal(saleId) {
    if (!userId) return;

    const saleRef = ref(database, `sales/${userId}/${saleId}`);
    try {
        const snapshot = await get(saleRef);
        currentSaleData = snapshot.val(); // Store the entire fetched sale data

        // Make sure all elements exist before trying to set their values
        const editSaleIdElement = document.getElementById('editSaleId');
        const editLeadIdElement = document.getElementById('editLeadId');
        const editNotesElement = document.getElementById('editNotes');
        
        if (!editSaleIdElement || !editLeadIdElement || !editNotesElement) {
            console.error("One or more elements are missing in the edit modal.");
            return;
        }

        editSaleIdElement.value = saleId;
        editLeadIdElement.value = currentSaleData.lead_id;
        editNotesElement.value = currentSaleData.notes;
        setupEsiConsentButtons(currentSaleData.esi_content);

        document.querySelectorAll('.edit-sale-type-btn').forEach(btn => {
            const saleType = btn.getAttribute('data-value');
            btn.classList.remove('selected');
            if (currentSaleData.sale_types && currentSaleData.sale_types[saleType]) {
                btn.classList.add('selected');
            }
            btn.onclick = toggleButtonSelectedState;
        });

        document.getElementById('editSaleModal').style.display = 'block';
    } catch (error) {
        console.error('Error fetching sale data:', error);
    }
}

// Handles the submission of the edit sale form
document.getElementById('editSaleForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!userId) return;

    const saleId = document.getElementById('editSaleId').value;
    const esiContent = document.querySelector('.edit-esi-consent-btn.selected').getAttribute('data-value');
    const updatedSaleData = {
        lead_id: document.getElementById('editLeadId').value,
        esi_content: esiContent,
        notes: document.getElementById('editNotes').value,
        sale_types: getEditSaleTypes(),
        timestamp: currentSaleData.timestamp, // Preserves the original timestamp
    };

    try {
        await set(ref(database, `sales/${userId}/${saleId}`), updatedSaleData);
        closeEditModal();
    } catch (error) {
        console.error('Error updating sale:', error);
        alert('Failed to update sale.');
    }
});

// Closes the edit modal
function closeEditModal() {
    document.getElementById('editSaleModal').style.display = 'none';
}

// Handles click events for edit and delete buttons in the sales history list
document.getElementById('salesHistory').addEventListener('click', async (event) => {
    if (!userId) return;

    const target = event.target;
    const saleContainer = target.closest('.sales-history-entry');
    if (!saleContainer) return;

    const saleId = saleContainer.getAttribute('data-sale-id');
    if (target.classList.contains('edit-btn')) {
        openEditModal(saleId);

    } else if (target.classList.contains('delete-btn') && confirm('Are you sure you want to delete this sale?')) {
        try {
            await remove(ref(database, `sales/${userId}/${saleId}`));
            saleContainer.remove();  // Updates the UI to reflect deletion
        } catch (error) {
            console.error('Error deleting sale:', error);
            alert('Failed to delete sale.');
        }
    }
});