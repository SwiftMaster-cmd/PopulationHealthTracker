// app.js
document.addEventListener('DOMContentLoaded', () => {
    const options = document.querySelectorAll('.custom-multiselect .option');
    const selectedSaleTypes = document.getElementById('selectedSaleTypes');

    options.forEach(option => {
        option.addEventListener('click', () => {
            option.classList.toggle('selected');
            updateSelectedSaleTypes();
        });
    });

    function updateSelectedSaleTypes() {
        const selectedValues = Array.from(options)
            .filter(option => option.classList.contains('selected'))
            .map(option => option.dataset.value);

        selectedSaleTypes.value = selectedValues.join(', ');
    }

    document.getElementById('submitBtn').addEventListener('click', submitSale);
    document.getElementById('goBackBtn').addEventListener('click', goBack);

    // Fetch sales data from the server when the page loads
    fetch('/api/sales')
        .then(response => response.json())
        .then(data => {
            // Assuming you have a displaySalesHistory function to display data
            displaySalesHistory(data);
        })
        .catch(error => console.error('Error fetching sales data:', error));
});

let salesHistory = []; // Assume a globally defined salesHistory array

function submitSale() {
    const leadId = document.getElementById('leadId').value;
    const esiStatus = document.getElementById('esiStatus').value;
    const selectedSaleTypes = document.getElementById('selectedSaleTypes').value;
    const timestamp = new Date().toLocaleString();

    const saleData = { leadId, esiStatus, selectedSaleTypes, timestamp };

    // Save the sale to the server (Assuming you have a saveSaleToServer function)
    fetch('/api/sales', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
    })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error saving sale:', error));

    // Save the sale to the client-side history
    salesHistory.push(saleData);

    // Display sales history on the history view (Assuming you have a displaySalesHistory function)
    displaySalesHistory();

    // Clear input fields and selected options
    document.getElementById('leadId').value = '';
    document.getElementById('esiStatus').value = 'complete';
    document.querySelectorAll('.custom-multiselect .option.selected').forEach(option => {
        option.classList.remove('selected');
    });
}

function goToViewSales() {
    window.location.href = 'history.html';
}

function goBack() {
    // Redirect to the main page
    window.location.href = 'index.html';
}

function displaySalesHistory() {
    const salesList = document.getElementById('salesList');
    salesList.innerHTML = ''; // Clear existing content

    salesHistory.forEach(sale => {
        const listItem = document.createElement('li');
        listItem.textContent = `Lead ID: ${sale.leadId}, ESI Status: ${sale.esiStatus}, Sale Types: ${sale.selectedSaleTypes}, Timestamp: ${sale.timestamp}`;
        salesList.appendChild(listItem);
    });
}
