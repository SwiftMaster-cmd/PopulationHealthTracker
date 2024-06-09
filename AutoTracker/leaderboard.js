document.addEventListener('DOMContentLoaded', () => {
    // Create the dropdown pickers
    const periodPicker = document.getElementById('periodPicker');
    const saleTypePicker = document.getElementById('saleTypePicker');

    // Add event listeners to the pickers
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

    const leaderboardSection = document.getElementById('leaderboard-section');
    if (!leaderboardSection) {
        console.error('Leaderboard section element not found');
        return;
    }

    leaderboardSection.innerHTML = ''; // Clear previous leaderboard

    salesCountsRef.once('value', salesSnapshot => {
        const salesData = salesSnapshot.val();
        const users = [];

        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                const currentUserId = user.uid;
                const currentUserEmail = user.email.split('@')[0]; // Get email without domain
                console.log('Current user email:', currentUserEmail);

                for (const userId in salesData) {
                    const userData = salesData[userId];
                    const count = userData[period] && userData[period][saleType] ? userData[period][saleType] : 0;
                    const email = (userId === currentUserId) ? currentUserEmail : 'Unknown User';
                    users.push({ email, count });
                }

                // Check if users array is populated correctly
                console.log(`Users for ${period} - ${saleType}:`, users);

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
            } else {
                console.error('No user is signed in.');
            }
        });
    }).catch(error => {
        console.error('Error fetching sales data:', error);
    });
}

function getReadableSaleType(saleType) {
    switch (saleType) {
        case 'selectRX':
            return 'S.R.X.';
        case 'billableHRA':
            return 'H.R.A.';
        case 'transfer':
            return 'Partner';
        case 'selectPatientManagement':
            return 'S.P.M.';
        default:
            return saleType;
    }
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
