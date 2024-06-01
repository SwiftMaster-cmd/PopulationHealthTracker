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
    
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const database = firebase.database();
    const provider = new firebase.auth.GoogleAuthProvider();

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

    function displaySalesOutcomes(user) {
        const outcomesRef = firebase.database().ref('salesOutcomes/' + user.uid);
        outcomesRef.on('value', (snapshot) => {
            const outcomes = snapshot.val();
            if (outcomes) {
                const outcomesContainer = document.getElementById('sales-outcomes-container');
                outcomesContainer.innerHTML = ''; // Clear previous outcomes

                // Group outcomes by account number and filter duplicates
                const groupedOutcomes = {};
                for (const key in outcomes) {
                    const outcome = outcomes[key];
                    const accountNumber = outcome.accountNumber;
                    if (!groupedOutcomes[accountNumber]) {
                        groupedOutcomes[accountNumber] = new Set();
                    }
                    // Create a unique key based on the outcome fields
                    const uniqueKey = `${outcome.outcomeTime}_${outcome.assignAction}_${outcome.notesValue}`;
                    groupedOutcomes[accountNumber].add(uniqueKey);
                }

                // Display grouped outcomes, sorted by newest first
                for (const accountNumber in groupedOutcomes) {
                    const accountContainer = document.createElement('div');
                    accountContainer.classList.add('account-container');

                    const accountTitle = document.createElement('div');
                    accountTitle.classList.add('account-title');
                    accountTitle.textContent = `Account Number: ${accountNumber}`;
                    accountContainer.appendChild(accountTitle);

                    const uniqueOutcomes = Array.from(groupedOutcomes[accountNumber]).map(key => {
                        const [outcomeTime, assignAction, notesValue] = key.split('_');
                        return { outcomeTime, assignAction, notesValue };
                    });

                    uniqueOutcomes.sort((a, b) => new Date(b.outcomeTime) - new Date(a.outcomeTime));

                    uniqueOutcomes.forEach(outcome => {
                        if (outcome.assignAction.trim() !== "--") {
                            const outcomeElement = document.createElement('div');
                            outcomeElement.classList.add('outcome-item');
                            outcomeElement.innerHTML = `
                                <p><strong>Outcome Time:</strong> ${formatDateTime(outcome.outcomeTime)}</p>
                                <p><strong>Assign Action:</strong> ${outcome.assignAction}</p>
                                <p><strong>Notes:</strong> ${outcome.notesValue}</p>
                            `;
                            accountContainer.appendChild(outcomeElement);
                        }
                    });

                    outcomesContainer.appendChild(accountContainer);
                }
            } else {
                console.log('No sales outcomes found for user:', user.displayName);
            }
        }, (error) => {
            console.error('Error fetching sales outcomes:', error);
        });
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            displaySalesOutcomes(user);
        } else {
            auth.signInWithPopup(provider).then((result) => {
                const user = result.user;
                displaySalesOutcomes(user);
            }).catch((error) => {
                console.error('Authentication error:', error);
            });
        }
    });
});