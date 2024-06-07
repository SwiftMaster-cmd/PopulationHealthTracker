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

function displaySalesOutcomes(user) {
    const database = firebase.database();
    const outcomesRef = database.ref('salesOutcomes/' + user.uid);
    const salesCountsRef = database.ref('salesCounts/' + user.uid);

    outcomesRef.on('value', (snapshot) => {
        const outcomes = snapshot.val();
        console.log('Sales outcomes retrieved:', outcomes);

        if (outcomes) {
            const outcomesContainer = document.getElementById('sales-outcomes-container');
            outcomesContainer.innerHTML = ''; // Clear previous outcomes

            // Initialize sales counts
            const salesCounts = {
                billableHRA: 0,
                selectRX: 0,
                selectPatientManagement: 0,
                transfer: 0
            };

            // Group outcomes by account number and filter out unwanted outcomes
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

                // Update sales counts
                const saleType = getSaleType(outcome.assignAction, outcome.notesValue);
                if (saleType === 'Billable HRA') {
                    salesCounts.billableHRA++;
                } else if (saleType === 'Select RX Enrolled') { // Ensure this matches the return value in getSaleType
                    salesCounts.selectRX++;
                } else if (saleType === 'Select Patient Management') {
                    salesCounts.selectPatientManagement++;
                } else if (saleType === 'Transfer') {
                    salesCounts.transfer++;
                }
            }

            // Update the sales counts in Firebase
            salesCountsRef.set(salesCounts, (error) => {
                if (error) {
                    console.error('Failed to update sales counts:', error);
                } else {
                    console.log('Sales counts updated successfully:', salesCounts);
                }
            });

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

            // Add event listeners for Copy Action buttons
            document.querySelectorAll('.copy-action-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const account = this.getAttribute('data-account');
                    const action = this.getAttribute('data-action');
                    const firstName = this.getAttribute('data-firstname');
                    const lastName = this.getAttribute('data-lastname');
                    const textToCopy = `${account} - ${action} - ${firstName} ${lastName}`;
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        alert(`Copied: ${textToCopy}`);
                    }).catch(err => {
                        console.error('Could not copy text: ', err);
                    });
                });
            });

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
            
                // Update sales counts
                const saleType = getSaleType(outcome.assignAction, outcome.notesValue);
                console.log(`Sale Type for action "${outcome.assignAction}": ${saleType}`); // Debugging line
                if (saleType === 'Billable HRA') {
                    salesCounts.billableHRA++;
                } else if (saleType === 'Select RX') { // Ensure this matches the return value in getSaleType
                    salesCounts.selectRX++;
                } else if (saleType === 'Select Patient Management') {
                    salesCounts.selectPatientManagement++;
                } else if (saleType === 'Transfer') {
                    salesCounts.transfer++;
                }
            }

            // Display sales counts
            const salesCountsContainer = document.createElement('div');
            salesCountsContainer.classList.add('sales-counts-container');
            for (const action in salesCounts) {
                const countElement = document.createElement('div');
                countElement.classList.add('sales-count-item');
                countElement.innerHTML = `<strong>${action}:</strong> ${salesCounts[action]}`;
                salesCountsContainer.appendChild(countElement);
            }
            outcomesContainer.prepend(salesCountsContainer);
        } else {
            console.log('No sales outcomes found for user:', user.displayName);
        }
    }, (error) => {
        console.error('Error fetching sales outcomes:', error);
    });
}

// Helper functions
function formatDate(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleDateString();
}

function formatTime(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleTimeString();
}

// Attach the function to the window object
window.displaySalesOutcomes = displaySalesOutcomes;