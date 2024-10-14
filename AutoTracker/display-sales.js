// display-sales.js

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

            // Create table body
            const tbody = document.createElement('tbody');

            Object.keys(data).forEach(key => {
                const sale = data[key];
                const customerInfo = sale.customerInfo || {};

                const row = document.createElement('tr');

                row.innerHTML = `
                    <td>${sale.outcomeTime || ''}</td>
                    <td>${sale.assignAction || ''}</td>
                    <td>${sale.notesValue || ''}</td>
                    <td>${sale.accountNumber || ''}</td>
                    <td>${customerInfo.firstName || ''}</td>
                    <td>${customerInfo.lastName || ''}</td>
                    <td>${customerInfo.gender || ''}</td>
                    <td>${customerInfo.birthdate || ''}</td>
                    <td>${customerInfo.email || ''}</td>
                    <td>${customerInfo.phone || ''}</td>
                    <td>${customerInfo.zipcode || ''}</td>
                    <td>${customerInfo.stateId || ''}</td>
                `;

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            container.appendChild(table);
        } else {
            container.innerHTML = '<p>No sales data found.</p>';
        }
    }).catch(error => {
        console.error('Error fetching sales data:', error);
        const container = document.querySelector('.grid-container');
        container.innerHTML = '<p>Error fetching sales data.</p>';
    });
};
