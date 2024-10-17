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
        const leaderboardRef = database.ref('leaderboardData');

        leaderboardRef.on('value', snapshot => {
            const leaderboardData = snapshot.val() || {};

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

                renderLeaderboard(leaderboardData, selectedSaleType, selectedTimeFrame);
            };

            saleTypeSelect.addEventListener('change', updateLeaderboard);
            timeFrameSelect.addEventListener('change', updateLeaderboard);

            // Initial render
            updateLeaderboard();
        });
    }

    function renderLeaderboard(leaderboardData, selectedSaleType, selectedTimeFrame) {
        const leaderboardContainer = document.getElementById('leaderboardContainer');
        leaderboardContainer.innerHTML = ''; // Clear existing content

        // Prepare data for leaderboard
        const leaderboardArray = [];

        for (const userId in leaderboardData) {
            const userData = leaderboardData[userId];
            const salesCounts = userData.salesCounts || {};

            let count = 0;

            // Get the count for the selected time frame and sale type
            if (salesCounts[selectedTimeFrame] && salesCounts[selectedTimeFrame][selectedSaleType]) {
                count = salesCounts[selectedTimeFrame][selectedSaleType];
            }

            if (count > 0) {
                const displayName = userData.names || userId;

                leaderboardArray.push({ userId, displayName, count });
            }
        }

        // Sort and display top 10
        leaderboardArray.sort((a, b) => b.count - a.count);
        const top10Data = leaderboardArray.slice(0, 10);

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
});
