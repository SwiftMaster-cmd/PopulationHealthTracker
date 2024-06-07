document.addEventListener('DOMContentLoaded', function() {
    const dbRef = firebase.database().ref('salesCounts');

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
                const listItem = document.createElement('li');
                listItem.textContent = `User: ${sales.userId}, Sales: ${sales.salesCount}`;
                leaderboardElement.appendChild(listItem);
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
});
