// Import necessary functions from the Firebase SDK
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, ServerValue } from "firebase/database";

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

// Function to add sales data to Firebase Realtime Database
function addSalesData(leadId, esiConsent, saleType) {
  // Use the specified parent path '/sales'
  const salesRef = ref(database, 'sales');

  // Use the specified document ID 'KhwuizoVuTXnQVhAkeuh'
  const newSalesKey = set(ref(salesRef, 'KhwuizoVuTXnQVhAkeuh'), {
    leadId: leadId,
    esiConsent: esiConsent,
    saleType: saleType,
    timestamp: ServerValue.TIMESTAMP,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString()
  });

  console.log('Sale added to Firebase:', newSalesKey);
}

// Function to handle form submission
function submitForm() {
  const leadId = document.getElementById('leadId').value;
  const esiConsent = document.getElementById('esiConsent').value;
  const saleType = document.getElementById('saleType').value;

  // Call the function to add sales data to Firebase
  addSalesData(leadId, esiConsent, saleType);

  // Clear form inputs after submission
  document.getElementById('leadId').value = '';
  document.getElementById('esiConsent').value = '';
  document.getElementById('saleType').value = '';

  // Provide feedback to the user (customize as needed)
  alert('Sale submitted successfully!');
}
