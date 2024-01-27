// Import necessary functions from the Firebase SDK
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAj5ac2MoocLPRcKNZg1ya2SMcksbaIfWY",
    authDomain: "pophealthtracker.firebaseapp.com",
    databaseURL: "https://pophealthtracker-default-rtdb.firebaseio.com",
    projectId: "pophealthtracker",
    storageBucket: "pophealthtracker.appspot.com",
    messagingSenderId: "934873881816",
    appId: "1:934873881816:web:fde6a268c880b9139f0bad",
    measurementId: "G-6S10R2SD81"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
// Function to load sales data from Firebase
function loadSalesData() {
    const salesRef = ref(database, 'sales'); // Assuming 'sales' is the path to your collection
  
    // Attach a listener for changes in the sales data
    onValue(salesRef, (snapshot) => {
      const salesData = snapshot.val();
  
      // Process and render the salesData as needed
      renderSalesData(salesData);
    });
  }
  
  // Function to render sales data on the HTML page
  function renderSalesData(salesData) {
    // You can customize this function based on how you want to display the data
    const salesContainer = document.getElementById('salesContainer');
  
    // Clear previous data
    salesContainer.innerHTML = '';
  
    // Iterate through the salesData and render it on the page
    for (const documentId in salesData) {
      if (salesData.hasOwnProperty(documentId)) {
        const sale = salesData[documentId];
        const saleElement = document.createElement('div');
        saleElement.innerHTML = `<p>Document ID: ${documentId}, Lead ID: ${sale.leadId}, ESI Consent: ${sale.esiConsent}, Sale Type: ${sale.saleType}, Date: ${sale.date}, Time: ${sale.time}</p>`;
        salesContainer.appendChild(saleElement);
      }
    }
  }
  
  // Call the function to load sales data when the page loads
  document.addEventListener('DOMContentLoaded', () => {
    loadSalesData();
  });
  