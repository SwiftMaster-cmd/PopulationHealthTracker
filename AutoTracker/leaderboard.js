document.addEventListener('DOMContentLoaded', () => {
    // Create the dropdown pickers for leaderboard
    const periodPicker = document.getElementById('periodPicker');
    const saleTypePicker = document.getElementById('saleTypePicker');

    // Add event listeners to the pickers for leaderboard
    periodPicker.addEventListener('change', () => {
        loadLeaderboard(periodPicker.value, saleTypePicker.value);
    });

    saleTypePicker.addEventListener('change', () => {
        loadLeaderboard(periodPicker.value, saleTypePicker.value);
    });

    // Load the default leaderboard
    loadLeaderboard();
});

function loadLeaderboard(period = 'day', saleType = 'selectRX') {
    const database = firebase.database();
    const salesCountsRef = database.ref('salesCounts');
    const usersRef = database.ref('users');

    const leaderboardSection = document.getElementById('leaderboard-section');
    if (!leaderboardSection) {
        console.error('Leaderboard section element not found');
        return;
    }

    // Clear previous leaderboard
    leaderboardSection.innerHTML = '';

    // Listen for real-time updates
    salesCountsRef.on('value', salesSnapshot => {
        const salesData = salesSnapshot.val();
        const users = [];

        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                const currentUserId = user.uid;

                usersRef.once('value', usersSnapshot => {
                    const usersData = usersSnapshot.val();
                    console.log('Users data:', usersData);

                    for (const userId in salesData) {
                        const userData = salesData[userId];
                        const count = userData[period] && userData[period][saleType] ? userData[period][saleType] : 0;
                        const email = usersData[userId] && usersData[userId].email ? usersData[userId].email.split('@')[0] : 'Unknown User';
                        users.push({ email, count });
                    }

                    users.sort((a, b) => b.count - a.count); // Sort users by count in descending order

                    const periodSaleTypeContainer = document.createElement('div');
                    periodSaleTypeContainer.classList.add('leaderboard-section');
                    periodSaleTypeContainer.innerHTML = `<h3>Leaderboard: ${getReadableTitle(saleType)}</h3>`;

                    users.slice(0, 5).forEach((user, index) => {
                        const userElement = document.createElement('div');
                        userElement.classList.add('leaderboard-item');
                        userElement.innerHTML = `<strong>${index + 1}. ${user.email} - ${getReadableTitle(saleType)}: ${user.count}</strong>`;
                        periodSaleTypeContainer.appendChild(userElement);
                    });

                    leaderboardSection.appendChild(periodSaleTypeContainer);
                });
            } else {
                console.error('No user is signed in.');
            }
        });
    }, error => {
        console.error('Error fetching sales data:', error);
    });
}

function getReadableTitle(saleType) {
    switch (saleType) {
        case 'selectRX':
            return 'Select RX';
        case 'billableHRA':
            return 'Billable HRA';
        case 'transfer':
            return 'Transfer';
        case 'selectPatientManagement':
            return 'Select Patient Management';
        default:
            return saleType;
    }
}