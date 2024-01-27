// app.js

document.addEventListener('DOMContentLoaded', () => {
    const salesForm = document.getElementById('salesForm');

    salesForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const leadId = document.getElementById('leadId').value;
        const esiStatus = document.getElementById('esiStatus').value;
        const selectedSaleTypes = document.getElementById('selectedSaleTypes').value;

        // Send data to the server for saving
        try {
            const response = await fetch('/.netlify/functions/saveSale', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ leadId, esiStatus, selectedSaleTypes }),
            });

            const data = await response.json();
            console.log(data);

            // Assuming you have a displaySalesHistory function to display data
            displaySalesHistory();
        } catch (error) {
            console.error('Error saving sale:', error);
        }

        // Clear input fields and selected options
        document.getElementById('leadId').value = '';
        document.getElementById('esiStatus').value = 'complete';
        document.querySelectorAll('.custom-multiselect .option.selected').forEach(option => {
            option.classList.remove('selected');
        });
    });

    // Fetch sales data from the server when the page loads
    fetch('/.netlify/functions/getSales')
        .then(response => response.json())
        .then(data => {
            // Assuming you have a displaySalesHistory function to display data
            displaySalesHistory(data);
        })
        .catch(error => console.error('Error fetching sales data:', error));

    // Update the displaySalesHistory function to include an Edit button
    function displaySalesHistory() {
        const salesList = document.getElementById('salesList');
        salesList.innerHTML = ''; // Clear existing content

        salesHistory.forEach((sale, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>Lead ID: ${sale.leadId}, ESI Status: ${sale.esiStatus}, Sale Types: ${sale.selectedSaleTypes}, Timestamp: ${sale.timestamp}</span>
                <button onclick="editSale(${index})">Edit</button>
            `;
            salesList.appendChild(listItem);
        });
    }

    // Function to populate the edit form with sale data
    function editSale(index) {
        const saleToEdit = salesHistory[index];

        // Assuming you have input elements in the edit form with IDs like 'editLeadId', 'editEsiStatus', etc.
        document.getElementById('editLeadId').value = saleToEdit.leadId;
        document.getElementById('editEsiStatus').value = saleToEdit.esiStatus;
        document.getElementById('editSelectedSaleTypes').value = saleToEdit.selectedSaleTypes;

        // Show the edit form or navigate to a new page for editing
        // Example: document.getElementById('editFormContainer').style.display = 'block';
    }

    // Add a function to handle updating sales data
    function updateSale() {
        const leadId = document.getElementById('editLeadId').value;
        const esiStatus = document.getElementById('editEsiStatus').value;
        const selectedSaleTypes = document.getElementById('editSelectedSaleTypes').value;

        // Assuming you have a function to find the index of the sale to be edited
        const index = findSaleIndexToUpdate(leadId);

        if (index !== -1) {
            // Update the sale in the salesHistory array
            salesHistory[index].esiStatus = esiStatus;
            salesHistory[index].selectedSaleTypes = selectedSaleTypes;

            // Display the updated sales history
            displaySalesHistory();

            // Optionally, hide the edit form or navigate to a different page
            // Example: document.getElementById('editFormContainer').style.display = 'none';
        } else {
            console.error('Sale not found for editing.');
        }
    }

    // Function to find the index of the sale to be updated
    function findSaleIndexToUpdate(leadId) {
        return salesHistory.findIndex(sale => sale.leadId === leadId);
    }

    // Other code for handling multiselect, form submission, etc.
});
