// Import necessary Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// Firebase configuration
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
const auth = getAuth(app);

// Function to handle user login
function loginUser() {
    const email = document.getElementById('login_email').value.trim();
    const password = document.getElementById('login_password').value.trim();

    if (!validate_email(email) || !validate_password(password)) {
        alert('Invalid email or password.');
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            alert('Login successful!');
            // Redirect or perform other actions after successful login
        })
        .catch((error) => {
            alert(`Login failed: ${error.message}`);
        });
}

// Email validation function
function validate_email(email) {
    const expression = /^[^@]+@\w+(\.\w+)+\w$/;
    return expression.test(email);
}

// Password validation function
function validate_password(password) {
    return password.length >= 6;
}

// Event listener for login button
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginButton'); // Ensure this ID matches your login button's ID
    if (loginButton) {
        loginButton.addEventListener('click', loginUser);
    }
});
