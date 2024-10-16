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

            // Populate sale types
            const actionTypes = ['Select Patient Management', 'Transfer', 'HRA', 'Select RX'];
            populateSaleTypeFilter(actionTypes);

            // Populate time frame options
            const timeFrames = [
                { value: 'today', label: 'Today' },
                { value: 'currentWeek', label: 'This Week' },
                { value: 'currentMonth', label: 'This Month' },
                { value: 'quarter', label: 'This Quarter' },
                { value: 'yearToDate', label: 'Year to Date' },
                { value: 'allTime', label: 'All Time' },
            ];
            populateTimeFrameFilter(timeFrames);

            // Add event listeners to update leaderboard when filters are changed
            const saleTypeSelect = document.getElementById('saleTypeFilter');
            const timeFrameSelect = document.getElementById('timeFrameFilter');

            const updateLeaderboard = () => {
                const selectedSaleType = saleTypeSelect.value || actionTypes[0];
                const selectedTimeFrame = timeFrameSelect.value || 'allTime';

                // Compute totals based on selected time frame
                const totals = computeTotals(salesData, selectedTimeFrame);
                renderLeaderboard(totals, usersData, selectedSaleType);
            };

            saleTypeSelect.addEventListener('change', updateLeaderboard);
            timeFrameSelect.addEventListener('change', updateLeaderboard);

            // Initial render
            updateLeaderboard();
        });
    }

    function computeTotals(salesData, selectedTimeFrame) {
        // salesData is an object with user IDs as keys
        const totals = {}; // { userId: { saleType: count } }

        const now = new Date();
        let startDate = new Date();

        // Determine start date based on selected time frame
        switch (selectedTimeFrame) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'currentWeek':
                const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
                startDate = new Date(now);
                startDate.setDate(now.getDate() - dayOfWeek);
                break;
            case 'currentMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
                startDate = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
                break;
            case 'yearToDate':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'allTime':
            default:
                startDate = new Date(0); // All time
        }

        const startTime = startDate.getTime();
        const endTime = now.getTime();

        for (const userId in salesData) {
            const userSales = salesData[userId];
            for (const saleId in userSales) {
                const sale = userSales[saleId];
                const saleType = getSaleType(sale.assignAction || '', sale.notesValue || '');
                const saleTime = new Date(sale.outcomeTime).getTime();

                // Check if sale falls within the selected time frame
                if (saleTime >= startTime && saleTime <= endTime && saleType) {
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

    function populateTimeFrameFilter(timeFrames) {
        const timeFrameSelect = document.getElementById('timeFrameFilter');
        timeFrameSelect.innerHTML = ''; // Clear existing options

        timeFrames.forEach(frame => {
            const option = document.createElement('option');
            option.value = frame.value;
            option.textContent = frame.label;
            timeFrameSelect.appendChild(option);
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

                // Use 'names' from the user data
                const displayName = userInfo.names || userId;

                leaderboardData.push({ userId, displayName, count });
            }
        }

        // Sort leaderboardData by count descending and limit to top 10
        leaderboardData.sort((a, b) => b.count - a.count);
        const top10Data = leaderboardData.slice(0, 10);

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

        top10Data.forEach((entry, index) => {
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
