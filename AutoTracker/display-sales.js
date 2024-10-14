window.displaySalesOutcomes = function(user) {
    // Ensure Firebase is initialized
    if (!firebase.apps.length) {
        console.error('Firebase is not initialized.');
        return;
    }

    const database = firebase.database();
    const salesRef = database.ref('salesOutcomes/' + user.uid);

    salesRef.once('value', snapshot => {
        const data = snapshot.val();
        const container = document.querySelector('.grid-container');

        // Clear any existing content
        container.innerHTML = '';

        if (data) {
            const tableContainer = document.createElement('div');
            tableContainer.classList.add('sales-table-container');

            // Create a table to display the sales data
            const table = document.createElement('table');
            table.classList.add('sales-table');

            // Create table header
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
                </tr>
            `;
            table.appendChild(thead);

            // Convert data object to array and sort it
            const dataArray = Object.values(data);

            // Sort the array in descending order based on outcomeTime
            dataArray.sort((a, b) => new Date(b.outcomeTime) - new Date(a.outcomeTime));

            // Create table body
            const tbody = document.createElement('tbody');
            dataArray.forEach(sale => {
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
            });

            table.appendChild(tbody);
            tableContainer.appendChild(table);
            container.appendChild(tableContainer);
        } else {
            container.innerHTML = '<p>No sales data found.</p>';
        }
    }).catch(error => {
        console.error('Error fetching sales data:', error);
        const container = document.querySelector('.grid-container');
        container.innerHTML = '<p>Error fetching sales data.</p>';
    });
};
