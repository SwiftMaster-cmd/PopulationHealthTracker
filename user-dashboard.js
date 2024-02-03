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

// Toggle ESI content buttons
document.querySelectorAll('.esi-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.esi-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
    });
});

// Toggle sale type buttons
document.querySelectorAll('.sale-type-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('selected');
    });
});


// Existing JavaScript code...

document.getElementById('lead_id').addEventListener('paste', function(e) {
    // Prevent the default paste action
    e.preventDefault();
    
    // Get the text content from the clipboard
    const text = (e.clipboardData || window.clipboardData).getData('text');
    
    // Extract numbers from the pasted text
    const numbers = text.match(/\d+/g);
    
    // If numbers are found, join them and set the input field's value
    if (numbers) {
        this.value = numbers.join('');
    }
});

// Keep the input event listener to handle typing and ensure only numbers are entered
document.getElementById('lead_id').addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
});


// Form submission event listener for adding new sales
const addSalesForm = document.getElementById('addSalesForm');

// Update your form submission event listener to use `userId` instead of `currentUser.uid`
if (addSalesForm) {
    addSalesForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!userId) { // Use userId to check if a user is logged in
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
            user_id: userId,
            timestamp: new Date().toISOString()
        };

        push(ref(database, `sales/${userId}`), saleData)
        .then(() => {
            document.getElementById('confirmationMessage').textContent = "Sale added successfully.";
            event.target.reset();
            // Reset selected buttons as before
        })
        .catch(error => {
            console.error('Error adding sale:', error);
            alert('Failed to add sale.');
        });
    });
}



onAuthStateChanged(auth, user => {
    if (user) {
        userId = user.uid; // Update when the user logs in
    } else {
        // Handle user not logged in
        userId = null; // Reset or handle the logged-out state
    }
});

























let userId = null; // This will store the current user's ID

// Auth state change listener to handle user login and logout
onAuthStateChanged(auth, (user) => {
    if (user) {
        userId = user.uid; // Set the userId when the user is logged in
        fetchSalesHistory(); // Fetch sales history for the logged-in user
    } else {
        console.log("User is not logged in.");
        userId = null; // Clear userId if no user is signed in
        // Optionally clear or update the UI to reflect the logged-out state
    }
});

function fetchSalesHistory() {
    if (!userId) {
        console.log("Attempted to fetch sales history without a valid user ID.");
        return; // Exit the function if userId is not set
    }

    const salesRef = ref(database, `sales/${userId}`);
    onValue(salesRef, (snapshot) => {
        const salesHistoryElement = document.getElementById('salesHistory');
        salesHistoryElement.innerHTML = ''; // Clear existing content

        const sales = snapshot.val();
        if (!sales) {
            salesHistoryElement.innerHTML = '<div>No sales history found.</div>';
            return;
        }

        // Convert sales object to an array and sort by timestamp
        const salesArray = Object.keys(sales).map(key => ({
            ...sales[key],
            id: key
        })).sort((a, b) => Number(a.timestamp) - Number(b.timestamp));


        // If timestamp is in ISO string format, you may need to parse it to Date objects before sorting:
        // .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        salesArray.forEach(sale => {
            const formattedTimestamp = sale.timestamp ? new Date(sale.timestamp).toLocaleString() : 'Unknown';
            const saleContainer = document.createElement('div');
            saleContainer.className = 'sales-history-entry';
            saleContainer.setAttribute('data-sale-id', sale.id);
            saleContainer.innerHTML = `
                <div class="sale-info">
                    <div class="sale-data">Sale ID: ${sale.id}</div>
                    <div class="sale-data">ESI: ${sale.esi_content || 'N/A'}</div>
                    <div class="sale-data">Lead ID: ${sale.lead_id}</div>
                    <div class="sale-data">Sale Types: ${Object.keys(sale.sale_types || {}).join(', ')}</div>
                    <div class="sale-data">Notes: ${sale.notes}</div>
                    <div class="sale-data">Timestamp: ${formattedTimestamp}</div>
                </div>
                <div class="sale-actions">
                    <button class="edit-btn" data-sale-id="${sale.id}">Edit</button>
                    <button class="delete-btn" data-sale-id="${sale.id}">Delete</button>
                </div>
            `;
            salesHistoryElement.appendChild(saleContainer);
        });
    });
}






