
function displayLeaderboard(user) {
    const database = firebase.database();
    const outcomesRef = database.ref('salesOutcomes/');
    outcomesRef.on('value', (snapshot) => {
        const outcomes = snapshot.val();
        console.log('Sales outcomes retrieved:', outcomes);
        if (outcomes) {
            const leaderboardContainer = document.getElementById('leaderboard-container');
            leaderboardContainer.innerHTML = ''; // Clear previous leaderboard

            // Group outcomes by user and filter out unwanted outcomes
            const userSales = {};

            for (const userId in outcomes) {
                const userOutcomes = outcomes[userId];
                for (const key in userOutcomes) {
                    const outcome = userOutcomes[key];
                    if (outcome.assignAction.trim() === "--") {
                        continue; // Skip outcomes with "--" in assign action
                    }
                    const saleType = getSaleType(outcome.assignAction, outcome.notesValue);
                    if (saleType !== 'Notes') {
                        if (!userSales[userId]) {
                            userSales[userId] = { salesCount: 0, displayName: outcome.displayName || 'Unknown', saleTypes: {} };
                        }
                        if (!userSales[userId].saleTypes[saleType]) {
                            userSales[userId].saleTypes[saleType] = [];
                        }
                        userSales[userId].saleTypes[saleType].push(outcome);
                        userSales[userId].salesCount++;
                    }
                }
            }

            // Sort users by their total sales in descending order
            const sortedUsers = Object.keys(userSales).sort((a, b) => userSales[b].salesCount - userSales[a].salesCount);

            // Display leaderboard
            const leaderboardTitle = document.createElement('h3');
            leaderboardTitle.textContent = 'Sales Leaderboard';
            leaderboardContainer.appendChild(leaderboardTitle);

            const leaderboardList = document.createElement('ol');
            sortedUsers.forEach((userId, index) => {
                const userItem = document.createElement('li');
                userItem.textContent = `${userSales[userId].displayName}: ${userSales[userId].salesCount} sales`;
                leaderboardList.appendChild(userItem);

                // Highlight the current user
                if (userId === user.uid) {
                    userItem.style.fontWeight = 'bold';
                    userItem.style.color = 'blue';
                }

                // Add click event to show detailed sales info
                userItem.addEventListener('click', () => {
                    displayUserSalesDetails(userId, userSales[userId]);
                });
            });

            leaderboardContainer.appendChild(leaderboardList);
        } else {
            console.log('No sales outcomes found.');
        }
    }, (error) => {
        console.error('Error fetching sales outcomes:', error);
    });
}

function displayUserSalesDetails(userId, userSales) {
    const detailsContainer = document.getElementById('user-sales-details-container');
    detailsContainer.innerHTML = ''; // Clear previous details

    const userTitle = document.createElement('div');
    userTitle.classList.add('user-title');
    userTitle.textContent = `${userSales.displayName} (${userSales.salesCount} sales)`;
    detailsContainer.appendChild(userTitle);

    const salesTypes = Object.keys(userSales.saleTypes);
    let currentSaleTypeIndex = 0;

    const salesInfoContainer = document.createElement('div');
    salesInfoContainer.classList.add('sales-info-container');
    detailsContainer.appendChild(salesInfoContainer);

    function displayCurrentSaleType() {
        salesInfoContainer.innerHTML = ''; // Clear previous outcomes
        const saleType = salesTypes[currentSaleTypeIndex];
        const saleOutcomes = userSales.saleTypes[saleType];

        const saleTypeTitle = document.createElement('div');
        saleTypeTitle.classList.add('sale-type-title');
        saleTypeTitle.textContent = `Sale Type: ${saleType}`;
        salesInfoContainer.appendChild(saleTypeTitle);

        saleOutcomes.forEach(outcome => {
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
        });
    }

    // Create navigation buttons
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.addEventListener('click', () => {
        currentSaleTypeIndex = (currentSaleTypeIndex - 1 + salesTypes.length) % salesTypes.length;
        displayCurrentSaleType();
    });

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.addEventListener('click', () => {
        currentSaleTypeIndex = (currentSaleTypeIndex + 1) % salesTypes.length;
        displayCurrentSaleType();
    });

    const navButtonsContainer = document.createElement('div');
    navButtonsContainer.classList.add('nav-buttons-container');
    navButtonsContainer.appendChild(prevButton);
    navButtonsContainer.appendChild(nextButton);

    detailsContainer.appendChild(navButtonsContainer);

    // Display the first sale type initially
    displayCurrentSaleType();
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
window.displayLeaderboard = displayLeaderboard;
