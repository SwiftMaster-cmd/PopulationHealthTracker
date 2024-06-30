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
            checkAndSetUserName(user.uid);
            loadLeaderboard(); // Ensure leaderboard loads after authentication
        }
    });
});

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

ffunction loadLeaderboard(period = 'day', saleType = 'selectRX') {
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

                    for (const userId in salesData) {
                        const userData = salesData[userId];
                        const count = userData[period] && userData[period][saleType] ? userData[period][saleType] : 0;
                        const name = usersData && usersData[userId] && usersData[userId].name ? usersData[userId].name : 'Unknown User';
                        users.push({ userId, name, count });
                    }

                    users.sort((a, b) => b.count - a.count);

                    // Find index of current user
                    const currentUserIndex = users.findIndex(u => u.userId === user.uid);

                    // Calculate range of indices to display
                    let startIdx = Math.max(0, currentUserIndex - 2);
                    let endIdx = Math.min(users.length - 1, currentUserIndex + 2);

                    // Adjust startIdx and endIdx to ensure exactly 5 items are shown
                    if (endIdx - startIdx < 4) {
                        if (startIdx === 0) {
                            endIdx = Math.min(users.length - 1, startIdx + 4);
                        } else {
                            startIdx = Math.max(0, endIdx - 4);
                        }
                    }

                    // Ensure top entry is always at the top
                    if (currentUserIndex > 2 && users.length > 5) {
                        startIdx = currentUserIndex - 2;
                        endIdx = currentUserIndex + 2;
                    } else if (users.length <= 5) {
                        startIdx = 0;
                        endIdx = users.length - 1;
                    }

                    leaderboardSection.innerHTML = ''; // Clear previous entries

                    const periodSaleTypeContainer = document.createElement('div');
                    periodSaleTypeContainer.classList.add('leaderboard-section');
                    periodSaleTypeContainer.innerHTML = `<h3>Leaderboard: ${getReadableTitle(saleType)}</h3>`;

                    for (let i = startIdx; i <= endIdx; i++) {
                        const currentUserClass = users[i].userId === user.uid ? 'current-user' : '';
                        const userElement = document.createElement('div');
                        userElement.classList.add('leaderboard-item', currentUserClass);
                        userElement.innerHTML = `<strong>${i + 1}. ${users[i].name} - ${getReadableTitle(saleType)}: ${users[i].count}</strong>`;
                        periodSaleTypeContainer.appendChild(userElement);
                    }

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