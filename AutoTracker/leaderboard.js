// Ensuring the DOM content is fully loaded before initializing Firebase
document.addEventListener('DOMContentLoaded', function() {
    const firebaseConfig = {
        apiKey: "AIzaSyBhSqBwrg8GYyaqpYHOZS8HtFlcXZ09OJA",
        authDomain: "track-dac15.firebaseapp.com",
        databaseURL: "https://track-dac15-default-rtdb.firebaseio.com",
        projectId: "track-dac15",
        storageBucket: "track-dac15.appspot.com",
        messagingSenderId: "495156821305",
        appId: "1:495156821305:web:7cbb86d257ddf9f0c3bce8",
        measurementId: "G-RVBYB0RR06"
    };

    // Initialize Firebase only if it hasn't been initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
});


// Global variable declaration
let salesCountsRef;


db = firebase.database();
salesCountsRef = db.ref('salesCounts');

// Fetching and displaying leaderboard
function updateLeaderboard(saleType = 'selectRX') {
    salesCountsRef.orderByChild(saleType).limitToLast(5).on('value', snapshot => {
        const leaderboardData = snapshot.val();
        const leaderboardDisplay = document.getElementById('leaderboard-display');
        leaderboardDisplay.innerHTML = ''; // Clear previous content
        if (leaderboardData) {
            Object.keys(leaderboardData).forEach(user => {
                const userSales = leaderboardData[user][saleType];
                const userElement = document.createElement('div');
                userElement.textContent = `${user}: ${userSales}`;
                leaderboardDisplay.appendChild(userElement);
            });
        } else {
            leaderboardDisplay.textContent = 'No data available';
        }
    }, error => {
        console.error('Failed to fetch leaderboard data:', error);
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
