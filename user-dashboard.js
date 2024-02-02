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

// Handling Edit and Delete button actions
const salesHistoryElement = document.getElementById('salesHistory');
if (salesHistoryElement) {
    salesHistoryElement.addEventListener('click', async (event) => {
        const saleContainer = event.target.closest('.sale-container');
        if (!saleContainer) return;

        const saleId = saleContainer.getAttribute('data-sale-id');

        if (event.target.classList.contains('edit-btn')) {
            // Code for handling edit action
            const editableFields = saleContainer.querySelectorAll('.editable');
            editableFields.forEach(field => field.contentEditable = true);

            // Show Save and Cancel buttons, hide Edit and Delete buttons
            saleContainer.querySelector('.edit-btn').style.display = 'none';
            saleContainer.querySelector('.delete-btn').style.display = 'none';
            saleContainer.querySelector('.save-btn').style.display = 'inline-block';
            saleContainer.querySelector('.cancel-btn').style.display = 'inline-block';
        } else if (event.target.classList.contains('delete-btn')) {
            // Code for handling delete action
            if (confirm('Are you sure you want to delete this sale?')) {
                try {
                    await remove(ref(database, 'sales/' + auth.currentUser.uid + '/' + saleId));
                    // Optionally, refresh the sales history or remove the element from the DOM
                } catch (error) {
                    console.error('Error deleting sale:', error);
                    alert('Failed to delete sale.');
                }
            }
        } else if (event.target.classList.contains('save-btn')) {
            // Code for handling save action after editing
            const editableFields = saleContainer.querySelectorAll('.editable');
            const updatedSaleData = {};

            editableFields.forEach(field => {
                const fieldName = field.getAttribute('data-name');
                updatedSaleData[fieldName] = field.textContent.trim();
            });

            try {
                await set(ref(database, 'sales/' + auth.currentUser.uid + '/' + saleId), updatedSaleData);
                // Reset UI to non-editable state
                editableFields.forEach(field => field.contentEditable = false);
                saleContainer.querySelector('.save-btn').style.display = 'none';
                saleContainer.querySelector('.cancel-btn').style.display = 'none';
                saleContainer.querySelector('.edit-btn').style.display = 'inline-block';
                saleContainer.querySelector('.delete-btn').style.display = 'inline-block';
            } catch (error) {
                console.error('Error updating sale:', error);
                alert('Failed to update sale.');
            }
        } else if (event.target.classList.contains('cancel-btn')) {
            // Code for handling cancel action
            const editableFields = saleContainer.querySelectorAll('.editable');
            editableFields.forEach(field => field.contentEditable = false);
            saleContainer.querySelector('.save-btn').style.display = 'none';
            saleContainer.querySelector('.cancel-btn').style.display = 'none';
            saleContainer.querySelector('.edit-btn').style.display = 'inline-block';
            saleContainer.querySelector('.delete-btn').style.display = 'inline-block';
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
            }));

            // Sort with a fallback for missing timestamps
            salesArray.sort((a, b) => {
                const timestampA = a.timestamp || '0000-00-00T00:00:00Z';
                const timestampB = b.timestamp || '0000-00-00T00:00:00Z';
                return timestampB.localeCompare(timestampA);
            });

            salesArray.forEach(sale => {
                const saleContainer = document.createElement('div');
                saleContainer.className = 'sales-history-entry';

                // Format the timestamp
                const date = new Date(sale.timestamp);
                const formattedTimestamp = date.toLocaleString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });

                // Build the HTML for sale details
                const esiContentHtml = sale.esi_content ? `<div class="sale-data esi-content">ESI: ${sale.esi_content}</div>` : '';
                const saleTypesHtml = Object.keys(sale.sale_types || {}).map(type => 
                    `<span class="sale-type-span">${type.replace(/_/g, ' ').toUpperCase()}</span>`
                ).join('');

                const formHtml = `
                    <div class="sale-info">
                        <div class="sale-data sale-id">Sale ID: ${sale.id}</div>
                        ${esiContentHtml}
                        <div class="sale-data lead-id">Lead ID: ${sale.lead_id}</div>
                        <div class="sale-data sale-type">Sale Types: ${saleTypesHtml}</div>
                        <div class="sale-data notes">Notes: ${sale.notes}</div>
                        <div class="sale-data timestamp">Timestamp: ${formattedTimestamp}</div>
                    </div>
                    <div class="sale-actions">
                        <button class="edit-btn" data-sale-id="${sale.id}">Edit</button>
                        <button class="delete-btn" data-sale-id="${sale.id}">Delete</button>
                    </div>
                `;
                saleContainer.innerHTML = formHtml;

                salesHistoryElement.appendChild(saleContainer);
            });
        } else {
            salesHistoryElement.innerHTML = '<div>No sales history found.</div>';
        }
    });
}
