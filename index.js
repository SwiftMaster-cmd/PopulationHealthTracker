// Your web app's Firebase configuration
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAj5ac2MoocLPRcKNZg1ya2SMcksbaIfWY",
    authDomain: "pophealthtracker.firebaseapp.com",
    databaseURL: "https://pophealthtracker-default-rtdb.firebaseio.com",
    projectId: "pophealthtracker",
    storageBucket: "pophealthtracker.appspot.com",
    messagingSenderId: "934873881816",
    appId: "1:934873881816:web:6c08dc670298fce29f0bad",
    measurementId: "G-3KGRYG8H8E"
};
// Initialize Fire
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

let login = true; // Initial state is login

// Function to handle user login
function login() {
    const email = document.getElementById('login_email').value.trim();
    const password = document.getElementById('login_password').value.trim();

    if (!validate_email(email) || !validate_password(password)) {
        alert('Invalid email or password.');
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            alert('Login successful!');
            // Redirect to the desired page or perform other actions after successful login
        })
        .catch((error) => {
            const error_message = error.message;
            alert(`Login failed: ${error_message}`);
        });
}

// Function to handle user registration
function signUp() {
    const email = document.getElementById('signup_email').value.trim();
    const password = document.getElementById('signup_password').value.trim();

    if (!validate_email(email) || !validate_password(password)) {
        alert('Invalid email or password. Make sure your email is correct and password is at least 6 characters long.');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            alert('User Created!');
            // Redirect to the desired page or perform other actions after successful registration
        })
        .catch((error) => {
            const error_message = error.message;
            alert(`Registration failed: ${error_message}`);
        });
}

// Function to add sale data to Firebase Realtime Database
function addSaleData() {
    const leadId = document.getElementById('lead_id').value.trim();
    const esiConsent = document.getElementById('esi_consent').value.trim();
    const saleType = document.getElementById('sale_type').value.trim();
    const timestamp = Date.now();

    // Validate input fields
    if (!validate_field(leadId) || !validate_field(esiConsent) || !validate_field(saleType)) {
        alert('All fields are required. Please fill in all the information.');
        return;
    }

    const saleData = {
        leadId: leadId,
        esiConsent: esiConsent,
        saleType: saleType,
        timestamp: timestamp
    };

    // Add sale data to the database
    database.ref('sales').push(saleData)
        .then(() => {
            alert('Sale Data Added Successfully!');
        })
        .catch((error) => {
            alert(`Failed to add sale data: ${error.message}`);
        });
}

// Validation functions
function validate_email(email) {
    const expression = /^[^@]+@\w+(\.\w+)+\w$/;
    return expression.test(email);
}

function validate_password(password) {
    return password.length >= 6;
}

function validate_field(field) {
    return field && field.trim().length > 0;
}

// Function to toggle between login and registration forms
function toggleForm() {
    login = !login; // Toggle between login and registration
    const loginForm = document.getElementById('loginForm');
    const registrationForm = document.getElementById('registrationForm');

    if (login) {
        loginForm.style.display = 'block';
        registrationForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registrationForm.style.display = 'block';
    }
}