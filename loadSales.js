function displaySalesOutcomes(user) {
    const outcomesRef = firebase.database().ref('salesOutcomes/' + user.uid);
    outcomesRef.on('value', (snapshot) => {
        const outcomes = snapshot.val();
        if (outcomes) {
            const outcomesContainer = document.getElementById('sales-outcomes-container');
            outcomesContainer.innerHTML = ''; // Clear previous outcomes

            // Group outcomes by account number and filter out unwanted outcomes
            const groupedOutcomes = {};
            for (const key in outcomes) {
                const outcome = outcomes[key];
                const accountNumber = outcome.accountNumber;
                if (outcome.assignAction.trim() === "--") {
                    continue; // Skip outcomes with "--" in assign action
                }
                if (!groupedOutcomes[accountNumber]) {
                    groupedOutcomes[accountNumber] = [];
                }
                groupedOutcomes[accountNumber].push(outcome); // Store all outcomes for each account
            }

            // Sort account numbers to display newest first based on the latest outcome time
            const sortedAccountNumbers = Object.keys(groupedOutcomes).sort((a, b) => {
                const lastOutcomeA = groupedOutcomes[a].sort((x, y) => new Date(y.outcomeTime) - new Date(x.outcomeTime))[0];
                const lastOutcomeB = groupedOutcomes[b].sort((x, y) => new Date(y.outcomeTime) - new Date(x.outcomeTime))[0];
                return new Date(lastOutcomeB.outcomeTime) - new Date(lastOutcomeA.outcomeTime);
            });

            // Display grouped outcomes for each sorted account number
            sortedAccountNumbers.forEach(accountNumber => {
                const accountContainer = document.createElement('div');
                accountContainer.classList.add('account-container');

                const accountTitle = document.createElement('div');
                accountTitle.classList.add('account-title');
                accountTitle.textContent = `Account Number: ${accountNumber}`;
                accountContainer.appendChild(accountTitle);

                const accountOutcomes = groupedOutcomes[accountNumber];
                accountOutcomes.sort((a, b) => new Date(b.outcomeTime) - new Date(a.outcomeTime)); // Ensure outcomes are also sorted

                for (const outcome of accountOutcomes) {
                    const outcomeElement = document.createElement('div');
                    outcomeElement.classList.add('outcome-item');
                    outcomeElement.innerHTML = `
                        <p><strong>Outcome Time:</strong> ${formatDateTime(outcome.outcomeTime)}</p>
                        <p><strong>Assign Action:</strong> ${outcome.assignAction}</p>
                        <p><strong>Notes:</strong> ${outcome.notesValue}</p>
                    `;
                    accountContainer.appendChild(outcomeElement);
                }

                outcomesContainer.appendChild(accountContainer);
            });
        } else {
            console.log('No sales outcomes found for user:', user.displayName);
        }
    }, (error) => {
        console.error('Error fetching sales outcomes:', error);
    });
}