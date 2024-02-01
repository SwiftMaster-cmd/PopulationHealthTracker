import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

const auth = getAuth();
const database = getDatabase();

document.getElementById('addSalesForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentUser = auth.currentUser;
    if (!currentUser) {
        alert('Please log in to add sales.');
        return;
    }

    const leadId = document.getElementById('lead_id').value.trim();
    const esiContent = document.querySelector('input[name="esi_content"]:checked').value;
    
    // Collecting selected sale types
    const saleTypes = {};
    document.querySelectorAll('.sale-type-btn.selected').forEach(btn => {
        const value = btn.getAttribute('data-value');
        saleTypes[value] = true;
    });

    const notes = document.getElementById('notes').value.trim();

    const saleData = {
        lead_id: leadId,
        esi_content: esiContent,
        sale_types: saleTypes, // Storing selected sale types
        notes: notes,
        user_id: currentUser.uid
    };

    try {
        const newSaleRef = push(ref(database, 'sales/' + currentUser.uid));
        await set(newSaleRef, saleData);

        // Reset the form and update UI
        event.target.reset();
        document.querySelectorAll('.sale-type-btn').forEach(btn => btn.classList.remove('selected'));
        const confirmationMessage = document.getElementById('confirmationMessage');
        confirmationMessage.textContent = `Sale with Lead ID ${leadId} added successfully.`;
    } catch (error) {
        console.error('Error adding sale:', error);
        alert('Failed to add sale.');
    }
});
