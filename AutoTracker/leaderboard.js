// Helper functions
function getCurrentDayKey() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

function getCurrentWeekKey() {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
    return `${startOfWeek.getFullYear()}-W${startOfWeek.getWeekNumber()}`;
}

Date.prototype.getWeekNumber = function() {
    const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // Format as YYYY-MM
}

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
                periodSaleTypeContainer.innerHTML = `<h3>Top 5 ${saleType} (${period})</h3>`;

                users.slice(0, 5).forEach((user, index) => {
                    const userElement = document.createElement('div');
                    userElement.classList.add('leaderboard-item');
                    userElement.innerHTML = `<strong>${index + 1}. ${user.email} - ${saleType}: ${user.count}</strong>`;
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

// Create buttons for period and sale types
function createButtons() {
    const timeButtonsContainer = document.querySelector('.time-buttons-container');
    const saleTypeButtonsContainer = document.querySelector('.sale-type-buttons-container');

    if (!timeButtonsContainer || !saleTypeButtonsContainer) {
        console.error('Button container element not found');
        return;
    }

    // Check if buttons already exist and clear them before creating new ones
    timeButtonsContainer.innerHTML = '';
    saleTypeButtonsContainer.innerHTML = '';

    const periods = ['day', 'week', 'month'];
    const saleTypes = ['selectRX', 'billableHRA', 'transfer', 'selectPatientManagement'];

    periods.forEach(period => {
        const periodButton = document.createElement('button');
        periodButton.textContent = period.charAt(0).toUpperCase() + period.slice(1);
        periodButton.onclick = () => {
            loadLeaderboard(period, document.querySelector('.sale-type-button.active').dataset.saleType);
            document.querySelectorAll('.period-button').forEach(btn => btn.classList.remove('active'));
            periodButton.classList.add('active');
        };
        periodButton.classList.add('period-button');
        periodButton.dataset.period = period;
        if (period === 'day') periodButton.classList.add('active');
        timeButtonsContainer.appendChild(periodButton);
    });

    saleTypes.forEach(type => {
        const typeButton = document.createElement('button');
        typeButton.textContent = type.replace(/([A-Z])/g, ' $1').trim();
        typeButton.onclick = () => {
            loadLeaderboard(document.querySelector('.period-button.active').dataset.period, type);
            document.querySelectorAll('.sale-type-button').forEach(btn => btn.classList.remove('active'));
            typeButton.classList.add('active');
        };
        typeButton.classList.add('sale-type-button');
        typeButton.dataset.saleType = type;
        if (type === 'selectRX') typeButton.classList.add('active');
        saleTypeButtonsContainer.appendChild(typeButton);
    });
}

// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    createButtons();
    loadLeaderboard(); // Load default leaderboard
});
