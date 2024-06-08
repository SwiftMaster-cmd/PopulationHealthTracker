document.addEventListener('DOMContentLoaded', function() {
    const dbRef = firebase.database().ref('salesCounts');
    const userRef = firebase.database().ref('users');
    const auth = firebase.auth();

    let currentSalesType = 'selectRX';
    let currentPeriod = 'day';

    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in, proceed with reading the database
            console.log('User signed in:', user.email);
            updateLeaderboards();
        } else {
            // No user is signed in, redirect to login
            console.log('No user signed in, redirecting to login.');
            window.location.href = 'index.html';
        }
    });

    function extractNamesFromEmail(email) {
        const emailParts = email.split('@');
        const nameParts = emailParts[0].split('.');
        const firstName = nameParts[0];
        const lastName = nameParts[1];
        return {
            firstName: firstName,
            lastName: lastName
        };
    }

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

    function getPeriodKey() {
        if (currentPeriod === 'day') {
            return getCurrentDayKey();
        } else if (currentPeriod === 'week') {
            return getCurrentWeekKey();
        } else if (currentPeriod === 'month') {
            return getCurrentMonthKey();
        }
    }

    function updateLeaderboards() {
        updateLeaderboard(currentSalesType, currentPeriod, document.getElementById('leaderboard-list'));
        document.getElementById('leaderboard-title').textContent = `${capitalizeFirstLetter(currentSalesType)} - ${capitalizeFirstLetter(currentPeriod)}`;
    }

    function updateLeaderboard(salesType, period, leaderboardElement) {
        const periodKey = getPeriodKey();
        const periodRef = `${period}/${periodKey}`;
        console.log('Fetching data from:', periodRef);
        dbRef.child(periodRef).once('value').then(snapshot => {
            const data = snapshot.val();
            let salesArray = [];

            // Collect sales data for the specified sales type and period
            if (data) {
                for (let userId in data) {
                    if (data[userId][salesType] !== undefined) {
                        salesArray.push({
                            userId: userId,
                            salesCount: data[userId][salesType]
                        });
                    }
                }

                // Sort the sales data in descending order
                salesArray.sort((a, b) => b.salesCount - a.salesCount);

                // Get the top 5 salespeople
                const topSales = salesArray.slice(0, 5);

                // Clear the leaderboard element
                leaderboardElement.innerHTML = '';

                // Display the top 5 salespeople
                topSales.forEach((sales, index) => {
                    userRef.child(sales.userId).once('value').then(userSnapshot => {
                        const userData = userSnapshot.val();
                        const { firstName, lastName } = extractNamesFromEmail(userData.email);
                        const listItem = document.createElement('li');
                        listItem.textContent = `#${index + 1} - ${firstName} ${lastName} - ${sales.salesCount}`;
                        leaderboardElement.appendChild(listItem);
                    }).catch(error => {
                        console.error('Error fetching user data:', error);
                    });
                });
            } else {
                console.log('No data found for:', periodRef);
                leaderboardElement.innerHTML = '<li>No data available</li>';
            }
        }).catch(error => {
            console.error('Error fetching sales data:', error);
        });
    }

    window.showLeaderboard = function(period) {
        currentPeriod = period;
        console.log('Period changed to:', currentPeriod);
        updateLeaderboards();
    }

    window.showSalesType = function(salesType) {
        currentSalesType = salesType;
        console.log('Sales type changed to:', currentSalesType);
        updateLeaderboards();
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Display default leaderboard on load
    updateLeaderboards();
});