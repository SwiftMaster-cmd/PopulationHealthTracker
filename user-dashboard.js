import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, push, set, query, orderByChild, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

const firebaseConfig = {
    // Your Firebase configuration
    apiKey: "AIzaSyBhSqBwrg8GYyaqpYHOZS8HtFlcXZ09OJA",
    authDomain: "track-dac15.firebaseapp.com",
    databaseURL: "https://track-dac15-default-rtdb.firebaseio.com",
    projectId: "track-dac15",
    storageBucket: "track-dac15.appspot.com",
    messagingSenderId: "495156821305",
    appId: "1:495156821305:web:7cbb86d257ddf9f0c3bce8",
    measurementId: "G-RVBYB0RR06"
};


initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase();

document.addEventListener('DOMContentLoaded', () => {
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
            const esiContent = document.querySelector('input[name="esi_content"]:checked').value;
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

                // Reset form and UI
                event.target.reset();
                document.querySelectorAll('.sale-type-btn').forEach(btn => btn.classList.remove('selected'));
                document.getElementById('confirmationMessage').textContent = `Sale with Lead ID ${leadId} added successfully.`;
            } catch (error) {
                console.error('Error adding sale:', error);
                alert('Failed to add sale.');
            }
        });
    }

    // Toggle sale type selection
    document.querySelectorAll('.sale-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });

    onAuthStateChanged(auth, user => {
        if (user) {
            fetchSalesHistory(user.uid);
        } else {
            console.log("User is not logged in. Redirecting to login page.");
            window.location.href = 'login.html'; // Redirect to login
        }
    });
});

function getSaleTypes() {
    const saleTypes = {};
    document.querySelectorAll('.sale-type-btn.selected').forEach(btn => {
        const value = btn.getAttribute('data-value');
        saleTypes[value] = true;
    });
    return saleTypes;
}

function fetchSalesHistory(userId) {
    const salesRef = ref(database, 'sales/' + userId);
    onValue(salesRef, (snapshot) => {
        const sales = snapshot.val();
        const salesHistoryElement = document.getElementById('salesHistory');
        salesHistoryElement.innerHTML = ''; // Clear existing content
        for (let saleId in sales) {
            const sale = sales[saleId];
            const saleElement = document.createElement('div');
            saleElement.textContent = `Lead ID: ${sale.lead_id}, ESI Content: ${sale.esi_content}, Notes: ${sale.notes}`;
            salesHistoryElement.appendChild(saleElement);
        }
    }, {
        onlyOnce: true
    });
}