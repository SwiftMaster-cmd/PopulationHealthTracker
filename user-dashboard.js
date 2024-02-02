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

document.addEventListener('DOMContentLoaded', () => {
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

    // Form submission event listener
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

    const salesHistoryElement = document.getElementById('salesHistory');
    salesHistoryElement.addEventListener('click', async (event) => {
        if (event.target.classList.contains('edit-btn')) {
            const saleContainer = event.target.closest('.sale-container');
            const saleId = saleContainer.getAttribute('data-sale-id');
            const editableFields = saleContainer.querySelectorAll('.editable');
            editableFields.forEach(field => field.contentEditable = true);

            // Show Save and Cancel buttons, hide Edit button
            saleContainer.querySelector('.edit-btn').style.display = 'none';
            saleContainer.querySelector('.delete-btn').style.display = 'none';
            saleContainer.querySelector('.save-btn').style.display = 'inline-block';
            saleContainer.querySelector('.cancel-btn').style.display = 'inline-block';
        } else if (event.target.classList.contains('delete-btn')) {
            const saleContainer = event.target.closest('.sale-container');
            const saleId = saleContainer.getAttribute('data-sale-id');
            if (confirm('Are you sure you want to delete this sale?')) {
                try {
                    await remove(ref(database, 'sales/' + auth.currentUser.uid + '/' + saleId));
                } catch (error) {
                    console.error('Error deleting sale:', error);
                    alert('Failed to delete sale.');
                }
            }
        } else if (event.target.classList.contains('save-btn')) {
            const saleContainer = event.target.closest('.sale-container');
            const saleId = saleContainer.getAttribute('data-sale-id');
            const editableFields = saleContainer.querySelectorAll('.editable');
            const updatedSaleData = {};

            editableFields.forEach(field => {
                const fieldName = field.getAttribute('data-name');
                updatedSaleData[fieldName] = field.textContent.trim();
                field.contentEditable = false;
            });

            try {
                await set(ref(database, 'sales/' + auth.currentUser.uid + '/' + saleId), updatedSaleData);
                event.target.style.display = 'none'; // Hide Save button
                saleContainer.querySelector('.cancel-btn').style.display = 'none'; // Hide Cancel button
                saleContainer.querySelector('.edit-btn').style.display = 'inline-block'; // Show Edit button
                saleContainer.querySelector('.delete-btn').style.display = 'inline-block'; // Show Delete button
            } catch (error) {
                console.error('Error updating sale:', error);
                alert('Failed to update sale.');
            }
        } else if (event.target.classList.contains('cancel-btn')) {
            const saleContainer = event.target.closest('.sale-container');
            const editableFields = saleContainer.querySelectorAll('.editable');
            editableFields.forEach(field => field.contentEditable = false);

            // Hide Save and Cancel buttons, show Edit and Delete buttons
            event.target.style.display = 'none';
            saleContainer.querySelector('.save-btn').style.display = 'none';
            saleContainer.querySelector('.edit-btn').style.display = 'inline-block';
            saleContainer.querySelector('.delete-btn').style.display = 'inline-block';
        }
    });


    // Auth state change event listener
    onAuthStateChanged(auth, user => {
        if (user) {
            fetchSalesHistory(user.uid);
        } else {
            console.log("User is not logged in. Redirecting to login page.");
            window.location.href = 'login.html';
        }
    });
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
            })).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

            salesArray.forEach(sale => {
                const saleContainer = document.createElement('div');
                saleContainer.className = 'sale-container';
                saleContainer.setAttribute('data-sale-id', sale.id);

                // Create HTML for sale details, including edit and delete buttons
                const formHtml = `
                    <div class="sale-detail"><strong>Lead ID:</strong> <span class="editable" data-name="lead_id">${sale.lead_id}</span></div>
                    <div class="sale-detail"><strong>ESI Content:</strong> <span class="editable" data-name="esi_content">${sale.esi_content}</span></div>
                    <div class="sale-detail"><strong>Notes:</strong> <span class="editable" data-name="notes">${sale.notes}</span></div>
                    <div class="sale-detail"><strong>Sale Types:</strong> <span class="editable" data-name="sale_types">${Object.keys(sale.sale_types || {}).join(', ')}</span></div>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                    <button class="save-btn" style="display:none;">Save</button>
                    <button class="cancel-btn" style="display:none;">Cancel</button>
                `;
                saleContainer.innerHTML = formHtml;

                salesHistoryElement.appendChild(saleContainer);
            });
        } else {
            salesHistoryElement.innerHTML = '<div>No sales history found.</div>';
        }
    }, {
        onlyOnce: true
    });
    
}
