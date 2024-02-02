import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, push, set, query, orderByChild, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

// Firebase configuration
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


// Initialize Firebase
initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase();

// Function to create and update charts
function createCharts(salesData) {
    // Prepare data for charts
    const dayPerformanceData = calculatePerformanceByDay(salesData);
    const monthPerformanceData = calculatePerformanceByMonth(salesData);
    const yearPerformanceData = calculatePerformanceByYear(salesData);

    // Create or update the Day Performance Chart
    createOrUpdateChart('dayPerformanceChart', 'Day Performance', 'line', dayPerformanceData);

    // Create or update the Month Performance Chart
    createOrUpdateChart('monthPerformanceChart', 'Month Performance', 'line', monthPerformanceData);

    // Create or update the Year Performance Chart
    createOrUpdateChart('yearPerformanceChart', 'Year Performance', 'line', yearPerformanceData);
}

// Function to calculate day performance
function calculatePerformanceByDay(salesData) {
    // Implement logic to calculate day performance from salesData
    // Return data in a suitable format for the chart
    // Example:
    const labels = ["Day 1", "Day 2", "Day 3"]; // Replace with actual labels
    const data = [10, 15, 8]; // Replace with actual data
    return {
        labels: labels,
        datasets: [
            {
                label: "Sales",
                data: data,
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderWidth: 1
            }
        ]
    };
}

// Function to calculate month performance
function calculatePerformanceByMonth(salesData) {
    // Implement logic to calculate month performance from salesData
    // Return data in a suitable format for the chart
    // Example:
    const labels = ["Jan", "Feb", "Mar"]; // Replace with actual labels
    const data = [50, 60, 45]; // Replace with actual data
    return {
        labels: labels,
        datasets: [
            {
                label: "Sales",
                data: data,
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderWidth: 1
            }
        ]
    };
}

// Function to calculate year performance
function calculatePerformanceByYear(salesData) {
    // Implement logic to calculate year performance from salesData
    // Return data in a suitable format for the chart
    // Example:
    const labels = ["2022", "2023", "2024"]; // Replace with actual labels
    const data = [200, 250, 180]; // Replace with actual data
    return {
        labels: labels,
        datasets: [
            {
                label: "Sales",
                data: data,
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderWidth: 1
            }
        ]
    };
}

// Function to create or update a chart
function createOrUpdateChart(chartId, chartTitle, chartType, data) {
    const chartContext = document.getElementById(chartId).getContext('2d');
    new Chart(chartContext, {
        type: chartType,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: chartTitle,
                },
            },
        },
    });
}

// Add the rest of your code...

// Fetch and use sales data from Firebase
onAuthStateChanged(auth, user => {
    if (user) {
        fetchSalesHistory(user.uid).then((salesData) => {
            createCharts(salesData);
        });
    } else {
        console.log("User is not logged in. Redirecting to login page.");
        window.location.href = 'login.html'; // Redirect to login
    }
});

function fetchSalesHistory(userId) {
    const salesRef = ref(database, 'sales/' + userId);
    onValue(salesRef, (snapshot) => {
        const sales = snapshot.val();
        const salesHistoryElement = document.getElementById('salesHistory');
        salesHistoryElement.innerHTML = ''; // Clear existing content
        for (let saleId in sales) {
            const sale = sales[saleId];
            const saleElement = document.createElement('div');
            saleElement.textContent = `Lead ID: ${sale.lead_id}, ESI Content: ${sale.esi_content}, Notes: ${sale.notes}`;
            // Add more details as needed
            salesHistoryElement.appendChild(saleElement);
        }
    }, {
        onlyOnce: true
    });
}
