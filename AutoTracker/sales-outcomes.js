document.addEventListener('DOMContentLoaded', function() {
    // Helper functions
    function formatDate(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleDateString();
    }

    function formatTime(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleTimeString();
    }

    function formatDateTime(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }

    function getSaleType(action, notes) {
        const normalizedAction = action.toLowerCase();

        if (normalizedAction.includes('srx: enrolled - rx history received') || normalizedAction.includes('srx: enrolled - rx history not available')) {
            return 'selectRX';
        } else if (normalizedAction.includes('hra') && /bill|billable/i.test(notes)) {
            return 'billableHRA';
        } else if (normalizedAction.includes('notes') && /(vbc|transfer|ndr|fe|final expense|national|national debt|national debt relief|value based care|oak street|osh)/i.test(notes)) {
            return 'transfer';
        } else if (normalizedAction.includes('select patient management')) {
            return 'selectPatientManagement';
        }
        return 'other';
    }

    let currentSaleIndex = 0;
    let salesData = [];
    let filteredSalesData = [];

    function updateSalesDisplay() {
        const salesToDisplay = filteredSalesData.length ? filteredSalesData : salesData;
        if (salesToDisplay.length === 0) return;

        const sale = salesToDisplay[currentSaleIndex];
        const leadIdContainer = document.getElementById('lead-id-container');
        const salesOutcomesContainer = document.getElementById('sales-outcomes-container');
        const customerInfoContainer = document.getElementById('customer-info-container');
        const counter = document.getElementById('counter');

        if (leadIdContainer) {
            leadIdContainer.textContent = `Lead ID: ${sale.accountNumber || 'N/A'}`;
        }

        if (salesOutcomesContainer) {
            salesOutcomesContainer.innerHTML = `
                <div class="sales-history-item">
                    <div class="details">
                        <p>Sale: ${getSaleType(sale.assignAction, sale.notesValue)}</p>
                        <p>Notes: ${sale.notesValue || 'No notes'}</p>
                    </div>
                    <div class="date-time">
                        <span>${formatDate(sale.outcomeTime)}</span>
                        <span>${formatTime(sale.outcomeTime)}</span>
                    </div>
                </div>
            `;
        }

        if (customerInfoContainer) {
            const customerInfoHtml = displayCustomerInfo(sale.customerInfo);
            customerInfoContainer.innerHTML = customerInfoHtml;
        }

        if (counter) {
            counter.textContent = `${currentSaleIndex + 1} of ${salesToDisplay.length}`;
        }
    }

    function displaySalesOutcomes(user) {
        const database = firebase.database();
        const outcomesRef = database.ref('salesOutcomes/' + user.uid);

        outcomesRef.on('value', (snapshot) => {
            const outcomes = snapshot.val();
            console.log('Sales outcomes retrieved:', outcomes);

            if (outcomes) {
                salesData = Object.values(outcomes).filter(outcome => outcome.assignAction.trim() !== "--");
                salesData.sort((a, b) => new Date(b.outcomeTime) - new Date(a.outcomeTime));
                filteredSalesData = [];
                currentSaleIndex = 0;  // Reset to the latest sale
                updateSalesDisplay();
            } else {
                console.log('No sales outcomes found for user:', user.displayName);
            }
        }, (error) => {
            console.error('Error fetching sales outcomes:', error);
        });
    }

    // Attach the function to the window object
    window.displaySalesOutcomes = displaySalesOutcomes;

    function displayCustomerInfo(customerInfo) {
        if (!customerInfo) {
            return '<p>No customer information available.</p>';
        }
        const name = `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim() || 'N/A';
        return `
            <div class="customer-info">
                <p>Name: ${name}</p>
                <p>Email: ${customerInfo.email || 'N/A'}</p>
                <p>Phone: ${customerInfo.phone || 'N/A'}</p>
                <!-- Add more fields as needed -->
            </div>
        `;
    }

    // Event listeners for prev and next buttons
    document.getElementById('prev').addEventListener('click', function() {
        const salesToDisplay = filteredSalesData.length ? filteredSalesData : salesData;
        if (currentSaleIndex > 0) {
            currentSaleIndex--;
            updateSalesDisplay();
        }
    });

    document.getElementById('next').addEventListener('click', function() {
        const salesToDisplay = filteredSalesData.length ? filteredSalesData : salesData;
        if (currentSaleIndex < salesToDisplay.length - 1) {
            currentSaleIndex++;
            updateSalesDisplay();
        }
    });

    // Search functionality
    const searchInput = document.getElementById('searchById');
    const clearSearchButton = document.getElementById('clearSearch');

    searchInput.addEventListener('input', function() {
        const query = searchInput.value.trim().toLowerCase();
        if (query) {
            clearSearchButton.style.display = 'inline';
            filteredSalesData = salesData.filter(sale => sale.accountNumber.toLowerCase().includes(query));
        } else {
            clearSearchButton.style.display = 'none';
            filteredSalesData = [];
        }
        currentSaleIndex = 0;
        updateSalesDisplay();
    });

    clearSearchButton.addEventListener('click', function() {
        searchInput.value = '';
        clearSearchButton.style.display = 'none';
        filteredSalesData = [];
        currentSaleIndex = 0;
        updateSalesDisplay();
    });
});