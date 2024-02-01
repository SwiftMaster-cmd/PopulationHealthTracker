import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

// Initialize Firebase Auth and Firestore
const auth = getAuth();
const db = getFirestore();

document.getElementById('addSalesForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentUser = auth.currentUser;
    if (!currentUser) {
        alert("Please log in to add sales.");
        return;
    }

    const leadId = document.getElementById('lead_id').value.trim();
    const esiContent = document.querySelector('input[name="esi_content"]:checked').value;
    const saleType = document.getElementById('sale_type').value;
    const notes = document.getElementById('notes').value.trim();

    try {
        // Structure your sale data here
        const saleData = {
            lead_id: leadId,
            esi_content: esiContent,
            sale_type: saleType,
            notes: notes
        };

        // Save the data in Firestore under the current user's ID
        await setDoc(doc(db, "sales", currentUser.uid), saleData);

        console.log("Sale added successfully.");
        showConfirmationMessage(leadId);
        event.target.reset();
    } catch (error) {
        console.error("Error adding sale: ", error);
        alert("Failed to add sale.");
    }
});

function showConfirmationMessage(leadId) {
    const confirmationMessage = `Lead ID ${leadId} added successfully.`;
    const messageElement = document.getElementById('confirmationMessage');
    messageElement.textContent = confirmationMessage;
}
