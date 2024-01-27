// history.js
document.addEventListener("DOMContentLoaded", function () {
    displaySalesHistory();
});

function displaySalesHistory() {
    const salesListContainer = document.getElementById('salesList');
    salesListContainer.innerHTML = '';

    if (salesHistory.length === 0) {
        salesListContainer.innerHTML = '<p>No sales yet.</p>';
    } else {
        salesHistory.forEach((sale, index) => {
            salesListContainer.innerHTML += `<li>${index + 1}. Lead ID: ${sale.leadId}, ESI Status: ${sale.esiStatus}, Sale Type: ${sale.saleType}, Time: ${sale.timestamp}</li>`;
        });
    }
}
