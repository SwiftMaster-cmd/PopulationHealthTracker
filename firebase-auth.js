import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/analytics';
// Import Firebase SDK modules
// Firebase configuration
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
firebase.initializeApp(firebaseConfig);
firebase.analytics();

// Get a reference to the authentication service
var auth = firebase.auth();

// Get elements
var loginForm = document.getElementById('login-form');
var signupForm = document.getElementById('signup-form');
var loginMessage = document.getElementById('login-message');
var signupMessage = document.getElementById('signup-message');

// Listen for login form submission
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    var email = loginForm['email'].value;
    var password = loginForm['password'].value;

    // Sign in
    auth.signInWithEmailAndPassword(email, password).then(function(userCredential) {
        // Signed in 
        loginMessage.textContent = 'Logged in successfully.';
        setTimeout(function() {
            window.location.href = 'homepage.html'; // Redirect to homepage
        }, 2000);
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        loginMessage.textContent = 'Error: ' + errorMessage;
    });
});

// Listen for signup form submission
signupForm.addEventListener('submit', function(e) {
    e.preventDefault();

    var email = signupForm['signup-email'].value;
    var password = signupForm['signup-password'].value;

    // Sign up
    auth.createUserWithEmailAndPassword(email, password).then(function(userCredential) {
        // Signed up
        signupMessage.textContent = 'Sign up successful. You can now log in.';
        signupForm.reset();
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        signupMessage.textContent = 'Error: ' + errorMessage;
    });
});
