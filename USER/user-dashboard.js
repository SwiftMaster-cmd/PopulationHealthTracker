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

        let salesArray = Object.keys(sales).map(key => ({
            ...sales[key],
            id: key
        }));

        salesArray = applyFilters(salesArray, timeFilter, saleTypeFilter, esiFilter, leadIdFilter);

        if (timeSort === 'newest') {
            salesArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } else if (timeSort === 'oldest') {
            salesArray.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }

        // Initialize an object to track cumulative sale type counts
        let cumulativeSaleTypeCounts = {};

        // If we are viewing the newest first, we will accumulate counts from the end
        if (timeSort === 'newest') {
            for (let i = salesArray.length - 1; i >= 0; i--) {
                updateCumulativeSaleTypeCounts(cumulativeSaleTypeCounts, salesArray[i].sale_types);
                salesArray[i].cumulativeSaleTypes = {...cumulativeSaleTypeCounts}; // Clone the current state for the sale
            }
        } else {
            // Accumulate counts from the beginning for oldest first
            salesArray.forEach(sale => {
                updateCumulativeSaleTypeCounts(cumulativeSaleTypeCounts, sale.sale_types);
                sale.cumulativeSaleTypes = {...cumulativeSaleTypeCounts}; // Clone the current state for the sale
            });
        }

        salesArray.forEach((sale) => {
            const formattedTimestamp = sale.timestamp ? new Date(sale.timestamp).toLocaleString() : 'Unknown';
            const saleContainerHTML = generateSaleEntryHTML(sale, formattedTimestamp, sale.cumulativeSaleTypes);
            const saleContainer = document.createElement('div');
            saleContainer.className = 'sales-history-entry';
            saleContainer.setAttribute('data-sale-id', sale.id);
            saleContainer.innerHTML = saleContainerHTML;
            salesHistoryElement.appendChild(saleContainer);
        });

         // Calculate total commission after fetching and filtering sales data
         const level = document.getElementById('commissionLevel').value; // Ensure you have a mechanism to set/get this
         const totalCommission = calculateTotalCommission(level, cumulativeSaleTypeCounts);
         document.getElementById('commissionAmount').textContent = `$${totalCommission.toFixed(2)}`;
         // After fetching the sales history and rendering the sales entries, generate and render the chart
         const chartData = generateChartData(salesArray);
         renderSalesChart(chartData);
 
         // Execute the callback if provided
         if (callback && typeof callback === 'function') {
             callback();
         }
    });
}
function updateCumulativeSaleTypeCounts(cumulativeCounts, currentSaleTypes) {
    Object.keys(currentSaleTypes || {}).forEach(type => {
        if (!cumulativeCounts[type]) {
            cumulativeCounts[type] = currentSaleTypes[type];
        } else {
            cumulativeCounts[type] += currentSaleTypes[type];
        }
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

function calculateSaleTypeCounts(salesArray) {
    let saleTypeCounts = {};
    salesArray.forEach(sale => {
        Object.keys(sale.sale_types || {}).forEach(type => {
            if (!saleTypeCounts[type]) {
                saleTypeCounts[type] = sale.sale_types[type];
            } else {
                saleTypeCounts[type] += sale.sale_types[type];
            }
        });
    });
    return saleTypeCounts;
}



function getSaleTypeDisplay(saleTypes, saleTypeCounts) {
    let display = '';
    Object.keys(saleTypes || {}).forEach(type => {
        display += `${type}: ${saleTypes[type]} (${saleTypeCounts[type] || 0}), `;
    });
    return display.slice(0, -2); // Remove trailing comma and space
}



function generateSaleEntryHTML(sale, formattedTimestamp, cumulativeSaleTypeCounts) {
    let saleTypesDisplay = '';

    // Filter out sale types with zero counts and not present in the current sale
    const nonZeroCounts = Object.entries(cumulativeSaleTypeCounts).filter(([type, count]) =>
        count > 0 && sale.sale_types && sale.sale_types[type] !== undefined
    );

    // Generate display string for sale types with non-zero counts that are present in the current sale
    saleTypesDisplay = nonZeroCounts.map(([type, count]) =>
        `<span class="sale-type-span">${type}: ${count}</span>`
    ).join(''); // Removed the comma from the join function

    // Check if any sale types are present before generating HTML
    if (saleTypesDisplay !== '') {
        return `
            <div class="sale-info">
                <div class="sale-data lead-id">Lead ID: ${sale.lead_id}</div>
                <div class="sale-data esi">ESI: ${sale.esi_content || 'N/A'}</div>
                <div class="sale-types">${saleTypesDisplay}</div>
                <div class="sale-note">${sale.notes}</div>
                <div class="sale-footer">
                    <div class="sale-timestamp">Time: ${formattedTimestamp}</div>
                    <div class="sale-actions">
                        <button class="edit-btn" data-sale-id="${sale.id}">Edit</button>
                        <button class="delete-btn" data-sale-id="${sale.id}">Delete</button>
                    </div>
                </div>
            </div>
        `;
    } else {
        // If no sale types are present, return an empty string
        return '';
    }
}










function generateChartData(salesArray) {
    const saleTypeCounts = calculateSaleTypeCounts(salesArray);
    const labels = Object.keys(saleTypeCounts);
    const data = Object.values(saleTypeCounts);

    return {
        labels: labels,
        datasets: [{
            label: 'Sale Type Counts',
            backgroundColor: 'rgba(54, 162, 235, 0.8)', // Blue color with opacity
            data: data,
        }]
    };
}

let salesChart;

function renderSalesChart(data) {
    if (salesChart) {
        salesChart.destroy();
    }

    const ctx = document.getElementById('salesChart').getContext('2d');
    salesChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)', // Light gray grid lines
                    },
                    ticks: {
                        maxTicksLimit: 5 // Attempt to limit to 5 ticks
                    }
                },
                x: {
                    grid: {
                        display: false // Hide vertical grid lines
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Hide legend
                }
            },
            animation: {
                duration: 2000, // Animates the chart over 2 seconds
                easing: 'easeInOutQuart' // Smooth animation curve
            },
            responsive: true,
            maintainAspectRatio: false // Allow chart to resize
        }
    });
}







