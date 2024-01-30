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
const auth = getAuth(app);

// Function to add sales data to Firebase Realtime Database
function addSalesData(leadId, esiConsent, saleType, customerName) {
  const salesRef = ref(database, 'sales');

  const newSalesData = {
    leadId: leadId,
    esiConsent: esiConsent,
    saleType: saleType,
    timestamp: ServerValue.TIMESTAMP,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    customerName: customerName
  };

  push(salesRef, newSalesData)
    .then(() => {
      console.log('Sale added to Firebase:', newSalesData);
      alert('Sale submitted successfully!');
    })
    .catch((error) => {
      console.error('Error adding sale:', error);
      alert('Sale submission failed. Check the console for details.');
    });
}

// Function to remove sales data from Firebase Realtime Database
function removeSalesData(saleId) {
  const salesRef = ref(database, 'sales/' + saleId);

  remove(salesRef)
    .then(() => {
      console.log('Sale removed from Firebase:', saleId);
      alert('Sale removed successfully!');
    })
    .catch((error) => {
      console.error('Error removing sale:', error);
      alert('Sale removal failed. Check the console for details.');
    });
}

// Function to update sales data in Firebase Realtime Database
function updateSalesData(saleId, updatedData) {
  const salesRef = ref(database, 'sales/' + saleId);

  update(salesRef, updatedData)
    .then(() => {
      console.log('Sale updated in Firebase:', saleId, updatedData);
      alert('Sale updated successfully!');
    })
    .catch((error) => {
      console.error('Error updating sale:', error);
      alert('Sale update failed. Check the console for details.');
    });
}

// Function to handle form submission
function submitForm() {
  const leadId = document.getElementById('leadId').value;
  const esiConsent = document.getElementById('esiConsent').value;
  const saleType = document.getElementById('saleType').value;
  const customerName = document.getElementById('customerName').value;

  // Call the function to add sales data to Firebase
  addSalesData(leadId, esiConsent, saleType, customerName);

  // Clear form inputs after submission
  document.getElementById('leadId').value = '';
  document.getElementById('esiConsent').value = '';
  document.getElementById('saleType').value = '';
  document.getElementById('customerName').value = '';
}

// Function to handle sale removal
function removeSale() {
  const saleId = document.getElementById('saleId').value;
  // Call the function to remove sales data from Firebase
  removeSalesData(saleId);
}

// Function to handle sale update
function updateSale() {
  const saleId = document.getElementById('saleId').value;
  const updatedLeadId = prompt('Enter updated Lead ID:');
  const updatedEsiConsent = prompt('Enter updated ESI Consent:');
  const updatedSaleType = prompt('Enter updated Sale Type:');
  const updatedCustomerName = prompt('Enter updated Customer Name:');

  const updatedData = {
    leadId: updatedLeadId,
    esiConsent: updatedEsiConsent,
    saleType: updatedSaleType,
    timestamp: ServerValue.TIMESTAMP,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    customerName: updatedCustomerName
  };

  // Call the function to update sales data in Firebase
  updateSalesData(saleId, updatedData);
}
