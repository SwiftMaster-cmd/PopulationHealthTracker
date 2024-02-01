import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, query, orderByChild, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

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

// Get references to Firebase services
const auth = getAuth();
const database = getDatabase();

// Check for user authentication
onAuthStateChanged(auth, user => {
    if (user) {
        // User is authenticated, you can proceed with chart rendering here
        // Call functions to render charts for day, month, and year
        renderDayChart(user.uid);
        renderMonthChart(user.uid);
        renderYearChart(user.uid);
    } else {
        console.log("User is not logged in.");
        // Handle the case when the user is not authenticated
    }
});

function renderDayChart(userId) {
    // Write code to retrieve and render sales data for the day using a charting library (e.g., Chart.js)
    // You will need to fetch the data from Firebase and format it for the chart
    // Example:
    const dayChartCanvas = document.getElementById('dayChartCanvas');
    // Create a Chart instance and render the data on 'dayChartCanvas'
    // You should fetch the necessary data from Firebase and format it here
}

function renderMonthChart(userId) {
    // Write code to retrieve and render sales data for the month using a charting library
    // Example:
    const monthChartCanvas = document.getElementById('monthChartCanvas');
    // Create a Chart instance and render the data on 'monthChartCanvas'
    // You should fetch the necessary data from Firebase and format it here
}

function renderYearChart(userId) {
    // Write code to retrieve and render sales data for the year using a charting library
    // Example:
    const yearChartCanvas = document.getElementById('yearChartCanvas');
    // Create a Chart instance and render the data on 'yearChartCanvas'
    // You should fetch the necessary data from Firebase and format it here
}
