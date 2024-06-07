function displayLeaderboard() {
    const database = firebase.database();
    const outcomesRef = database.ref('salesOutcomes/');
    outcomesRef.on('value', (snapshot) => {
        const outcomes = snapshot.val();
        console.log('Sales outcomes retrieved:', outcomes);

        if (outcomes) {
            const leaderboardContainer = document.getElementById('leaderboard-container');
            leaderboardContainer.innerHTML = ''; // Clear previous leaderboard

            const srxActions = [];

            for (const userId in outcomes) {
                const userOutcomes = outcomes[userId];
                for (const key in userOutcomes) {
                    const outcome = userOutcomes[key];
                    if (outcome.assignAction === 'Select RX Enrolled History Received' || outcome.assignAction === 'Select RX Enrolled History Not Received') {
                        srxActions.push(outcome);
                    }
                }
            }

            console.log('Filtered SRX actions:', srxActions);

            // Sort SRX actions by time (newest first)
            srxActions.sort((a, b) => new Date(b.outcomeTime) - new Date(a.outcomeTime));

            // Display top 5 SRX actions
            const top5SrxActions = srxActions.slice(0, 5);
            const leaderboardTitle = document.createElement('h3');
            leaderboardTitle.textContent = 'Top 5 SRX Actions';
            leaderboardContainer.appendChild(leaderboardTitle);

            const leaderboardList = document.createElement('ol');
            top5SrxActions.forEach(action => {
                const actionItem = document.createElement('li');
                actionItem.textContent = `${action.displayName}: ${action.assignAction} at ${formatDateTime(action.outcomeTime)}`;
                leaderboardList.appendChild(actionItem);
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