// Commission structure for levels 1, 2, and 3
const commissionRates = {
    "1": {
        "Billable HRAS": [
            { min: 0, max: 29, rate: 1.00 },
            { min: 30, max: 34, rate: 2.00 },
            { min: 35, max: 59, rate: 3.00 },
            { min: 60, max: 74, rate: 4.00 },
            { min: 75, max: Infinity, rate: 5.00 }
        ],
        "Transfer": [
            { min: 0, max: 9, rate: 11.00 },
            { min: 10, max: 14, rate: 12.00 },
            { min: 15, max: 24, rate: 13.00 },
            { min: 25, max: 29, rate: 14.00 },
            { min: 30, max: Infinity, rate: 15.00 }
        ],
        "Select RX": [
            { min: 89, max: 104, rate: 16.00 },
            { min: 105, max: 169, rate: 17.00 },
            { min: 170, max: 199, rate: 18.00 },
            { min: 200, max: Infinity, rate: 19.00 }
        ]
    },
    "2": {
        "Billable HRAS": [
            { min: 0, max: 19, rate: 1.00 },
            { min: 20, max: 29, rate: 1.75 },
            { min: 30, max: 54, rate: 2.50 },
            { min: 55, max: 69, rate: 3.25 },
            { min: 70, max: Infinity, rate: 4.00 }
        ],
        "Transfer": [
            { min: 0, max: 4, rate: 9.00 },
            { min: 5, max: 9, rate: 9.75 },
            { min: 10, max: 19, rate: 10.50 },
            { min: 20, max: 24, rate: 11.25 },
            { min: 25, max: Infinity, rate: 12.00 }
        ],
        "Select RX": [
            { min: 0, max: 29, rate: 14.00 },
            { min: 30, max: 59, rate: 14.75 },
            { min: 60, max: 104, rate: 15.50 },
            { min: 105, max: 124, rate: 16.25 },
            { min: 125, max: Infinity, rate: 17.00 }
        ]
    },
    "3": {
        "Billable HRAS": [
            { min: 0, max: 14, rate: 1.00 },
            { min: 15, max: 24, rate: 1.50 },
            { min: 25, max: 49, rate: 2.00 },
            { min: 50, max: 59, rate: 2.50 },
            { min: 60, max: Infinity, rate: 3.00 }
        ],
        "Transfer": [
            // Assuming missing values, filled with example rates for demonstration
            { min: 0, max: 1, rate: 8.00 },
            { min: 2, max: 4, rate: 8.50 },
            { min: 5, max: 6, rate: 9.00 },
            { min: 7, max: 9, rate: 9.50 },
            { min: 10, max: Infinity, rate: 10.00 }
        ],
        "Select RX": [
            { min: 0, max: 9, rate: 13.00 },
            { min: 10, max: 14, rate: 13.50 },
            { min: 15, max: 39, rate: 14.00 },
           { min: 40, max: 54, rate: 14.50 },
            { min: 55, max: Infinity, rate: 15.00 }
        ]
    }
};



