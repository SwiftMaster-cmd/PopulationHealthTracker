// Firebase configuration
const firebaseConfig = {
    // Your Firebase configuration
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    databaseURL: "your-database-url",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

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
firebase.auth().onAuthStateChanged(user => {
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
    const salesRef = firebase.database().ref('sales/' + userId);
    return salesRef.once('value').then((snapshot) => {
        const sales = snapshot.val();
        const salesHistoryElement = document.getElementById('salesHistory');
        salesHistoryElement.innerHTML = ''; // Clear existing content
        const salesData = [];
        for (let saleId in sales) {
            const sale = sales[saleId];
            const saleElement = document.createElement('div');
            saleElement.textContent = `Lead ID: ${sale.lead_id}, ESI Content: ${sale.esi_content}, Notes: ${sale.notes}`;
            // Add more details as needed
            salesHistoryElement.appendChild(saleElement);
            salesData.push(sale);
        }
        return salesData;
    }).catch((error) => {
        console.error('Error fetching sales data:', error);
        return [];
    });
}
