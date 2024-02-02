// Import statements for Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

// Firebase project configuration
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

document.addEventListener('DOMContentLoaded', () => {
    // Event listeners for dynamic UI elements
    setupDynamicEventListeners();

    onAuthStateChanged(auth, user => {
        if (user) {
            fetchSalesHistory(user.uid);
        } else {
            console.log("User is not logged in. Redirecting to login page.");
            window.location.href = 'login.html';
        }
    });
});

function setupDynamicEventListeners() {
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-btn')) {
            handleEdit(e.target.closest('.sale-container'));
        } else if (e.target.classList.contains('delete-btn')) {
            const saleId = e.target.closest('.sale-container').getAttribute('data-sale-id');
            deleteSale(saleId, auth.currentUser.uid);
        } else if (e.target.classList.contains('save-btn')) {
            const saleContainer = e.target.closest('.sale-container');
            saveSale(saleContainer, auth.currentUser.uid);
        } else if (e.target.classList.contains('cancel-btn')) {
            fetchSalesHistory(auth.currentUser.uid); // Refresh the list to cancel edits
        }
    });
}

function getSelectedESIContent() {
    const selectedButton = document.querySelector('.esi-btn.selected');
    return selectedButton ? selectedButton.getAttribute('data-value') : null;
}

function getSaleTypes() {
    const saleTypes = {};
    document.querySelectorAll('.sale-type-btn.selected').forEach(btn => {
        const value = btn.getAttribute('data-value');
        saleTypes[value] = true;
    });
    return saleTypes;
}

function fetchSalesHistory(userId) {
    // Similar to the previous implementation
}

function handleEdit(saleContainer) {
    // Convert display elements to input fields for editing
    const editableFields = saleContainer.querySelectorAll('.editable');
    editableFields.forEach(field => {
        const name = field.getAttribute('data-name');
        const value = field.textContent;
        const input = document.createElement(name === 'notes' ? 'textarea' : 'input');
        input.setAttribute('type', 'text');
        input.classList.add('edit-field');
        input.value = value;
        field.parentNode.replaceChild(input, field);
    });

    // Toggle visibility of buttons
    saleContainer.querySelector('.edit-btn').style.display = 'none';
    saleContainer.querySelector('.delete-btn').style.display = 'none';
    saleContainer.querySelector('.save-btn').style.display = '';
    saleContainer.querySelector('.cancel-btn').style.display = '';
}

function deleteSale(saleId, userId) {
    if (confirm('Are you sure you want to delete this sale?')) {
        const saleRef = ref(database, `sales/${userId}/${saleId}`);
        set(saleRef, null).then(() => {
            alert('Sale deleted successfully.');
            fetchSalesHistory(userId);
        }).catch(error => {
            console.error('Error deleting sale: ', error);
        });
    }
}

function saveSale(saleContainer, userId) {
    const saleId = saleContainer.getAttribute('data-sale-id');
    const updatedSale = {
        lead_id: saleContainer.querySelector('[data-name="lead_id"]').value,
        esi_content: getSelectedESIContent() || saleContainer.querySelector('[data-name="esi_content"]').value,
        notes: saleContainer.querySelector('[data-name="notes"]').value,
        // Assuming sale_types needs to be collected from a specific input or selection method
        // sale_types: getSaleTypes(), // This needs to be adjusted based on your actual UI for editing sale types
        timestamp: new Date().toISOString()
    };

    const saleRef = ref(database, `sales/${userId}/${saleId}`);
    set(saleRef, updatedSale).then(() => {
        alert('Sale updated successfully.');
        fetchSalesHistory(userId);
    }).catch(error => {
        console.error('Error updating sale: ', error);
    });
}
