function displayLeaderboard() {
    console.log("Starting displayLeaderboard function");
    const database = firebase.database();
    const outcomesRef = database.ref('salesOutcomes/');
    outcomesRef.on('value', (snapshot) => {
        const outcomes = snapshot.val();
        console.log('Sales outcomes retrieved:', outcomes);

        if (outcomes) {
            const leaderboardContainer = document.getElementById('leaderboard-container');
            leaderboardContainer.innerHTML = ''; // Clear previous leaderboard

            const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
            const userSRXCounts = {};

            console.log("Processing outcomes for today:", today);

            // Iterate through all outcomes
            for (const userId in outcomes) {
                console.log(`Processing outcomes for user: ${userId}`);
                const userOutcomes = outcomes[userId];
                for (const key in userOutcomes) {
                    const outcome = userOutcomes[key];
                    const outcomeDate = outcome.outcomeTime.split('T')[0]; // Extract date from outcomeTime

                    if (outcomeDate === today && (outcome.assignAction === 'Select RX Enrolled History Received' || outcome.assignAction === 'Select RX Enrolled History Not Received')) {
                        console.log(`Found SRX action for user: ${userId}, outcome:`, outcome);
                        if (!userSRXCounts[userId]) {
                            userSRXCounts[userId] = {
                                displayName: outcome.displayName,
                                count: 0
                            };
                        }
                        userSRXCounts[userId].count++;
                    }
                }
            }

            console.log('User SRX counts:', userSRXCounts);

            // Convert object to array and sort by count descending
            const sortedUsers = Object.values(userSRXCounts).sort((a, b) => b.count - a.count);
            console.log('Sorted users by SRX count:', sortedUsers);

            // Display top 5 users
            const top5Users = sortedUsers.slice(0, 5);
            const leaderboardTitle = document.createElement('h3');
            leaderboardTitle.textContent = 'Top 5 SRX Actions for Today';
            leaderboardContainer.appendChild(leaderboardTitle);

            const leaderboardList = document.createElement('ol');
            top5Users.forEach((user, index) => {
                const userItem = document.createElement('li');
                userItem.textContent = `${index + 1}. ${user.displayName}: ${user.count} SRX actions`;
                leaderboardList.appendChild(userItem);
            });

            leaderboardContainer.appendChild(leaderboardList);
        } else {
            console.log('No sales outcomes found.');
        }
    }, (error) => {
        console.error('Error fetching sales outcomes:', error);
    });
}

// Helper function to format date and time
function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}