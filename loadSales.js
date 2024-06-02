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

    function displayCustomerInfo(customerInfo) {
        const customerInfoContainer = document.getElementById('customer-info');
        customerInfoContainer.innerHTML = `
            <h2>Customer Info</h2>
            <div><strong>First Name:</strong> ${customerInfo.firstName}</div>
            <div><strong>Last Name:</strong> ${customerInfo.lastName}</div>
            <div><strong>Gender:</strong> ${customerInfo.gender}</div>
            <div><strong>Birthdate:</strong> ${customerInfo.birthdate}</div>
            <div><strong>Phone:</strong> ${customerInfo.phone}</div>
            <div><strong>Zipcode:</strong> ${customerInfo.zipcode}</div>
            <div><strong>State ID:</strong> ${customerInfo.stateId}</div>
        `;
    }

    function displaySalesOutcomes(user) {
        const outcomesRef = firebase.database().ref('salesOutcomes/' + user.uid);
        outcomesRef.on('value', (snapshot) => {
            const outcomes = snapshot.val();
            if (outcomes) {
                const outcomesContainer = document.getElementById('sales-outcomes');
                outcomesContainer.innerHTML = ''; // Clear previous outcomes

                // Group outcomes by account number and filter out unwanted outcomes
                const groupedOutcomes = {};
                let latestCustomerInfo = null;

                for (const key in outcomes) {
                    const outcome = outcomes[key];
                    const accountNumber = outcome.accountNumber;
                    if (outcome.assignAction.trim() === "--") {
                        continue; // Skip outcomes with "--" in assign action
                    }
                    if (!groupedOutcomes[accountNumber]) {
                        groupedOutcomes[accountNumber] = {};
                    }
                    groupedOutcomes[accountNumber][outcome.assignAction] = outcome; // Only keep the latest outcome for each action

                    // Update latest customer info
                    latestCustomerInfo = outcome.customerInfo;
                }

                // Display latest customer info
                if (latestCustomerInfo) {
                    displayCustomerInfo(latestCustomerInfo);
                }

                // Sort account numbers by the newest outcome time
                const sortedAccounts = Object.keys(groupedOutcomes).sort((a, b) => {
                    const latestA = Object.values(groupedOutcomes[a]).reduce((latest, current) => new Date(current.outcomeTime) > new Date(latest.outcomeTime) ? current : latest);
                    const latestB = Object.values(groupedOutcomes[b]).reduce((latest, current) => new Date(current.outcomeTime) > new Date(latest.outcomeTime) ? current : latest);
                    return new Date(latestB.outcomeTime) - new Date(latestA.outcomeTime);
                });

                // Display grouped outcomes, sorted by newest account first
                for (const accountNumber of sortedAccounts) {
                    const accountContainer = document.createElement('div');
                    accountContainer.classList.add('account-container');

                    const accountTitle = document.createElement('div');
                    accountTitle.classList.add('account-title');
                    accountTitle.textContent = `Account Number: ${accountNumber}`;
                    accountContainer.appendChild(accountTitle);

                    const accountOutcomes = Object.values(groupedOutcomes[accountNumber]);
                    accountOutcomes.sort((a, b) => new Date(b.outcomeTime) - new Date(a.outcomeTime));

                    for (const outcome of accountOutcomes) {
                        const outcomeElement = document.createElement('div');
                        outcomeElement.classList.add('outcome-item');
                        outcomeElement.innerHTML = `
                            <p><strong>Action:</strong> ${outcome.assignAction}</p>
                        `;
                        if (outcome.notesValue && outcome.notesValue.trim() && outcome.notesValue !== ' ') {
                            outcomeElement.innerHTML += `<p><strong>Notes:</strong> ${outcome.notesValue}</p>`;
                        }
                        outcomeElement.innerHTML += `
                            <p class="outcome-time"><strong>Time:</strong> ${formatDateTime(outcome.outcomeTime)}</p>
                        `;
                        accountContainer.appendChild(outcomeElement);
                    }

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