document.addEventListener('DOMContentLoaded', function() {
    const dbRef = firebase.database().ref('salesCounts');
    const userRef = firebase.database().ref('users');
    const auth = firebase.auth();

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
        if (typeof email !== 'string') {
            return { firstName: 'Unknown', lastName: 'User' };
        }
        
        const emailParts = email.split('@');
        if (emailParts.length < 2) {
            return { firstName: 'Unknown', lastName: 'User' };
        }

        const nameParts = emailParts[0].split('.');
        const firstName = nameParts[0] ? nameParts[0] : 'Unknown';
        const lastName = nameParts[1] ? nameParts[1] : 'User';
        return {
            firstName: firstName,
            lastName: lastName
        };
    }

    function updateLeaderboards(userEmail) {
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
