document.addEventListener('DOMContentLoaded', () => {
    const periodPicker = document.getElementById('periodPicker');
    const saleTypePicker = document.getElementById('saleTypePicker');
    const leaderboardTitle = document.getElementById('leaderboard-title');

    periodPicker.addEventListener('change', () => {
        updateLeaderboard();
    });

    saleTypePicker.addEventListener('change', () => {
        updateLeaderboard();
    });

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            checkAndSetUserName(user.uid);
            loadLeaderboard();
        }
    });

    function updateLeaderboard() {
        loadLeaderboard(periodPicker.value, saleTypePicker.value);
        leaderboardTitle.textContent = `Leaderboard: ${getReadableTitle(saleTypePicker.value)}`;
    }
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
        if (!salesData) return;

        const users = [];
        usersRef.once('value', usersSnapshot => {
            const usersData = usersSnapshot.val();
            const currentUserId = firebase.auth().currentUser.uid;

            for (const userId in salesData) {
                const userData = salesData[userId];
                const count = userData[period] && userData[period][saleType] ? userData[period][saleType] : 0;
                const name = usersData && usersData[userId] && usersData[userId].name ? usersData[userId].name : 'Unknown User';
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
                userElement.innerHTML = `<strong>${i + 1}. ${user.name.substring(0, 10)}: ${user.count}</strong>`; // Limiting name to 10 characters
                leaderboardSection.appendChild(userElement);
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