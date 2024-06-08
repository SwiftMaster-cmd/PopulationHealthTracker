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

function loadLeaderboard() {
    const database = firebase.database();
    const salesCountsRef = database.ref('salesCounts');
    
    const dayKey = getCurrentDayKey();
    const weekKey = getCurrentWeekKey();
    const monthKey = getCurrentMonthKey();
    
    const leaderboardContainer = document.getElementById('leaderboard-container');
    if (!leaderboardContainer) {
        console.error('Leaderboard container element not found');
        return;
    }

    leaderboardContainer.innerHTML = ''; // Clear previous leaderboard
    
    const periods = ['day', 'week', 'month'];
    const saleTypes = ['billableHRA', 'selectRX', 'selectPatientManagement', 'transfer'];
    
    periods.forEach(period => {
        saleTypes.forEach(saleType => {
            salesCountsRef.orderByChild(`${period}/${saleType}`).limitToLast(5).once('value', snapshot => {
                const users = [];
                snapshot.forEach(childSnapshot => {
                    const userId = childSnapshot.key;
                    const userData = childSnapshot.val();
                    const count = userData[period] && userData[period][saleType] ? userData[period][saleType] : 0;
                    users.push({ userId, count });
                });
                
                users.sort((a, b) => b.count - a.count); // Sort users by count in descending order
                
                const periodSaleTypeContainer = document.createElement('div');
                periodSaleTypeContainer.classList.add('leaderboard-section');
                periodSaleTypeContainer.innerHTML = `<h3>Top 5 ${saleType} (${period})</h3>`;
                
                users.forEach((user, index) => {
                    const userElement = document.createElement('div');
                    userElement.classList.add('leaderboard-item');
                    userElement.innerHTML = `<strong>${index + 1}. User ID: ${user.userId} - ${saleType}: ${user.count}</strong>`;
                    periodSaleTypeContainer.appendChild(userElement);
                });
                
                leaderboardContainer.appendChild(periodSaleTypeContainer);
            }).catch(error => {
                console.error('Error fetching sales data:', error);
            });
        });
    });
}

// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    if (firebase.apps.length) {
        loadLeaderboard();
    } else {
        document.addEventListener('firebaseInitialized', loadLeaderboard);
    }
});