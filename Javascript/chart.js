// chart.js

function generateChartData(salesArray) {
    const saleTypeCounts = calculateSaleTypeCounts(salesArray);
    const labels = Object.keys(saleTypeCounts);
    const data = Object.values(saleTypeCounts);

    return {
        labels: labels,
        datasets: [{
            label: 'Sale Type Counts',
            backgroundColor: 'rgba(54, 162, 235, 0.8)', // Blue color with opacity
            data: data,
        }]
    };
}

let salesChart;

function renderSalesChart(data) {
    if (salesChart) {
        salesChart.destroy();
    }

    const ctx = document.getElementById('salesChart').getContext('2d');
    salesChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)', // Light gray grid lines
                    },
                    ticks: {
                        maxTicksLimit: 5 // Attempt to limit to 5 ticks
                    }
                },
                x: {
                    grid: {
                        display: false // Hide vertical grid lines
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Hide legend
                }
            },
            animation: {
                duration: 2000, // Animates the chart over 2 seconds
                easing: 'easeInOutQuart' // Smooth animation curve
            },
            responsive: true,
            maintainAspectRatio: false // Allow chart to resize
        }
    });
}
