// sales-charts.js
import { Chart } from 'https://cdn.jsdelivr.net/npm/chart.js';


// Dummy data for demonstration purposes
const dailySalesData = {
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
    datasets: [
        {
            label: 'Daily Sales',
            data: [10, 15, 8, 12, 18],
            backgroundColor: 'rgba(255, 99, 132, 0.2)', // Red background color
            borderColor: 'rgba(255, 99, 132, 1)', // Red border color
            borderWidth: 1,
        },
    ],
};

const monthlySalesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
        {
            label: 'Monthly Sales',
            data: [100, 150, 80, 120, 180],
            backgroundColor: 'rgba(54, 162, 235, 0.2)', // Blue background color
            borderColor: 'rgba(54, 162, 235, 1)', // Blue border color
            borderWidth: 1,
        },
    ],
};

const yearlySalesData = {
    labels: ['2022', '2023', '2024', '2025', '2026'],
    datasets: [
        {
            label: 'Yearly Sales',
            data: [1000, 1500, 800, 1200, 1800],
            backgroundColor: 'rgba(75, 192, 192, 0.2)', // Green background color
            borderColor: 'rgba(75, 192, 192, 1)', // Green border color
            borderWidth: 1,
        },
    ],
};

// Function to create and render a chart
function renderChart(chartData, chartId) {
    const salesChartCanvas = document.getElementById(chartId);

    // Create a new Chart instance and specify the type (e.g., 'bar' for bar chart)
    const salesChart = new Chart(salesChartCanvas, {
        type: 'bar',
        data: chartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}

// Event listeners for tab clicks
document.getElementById('dailyTab').addEventListener('click', () => {
    renderChart(dailySalesData, 'salesChart');
});

document.getElementById('monthlyTab').addEventListener('click', () => {
    renderChart(monthlySalesData, 'salesChart');
});

document.getElementById('yearlyTab').addEventListener('click', () => {
    renderChart(yearlySalesData, 'salesChart');
});

// Initial chart rendering (you can choose a default chart to display)
renderChart(dailySalesData, 'salesChart');