// Commission calculation logic integrated directly in user-dashboard.js

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

    const salesRef = ref(database, `sales/${userId}`);
    const snapshot = await get(salesRef);
    const sales = snapshot.val();

    if (!sales) {
        console.log("No sales data found.");
        return;
    }

    let totalCommission = 0;

    // Assuming sales data is structured with categories and counts
    console.log("Calculating commissions...");
commissionStructures.forEach(structure => {
    console.log(`Processing category: ${structure.category}`);
    // Your existing logic...

        // Filter sales by category and sum their counts for the current month
        const salesCount = Object.values(sales).filter(sale => 
            sale.category === structure.category && 
            new Date(sale.timestamp).getMonth() === new Date().getMonth() // Filter by current month
        ).length; // Assuming each sale is a single entry, adjust if your data includes a count

        try {
            const commission = calculateCommission(salesCount, structure.category);
            totalCommission += commission;

            const commissionElement = document.createElement('div');
            commissionElement.textContent = `${structure.category}: $${commission.toFixed(2)}`;
            document.getElementById('commissionSummary').appendChild(commissionElement);
        } catch (error) {
            console.error(`Error calculating commission for ${structure.category}:`, error);
        }
    });

    const totalCommissionElement = document.createElement('div');
    totalCommissionElement.textContent = `Total Commission: $${totalCommission.toFixed(2)}`;
    document.getElementById('commissionSummary').appendChild(totalCommissionElement);
}

// Make sure to call this function at the right moment, e.g., after sales history is fetched

  













// Handling user actions for edit and delete
document.getElementById('salesHistory').addEventListener('click', async (event) => {
    if (!userId) return; // Ensure `userId` is available

    const saleContainer = event.target.closest('.sales-history-entry');
    if (!saleContainer) return;

    const saleId = saleContainer.getAttribute('data-sale-id');

    if (event.target.classList.contains('edit-btn')) {
        openEditModal(saleId);
    } else if (event.target.classList.contains('delete-btn')) {
        if (confirm('Are you sure you want to delete this sale?')) {
            try {
                await remove(ref(database, `sales/${userId}/${saleId}`));
                saleContainer.remove(); // Remove the sale entry from the DOM
            } catch (error) {
                console.error('Error deleting sale:', error);
                alert('Failed to delete sale.');
            }
        }
    }
});




// Function to open the edit modal and populate it with sale data
async function openEditModal(saleId) {
    if (!userId) return; // Ensure `userId` is available
    const saleRef = ref(database, `sales/${userId}/${saleId}`);
    const snapshot = await get(saleRef);
    const sale = snapshot.val();

    if (sale) {
        document.getElementById('editSaleId').value = saleId;
        document.getElementById('editLeadId').value = sale.lead_id;
        document.getElementById('editEsiContent').value = sale.esi_content;
        document.getElementById('editNotes').value = sale.notes;

        document.getElementById('editSaleModal').style.display = 'block';
    }
}

// Handling the edit form submission
document.getElementById('editSaleForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!userId) return; // Ensure `userId` is available

    const saleId = document.getElementById('editSaleId').value;
    const updatedSaleData = {
        lead_id: document.getElementById('editLeadId').value,
        esi_content: document.getElementById('editEsiContent').value,
        notes: document.getElementById('editNotes').value,
    };

    try {
        await set(ref(database, `sales/${userId}/${saleId}`), updatedSaleData);
        closeEditModal();
        fetchSalesHistory(); // Refresh the sales history to reflect the changes
    } catch (error) {
        console.error('Error updating sale:', error);
        alert('Failed to update sale.');
    }
});

// Function to close the edit modal
function closeEditModal() {
    document.getElementById('editSaleModal').style.display = 'none';
}










