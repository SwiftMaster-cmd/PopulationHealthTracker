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

// Function to fetch and display sales history for the logged-in user
function fetchSalesHistory() {
    if (!userId) {
        console.log("Attempted to fetch sales history without a valid user ID.");
        return; // Exit the function if userId is not set
    }

    const salesRef = ref(database, `sales/${userId}`);
    onValue(salesRef, (snapshot) => {
        // Ensure this part is executed
        console.log("Fetching sales history for:", userId);
        const salesHistoryElement = document.getElementById('salesHistory');
        salesHistoryElement.innerHTML = ''; // Clear existing content

        const sales = snapshot.val();
        if (!sales) {
            salesHistoryElement.innerHTML = '<div>No sales history found.</div>';
            return;
        }

        Object.keys(sales).forEach((key) => {
            const sale = sales[key];
                // Format the timestamp, display 'Unknown' if not available
                const formattedTimestamp = sale.timestamp ? new Date(sale.timestamp).toLocaleString() : 'Unknown';
                
                // Create and append the sale container to the sales history element
                const saleContainer = document.createElement('div');
                saleContainer.className = 'sales-history-entry';
                saleContainer.setAttribute('data-sale-id', key);
                saleContainer.innerHTML = `
                    <div class="sale-info">
                        <div class="sale-data">Sale ID: ${key}</div>
                        <div class="sale-data">ESI: ${sale.esi_content || 'N/A'}</div>
                        <div class="sale-data">Lead ID: ${sale.lead_id}</div>
                        <div class="sale-data">Sale Types: ${Object.keys(sale.sale_types || {}).join(', ')}</div>
                        <div class="sale-data">Notes: ${sale.notes}</div>
                        <div class="sale-data">Timestamp: ${formattedTimestamp}</div>
                    </div>
                    <div class="sale-actions">
                        <button class="edit-btn" data-sale-id="${key}">Edit</button>
                        <button class="delete-btn" data-sale-id="${key}">Delete</button>
                    </div>
                `;
                salesHistoryElement.appendChild(saleContainer);
            });
        }, (error) => {
            console.error("Error fetching sales data:", error);
        });
    }

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