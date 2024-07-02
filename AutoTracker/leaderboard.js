document.addEventListener('DOMContentLoaded', () => {
    const periodPicker = document.getElementById('periodPicker');
    const saleTypePicker = document.getElementById('saleTypePicker');
    const leaderboardTitle = document.getElementById('leaderboard-title');

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

    salesCountsRef.off('value');

    salesCountsRef.on('value', salesSnapshot => {
        const salesData = salesSnapshot.val();
        const users = [];

        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                usersRef.once('value', usersSnapshot => {
                    const usersData = usersSnapshot.val();
                    const currentUserId = user.uid;

                    for (const userId in salesData) {
                        const userData = salesData[userId];
                        const count = userData[period] && userData[period][saleType] ? userData[period][saleType] : 0;
                        let name = usersData && usersData[userId] && usersData[userId].name ? usersData[userId].name : 'Unknown User';
                        if (name.length > 10) {
                            name = name.substring(0, 8); // Truncate name to 8 characters
                        }
                        users.push({ userId, name, count });
                    }

                    users.sort((a, b) => b.count - a.count);

                    const currentUserIndex = users.findIndex(u => u.userId === currentUserId);
                    const start = Math.max(0, currentUserIndex - 3);
                    const end = Math.min(users.length, start + 8);

                    leaderboardSection.innerHTML = '';

                    for (let i = start; i < end; i++) {
                        const user = users[i];
                        const userElement = document.createElement('div');
                        userElement.classList.add('leaderboard-item');
                        if (user.userId === currentUserId) {
                            userElement.style.color = 'var(--color-quinary)'; // Highlight current user
                        }
                        userElement.innerHTML = `<strong>${i + 1}. ${user.name}: ${user.count}</strong>`;
                        leaderboardSection.appendChild(userElement);
                    }
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


document.addEventListener('DOMContentLoaded', () => {
    loadLiveActivities();

    const chartPeriodPicker = document.getElementById('chartPeriodPicker');

    // Set default picker value to 'month'
    chartPeriodPicker.value = 'month';

    chartPeriodPicker.addEventListener('change', () => {
        loadChart(chartPeriodPicker.value);
    });

    loadChart('month');

    const savedColor = localStorage.getItem('baseColor');
    if (savedColor) {
        applyColorPalette(savedColor);
    } else {
        const defaultColor = getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim();
        applyColorPalette(defaultColor);
    }
});

function loadLiveActivities() {
    const database = firebase.database();
    const salesOutcomesRef = database.ref('salesOutcomes').limitToLast(5);
    const usersRef = database.ref('users');
    const salesTimeFramesRef = database.ref('salesTimeFrames');

    const liveActivitiesSection = document.getElementById('live-activities-section');
    if (!liveActivitiesSection) {
        console.error('Live activities section element not found');
        return;
    }

    salesOutcomesRef.off('value');

    salesOutcomesRef.on('value', salesSnapshot => {
        const salesData = salesSnapshot.val();
        const sales = [];

        for (const userId in salesData) {
            for (const saleId in salesData[userId]) {
                const sale = salesData[userId][saleId];
                const timestamp = sale.outcomeTime;
                const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                sales.push({ userId, timestamp, formattedTime, saleId });
            }
        }

        sales.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const latestSales = sales.slice(0, 5);

        Promise.all(latestSales.map(sale => 
            Promise.all([
                fetchUserName(usersRef, sale),
                fetchSaleType(salesTimeFramesRef, sale)
            ])
        )).then(() => {
            renderLiveActivities(latestSales, liveActivitiesSection);
        }).catch(error => {
            console.error('Error fetching user data:', error);
        });
    }, error => {
        console.error('Error fetching live activities:', error);
    });
}

function fetchUserName(usersRef, sale) {
    return usersRef.child(sale.userId).once('value').then(snapshot => {
        sale.userName = snapshot.val().name || 'Unknown User';
    });
}

function fetchSaleType(salesTimeFramesRef, sale) {
    return salesTimeFramesRef.child(`${sale.userId}/${sale.saleId}`).once('value').then(snapshot => {
        const saleData = snapshot.val();
        const saleType = Object.keys(saleData)[0]; // Assuming there's only one key per saleId
        sale.saleType = saleType;
    });
}

function renderLiveActivities(latestSales, liveActivitiesSection) {
    liveActivitiesSection.innerHTML = '<h4>Live Activities</h4>';
    latestSales.forEach(sale => {
        const saleElement = document.createElement('div');
        saleElement.classList.add('activity-item');
        saleElement.innerHTML = `<strong>${sale.userName}</strong> sold <strong>${sale.saleType}</strong> at ${sale.formattedTime}`;
        liveActivitiesSection.appendChild(saleElement);
    });
}

// Additional functions for the chart
// ... (chart code remains the same)