document.addEventListener('DOMContentLoaded', function() {
    const dbRef = firebase.database().ref('salesCounts');
    const userRef = firebase.database().ref('users');
    const auth = firebase.auth();

    auth.onAuthStateChanged(user => {
        if (user) {
            updateLeaderboards(user.email);
        } else {
            window.location.href = 'index.html';
        }
    });

    function extractNamesFromEmail(email) {
        const emailParts = email.split('@');
        const nameParts = emailParts[0].split('.');
        const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
        const lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
        return {
            firstName: firstName,
            lastName: lastName
        };
    }

    function updateLeaderboards(userEmail) {
        function updateLeaderboard(salesType, leaderboardElement) {
            dbRef.once('value').then(snapshot => {
                const data = snapshot.val();
                let salesArray = [];

                for (let userId in data) {
                    if (data[userId][salesType] !== undefined) {
                        salesArray.push({
                            userId: userId,
                            salesCount: data[userId][salesType]
                        });
                    }
                }

                salesArray.sort((a, b) => b.salesCount - a.salesCount);

                const topSales = salesArray.slice(0, 5);
                leaderboardElement.innerHTML = '';

                topSales.forEach((sales, index) => {
                    userRef.child(sales.userId).once('value').then(userSnapshot => {
                        const userData = userSnapshot.val();
                        const { firstName, lastName } = extractNamesFromEmail(userEmail);
                        const listItem = document.createElement('li');
                        listItem.textContent = `#${index + 1} - ${firstName} ${lastName} - ${sales.salesCount}`;
                        leaderboardElement.appendChild(listItem);
                    });
                });
            });
        }

        const salesTypes = ['billableHRA', 'selectPatientManagement', 'selectRX', 'transfer'];
        salesTypes.forEach(salesType => {
            const leaderboardElement = document.getElementById(`${salesType}-leaderboard`);
            if (leaderboardElement) {
                updateLeaderboard(salesType, leaderboardElement);
            }
        });
    }
});