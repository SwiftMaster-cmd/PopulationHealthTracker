salesCountsRef = db.ref('salesCounts');
// Fetching and displaying leaderboard
function updateLeaderboard(saleType = 'selectRX') {
    salesCountsRef.orderByChild(`${saleType}`).limitToLast(5).on('value', (snapshot) => {
        const leaderboardData = snapshot.val();
        const leaderboardDisplay = document.getElementById('leaderboard-display');
        leaderboardDisplay.innerHTML = ''; // Clear previous content
        if (leaderboardData) {
            Object.keys(leaderboardDatßa).forEach(user => {
                const userSales = leaderboardData[user][saleType];
                const userElement = document.createElement('div');
                userElement.textContent = `${user}: ${userSales}`;
                leaderboardDisplay.appendChild(userElement);
            });
        } else {
            leaderboardDisplay.textContent = 'No data available';
        }
    });
}

// Function to create buttons for switching sales types
function createButtons() {
    const types = ['selectRX', 'billableHRA', 'selectPatientManagement', 'transfer'];
    const buttonsContainer = document.getElementById('buttons-container');
    buttonsContainer.innerHTML = ''; // Clear previous buttons
    types.forEach(type => {
        const button = document.createElement('button');
        button.textContent = type;
        button.onclick = () => updateLeaderboard(type);
        buttonsContainer.appendChild(button);
    });
}

// Initialize the leaderboard with SelectRX type and create buttons
document.addEventListener('DOMContentLoaded', () => {
    createButtons();
    updateLeaderboard('selectRX');
});
