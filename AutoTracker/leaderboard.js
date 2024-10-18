// leaderboard.js

document.addEventListener('firebaseInitialized', function() {
    const auth = firebase.auth();
    const database = firebase.database();

    let usersData = {};
    let salesData = {};

    let selectedSaleType;
    let selectedTimeFrame;

    auth.onAuthStateChanged(user => {
        if (user) {
            checkUserName(user);
        }
    });

    function checkUserName(user) {
        const userRef = database.ref('Users/' + user.uid);

        userRef.once('value').then(snapshot => {
            const userData = snapshot.val();
            if (userData && userData.name) {
                // Name exists; proceed to initialize the leaderboard
                initializeLeaderboard();
            } else {
                // Name does not exist; prompt user to enter it
                promptForUserName(user, initializeLeaderboard);
            }
        }).catch(error => {
            console.error('Error fetching user data:', error);
        });
    }

    function promptForUserName(user, callback) {
        let userName = prompt('Please enter your name:');
        if (userName === null || userName.trim() === '') {
            userName = 'No name';
        }

        // Save the name in the database
        const userRef = database.ref('Users/' + user.uid);
        userRef.update({ name: userName }).then(() => {
            console.log('User name saved successfully.');
            callback(); // Proceed to initialize the leaderboard after saving the name
        }).catch(error => {
            console.error('Error saving user name:', error);
        });
    }

    function initializeLeaderboard() {
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

        // Get references to filters
        const saleTypeSelect = document.getElementById('saleTypeFilter');
        const timeFrameSelect = document.getElementById('timeFrameFilter');

        // Load saved selections from localStorage
        const savedSaleType = localStorage.getItem('selectedSaleType');
        const savedTimeFrame = localStorage.getItem('selectedTimeFrame');

        if (savedSaleType && actionTypes.includes(savedSaleType)) {
            saleTypeSelect.value = savedSaleType;
        }

        if (savedTimeFrame && timeFrames.some(frame => frame.value === savedTimeFrame)) {
            timeFrameSelect.value = savedTimeFrame;
        }

        // Set selected values
        selectedSaleType = saleTypeSelect.value || actionTypes[0];
        selectedTimeFrame = timeFrameSelect.value || 'allTime';

        // Event listeners for filters
        saleTypeSelect.addEventListener('change', () => {
            selectedSaleType = saleTypeSelect.value;
            localStorage.setItem('selectedSaleType', selectedSaleType);
            updateLeaderboard();
        });

        timeFrameSelect.addEventListener('change', () => {
            selectedTimeFrame = timeFrameSelect.value;
            localStorage.setItem('selectedTimeFrame', selectedTimeFrame);
            updateLeaderboard();
        });

        // Set up listeners for Users and salesOutcomes to load data in real-time
        const usersRef = database.ref('Users');
        usersRef.on('value', usersSnapshot => {
            usersData = usersSnapshot.val() || {};
            updateUI(); // Update both leaderboard and live activities
        });

        const salesOutcomesRef = database.ref('salesOutcomes');
        salesOutcomesRef.on('value', salesSnapshot => {
            salesData = salesSnapshot.val() || {};
            updateUI(); // Update both leaderboard and live activities
        });
    }

    // Function to update both leaderboard and live activities
    function updateUI() {
        updateLeaderboard();
        updateLiveActivities();
    }

    function updateLeaderboard() {
        computeTotals(usersData, salesData, selectedTimeFrame, selectedSaleType, totals => {
            renderLeaderboard(totals, selectedSaleType);
        });
    }

    function computeTotals(usersData, salesData, selectedTimeFrame, selectedSaleType, callback) {
        const totals = []; // Array of { userId, name, count }

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

        for (const userId in usersData) {
            const userData = usersData[userId];
            const userName = userData.name || 'No name';

            const userSalesData = salesData[userId] || {};
            let count = 0;

            for (const saleId in userSalesData) {
                const sale = userSalesData[saleId];
                const saleType = getSaleType(sale.assignAction || '', sale.notesValue || '');
                const saleTime = new Date(sale.outcomeTime).getTime();

                // Check if sale falls within the selected time frame and sale type
                if (saleTime >= startTime && saleTime <= endTime && saleType === selectedSaleType) {
                    count++;
                }
            }

            if (count > 0) {
                totals.push({ userId, name: userName, count });
            }
        }

        callback(totals);
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

    function renderLeaderboard(totals, selectedSaleType) {
        const leaderboardContainer = document.getElementById('leaderboardContainer');
        leaderboardContainer.innerHTML = ''; // Clear existing content

        // Sort totals by count descending and limit to top 10
        totals.sort((a, b) => b.count - a.count);
        const top10Data = totals.slice(0, 10);

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
            userCell.textContent = entry.name;

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

    // New function to update live activities
    function updateLiveActivities() {
        const salesList = []; // Array to hold all sales

        for (const userId in salesData) {
            const userSalesData = salesData[userId];
            const userName = (usersData[userId] && usersData[userId].name) || 'No name';

            for (const saleId in userSalesData) {
                const sale = userSalesData[saleId];
                const saleType = getSaleType(sale.assignAction || '', sale.notesValue || '');
                const saleTime = new Date(sale.outcomeTime).getTime();

                if (saleType) { // Include only valid sale types
                    salesList.push({
                        userId,
                        userName,
                        saleType,
                        saleTime,
                        sale // Include other sale data if needed
                    });
                }
            }
        }

        // Sort salesList by saleTime descending (newest first)
        salesList.sort((a, b) => b.saleTime - a.saleTime);

        // Take the first 5 sales
        const recentSales = salesList.slice(0, 5);

        // Render recentSales in the liveActivitiesContainer
        renderLiveActivities(recentSales);
    }

    function renderLiveActivities(sales) {
        const liveActivitiesContainer = document.getElementById('liveActivitiesContainer');
        liveActivitiesContainer.innerHTML = ''; // Clear existing content

        sales.forEach(sale => {
            const saleDiv = document.createElement('div');
            saleDiv.classList.add('live-activity');

            // Format saleTime to a readable format
            const saleDate = new Date(sale.saleTime);
            const options = {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: 'numeric', minute: 'numeric'
            };
            const formattedTime = saleDate.toLocaleDateString(undefined, options);

            saleDiv.innerHTML = `
                <p><strong>${sale.userName}</strong> made a <strong>${sale.saleType}</strong> sale on ${formattedTime}</p>
            `;

            liveActivitiesContainer.appendChild(saleDiv);
        });
    }

});
