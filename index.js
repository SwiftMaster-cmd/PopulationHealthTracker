// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

// Your web app's Firebase configuration
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

function register() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const full_name = document.getElementById('full_name').value.trim();
    const favourite_song = document.getElementById('favourite_song').value.trim();
    const milk_before_cereal = document.getElementById('milk_before_cereal').value.trim();

    if (!validate_email(email) || !validate_password(password)) {
        alert('Invalid email or password. Make sure your email is correct and password is at least 6 characters long.');
        return;
    }

    if (!validate_field(full_name) || !validate_field(favourite_song) || !validate_field(milk_before_cereal)) {
        alert('All fields are required. Please fill in all the information.');
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            const user = auth.currentUser;
            const database_ref = ref(database);

            const user_data = {
                email: email,
                full_name: full_name,
                favourite_song: favourite_song,
                milk_before_cereal: milk_before_cereal,
                last_login: Date.now()
            };

            push(ref(database, `users/${user.uid}`), user_data);

            alert('User Created!!');
        })
        .catch((error) => {
            const error_message = error.message;
            alert(`Registration failed: ${error_message}`);
        });
}

function addSaleData() {
    const leadId = document.getElementById('lead_id').value.trim();
    const esiConsent = document.getElementById('esi_consent').value.trim();
    const saleType = document.getElementById('sale_type').value.trim();
    const timestamp = Date.now();

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
