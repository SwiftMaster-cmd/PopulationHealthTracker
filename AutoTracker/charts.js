document.addEventListener('DOMContentLoaded', () => {
    // Get the chart period picker
    const chartPeriodPicker = document.getElementById('chartPeriodPicker');

    // Add event listener to the chart period picker
    chartPeriodPicker.addEventListener('change', () => {
        loadChart(chartPeriodPicker.value);
    });

    // Load the default chart
    loadChart();
});

let salesChart;

function loadChart(period = 'day') {
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
                const chartData = {
                    labels: ['Billable HRA', 'Select RX', 'Select Patient Management', 'Transfer'],
                    datasets: [{
                        label: `Sales Counts (${period})`,
                        data: [
                            salesCounts.billableHRA,
                            salesCounts.selectRX,
                            salesCounts.selectPatientManagement,
                            salesCounts.transfer
                        ],
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(153, 102, 255, 0.2)'
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(153, 102, 255, 1)'
                        ],
                        borderWidth: 1
                    }]
                };

                const ctx = document.getElementById('salesChart').getContext('2d');

                if (salesChart instanceof Chart) {
                    // Update the chart data
                    salesChart.data = chartData;
                    salesChart.update();
                } else {
                    // Initialize the chart
                    salesChart = new Chart(ctx, {
                        type: 'bar',
                        data: chartData,
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