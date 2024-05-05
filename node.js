// Import the Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with service account credentials
const serviceAccount = require('./path/to/serviceAccountKey.json'); // Path to your service account key file
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com' // Replace with your database URL
});

// Get a reference to the Firebase Realtime Database
const db = admin.database();

// Function to save monthly goals for a user
function saveMonthlyGoals(userId, goals) {
  const goalsRef = db.ref(`users/${userId}/monthlyGoals`);
  return goalsRef.set(goals);
}

// Example usage
const userId = 'user123'; // Replace with the actual user ID
const monthlyGoals = {
  January: { goal: 'Read 5 books', progress: '2 out of 5 books read' },
  February: { goal: 'Exercise 3 times a week', progress: '1 time exercised' },
  // Add goals for other months as needed
};

saveMonthlyGoals(userId, monthlyGoals)
  .then(() => {
    console.log('Monthly goals saved successfully.');
  })
  .catch(error => {
    console.error('Error saving monthly goals:', error);
  });
