// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAj5ac2MoocLPRcKNZg1ya2SMcksbaIfWY",
    authDomain: "pophealthtracker.firebaseapp.com",
    databaseURL: "https://pophealthtracker.firebaseio.com",
    projectId: "pophealthtracker",
    storageBucket: "pophealthtracker.appspot.com",
    messagingSenderId: "934873881816",
    appId: "1:934873881816:web:fde6a268c880b9139f0bad",
    measurementId: "G-6S10R2SD81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

// Function to handle user registration
function register() {
    
    const email = document.getElementById('signup_email').value.trim();
    const password = document.getElementById('signup_password').value.trim();
    // ... rest of the function
    const full_name = document.getElementById('full_name').value.trim();
    const favourite_song = document.getElementById('favourite_song').value.trim();
    const milk_before_cereal = document.getElementById('milk_before_cereal').value.trim();

    if (!validate_email(email) || !validate_password(password)) {
        alert('Invalid email or password. Make sure your email is correct and password is at least 6 characters long.');
        return;
    }

    if (!validate_field(full_name) || !validate_field(favourite_song) || !validate_field(milk_before_cereal)) {
        alert('All fields are required.');
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // User registered
            // Save additional user data to the database
            const user = userCredential.user;
            const userDataRef = ref(database, 'users/' + user.uid);
            set(userDataRef, {
                full_name: full_name,
                favourite_song: favourite_song,
                milk_before_cereal: milk_before_cereal,
                last_login: Date.now()
            });

            alert('User registered successfully!');
            // Redirect to login.html or other page
            window.location.href = 'login.html';
        })
        .catch((error) => {
            const errorMessage = error.message;
            alert(`Registration failed: ${errorMessage}`);
        });
}


// Function to add sale data to Firebase Realtime Database
function addSaleData() {
    let leadId = document.getElementById('lead_id').value.trim();
    let esiConsent = document.querySelector('input[name="esi_consent"]:checked').value;
    let saleType = document.getElementById('sale_type').value.trim();
    let timestamp = Date.now();

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

    push(ref(database, 'sales'), saleData)
        .then(() => {
            alert('Sale Data Added Successfully!');
        })
        .catch((error) => {
            alert(`Failed to add sale data: ${error.message}`);
        });
}

// Function to handle user login
function loginUser() {
    const email = document.getElementById('login_email').value.trim();
    const password = document.getElementById('login_password').value.trim();

    if (!validate_email(email) || !validate_password(password)) {
        alert('Invalid email or password. Make sure your email is correct and password is at least 6 characters long.');
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // User signed in
            alert('Login successful!');
            // Redirect to add-sales.html
            window.location.href = 'add-sales.html';
        })
        .catch((error) => {
            const errorMessage = error.message;
            alert(`Login failed: ${errorMessage}`);
        });
}

// Function to validate email
function validate_email(email) {
    const expression = /^[^@]+@\w+(\.\w+)+\w$/;
    return expression.test(email);
}

// Function to validate password
function validate_password(password) {
    return password.length >= 6;
}

// Function to validate field
function validate_field(field) {
    return field && field.trim().length > 0;
}

// Real-time listener setup for a specific path in your database
function setupRealtimeListener() {
    const salesRef = ref(database, 'sales');
    onValue(salesRef, (snapshot) => {
        const salesData = snapshot.val();
        updateSalesUI(salesData);
    }, (error) => {
        console.error('Failed to read data:', error);
    });
}

// Example function to update sales UI with real-time data
function updateSalesUI(salesData) {
    // Implement how you want to update your UI with salesData here
}

// Call the function to set up the real-time listener
setupRealtimeListener();