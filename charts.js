// Import the Chart.js library
// charts.js (After)
import { someFunction } from './sales-charts.js'; // Adjust the path as needed


// Dummy data for demonstration purposes
const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
        {
            label: 'Sales for the Year',
            data: [10, 15, 8, 12, 18],
            backgroundColor: 'rgba(255, 99, 132, 0.2)', // Red background color
            borderColor: 'rgba(255, 99, 132, 1)', // Red border color
            borderWidth: 1,
        },
    ],
};

// Get the canvas element to render the chart
const salesChartCanvas = document.getElementById('salesChart');

// Create a new Chart instance and specify the type (e.g., 'bar' for bar chart)
const salesChart = new Chart(salesChartCanvas, {
    type: 'bar',
    data: salesData,
    options: {
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    },
});
