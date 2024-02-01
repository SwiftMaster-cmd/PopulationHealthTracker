// Import Firebase modules
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, set, push } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

// Initialize Firebase Auth and Realtime Database
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
    const saleType = document.getElementById('sale_type').value;
    const notes = document.getElementById('notes').value.trim();

    const saleData = {
        lead_id: leadId,
        esi_content: esiContent,
        sale_type: saleType,
        notes: notes,
        user_id: currentUser.uid // Associate sale with the user's UID
    };

    try {
        // Use push() if you want to generate a unique key for each sale
        const newSaleRef = push(ref(database, 'sales'));
        await set(newSaleRef, saleData);

        console.log('Sale added successfully. ID:', newSaleRef.key);
        alert('Sale added successfully!');
        // Optionally, display a confirmation message
        // Optionally, reset the form
    } catch (error) {
        console.error('Error adding sale:', error);
        alert('Failed to add sale.');
    }
});
