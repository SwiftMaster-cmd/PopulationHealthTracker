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
function addSalesData(leadId, esiConsent, saleType) {
  const salesRef = ref(database, 'sales');

  const newSalesKey = push(salesRef);

  const newSalesData = {
    leadId: leadId,
    esiConsent: esiConsent,
    saleType: saleType,
    timestamp: ServerValue.TIMESTAMP,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString()
  };

  set(newSalesKey, newSalesData);

  console.log('Sale added to Firebase:', newSalesData);
}

// Function to remove sales data from Firebase Realtime Database
function removeSalesData(saleId) {
  const salesRef = ref(database, `sales/${saleId}`);
  remove(salesRef);
  console.log('Sale removed from Firebase:', saleId);
}

// Function to update sales data in Firebase Realtime Database
function updateSalesData(saleId, updatedData) {
  const salesRef = ref(database, `sales/${saleId}`);
  update(salesRef, updatedData);
  console.log('Sale updated in Firebase:', saleId, updatedData);
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

// Function to handle sale removal
function removeSale(saleId) {
  // Call the function to remove sales data from Firebase
  removeSalesData(saleId);
  // Provide feedback to the user (customize as needed)
  alert('Sale removed successfully!');
}

// Function to handle sale update
function updateSale(saleId) {
  const updatedLeadId = prompt('Enter updated Lead ID:');
  const updatedEsiConsent = prompt('Enter updated ESI Consent:');
  const updatedSaleType = prompt('Enter updated Sale Type:');

  const updatedData = {
    leadId: updatedLeadId,
    esiConsent: updatedEsiConsent,
    saleType: updatedSaleType,
    timestamp: ServerValue.TIMESTAMP,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString()
  };

  // Call the function to update sales data in Firebase
  updateSalesData(saleId, updatedData);

  // Provide feedback to the user (customize as needed)
  alert('Sale updated successfully!');
}

// Firebase Authentication - Sign Up
function signUp() {
  const email = prompt('Enter your email:');
  const password = prompt('Enter your password:');

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      console.log('User signed up:', user);
      // Provide feedback to the user (customize as needed)
      alert('Sign up successful!');
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Sign up error:', errorCode, errorMessage);
      // Provide feedback to the user (customize as needed)
      alert('Sign up failed. Check the console for details.');
    });
}

// Firebase Authentication - Sign In
function signIn() {
  const email = prompt('Enter your email:');
  const password = prompt('Enter your password:');

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      console.log('User signed in:', user);
      // Provide feedback to the user (customize as needed)
      alert('Sign in successful!');
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Sign in error:', errorCode, errorMessage);
      // Provide feedback to the user (customize as needed)
      alert('Sign in failed. Check the console for details.');
    });
}
