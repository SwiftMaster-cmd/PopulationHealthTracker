// display-sales.js

document.addEventListener('DOMContentLoaded', function() {
    window.displaySalesOutcomes = function(user) {
        // Ensure Firebase is initialized
        if (!firebase.apps.length) {
            console.error('Firebase is not initialized.');
            return;
        }

        const database = firebase.database();
        const salesRef = database.ref('salesOutcomes/' + user.uid);

        let salesData = [];
        let displayedData = [];
        let itemsPerPage = 25;
        let currentPage = 1;

        // Elements
        const container = document.getElementById('salesTableContainer');
        const showMoreButton = document.getElementById('showMoreButton');
        const toggleTableButton = document.getElementById('toggleTableButton');
        const salesFilters = document.getElementById('salesFilters');
        const searchInput = document.getElementById('searchInput');
        const salesTimeFrame = document.getElementById('salesTimeFrame');

        if (!container || !showMoreButton || !toggleTableButton || !salesFilters || !searchInput || !salesTimeFrame) {
            console.error('One or more elements not found in the DOM.');
            return;
        }

        // Event Listeners
        toggleTableButton.addEventListener('click', () => {
            if (container.style.display === 'none' || container.style.display === '') {
                container.style.display = 'block';
                salesFilters.style.display = 'flex';
                toggleTableButton.textContent = 'Hide Sales Data';
                showMoreButton.style.display = 'block';
                renderTable();
            } else {
                container.style.display = 'none';
                salesFilters.style.display = 'none';
                toggleTableButton.textContent = 'Show Sales Data';
                showMoreButton.style.display = 'none';
            }
        });

        showMoreButton.addEventListener('click', () => {
            currentPage++;
            renderTable();
        });

        searchInput.addEventListener('input', () => {
            currentPage = 1;
            renderTable();
        });

        salesTimeFrame.addEventListener('change', () => {
            currentPage = 1;
            renderTable();
        });

        // Listen for real-time updates
        salesRef.on('value', snapshot => {
            salesData = [];
            const salesObj = snapshot.val() || {};
            for (const saleId in salesObj) {
                salesData.push({ saleId: saleId, ...salesObj[saleId] });
            }
            currentPage = 1;
            // Only render table if it is visible
            if (container.style.display !== 'none' && container.style.display !== '') {
                renderTable();
            }
        });

        // Monitor for duplicate sales
        monitorSalesForDuplicates(user.uid);

        function renderTable() {
            // Clear container
            container.innerHTML = '';

            // Filter data
            let filteredData = filterSalesData(salesData, salesTimeFrame.value);
            filteredData = searchSalesData(filteredData, searchInput.value);

            // Update displayed data
            displayedData = filteredData.slice(0, itemsPerPage * currentPage);

            // Create table
            if (displayedData.length > 0) {
                const tableContainer = document.createElement('div');
                tableContainer.classList.add('sales-table-container');

                const table = document.createElement('table');
                table.classList.add('sales-table');

                // Table Header
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th>Outcome Time</th>
                        <th>Assign Action</th>
                        <th>Notes</th>
                        <th>Account Number</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Gender</th>
                        <th>Birthdate</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Zipcode</th>
                        <th>State ID</th>
                        <th>Action</th> <!-- New column for delete button -->
                    </tr>
                `;
                table.appendChild(thead);

                // Table Body
                const tbody = document.createElement('tbody');
                displayedData.forEach(sale => {
                    const customerInfo = sale.customerInfo || {};

                    const row = tbody.insertRow();

                    // Format date
                    const date = new Date(sale.outcomeTime);
                    const options = { year: 'numeric', month: 'short', day: 'numeric' };
                    const formattedDate = date.toLocaleDateString(undefined, options);

                    row.insertCell().innerText = formattedDate || '';
                    row.insertCell().innerText = sale.assignAction || '';
                    row.insertCell().innerText = sale.notesValue || '';
                    row.insertCell().innerText = sale.accountNumber || '';
                    row.insertCell().innerText = customerInfo.firstName || '';
                    row.insertCell().innerText = customerInfo.lastName || '';
                    row.insertCell().innerText = customerInfo.gender || '';
                    row.insertCell().innerText = customerInfo.birthdate || '';
                    row.insertCell().innerText = customerInfo.email || '';
                    row.insertCell().innerText = customerInfo.phone || '';
                    row.insertCell().innerText = customerInfo.zipcode || '';
                    row.insertCell().innerText = customerInfo.stateId || '';

                    // Add delete button
                    const actionCell = row.insertCell();
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.classList.add('delete-button');
                    deleteButton.addEventListener('click', () => {
                        confirmAndDeleteSale(sale.saleId);
                    });
                    actionCell.appendChild(deleteButton);
                });

                table.appendChild(tbody);
                tableContainer.appendChild(table);
                container.appendChild(tableContainer);
            } else {
                container.innerHTML = '<p>No sales data found.</p>';
            }

            // Show or hide the "Show More" button
            if (filteredData.length > displayedData.length) {
                showMoreButton.style.display = 'block';
            } else {
                showMoreButton.style.display = 'none';
            }
        }

        function confirmAndDeleteSale(saleId) {
            const confirmation = confirm('Are you sure you want to delete this sale?');
            if (confirmation) {
                const userId = user.uid;
                const saleRef = database.ref(`salesOutcomes/${userId}/${saleId}`);
                saleRef.remove()
                    .then(() => {
                        alert('Sale deleted successfully.');
                    })
                    .catch(error => {
                        console.error('Error deleting sale:', error);
                        alert('Error deleting sale. Please try again.');
                    });
            }
        }

        function monitorSalesForDuplicates(userId) {
            const salesRef = database.ref(`salesOutcomes/${userId}`);
            salesRef.on('child_added', snapshot => {
                const newSale = snapshot.val();
                const newSaleId = snapshot.key;
                const newSaleTime = new Date(newSale.outcomeTime).getTime();

                // Query for sales within the last 2 seconds
                const timeWindowStart = newSaleTime - 2000;
                salesRef.orderByChild('outcomeTime').startAt(timeWindowStart).endAt(newSaleTime).once('value', salesSnapshot => {
                    const salesInWindow = salesSnapshot.val() || {};
                    const duplicateSales = [];

                    for (const saleId in salesInWindow) {
                        if (saleId !== newSaleId) {
                            const sale = salesInWindow[saleId];
                            // Compare sales fields to determine if they are duplicates
                            if (isDuplicateSale(newSale, sale)) {
                                duplicateSales.push(saleId);
                            }
                        }
                    }

                    // Remove duplicate sales
                    duplicateSales.forEach(duplicateSaleId => {
                        database.ref(`salesOutcomes/${userId}/${duplicateSaleId}`).remove()
                            .then(() => {
                                console.log(`Duplicate sale ${duplicateSaleId} removed.`);
                            })
                            .catch(error => {
                                console.error('Error removing duplicate sale:', error);
                            });
                    });
                });
            });
        }

        function isDuplicateSale(sale1, sale2) {
            // Compare relevant fields to determine if sales are duplicates
            return sale1.assignAction === sale2.assignAction &&
                   sale1.notesValue === sale2.notesValue &&
                   sale1.outcomeTime === sale2.outcomeTime;
        }

        function filterSalesData(data, timeFrame) {
            const now = new Date();
            let startDate = new Date();

            switch (timeFrame) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'currentWeek':
                    const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - dayOfWeek);
                    break;
                case 'previousWeek':
                    const previousWeekStart = new Date(now);
                    const prevWeekDayOfWeek = now.getDay();
                    previousWeekStart.setDate(now.getDate() - prevWeekDayOfWeek - 7);
                    startDate = previousWeekStart;
                    now.setDate(previousWeekStart.getDate() + 6);
                    break;
                case 'currentMonth':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case '90days':
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - 90);
                    break;
                case 'quarter':
                    const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
                    startDate = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
                    break;
                case 'yearToDate':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                case 'allTime':
                default:
                    startDate = new Date(0);
            }

            const startTime = startDate.getTime();
            const endTime = now.getTime();

            // Filter data based on time frame
            let filteredData = data.filter(sale => {
                const saleTime = new Date(sale.outcomeTime).getTime();
                return saleTime >= startTime && saleTime <= endTime;
            });

            // Sort data by outcomeTime descending
            filteredData.sort((a, b) => new Date(b.outcomeTime) - new Date(a.outcomeTime));

            return filteredData;
        }

        function searchSalesData(data, query) {
            if (!query) return data;

            query = query.toLowerCase();

            return data.filter(sale => {
                const customerInfo = sale.customerInfo || {};
                return (
                    (sale.assignAction && sale.assignAction.toLowerCase().includes(query)) ||
                    (sale.notesValue && sale.notesValue.toLowerCase().includes(query)) ||
                    (sale.accountNumber && sale.accountNumber.toLowerCase().includes(query)) ||
                    (customerInfo.firstName && customerInfo.firstName.toLowerCase().includes(query)) ||
                    (customerInfo.lastName && customerInfo.lastName.toLowerCase().includes(query)) ||
                    (customerInfo.email && customerInfo.email.toLowerCase().includes(query)) ||
                    (customerInfo.phone && customerInfo.phone.toLowerCase().includes(query))
                );
            });
        }
    };
});
