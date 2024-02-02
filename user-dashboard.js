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
            // Create a Bootstrap card for each sale
            const card = document.createElement('div');
            card.className = 'card mb-3'; // Add Bootstrap card classes

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';

            // Add a card title
            const cardTitle = document.createElement('h5');
            cardTitle.className = 'card-title';
            cardTitle.textContent = `Sale ID: ${saleId}`;
            cardBody.appendChild(cardTitle);

            // Create a list group for sale details
            const listGroup = document.createElement('ul');
            listGroup.className = 'list-group list-group-flush';

            // Function to add each detail to the list group
            const addSaleDetail = (title, value) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item';
                listItem.innerHTML = `<strong>${title}:</strong> ${value}`;
                listGroup.appendChild(listItem);
            };

            // Add sale details
            addSaleDetail('Lead ID', sale.lead_id);
            addSaleDetail('ESI Content', sale.esi_content);
            addSaleDetail('Notes', sale.notes);
            addSaleDetail('User ID', sale.user_id);
            addSaleDetail('Timestamp', sale.timestamp);

            // Append list of sale types
            const saleTypesList = document.createElement('li');
            saleTypesList.className = 'list-group-item';
            saleTypesList.innerHTML = '<strong>Sale Types:</strong>';
            const saleTypes = sale.sale_types;
            const saleTypesContent = document.createElement('p');
            saleTypesContent.textContent = Object.keys(saleTypes).join(', ');
            saleTypesList.appendChild(saleTypesContent);
            listGroup.appendChild(saleTypesList);

            // Append everything to the card
            card.appendChild(cardBody);
            card.appendChild(listGroup);

            // Append the card to the sales history container
            salesHistoryElement.appendChild(card);
        }
    }, {
        onlyOnce: true
    });
}
