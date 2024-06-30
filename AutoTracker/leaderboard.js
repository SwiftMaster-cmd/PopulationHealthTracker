document.addEventListener('DOMContentLoaded', () => {
    const periodPicker = document.getElementById('periodPicker');
    const saleTypePicker = document.getElementById('saleTypePicker');

    periodPicker.addEventListener('change', () => {
        loadLeaderboard(periodPicker.value, saleTypePicker.value);
    });

    saleTypePicker.addEventListener('change', () => {
        loadLeaderboard(periodPicker.value, saleTypePicker.value);
    });

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            loadLeaderboard(); // Ensure leaderboard loads after authentication
        }
    });
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

    salesCountsRef.off('value');

    salesCountsRef.on('value', salesSnapshot => {
        const salesData = salesSnapshot.val();
        const users = [];

        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                usersRef.once('value', usersSnapshot => {
                    const usersData = usersSnapshot.val();

                    for (const userId in salesData) {
                        const userData = salesData[userId];
                        const count = userData[period] && userData[period][saleType] ? userData[period][saleType] : 0;
                        const userDetail = usersData && usersData[userId];
                        const name = userDetail && userDetail.firstName ? userDetail.firstName : 'Unknown User';
                        const team = userDetail && userDetail.teamName ? userDetail.teamName : 'Unknown Team';
                        users.push({ name, team, count });
                    }

                    users.sort((a, b) => b.count - a.count);

                    leaderboardSection.innerHTML = '';

                    const periodSaleTypeContainer = document.createElement('div');
                    periodSaleTypeContainer.classList.add('leaderboard-section');
                    periodSaleTypeContainer.innerHTML = `<h3>Leaderboard: ${getReadableTitle(saleType)}</h3>`;

                    users.slice(0, 5).forEach((user, index) => {
                        const userElement = document.createElement('div');
                        userElement.classList.add('leaderboard-item');
                        userElement.innerHTML = `<strong>${index + 1}. ${user.name} (${user.team}) - ${getReadableTitle(saleType)}: ${user.count}</strong>`;
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