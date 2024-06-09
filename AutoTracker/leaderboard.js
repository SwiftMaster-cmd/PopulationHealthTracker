document.addEventListener('DOMContentLoaded', () => {
    // Create the dropdown pickers
    const periodPicker = document.getElementById('periodPicker');
    const saleTypePicker = document.getElementById('saleTypePicker');

    // Add event listeners to the pickers
    periodPicker.addEventListener('change', () => {
        loadLeaderboard(periodPicker.value, saleTypePicker.value);
        loadChart(periodPicker.value, saleTypePicker.value);
    });

    saleTypePicker.addEventListener('change', () => {
        loadLeaderboard(periodPicker.value, saleTypePicker.value);
        loadChart(periodPicker.value, saleTypePicker.value);
    });

    // Load the default leaderboard and chart
    loadLeaderboard();
    loadChart();
});

function loadLeaderboard(period = 'day', saleType = 'selectRX') {
    const database = firebase.database();
    const salesCountsRef = database.ref('salesCounts');

    const leaderboardSection = document.getElementById('leaderboard-section');
    if (!leaderboardSection) {
        console.error('Leaderboard section element not found');
        return;
    }

    leaderboardSection.innerHTML = ''; // Clear previous leaderboard

    salesCountsRef.once('value', salesSnapshot => {
        const salesData = salesSnapshot.val();
        const users = [];

        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                const currentUserId = user.uid;
                const currentUserEmail = user.email.split('@')[0]; // Get email without domain
                console.log('Current user email:', currentUserEmail);

                for (const userId in salesData) {
                    const userData = salesData[userId];
                    const count = userData[period] && userData[period][saleType] ? userData[period][saleType] : 0;
                    const email = (userId === currentUserId) ? currentUserEmail : 'Unknown User';
                    users.push({ email, count });
                }

                // Check if users array is populated correctly
                console.log(`Users for ${period} - ${saleType}:`, users);

                users.sort((a, b) => b.count - a.count); // Sort users by count in descending order

                const periodSaleTypeContainer = document.createElement('div');
                periodSaleTypeContainer.classList.add('leaderboard-section');
                periodSaleTypeContainer.innerHTML = `<h3>Leaderboard: ${getReadableTitle(saleType)}</h3>`;

                users.slice(0, 5).forEach((user, index) => {
                    const userElement = document.createElement('div');
                    userElement.classList.add('leaderboard-item');
                    userElement.innerHTML = `<strong>${index + 1}. ${user.email} - ${getReadableTitle(saleType)}: ${user.count}</strong>`;
                    periodSaleTypeContainer.appendChild(userElement);
                });

                leaderboardSection.appendChild(periodSaleTypeContainer);
            } else {
                console.error('No user is signed in.');
            }
        });
    }).catch(error => {
        console.error('Error fetching sales data:', error);
    });
}

let salesChart; // Declare salesChart variable

function loadChart(period = 'day', saleType = 'selectRX') {
    const database = firebase.database();
    const salesCountsRef = database.ref('salesCounts');

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const currentUserId = user.uid;

            salesCountsRef.child(currentUserId).once('value', salesSnapshot => {
                const salesData = salesSnapshot.val();
                const salesCounts = salesData[period] && salesData[period][saleType] ? salesData[period][saleType] : 0;
                
                // Check if salesCounts array is populated correctly
                console.log(`Sales counts for ${period} - ${saleType}:`, salesCounts);

                const ctx = document.getElementById('salesChart').getContext('2d');
                
                if (!salesChart) {
                    // Initialize the chart
                    salesChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ['Sales Count'], // Adjust labels as needed
                            datasets: [{
                                label: `${getReadableTitle(saleType)} Sales`,
                                data: [salesCounts], // Adjust data to match the period and sale type
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 1
                            }]
                        },
                        options: {
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }
                    });
                } else {
                    // Update the chart data
                    salesChart.data.datasets[0].data = [salesCounts];
                    salesChart.data.datasets[0].label = `${getReadableTitle(saleType)} Sales`;
                    salesChart.update();
                }
            }).catch(error => {
                console.error('Error fetching sales data:', error);
            });
        } else {
            console.error('No user is signed in.');
        }
    });
}

function getReadableTitle(saleType) {
    switch (saleType) {
        case 'selectRX':
            return 'Select RX';
        case 'billableHRA':
            return 'Billable HRA';
        case 'transfer':
            return 'Transfer';
        case 'selectPatientManagement':
            return 'Select Patient Management';
        default:
            return saleType;
    }
}
