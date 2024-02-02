// Firebase App (the core Firebase SDK) is always required and must be listed first
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

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
            // Convert sales object to an array and sort by timestamp
            const salesArray = Object.keys(sales).map(key => ({
                ...sales[key],
                id: key
            })).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

            // Iterate through the sorted array to display each sale
            salesArray.forEach(sale => {
                const saleContainer = document.createElement('div');
                saleContainer.className = 'sale-container';

                const addDetail = (title, value) => {
                    const detailDiv = document.createElement('div');
                    detailDiv.className = 'sale-detail';
                    detailDiv.innerHTML = `<strong>${title}:</strong> ${value}`;
                    saleContainer.appendChild(detailDiv);
                };

                addDetail('Lead ID', sale.lead_id);
                addDetail('ESI Content', sale.esi_content);
                addDetail('Sale Types', Object.keys(sale.sale_types || {}).join(', '));
                addDetail('Notes', sale.notes);
                addDetail('Timestamp', new Date(sale.timestamp).toLocaleString());

                salesHistoryElement.appendChild(saleContainer);
            });
        } else {
            salesHistoryElement.innerHTML = '<div>No sales history found.</div>';
        }
    }, {
        onlyOnce: true
    });
}