// Helper functions
function formatDate(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleDateString();
}

function formatTime(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleTimeString();
}

// Display sales outcomes for the current user
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

                    if (saleType !== 'Notes') {
                        if (!salesCounts[saleType]) {
                            salesCounts[saleType] = 0;
                        }
                        salesCounts[saleType]++;
                    }
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

// Function to display leaderboard
function displayLeaderboard() {
    const database = firebase.database();
    const leaderboardRef = database.ref('leaderboard');
    leaderboardRef.on('value', (snapshot) => {
        const leaderboardData = snapshot.val();
        if (leaderboardData) {
            const sortedUsers = Object.keys(leaderboardData).sort((a, b) => leaderboardData[b].totalSales - leaderboardData[a].totalSales);
            const leaderboardContainer = document.getElementById('leaderboard-container');
            leaderboardContainer.innerHTML = ''; // Clear previous leaderboard

            sortedUsers.forEach((userId, index) => {
                const userData = leaderboardData[userId];
                const userElement = document.createElement('div');
                userElement.classList.add('leaderboard-item');
                userElement.innerHTML = `
                    <div class="rank">${index + 1}</div>
                    <div class="username">${userData.username || 'Unknown User'}</div>
                    <div class="sales-count">${userData.totalSales || 0}</div>
                `;
                leaderboardContainer.appendChild(userElement);
            });
        } else {
            console.log('No leaderboard data found.');
        }
    }, (error) => {
        console.error('Error fetching leaderboard data:', error);
    });
}

// Function to update leaderboard
function updateLeaderboard(user, salesCounts) {
    const database = firebase.database();
    const userRef = database.ref('leaderboard/' + user.uid);
    userRef.once('value').then((snapshot) => {
        const userData = snapshot.val();
        const totalSales = Object.values(salesCounts).reduce((sum, count) => sum + count, 0);
        const newUserData = {
            username: user.displayName,
            totalSales: (userData ? userData.totalSales : 0) + totalSales
        };
        userRef.set(newUserData).then(() => {
            console.log('Leaderboard updated for user:', user.displayName);
        }).catch((error) => {
            console.error('Error updating leaderboard:', error);
        });
    }).catch((error) => {
        console.error('Error fetching user data for leaderboard:', error);
    });
}

// Attach the functions to the window object
window.displaySalesOutcomes = displaySalesOutcomes;
window.displayLeaderboard = displayLeaderboard;
window.updateLeaderboard = updateLeaderboard;