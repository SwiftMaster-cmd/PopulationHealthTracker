document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase app is already initialized
    if (!firebase.apps.length) {
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
        firebase.initializeApp(firebaseConfig);
    } else {
        firebase.app(); // if already initialized, use that one
    }

    const dbRef = firebase.database().ref('salesCounts');
    const userRef = firebase.database().ref('users');
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User authenticated:', user);
            window.displaySalesOutcomes(user); // Call the global function
            updateLeaderboards(user.email); // Update leaderboards
        } else {
            auth.signInWithPopup(provider).then((result) => {
                const user = result.user;
                console.log('User signed in:', user);
                window.displaySalesOutcomes(user); // Call the global function
                updateLeaderboards(user.email); // Update leaderboards
            }).catch((error) => {
                console.error('Authentication error:', error);
            });
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
                        const { firstName, lastName } = extractNamesFromEmail(userEmail);
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