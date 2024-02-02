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
salesHistoryElement.addEventListener('click', async (event) => {
    if (event.target.classList.contains('edit-btn')) {
        const saleId = event.target.getAttribute('data-sale-id');
        const saleContainer = event.target.closest('.sales-history-entry');
        const saleData = {
            // Assuming you fetch the current sale data to fill the form
            // This part is simplified; you'll likely need to fetch or otherwise retrieve this data
            lead_id: saleContainer.querySelector('.lead-id').textContent,
            notes: saleContainer.querySelector('.notes').textContent,
            sale_types: getSaleTypesFromContainer(saleContainer), // You need to implement this
        };

        // Generate the edit form HTML
        const editFormHtml = generateEditFormHtml(saleData, saleId);
        saleContainer.innerHTML = editFormHtml;

        // Attach event listeners to the new sale type buttons and the save button
        attachSaleTypeButtonListeners(saleContainer);
        attachSaveButtonListener(saleContainer, saleId);
    }
});

function generateEditFormHtml(saleData, saleId) {
    // Generate sale type buttons, mark them selected based on saleData.sale_types
    const saleTypeButtonsHtml = Object.keys(allSaleTypes) // Assuming you have a list of all possible sale types
        .map(type => {
            const isSelected = saleData.sale_types[type] ? 'selected' : '';
            return `<button class="sale-type-btn ${isSelected}" data-value="${type}">${type}</button>`;
        })
        .join('');

    return `
        <div class="sale-info">
            <input class="edit-lead-id" value="${saleData.lead_id}">
            <div class="edit-sale-types">${saleTypeButtonsHtml}</div>
            <textarea class="edit-notes">${saleData.notes}</textarea>
        </div>
        <div class="sale-actions">
            <button class="save-btn" data-sale-id="${saleId}">Save</button>
        </div>
    `;
}

function attachSaleTypeButtonListeners(container) {
    container.querySelectorAll('.sale-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });
}

function attachSaveButtonListener(container, saleId) {
    const saveBtn = container.querySelector('.save-btn');
    saveBtn.addEventListener('click', async () => {
        // Extract updated data from form
        const updatedSaleData = {
            lead_id: container.querySelector('.edit-lead-id').value,
            notes: container.querySelector('.edit-notes').value,
            sale_types: extractSelectedSaleTypes(container),
        };

        // Save the updated data back to Firebase
        await set(ref(database, 'sales/' + auth.currentUser.uid + '/' + saleId), updatedSaleData);

        // Optionally, refresh or update the UI to reflect the saved changes
    });
}

function extractSelectedSaleTypes(container) {
    const selectedSaleTypes = {};
    container.querySelectorAll('.sale-type-btn.selected').forEach(btn => {
        const value = btn.getAttribute('data-value');
        selectedSaleTypes[value] = true;
    });
    return selectedSaleTypes;
}

// Fetch available sale types based on the user's UID
async function fetchAvailableSaleTypes(userId) {
    const salesRef = ref(database, 'sales/' + userId);
    const snapshot = await get(salesRef);

    let availableSaleTypes = {};
    if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
            const sale = childSnapshot.val();
            Object.keys(sale.sale_types || {}).forEach(type => {
                availableSaleTypes[type] = true;
            });
        });
    }

    return availableSaleTypes;
}

// Auth state change event listener
onAuthStateChanged(auth, user => {
    if (user) {
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

                // Build the HTML for sale details
                const saleTypesHtml = Object.keys(sale.sale_types || {}).map(type => 
                    `<span class="sale-type-span">${type.replace(/_/g, ' ')}</span>` // Replace underscores with spaces for display
                ).join('');

                const formHtml = `
                    <div class="sale-info">
                        <div class="sale-data lead-id">Lead ID: ${sale.lead_id}</div>
                        <div class="sale-data sale-type">${saleTypesHtml}</div>
                        <div class="sale-data notes">${sale.notes}</div>
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
    }, {
        onlyOnce: true
    });
}