function calculateDetailedCommission(level, salesArray) {
    let detailedCommission = {
        totalCommission: 0,
        byType: {}
    };

    salesArray.forEach(sale => {
        Object.entries(sale.sale_types || {}).forEach(([type, count]) => {
            const rates = commissionRates[level][type];
            if (rates) {
                const rate = findRate(count, rates);
                const commission = count * rate;

                if (!detailedCommission.byType[type]) {
                    detailedCommission.byType[type] = {
                        totalSales: 0,
                        commission: 0
                    };
                }

                detailedCommission.byType[type].totalSales += count;
                detailedCommission.byType[type].commission += commission;
            }
        });
    });

    // Calculate total commission separately
    detailedCommission.totalCommission = Object.values(detailedCommission.byType)
        .reduce((total, typeCommission) => total + typeCommission.commission, 0);

    return detailedCommission;
}





function calculateTotalCommission(level, salesData) {
    let totalCommission = 0;
    for (const [category, count] of Object.entries(salesData)) {
        const rates = commissionRates[level][category];
        if (rates) {
            const rate = findRate(count, rates);
            totalCommission += count * rate;
        }
    }
    return totalCommission;
}

// Function to find the appropriate rate based on sales count and level
function findRate(salesCount, rates) {
    for (const rate of rates) {
        if (salesCount >= rate.min && salesCount <= rate.max) {
            return rate.rate;
        }
    }
    return 0; // Default rate if no matching range is found
}

async function saveSettings(commissionLevel) {
    if (!userId) {
        console.error('No user logged in.');
        return;
    }
    // Define the path to save the user's settings, specifically their commission level
    const settingsRef = firebase.database().ref(`users/${userId}/settings/commissionLevel`);
    try {
        // Save the commission level to Firebase
        await settingsRef.set({ commissionLevel: commissionLevel });
        console.log('Commission level settings saved successfully');
    } catch (error) {
        console.error('Failed to save commission level settings:', error);
    }
}

// Function to load settings from Firebase Realtime Database
async function loadSettings() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            userId = user.uid; // Update the global userId with the current user's ID
            const settingsRef = firebase.database().ref(`users/${userId}/settings`);
            const snapshot = await settingsRef.once('value');
            if (snapshot.exists()) {
                const data = snapshot.val();
                // Assuming the settings object contains a commissionLevel property
                document.getElementById('commissionLevel').value = data.commissionLevel;
            } else {
                console.log('No settings found for this user.');
            }
        } else {
            console.log('User is not signed in.');
        }
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load settings when the page loads
    loadSettings();

    // Load the saved commission level when the page loads
    const savedCommissionLevel = localStorage.getItem('commissionLevel');
    if (savedCommissionLevel) {
        document.getElementById('commissionLevel').value = savedCommissionLevel;
    }

    document.getElementById('settingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const commissionLevel = document.getElementById('commissionLevel').value;
        saveSettings(commissionLevel); // Save the selected commission level
    });

    document.getElementById('commissionLevel').addEventListener('change', function() {
        const commissionLevel = this.value;
        saveSettings(commissionLevel); // Save the selected commission level immediately on change
    });
});

document.getElementById('calculateCommission').addEventListener('click', () => {
    const level = document.getElementById('commissionLevel').value;
    // Implementation for calculateAndDisplayCommission needs the sales data logic
});

document.getElementById('commissionLevel').addEventListener('change', () => {
    const currentLevel = document.getElementById('commissionLevel').value;
    // Implementation for dynamic commission calculation needs the sales data logic
});






























































































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
