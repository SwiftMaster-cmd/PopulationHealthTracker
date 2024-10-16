// leaderboard.js

document.addEventListener('firebaseInitialized', function() {
    const auth = firebase.auth();
    const database = firebase.database();

    auth.onAuthStateChanged(user => {
        if (user) {
            initializeLeaderboard();
        }
    });

    function initializeLeaderboard() {
        const salesRef = database.ref('salesOutcomes');
        const usersRef = database.ref('users');

        Promise.all([
            salesRef.once('value'),
            usersRef.once('value')
        ]).then(([salesSnapshot, usersSnapshot]) => {
            const salesData = salesSnapshot.val() || {};
            const usersData = usersSnapshot.val() || {};

            // Process sales data to compute totals per user per sale type
            const totals = computeTotals(salesData);

            // Populate sale types
            const actionTypes = ['Select Patient Management', 'Transfer', 'HRA', 'Select RX'];
            populateSaleTypeFilter(actionTypes);

            // Render the leaderboard for the default sale type
            const saleTypeSelect = document.getElementById('saleTypeFilter');
            const selectedSaleType = saleTypeSelect.value || actionTypes[0];

            renderLeaderboard(totals, usersData, selectedSaleType);

            // Add event listener to update leaderboard when sale type is changed
            saleTypeSelect.addEventListener('change', () => {
                const selectedSaleType = saleTypeSelect.value;
                renderLeaderboard(totals, usersData, selectedSaleType);
            });
        });
    }

    function computeTotals(salesData) {
        // salesData is an object with user IDs as keys
        const totals = {}; // { userId: { saleType: count } }

        for (const userId in salesData) {
            const userSales = salesData[userId];
            for (const saleId in userSales) {
                const sale = userSales[saleId];
                const saleType = getSaleType(sale.assignAction || '', sale.notesValue || '');

                if (saleType) {
                    if (!totals[userId]) {
                        totals[userId] = {};
                    }
                    if (!totals[userId][saleType]) {
                        totals[userId][saleType] = 0;
                    }
                    totals[userId][saleType]++;
                }
            }
        }
        return totals;
    }

    function populateSaleTypeFilter(actionTypes) {
        const saleTypeSelect = document.getElementById('saleTypeFilter');
        saleTypeSelect.innerHTML = ''; // Clear existing options

        actionTypes.forEach(actionType => {
            const option = document.createElement('option');
            option.value = actionType;
            option.textContent = actionType;
            saleTypeSelect.appendChild(option);
        });
    }

    function renderLeaderboard(totals, usersData, selectedSaleType) {
        const leaderboardContainer = document.getElementById('leaderboardContainer');
        leaderboardContainer.innerHTML = ''; // Clear existing content

        // Prepare data for leaderboard
        const leaderboardData = [];

        for (const userId in totals) {
            const userTotals = totals[userId];
            const count = userTotals[selectedSaleType] || 0;

            if (count > 0) {
                const userInfo = usersData[userId] || {};
                const displayName = userInfo.displayName || userInfo.email || userId;
                leaderboardData.push({ userId, displayName, count });
            }
        }

        // Sort leaderboardData by count descending
        leaderboardData.sort((a, b) => b.count - a.count);

        // Render leaderboard
        const table = document.createElement('table');
        table.classList.add('leaderboard-table');

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Rank</th>
                <th>User</th>
                <th>${selectedSaleType} Sales</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        leaderboardData.forEach((entry, index) => {
            const row = tbody.insertRow();

            const rankCell = row.insertCell();
            rankCell.textContent = index + 1;

            const userCell = row.insertCell();
            userCell.textContent = entry.displayName;

            const countCell = row.insertCell();
            countCell.textContent = entry.count;
        });

        table.appendChild(tbody);
        leaderboardContainer.appendChild(table);
    }

    function getSaleType(action, notes) {
        const normalizedAction = action.toLowerCase();
        const normalizedNotes = notes.toLowerCase();

        if (/hra/i.test(normalizedAction) || /hra/i.test(normalizedNotes)) {
            return 'HRA';
        } else if (
            /(vbc|transfer|ndr|dental|fe|final expense|national|national debt|national debt relief|value based care|oak street|osh)/i.test(normalizedNotes)
        ) {
            return 'Transfer';
        } else if (/spm|select patient management/i.test(normalizedAction) || /spm|select patient management/i.test(normalizedNotes)) {
            return 'Select Patient Management';
        } else if (
            normalizedAction.includes('srx: enrolled - rx history received') ||
            normalizedAction.includes('srx: enrolled - rx history not available') ||
            /select rx/i.test(normalizedAction) ||
            /select rx/i.test(normalizedNotes)
        ) {
            return 'Select RX';
        } else {
            // Exclude other options
            return null;
        }
    }
});
