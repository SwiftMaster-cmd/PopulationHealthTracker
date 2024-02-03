// Firebase App (the core Firebase SDK) is always required and must be listed first
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js"; // Add 'remove' here

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
        // Function to fetch and display sales history
        fetchSalesHistory(user.uid);
    } else {
        console.log("User is not logged in. Redirecting to login page.");
        window.location.href = 'login.html';
    }
});




let userId; // Define userId at a higher scope

// Assuming you have a Firebase Authentication setup
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    userId = user.uid; // Set the userId when the user is logged in
    fetchSalesHistory(userId); // Now you can use userId
  } else {
    // Handle user not logged in
  }
});




// Assuming Firebase initialization has already been done

// Function to fetch and display sales history
function fetchSalesHistory(userId) {
    const salesRef = ref(database, `sales/${userId}`);
    onValue(salesRef, (snapshot) => {
        const sales = snapshot.val();
        const salesHistoryElement = document.getElementById('salesHistory');
        salesHistoryElement.innerHTML = ''; // Clear existing content

        if (sales) {
            Object.keys(sales).forEach((key) => {
                const sale = sales[key];
                const saleContainer = document.createElement('div');
                saleContainer.className = 'sales-history-entry';
                saleContainer.setAttribute('data-sale-id', key);
                // Assuming sale.timestamp exists and is a valid date
                const formattedTimestamp = new Date(sale.timestamp).toLocaleString();

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
        } else {
            salesHistoryElement.innerHTML = '<div>No sales history found.</div>';
        }
    });
}

// Handling user actions for edit and delete
document.getElementById('salesHistory').addEventListener('click', async (event) => {
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

    const saleId = document.getElementById('editSaleId').value;
    const updatedSaleData = {
        lead_id: document.getElementById('editLeadId').value,
        esi_content: document.getElementById('editEsiContent').value,
        notes: document.getElementById('editNotes').value,
    };

    try {
        await set(ref(database, `sales/${userId}/${saleId}`), updatedSaleData);
        closeEditModal();
        fetchSalesHistory(userId); // Refresh the sales history to reflect the changes
    } catch (error) {
        console.error('Error updating sale:', error);
        alert('Failed to update sale.');
    }
});

// Function to close the edit modal
function closeEditModal() {
    document.getElementById('editSaleModal').style.display = 'none';
}

// Call fetchSalesHistory with the current user's ID upon initialization or user authentication state change
fetchSalesHistory(userId);
