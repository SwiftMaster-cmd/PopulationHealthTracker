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

    function extractNamesFromEmail(email) {
        if (!email) {
            console.error('Email is undefined or null');
            return {
                firstName: 'Unknown',
                lastName: 'User'
            };
        }
        const emailParts = email.split('@');
        const nameParts = emailParts[0].split('.');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts[1] || 'User';
        return {
            firstName: firstName,
            lastName: lastName
        };
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

                // Display the top 5 salespeople with their rankings
                topSales.forEach((sales, index) => {
                    userRef.child(sales.userId).once('value').then(userSnapshot => {
                        const userData = userSnapshot.val();
                        if (!userData || !userData.email) {
                            console.error('User data or email is missing for userId:', sales.userId);
                            return;
                        }
                        const { firstName, lastName } = extractNamesFromEmail(userData.email);
                        const listItem = document.createElement('li');
                        listItem.innerHTML = `<div class="user-info"><span class="ranking">${index + 1}</span> ${firstName} ${lastName} - Sales: ${sales.salesCount}</div>`;
                        leaderboardElement.appendChild(listItem);
                        if (index < topSales.length - 1) {
                            leaderboardElement.appendChild(document.createElement('hr'));
                        }
                    }).catch(error => {
                        console.error('Error fetching user data for userId:', sales.userId, error);
                    });
                });
            }).catch(error => {
                console.error('Error fetching sales data:', error);
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
