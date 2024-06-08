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
    // Normalize action to lowercase for reliable comparison
    const normalizedAction = action.toLowerCase();

    if (normalizedAction.includes('srx: enrolled - rx history received') || normalizedAction.includes('srx: enrolled - rx history not available')) {
        return 'Select RX';
    } else if (normalizedAction.includes('hra') && /bill|billable/i.test(notes)) {
        return 'Billable HRA';
    } else if (normalizedAction.includes('notes') && /(vbc|transfer|ndr|fe|final expense|national|national debt|national debt relief|value based care|oak street|osh)/i.test(notes)) {
        return 'Transfer';
    } else if (normalizedAction.includes('select patient management')) {
        return 'Select Patient Management';
    }
    return action; // Return the original action if no type matches
}

function getCurrentDayKey() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

function getCurrentWeekKey() {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
    return `${startOfWeek.getFullYear()}-W${startOfWeek.getWeekNumber()}`;
}

Date.prototype.getWeekNumber = function() {
    const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // Format as YYYY-MM
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function isSameWeek(date1, date2) {
    const week1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate() - date1.getDay() + (date1.getDay() === 0 ? -6 : 1));
    const week2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate() - date2.getDay() + (date2.getDay() === 0 ? -6 : 1));
    return week1.getTime() === week2.getTime();
}

function isSameMonth(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth();
}

function displaySalesOutcomes(user) {
    const database = firebase.database();
    const outcomesRef = database.ref('salesOutcomes/' + user.uid);
    const salesCountsRef = database.ref('salesCounts/' + user.uid);

    const dayKey = getCurrentDayKey();
    const weekKey = getCurrentWeekKey();
    const monthKey = getCurrentMonthKey();

    const now = new Date();

    outcomesRef.on('value', (snapshot) => {
        const outcomes = snapshot.val();
        console.log('Sales outcomes retrieved:', outcomes);

        if (outcomes) {
            // Initialize sales counts
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

            // Process each outcome
            for (const key in outcomes) {
                const outcome = outcomes[key];
                const action = outcome.assignAction;
                const notes = outcome.notesValue;
                const outcomeTime = new Date(outcome.outcomeTime);

                console.log(`Processing outcome - Key: ${key}, Action: "${action}", Notes: "${notes}"`);

                // Get the sale type
                const saleType = getSaleType(action, notes);
                console.log(`Identified Sale Type: ${saleType}`);

                // Update sales counts based on sale type and time frame
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

                console.log('Updated salesCounts:', salesCounts); // Log after each update
            }

            // Log final sales counts
            console.log('Final Sales Counts:', salesCounts);

            // Update the sales counts in Firebase
            const updates = {};
            updates[`${dayKey}/day`] = salesCounts.day;
            updates[`${weekKey}/week`] = salesCounts.week;
            updates[`${monthKey}/month`] = salesCounts.month;

            salesCountsRef.update(updates, (error) => {
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
            for (const period in salesCounts) {
                for (const action in salesCounts[period]) {
                    const countElement = document.createElement('div');
                    countElement.classList.add('sales-count-item');
                    countElement.innerHTML = `<strong>${action} (${period}):</strong> ${salesCounts[period][action]}`;
                    salesCountsContainer.appendChild(countElement);
                }
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
