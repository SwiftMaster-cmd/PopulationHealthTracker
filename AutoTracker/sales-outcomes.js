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
    if (action === 'SRX: Enrolled - Rx History Not Available' || action === 'SRX: Enrolled - Rx History Received') {
        return 'Select RX';
    } else if (action === 'HRA' && /bill|billable/i.test(notes)) {
        return 'Billable HRA';
    } else if (action === 'Notes' && /(vbc|transfer|ndr|fe|final expense|national|national debt|national debt relief|value based care|oak street|osh)/i.test(notes)) {
        return 'Transfer';
    } else if (action === 'Select Patient Management') {
        return 'Select Patient Management';
    }
    return action;
}

function displayCustomerInfo(customerInfo) {
    if (!customerInfo) {
        return '<div class="customer-info"><h4>No Customer Information Available</h4></div>';
    }

    return `
        <div class="customer-info">
            <div class="customer-row">
                <div class="customer-field"><strong>First:</strong> ${customerInfo.firstName || 'N/A'}</div>
                <div class="customer-field"><strong>Last:</strong> ${customerInfo.lastName || 'N/A'}</div>
            </div>
            <div class="customer-row">
                <div class="customer-field"><strong>Phone:</strong> ${customerInfo.phone || 'N/A'}</div>
                <button class="more-info-btn">+ More</button>
            </div>
            <div class="more-info-popup" style="display:none;">
                <div class="customer-row">
                    <div class="customer-field"><strong>Gender:</strong> ${customerInfo.gender || 'N/A'}</div>
                    <div class="customer-field"><strong>Birth:</strong> ${customerInfo.birthdate || 'N/A'}</div>
                </div>
                <div class="customer-row">
                    <div class="customer-field"><strong>Email:</strong> ${customerInfo.email || 'N/A'}</div>
                </div>
                <div class="customer-row">
                    <div class="customer-field"><strong>Zip:</strong> ${customerInfo.zipcode || 'N/A'}</div>
                    <div class="customer-field"><strong>State:</strong> ${customerInfo.stateId || 'N/A'}</div>
                </div>
            </div>
        </div>
    `;
}

