function displaySalesOutcomes(user) {
    const database = firebase.database();
    const outcomesRef = database.ref('salesOutcomes/' + user.uid);
    outcomesRef.on('value', (snapshot) => {
        const outcomes = snapshot.val();
        console.log('Sales outcomes retrieved:', outcomes);
        if (outcomes) {
            const outcomesContainer = document.getElementById('sales-outcomes-container');
            outcomesContainer.innerHTML = ''; // Clear previous outcomes

            // Group outcomes by account number and filter out unwanted outcomes
            const groupedOutcomes = {};
            const salesCounts = {};

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

            // Tally the sales counts
            for (const accountNumber in groupedOutcomes) {
                const actions = groupedOutcomes[accountNumber].actions;
                for (const action in actions) {
                    const outcome = actions[action];
                    const saleType = getSaleType(outcome.assignAction, outcome.notesValue);

                    if (!salesCounts[saleType]) {
                        salesCounts[saleType] = 0;
                    }
                    salesCounts[saleType]++;
                }
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
                        <div class="action-notes">
                            <div class="action">${outcome.assignAction}</div>
                            <div class="date-time">
                                <div class="date">${formatDateTime(outcome.outcomeTime).split(', ')[0]}</div>
                                <div class="time">${formatDateTime(outcome.outcomeTime).split(', ')[1]}</div>
                            </div>
                        </div>
                        <div class="notes">${outcome.notesValue || 'No notes'}</div>
                    `;
                    salesInfoContainer.appendChild(outcomeElement);
                }

                outcomesContainer.appendChild(accountContainer);
            }

            // Add event listeners for + More buttons
            document.querySelectorAll('.more-info-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const popup = this.parentElement.nextElementSibling;
                    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
                });
            });

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

// CSS to align elements as per requirement
const styles = `
    .account-container {
        margin-bottom: 20px;
        border: 1px solid #ddd;
        padding: 10px;
    }
    .account-title {
        font-weight: bold;
        margin-bottom: 10px;
    }
    .action-notes {
        display: flex;
        justify-content: space-between;
    }
    .action {
        text-align: left;
    }
    .date-time {
        text-align: right;
    }
    .notes {
        display: flex;
        justify-content: space-between;
    }
    .notes div {
        flex: 1;
    }
`;

// Add styles to the document
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Attach the function to the window object
window.displaySalesOutcomes = displaySalesOutcomes;