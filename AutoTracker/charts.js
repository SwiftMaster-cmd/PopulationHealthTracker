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

function loadChart(period = 'day', saleType = 'billableHRA') {
    const database = firebase.database();
    const salesCountsRef = database.ref('salesCounts');

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const currentUserId = user.uid;

            salesCountsRef.child(currentUserId).once('value', salesSnapshot => {
                const salesData = salesSnapshot.val();
                const salesCounts = salesData && salesData[period] ? salesData[period] : {
                    billableHRA: 0,
                    selectRX: 0,
                    selectPatientManagement: 0,
                    transfer: 0
                };
                
                // Prepare the data for the chart
                const saleTypeLabel = getReadableTitle(saleType);
                const salesCount = salesCounts[saleType];

                const ctx = document.getElementById('salesChart').getContext('2d');
                
                if (salesChart instanceof Chart) {
                    // Update the chart data
                    salesChart.data.labels = [saleTypeLabel];
                    salesChart.data.datasets[0].data = [salesCount];
                    salesChart.data.datasets[0].label = `${saleTypeLabel} Sales (${period})`;
                    salesChart.update();
                } else {
                    // Initialize the chart
                    salesChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: [saleTypeLabel], // Adjust labels as needed
                            datasets: [{
                                label: `${saleTypeLabel} Sales (${period})`,
                                data: [salesCount], // Adjust data to match the period and sale type
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
