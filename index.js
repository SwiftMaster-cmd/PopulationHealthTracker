// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-analytics.js";

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
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-analytics.js";


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = firebase.auth();
const database = firebase.database();

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

    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            const user = auth.currentUser;
            const database_ref = database.ref();

            const user_data = {
                email: email,
                full_name: full_name,
                favourite_song: favourite_song,
                milk_before_cereal: milk_before_cereal,
                last_login: Date.now()
            };

            database_ref.child(`users/${user.uid}`).set(user_data);

            alert('User Created!!');
        })
        .catch((error) => {
            const error_message = error.message;
            alert(`Registration failed: ${error_message}`);
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
