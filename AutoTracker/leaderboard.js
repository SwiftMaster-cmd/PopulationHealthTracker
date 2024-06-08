document.addEventListener('DOMContentLoaded', function() {
    const dbRef = firebase.database().ref('salesCounts');
    const userRef = firebase.database().ref('users');
    const auth = firebase.auth();

    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in, proceed with reading the database
            updateLeaderboards();
        } else {
            // No user is signed in, redirect to login
            window.location.href = 'index.html';
        }
    });

    function getEmailName(email) {
        return email.split('@')[0];
    }

    function updateLeaderboards() {
        // Function to update the leaderboard for a specific sales type
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

                // Use a Set to track processed user IDs
                const processedUsers = new Set();

                // Display the top 5 salespeople
                topSales.forEach((sales, index) => {
                    if (!processedUsers.has(sales.userId)) {
                        userRef.child(sales.userId).once('value').then(userSnapshot => {
                            const userData = userSnapshot.val();
                            if (userData && userData.email) {
                                const emailName = getEmailName(userData.email);
                                const listItem = document.createElement('li');
                                listItem.textContent = `#${index + 1} - ${emailName} - ${sales.salesCount}`;
                                leaderboardElement.appendChild(listItem);
                                processedUsers.add(sales.userId);  // Mark user as processed
                            }
                        });
                    }
                });
            });
        }

        // Define sales types
        const salesTypes = ['billableHRA', 'selectPatientManagement', 'selectRX', 'transfer'];

        // Update leaderboard for each sales type
        salesTypes.forEach(salesType => {
            const leaderboardElement = document.getElementById(`${salesType}-leaderboard`);
            if (leaderboardElement) {
                updateLeaderboard(salesType, leaderboardElement);
            }
        });
    }
});