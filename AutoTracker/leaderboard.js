document.addEventListener('DOMContentLoaded', () => {
    // Create the dropdown pickers
    const periodPicker = document.getElementById('periodPicker');
    const saleTypePicker = document.getElementById('saleTypePicker');

    // Add event listeners to the pickers
    periodPicker.addEventListener('change', () => {
        loadChart(periodPicker.value, saleTypePicker.value);
    });

    saleTypePicker.addEventListener('change', () => {
        loadChart(periodPicker.value, saleTypePicker.value);
    });

    // Load the default chart
    loadChart();
});

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
