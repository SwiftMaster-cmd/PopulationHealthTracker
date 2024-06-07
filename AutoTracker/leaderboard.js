document.addEventListener('DOMContentLoaded', function() {
    const dbRef = firebase.database().ref('salesCounts');
    const userRef = firebase.database().ref('users');
    const auth = firebase.auth();

    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in, proceed with reading the database
            updateLeaderboards(user.email, user.uid);
        } else {
            // No user is signed in, redirect to login
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

    function updateLeaderboards(userEmail, userId) {
        // Function to update the leaderboard for a specific sales type
        function updateLeaderboard(salesType, leaderboardContainer) {
            dbRef.once('value').then(snapshot => {
                const data = snapshot.val();
                let salesArray = [];

                // Collect sales data for the specified sales type
                for (let uid in data) {
                    if (data[uid][salesType] !== undefined) {
                        salesArray.push({
                            userId: uid,
                            salesCount: data[uid][salesType]
                        });
                    }
                }

                // Sort the sales data in descending order
                salesArray.sort((a, b) => b.salesCount - a.salesCount);

                // Get the top 5 salespeople
                const topSales = salesArray.slice(0, 5);

                // Clear the leaderboard container
                leaderboardContainer.innerHTML = '';

                // Create a container for this sales type
                const salesTypeContainer = document.createElement('div');
                salesTypeContainer.className = 'sales-type-container';

                // Create a title for this sales type
                const title = document.createElement('h3');
                title.className = 'sale-type-title';
                title.textContent = salesType;
                salesTypeContainer.appendChild(title);

                // Display the top 5 salespeople
                topSales.forEach((sales, index) => {
                    userRef.child(sales.userId).once('value').then(userSnapshot => {
                        const userData = userSnapshot.val();
                        const { firstName, lastName } = extractNamesFromEmail(userData.email);
                        const listItem = document.createElement('div');
                        listItem.className = 'leaderboard-item';
                        listItem.textContent = `#${index + 1} - ${firstName} ${lastName} - ${sales.salesCount}`;
                        if (sales.userId === userId) {
                            listItem.classList.add('current-user');
                        }
                        salesTypeContainer.appendChild(listItem);
                    });
                });

                leaderboardContainer.appendChild(salesTypeContainer);
            });
        }

        // Define sales types
        const salesTypes = ['billableHRA', 'selectPatientManagement', 'selectRX', 'transfer'];

        // Update leaderboard for each sales type
        const leaderboardContainer = document.getElementById('leaderboard-container');
        salesTypes.forEach(salesType => {
            updateLeaderboard(salesType, leaderboardContainer);
        });
    }
});
