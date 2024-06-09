import { formatDate, formatTime, getSaleType, isSameDay, isSameWeek, isSameMonth } from './helpers.js';


function displaySalesOutcomes(user) {
    const database = firebase.database();
    const outcomesRef = database.ref('salesOutcomes/' + user.uid);
    const salesCountsRef = database.ref('salesCounts/' + user.uid);

    const now = new Date();

    outcomesRef.on('value', (snapshot) => {
        const outcomes = snapshot.val();
        console.log('Sales outcomes retrieved:', outcomes);

        if (outcomes) {
            const salesCounts = {
                day: {
                    billableHRA: 0,
                    selectRX: 0,
                    selectPatientManagement: 0,
                    transfer: 0
                },
                week: {
                    billableHRA: 0,
                    selectRX: 0,
                    selectPatientManagement: 0,
                    transfer: 0
                },
                month: {
                    billableHRA: 0,
                    selectRX: 0,
                    selectPatientManagement: 0,
                    transfer: 0
                }
            };

            for (const key in outcomes) {
                const outcome = outcomes[key];
                const action = outcome.assignAction;
                const notes = outcome.notesValue;
                const outcomeTime = new Date(outcome.outcomeTime);

                console.log(`Processing outcome - Key: ${key}, Action: "${action}", Notes: "${notes}"`);

                const saleType = getSaleType(action, notes);
                console.log(`Identified Sale Type: ${saleType}`);

                if (isSameDay(outcomeTime, now)) {
                    if (saleType === 'Billable HRA') {
                        salesCounts.day.billableHRA++;
                    } else if (saleType === 'Select RX') {
                        salesCounts.day.selectRX++;
                    } else if (saleType === 'Select Patient Management') {
                        salesCounts.day.selectPatientManagement++;
                    } else if (saleType === 'Transfer') {
                        salesCounts.day.transfer++;
                    }
                }

                if (isSameWeek(outcomeTime, now)) {
                    if (saleType === 'Billable HRA') {
                        salesCounts.week.billableHRA++;
                    } else if (saleType === 'Select RX') {
                        salesCounts.week.selectRX++;
                    } else if (saleType === 'Select Patient Management') {
                        salesCounts.week.selectPatientManagement++;
                    } else if (saleType === 'Transfer') {
                        salesCounts.week.transfer++;
                    }
                }

                if (isSameMonth(outcomeTime, now)) {
                    if (saleType === 'Billable HRA') {
                        salesCounts.month.billableHRA++;
                    } else if (saleType === 'Select RX') {
                        salesCounts.month.selectRX++;
                    } else if (saleType === 'Select Patient Management') {
                        salesCounts.month.selectPatientManagement++;
                    } else if (saleType === 'Transfer') {
                        salesCounts.month.transfer++;
                    }
                }

                console.log('Updated salesCounts:', salesCounts);
            }

            console.log('Final Sales Counts:', salesCounts);

            const updates = {};
            updates[`day`] = salesCounts.day;
            updates[`week`] = salesCounts.week;
            updates[`month`] = salesCounts.month;

            salesCountsRef.update(updates, (error) => {
                if (error) {
                    console.error('Failed to update sales counts:', error);
                } else {
                    console.log('Sales counts updated successfully:', salesCounts);
                }
            });

            const outcomesContainer = document.getElementById('sales-outcomes-container');
            outcomesContainer.innerHTML = '';

            const salesCountsContainer = document.createElement('div');
            salesCountsContainer.classList.add('sales-counts-container');
            for (const period in salesCounts) {
                for (const action in salesCounts[period]) {
                    const countElement = document.createElement('div');
                    countElement.classList.add('sales-count-item');
                    countElement.innerHTML = `<strong>${action} (${period}):</strong> ${salesCounts[period][action]}`;
                    salesCountsContainer.appendChild(countElement);
                }
            }
            outcomesContainer.appendChild(salesCountsContainer);

            const groupedOutcomes = {};

            for (const key in outcomes) {
                const outcome = outcomes[key];
                const accountNumber = outcome.accountNumber;

                if (outcome.assignAction.trim() === "--") {
                    continue;
                }
                if (!groupedOutcomes[accountNumber]) {
                    groupedOutcomes[accountNumber] = { customerInfo: outcome.customerInfo || {}, actions: {} };
                }
                groupedOutcomes[accountNumber].actions[outcome.assignAction] = outcome;
            }

            const sortedAccounts = Object.keys(groupedOutcomes).sort((a, b) => {
                const latestA = Object.values(groupedOutcomes[a].actions).reduce((latest, current) => new Date(current.outcomeTime) > new Date(latest.outcomeTime) ? current : latest);
                const latestB = Object.values(groupedOutcomes[b].actions).reduce((latest, current) => new Date(current.outcomeTime) > new Date(latest.outcomeTime) ? current : latest);
                return new Date(latestB.outcomeTime) - new Date(latestA.outcomeTime);
            });

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
                    if (outcome.assignAction.trim() === "--") continue;
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
