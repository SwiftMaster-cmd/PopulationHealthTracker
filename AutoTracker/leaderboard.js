document.addEventListener('DOMContentLoaded', function() {
    const dbRef = firebase.database().ref('salesCounts');
    const userRef = firebase.database().ref('users');
    const auth = firebase.auth();

    let currentSalesType = 'selectRX';
    let currentPeriod = 'day';

    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in, proceed with reading the database
            updateLeaderboards(user.email);
        } else {
            // No user is signed in, redirect to login
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

    function updateLeaderboards(userEmail) {
        updateLeaderboard(currentSalesType, document.getElementById('leaderboard-list'));
        document.getElementById('leaderboard-title').textContent = `${capitalizeFirstLetter(currentSalesType)} - ${capitalizeFirstLetter(currentPeriod)}`;
    }

    function updateLeaderboard(salesType, leaderboardElement) {
        dbRef.once('value').then(snapshot => {
            const data = snapshot.val();
            let salesArray = [];

            // Collect sales data for the specified sales type
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
                });
            });
        });
    }

    window.showLeaderboard = function(period) {
        currentPeriod = period;
        updateLeaderboards(firebase.auth().currentUser.email);
    }

    window.showSalesType = function(salesType) {
        currentSalesType = salesType;
        updateLeaderboards(firebase.auth().currentUser.email);
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Display default leaderboard on load
    updateLeaderboards(firebase.auth().currentUser ? firebase.auth().currentUser.email : '');
});