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
            updateLeaderboards(user.email);
        } else {
            // No user is signed in, redirect to login
            console.log('No user signed in, redirecting to login.');
            window.location.href = 'index.html';
        }
    });

    function extractNamesFromEmail(email) {
        const emailParts = email.split('@');
        const domain = emailParts[1];
        const nameParts = emailParts[0].split('.');
        const firstName = nameParts[0];
        const lastName = nameParts[1];
        return {
            firstName: firstName,
            lastName: lastName
        };
    }

    function getCurrentDateKey() {
        const now = new Date();
        return now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }

    function getCurrentWeekKey() {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
        return `${startOfWeek.getFullYear()}-W${startOfWeek.getWeekNumber()}`;
    }

    function getCurrentMonthKey() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // Format as YYYY-MM
    }

    function getPeriodKey() {
        if (currentPeriod === 'day') {
            return getCurrentDateKey();
        } else if (currentPeriod === 'week') {
            return getCurrentWeekKey();
        } else if (currentPeriod === 'month') {
            return getCurrentMonthKey();
        }
    }

    function updateLeaderboards(userEmail) {
        updateLeaderboard(currentSalesType, currentPeriod, document.getElementById('leaderboard-list'));
        document.getElementById('leaderboard-title').textContent = `${capitalizeFirstLetter(currentSalesType)} - ${capitalizeFirstLetter(currentPeriod)}`;
    }

    function updateLeaderboard(salesType, period, leaderboardElement) {
        const periodKey = getPeriodKey();
        const periodRef = `${period}/${periodKey}/${salesType}`;
        console.log('Fetching data from:', periodRef);
        dbRef.child(periodRef).once('value').then(snapshot => {
            const data = snapshot.val();
            let salesArray = [];

            // Collect sales data for the specified sales type and period
            if (data) {
                for (let userId in data) {
                    if (data[userId] !== undefined) {
                        salesArray.push({
                            userId: userId,
                            salesCount: data[userId]
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
        updateLeaderboards(firebase.auth().currentUser.email);
    }

    window.showSalesType = function(salesType) {
        currentSalesType = salesType;
        console.log('Sales type changed to:', currentSalesType);
        updateLeaderboards(firebase.auth().currentUser.email);
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Display default leaderboard on load
    updateLeaderboards(firebase.auth().currentUser ? firebase.auth().currentUser.email : '');
});