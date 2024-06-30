document.addEventListener('DOMContentLoaded', () => {
    const periodPicker = document.getElementById('periodPicker');
    const saleTypePicker = document.getElementById('saleTypePicker');
    const leaderboardTitle = document.createElement('h3');
    leaderboardTitle.textContent = 'Leaderboard: Select RX';

    const pickerHeader = document.querySelector('.picker-header');
    pickerHeader.insertBefore(leaderboardTitle, pickerHeader.firstChild);

    periodPicker.addEventListener('change', () => {
        loadLeaderboard(periodPicker.value, saleTypePicker.value);
        leaderboardTitle.textContent = `Leaderboard: ${getReadableTitle(saleTypePicker.value)}`;
    });

    saleTypePicker.addEventListener('change', () => {
        loadLeaderboard(periodPicker.value, saleTypePicker.value);
        leaderboardTitle.textContent = `Leaderboard: ${getReadableTitle(saleTypePicker.value)}`;
    });

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            checkAndSetUserName(user.uid);
            loadLeaderboard();
        }
    });
});

// Rest of the code remains unchanged

function checkAndSetUserName(userId) {
    const usersRef = firebase.database().ref('users/' + userId);

    usersRef.once('value', snapshot => {
        if (!snapshot.exists() || !snapshot.val().name) {
            const name = prompt("Please enter your name:");
            if (name) {
                usersRef.set({ name: name });
            } else {
                alert("Name is required to proceed.");
                firebase.auth().signOut();
            }
        }
    });
}

function loadLeaderboard(period = 'day', saleType = 'selectRX') {
    const database = firebase.database();
    const salesCountsRef = database.ref('salesCounts');
    const usersRef = database.ref('users');

    const leaderboardSection = document.getElementById('leaderboard-section');
    if (!leaderboardSection) {
        console.error('Leaderboard section element not found');
        return;
    }

    // Detach previous listeners
    salesCountsRef.off('value');

    salesCountsRef.on('value', salesSnapshot => {
        const salesData = salesSnapshot.val();
        const users = [];

        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                usersRef.once('value', usersSnapshot => {
                    const usersData = usersSnapshot.val();
                    console.log('Users data:', usersData);

                    for (const userId in salesData) {
                        const userData = salesData[userId];
                        const count = userData[period] && userData[period][saleType] ? userData[period][saleType] : 0;
                        const name = usersData && usersData[userId] && usersData[userId].name ? usersData[userId].name : 'Unknown User';
                        users.push({ name, count });
                    }

                    console.log('Leaderboard users:', users);

                    users.sort((a, b) => b.count - a.count);

                    leaderboardSection.innerHTML = ''; // Clear previous entries

                    const periodSaleTypeContainer = document.createElement('div');
                    periodSaleTypeContainer.classList.add('leaderboard-section');
                    periodSaleTypeContainer.innerHTML = `<h3>Leaderboard: ${getReadableTitle(saleType)}</h3>`;

                    users.slice(0, 5).forEach((user, index) => {
                        const userElement = document.createElement('div');
                        userElement.classList.add('leaderboard-item');
                        userElement.innerHTML = `<strong>${index + 1}. ${user.name} - ${getReadableTitle(saleType)}: ${user.count}</strong>`;
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