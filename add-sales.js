import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

document.getElementById('addSalesForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const leadId = document.getElementById('lead_id').value.trim();
    const esiContent = document.querySelector('input[name="esi_content"]:checked').value;
    const saleType = document.getElementById('sale_type').value;
    const notes = document.getElementById('notes').value.trim();

    try {
        const docRef = await addDoc(collection(window.db, "sales"), {
            lead_id: leadId,
            esi_content: esiContent,
            sale_type: saleType,
            notes: notes
        });
        console.log("Document written with ID: ", docRef.id);
        alert("Sale added successfully!");
        // Optionally, display a confirmation message
        showConfirmationMessage(leadId);
        // Optionally, reset the form
        event.target.reset();
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("Failed to add sale.");
    }
});

function showConfirmationMessage(leadId) {
    const confirmationMessage = `Lead ID ${leadId} added successfully.`;
    const messageElement = document.getElementById('confirmationMessage');
    messageElement.textContent = confirmationMessage;
}
