import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBhSqBwrg8GYyaqpYHOZS8HtFlcXZ09OJA",
    authDomain: "track-dac15.firebaseapp.com",
    databaseURL: "https://track-dac15-default-rtdb.firebaseio.com",
    projectId: "track-dac15",
    storageBucket: "track-dac15.appspot.com",
    messagingSenderId: "495156821305",
    appId: "1:495156821305:web:7cbb86d257ddf9f0c3bce8",
    measurementId: "G-RVBYB0RR06"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// User Registration Function
async function registerUser(email, password, firstName, lastName, teamName, teamManager, phoneNumber) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User registered:', userCredential.user);

        // Send email verification
        await sendEmailVerification(userCredential.user);
        console.log('Verification email sent.');

        // Save additional user data in Realtime Database
        const userDataRef = ref(database, 'users/' + userCredential.user.uid);
        await set(userDataRef, {
            firstName,
            lastName,
            teamName,
            teamManager,
            phoneNumber
        });
    } catch (error) {
        console.error('Registration error:', error);
    }
}

// User Login Function
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in:', userCredential.user);
    } catch (error) {
        console.error('Login error:', error);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registerButton').addEventListener('click', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const teamName = document.getElementById('teamName').value;
        const teamManager = document.getElementById('teamManager').value;
        const phoneNumber = document.getElementById('phoneNumber').value;
        
        registerUser(email, password, firstName, lastName, teamName, teamManager, phoneNumber);
    });

    document.getElementById('loginButton').addEventListener('click', () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        loginUser(email, password);
    });
});