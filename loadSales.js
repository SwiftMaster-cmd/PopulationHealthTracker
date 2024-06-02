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

    function getSaleType(action, notes) {
        if (action === 'Notes') {
            if (/fe|final expense|vbc|dental/i.test(notes)) {
                return 'Transfer';
            }
        } else if (action === 'Select RX Enrolled History Received' || action === 'Select RX Enrolled History Not Received') {
            return 'Select RX Enrolled';
        } else if (action === 'HRA') {
            if (/billable|bill|b/i.test(notes)) {
                return 'Billable HRA';
            }
            return 'HRA Completed';
        }
        return action;
    }

    function displayCustomerInfo(customerInfo) {
        if (!customerInfo) {
            return '<div class="customer-info"><h4>No Customer Information Available</h4></div>';
        }

        return `
            <div class="customer-info">
                <div class="customer-row">
                    <div class="customer-field"><strong>First:</strong> ${customerInfo.firstName || 'N/A'}</div>
                    <div class="customer-field"><strong>Last:</strong> ${customerInfo.lastName || 'N/A'}</div>
                </div>
                <div class="customer-row">
                    <div class="customer-field"><strong>Phone:</strong> ${customerInfo.phone || 'N/A'}</div>
                    <button class="more-info-btn">+ More</button>
                </div>
                <div class="more-info-popup" style="display:none;">
                    <div class="customer-row">
                        <div class="customer-field"><strong>Gender:</strong> ${customerInfo.gender || 'N/A'}</div>
                        <div class="customer-field"><strong>Birth:</strong> ${customerInfo.birthdate || 'N/A'}</div>
                    </div>
                    <div class="customer-row">
                        <div class="customer-field"><strong>Email:</strong> ${customerInfo.email || 'N/A'}</div>
                    </div>
                    <div class="customer-row">
                        <div class="customer-field"><strong>Zip:</strong> ${customerInfo.zipcode || 'N/A'}</div>
                        <div class="customer-field"><strong>State:</strong> ${customerInfo.stateId || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    function displaySalesOutcomes(user) {
        const outcomesRef = firebase.database().ref('salesOutcomes/' + user.uid);
        outcomesRef.on('value', (snapshot) => {
            const outcomes = snapshot.val();
            if (outcomes) {
                const outcomesContainer = document.getElementById('sales-outcomes-container');
                outcomesContainer.innerHTML = ''; // Clear previous outcomes

                // Group outcomes by account number and filter out unwanted outcomes
                const groupedOutcomes = {};
                const salesCounts = {};

                for (const key in outcomes) {
                    const outcome = outcomes[key];
                    const accountNumber = outcome.accountNumber;
                    if (outcome.assignAction.trim() === "--") {
                        continue; // Skip outcomes with "--" in assign action
                    }
                    if (!groupedOutcomes[accountNumber]) {
                        groupedOutcomes[accountNumber] = { customerInfo: outcome.customerInfo || {}, actions: {} };
                    }
                    groupedOutcomes[accountNumber].actions[outcome.assignAction] = outcome; // Keep only the latest action for each type
                }

                // Tally the sales counts
                for (const accountNumber in groupedOutcomes) {
                    const actions = groupedOutcomes[accountNumber].actions;
                    for (const action in actions) {
                        const outcome = actions[action];
                        const saleType = getSaleType(outcome.assignAction, outcome.notesValue);

                        if (!salesCounts[saleType]) {
                            salesCounts[saleType] = 0;
                        }
                        salesCounts[saleType]++;
                    }
                }

                // Sort account numbers by the newest outcome time
                const sortedAccounts = Object.keys(groupedOutcomes).sort((a, b) => {
                    const latestA = Object.values(groupedOutcomes[a].actions).reduce((latest, current) => new Date(current.outcomeTime) > new Date(latest.outcomeTime) ? current : latest);
                    const latestB = Object.values(groupedOutcomes[b].actions).reduce((latest, current) => new Date(current.outcomeTime) > new Date(latest.outcomeTime) ? current : latest);
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

                    const accountContent = document.createElement('div');
                    accountContent.classList.add('account-content');
                    accountContainer.appendChild(accountContent);

                    const salesInfoContainer = document.createElement('div');
                    salesInfoContainer.classList.add('sales-info');
                    accountContent.appendChild(salesInfoContainer);

                    const customerInfoContainer = document.createElement('div');
                    customerInfoContainer.classList.add('customer-info-container');
                    accountContent.appendChild(customerInfoContainer);

                    const customerInfoHtml = displayCustomerInfo(groupedOutcomes[accountNumber].customerInfo);
                    customerInfoContainer.innerHTML = customerInfoHtml;

                    const accountOutcomes = Object.values(groupedOutcomes[accountNumber].actions);
                    accountOutcomes.sort((a, b) => new Date(b.outcomeTime) - new Date(a.outcomeTime));

                    for (const outcome of accountOutcomes) {
                        if (outcome.assignAction.trim() === "--") continue; // Ensure actions with "--" are not displayed
                        const outcomeElement = document.createElement('div');
                        outcomeElement.classList.add('outcome-item');
                        outcomeElement.innerHTML = `
                            <button class="copy-action-btn" data-account="${accountNumber}" data-action="${outcome.assignAction}" data-firstname="${groupedOutcomes[accountNumber].customerInfo.firstName || ''}" data-lastname="${groupedOutcomes[accountNumber].customerInfo.lastName || ''}">${outcome.assignAction}</button>
                            <div class="notes">${outcome.notesValue || 'No notes'}</div>
                            <div class="outcome-time">${formatDateTime(outcome.outcomeTime)}</div>
                        `;
                        salesInfoContainer.appendChild(outcomeElement);
                    }

                    outcomesContainer.appendChild(accountContainer);
                }

                // Add event listeners for + More buttons
                document.querySelectorAll('.more-info-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const popup = this.parentElement.nextElementSibling;
                        popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
                    });
                });

                // Add event listeners for Copy Action buttons
                document.querySelectorAll('.copy-action-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const account = this.getAttribute('data-account');
                        const action = this.getAttribute('data-action');
                        const firstName = this.getAttribute('data-firstname');
                        const lastName = this.getAttribute('data-lastname');
                        const textToCopy = `${account} - ${action} - ${firstName} ${lastName}`;
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            alert(`Copied: ${textToCopy}`);
                        }).catch(err => {
                            console.error('Could not copy text: ', err);
                        });
                    });
                });

// Display sales counts
const salesCountsContainer = document.createElement('div');
salesCountsContainer.classList.add('sales-counts-container');
for (const action in salesCounts) {
    const countElement = document.createElement('div');
    countElement.classList.add('sales-count-item');
    countElement.innerHTML = `<strong>${action}:</strong> ${salesCounts[action]}`;
    salesCountsContainer.appendChild(countElement);
}
outcomesContainer.prepend(salesCountsContainer);
            } else {
                console.log('No sales outcomes found for user:', user.displayName);
            }
        }, (error) => {
            console.error('Error fetching sales outcomes:', error);
        });
    }

    // Add this function to display the monthly chart
function displayMonthlyChart(monthlySalesData) {
    const chartContainer = document.createElement('div');
    chartContainer.classList.add('chart-container');
    chartContainer.innerHTML = '<canvas id="monthlySalesChart"></canvas>';
    document.getElementById('sales-outcomes-container').prepend(chartContainer);

    const ctx = document.getElementById('monthlySalesChart').getContext('2d');
    const labels = Array.from({ length: 31 }, (_, i) => i + 1);
    const datasets = Object.keys(monthlySalesData).map((saleType, index) => {
        const colors = ['red', 'blue', 'green', 'orange', 'purple', 'cyan'];
        return {
            label: saleType,
            data: monthlySalesData[saleType],
            borderColor: colors[index % colors.length],
            fill: false
        };
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Day of the Month'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Sales'
                    }
                }
            }
        }
    });
}

// Inside the displaySalesOutcomes function, before the end of the if(outcomes) block
const monthlySalesData = {};

// Prepare data for the chart
for (const key in outcomes) {
    const outcome = outcomes[key];
    const date = new Date(outcome.outcomeTime);
    const day = date.getDate();
    const saleType = getSaleType(outcome.assignAction, outcome.notesValue);

    if (!monthlySalesData[saleType]) {
        monthlySalesData[saleType] = Array.from({ length: 31 }, () => 0);
    }
    if (date.getFullYear() === new Date().getFullYear() && date.getMonth() === new Date().getMonth()) {
        monthlySalesData[saleType][day - 1]++;
    }
}

// Call the function to display the chart
displayMonthlyChart(monthlySalesData);

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