function displaySalesOutcomes(user) {
    const database = firebase.database();
    const outcomesRef = database.ref('salesOutcomes/' + user.uid);
    const salesCountsRef = database.ref('salesCounts/' + user.uid);

    outcomesRef.on('value', (snapshot) => {
        const outcomes = snapshot.val();
        console.log('Sales outcomes retrieved:', outcomes);

        if (outcomes) {
            // Initialize sales counts
            const salesCounts = {
                billableHRA: 0,
                selectRX: 0,
                selectPatientManagement: 0,
                transfer: 0
            };

            // Process each outcome
            for (const key in outcomes) {
                const outcome = outcomes[key];
                const action = outcome.assignAction;
                const notes = outcome.notesValue;
                
                console.log(`Processing outcome - Key: ${key}, Action: "${action}", Notes: "${notes}"`);

                // Get the sale type
                const saleType = getSaleType(action, notes);
                console.log(`Identified Sale Type: ${saleType}`);

                // Update sales counts based on sale type
                if (saleType === 'Billable HRA') {
                    salesCounts.billableHRA++;
                } else if (saleType === 'Select RX') {
                    salesCounts.selectRX++;
                } else if (saleType === 'Select Patient Management') {
                    salesCounts.selectPatientManagement++;
                } else if (saleType === 'Transfer') {
                    salesCounts.transfer++;
                }

                console.log('Updated salesCounts:', salesCounts); // Log after each update
            }

            // Log final sales counts
            console.log('Final Sales Counts:', salesCounts);

            // Update the sales counts in Firebase
            salesCountsRef.set(salesCounts, (error) => {
                if (error) {
                    console.error('Failed to update sales counts:', error);
                } else {
                    console.log('Sales counts updated successfully:', salesCounts);
                }
            });

            // Display sales counts in the UI
            const outcomesContainer = document.getElementById('sales-outcomes-container');
            outcomesContainer.innerHTML = ''; // Clear previous outcomes

            const salesCountsContainer = document.createElement('div');
            salesCountsContainer.classList.add('sales-counts-container');
            for (const action in salesCounts) {
                const countElement = document.createElement('div');
                countElement.classList.add('sales-count-item');
                countElement.innerHTML = `<strong>${action}:</strong> ${salesCounts[action]}`;
                salesCountsContainer.appendChild(countElement);
            }
            outcomesContainer.appendChild(salesCountsContainer);

            // Process and display outcomes
            const groupedOutcomes = {};

            for (const key in outcomes) {
                const outcome = outcomes[key];
                const accountNumber = outcome.accountNumber;

                if (outcome.assignAction.trim() === "--") {
                    continue; // Skip outcomes with "--" in assign action
                }
                if (!groupedOutcomes[accountNumber]) {
                    groupedOutcomes[accountNumber] = { customerInfo: outcome.customerInfo || {}, actions: {} };
                }
                groupedOutcomes[accountNumber].actions[outcome.assignAction] = outcome; // Keep only the latest action for each type
            }

            // Sort account numbers by the newest outcome time
            const sortedAccounts = Object.keys(groupedOutcomes).sort((a, b) => {
                const latestA = Object.values(groupedOutcomes[a].actions).reduce((latest, current) => new Date(current.outcomeTime) > new Date(latest.outcomeTime) ? current : latest);
                const latestB = Object.values(groupedOutcomes[b].actions).reduce((latest, current) => new Date(current.outcomeTime) > new Date(latest.outcomeTime) ? current : latest);
                return new Date(latestB.outcomeTime) - new Date(latestA.outcomeTime);
            });

            // Display grouped outcomes, sorted by newest account first
            for (const accountNumber of sortedAccounts) {
                const accountContainer = document.createElement('div');
                accountContainer.classList.add('account-container');

                const accountTitle = document.createElement('div');
                accountTitle.classList.add('account-title');
                accountTitle.textContent = `Account Number: ${accountNumber}`;
                accountContainer.appendChild(accountTitle);

                const accountContent = document.createElement('div');
                accountContent.classList.add('account-content');
                accountContainer.appendChild(accountContent);

                const salesInfoContainer = document.createElement('div');
                salesInfoContainer.classList.add('sales-info');
                accountContent.appendChild(salesInfoContainer);

                const customerInfoContainer = document.createElement('div');
                customerInfoContainer.classList.add('customer-info-container');
                accountContent.appendChild(customerInfoContainer);

                const customerInfoHtml = displayCustomerInfo(groupedOutcomes[accountNumber].customerInfo);
                customerInfoContainer.innerHTML = customerInfoHtml;

                const accountOutcomes = Object.values(groupedOutcomes[accountNumber].actions);
                accountOutcomes.sort((a, b) => new Date(b.outcomeTime) - new Date(a.outcomeTime));

                for (const outcome of accountOutcomes) {
                    if (outcome.assignAction.trim() === "--") continue; // Ensure actions with "--" are not displayed
                    const outcomeElement = document.createElement('div');
                    outcomeElement.classList.add('outcome-item');
                    outcomeElement.innerHTML = `
                        <div class="top-section">
                            <div class="action" style="float:left;">${outcome.assignAction}</div>
                            <div class="date-top" style="float:right;">${formatDate(outcome.outcomeTime)}</div>
                        </div>
                        <div class="bottom-section">
                            <div class="notes" style="float:left;">${outcome.notesValue || 'No notes'}</div>
                            <div class="time-bottom" style="float:right;">${formatTime(outcome.outcomeTime)}</div>
                        </div>
                    `;
                    salesInfoContainer.appendChild(outcomeElement);
                }

                outcomesContainer.appendChild(accountContainer);
            }
        } else {
            console.log('No sales outcomes found for user:', user.displayName);
        }
    }, (error) => {
        console.error('Error fetching sales outcomes:', error);
    });
}

// Attach the function to the window object
window.displaySalesOutcomes = displaySalesOutcomes;
