// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhSqBwrg8GYyaqpYHOZS8HtFlcXZ09OJA",
  authDomain: "track-dac15.firebaseapp.com",
  projectId: "track-dac15",
  storageBucket: "track-dac15.appspot.com",
  messagingSenderId: "495156821305",
  appId: "1:495156821305:web:7cbb86d257ddf9f0c3bce8",
  measurementId: "G-RVBYB0RR06"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);



// Get the signup form
const signupForm = document.getElementById('signup-form');

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = signupForm['signup-email'].value;
    const password = signupForm['signup-password'].value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up 
            const user = userCredential.user;
            console.log('User created:', user.email);
            displayMessage('User created successfully.', 'signup-message');
            // Optional: Redirect or clear form
            signupForm.reset();
        })
        .catch((error) => {
            console.error('Error during signup:', error.message);
            displayMessage(`Error during signup: ${error.message}`, 'signup-message');
        });
});

// Reuse the displayMessage function or create a new one for sign up
function displayMessage(message, elementId) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
    }
}




// Get the login form
const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const email = loginForm['email'].value;
  const password = loginForm['password'].value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in 
      const user = userCredential.user;
      console.log('Logged in as:', user.email);
      displayMessage('Logged in successfully. Redirecting...');

      setTimeout(() => {
        window.location.href = 'homepage.html'; // Redirect after a short delay
      }, 2000);
    })
    .catch((error) => {
      console.error('Error during login:', error.message);
      displayMessage(`Error during login: ${error.message}`);
    });
});

// Function to display messages to the user
function displayMessage(message) {
  const messageElement = document.getElementById('message');
  if (messageElement) {
    messageElement.textContent = message;
  }
}

// Check for authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is logged in:', user);
    displayMessage(`Logged in as: ${user.email}`);
  } else {
    console.log('User is logged out');
    displayMessage('User is logged out');
  }
});
