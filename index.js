import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();

// User Registration Function
async function registerUser(email, password, additionalData) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User registered:', userCredential.user);

        // Save additional user data in Realtime Database
        const userDataRef = ref(database, 'users/' + userCredential.user.uid);
        await set(userDataRef, additionalData);
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

// Google Sign-In Function
async function googleSignIn() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Fetch user role from Firebase Realtime Database correctly
        const roleRef = ref(database, `users/${user.uid}/role`);
        get(roleRef).then((snapshot) => {
            if (snapshot.exists()) {
                const role = snapshot.val();
                // Redirect based on role
                if (role === 'manager') {
                    window.location.href = 'manager-dashboard.html';
                } else {
                    window.location.href = 'user-dashboard.html';
                }
            } else {
                console.log('No specific role found, redirecting to user dashboard.');
                window.location.href = 'user-dashboard.html';
            }
        });
    } catch (error) {
        console.error('Error during Google sign-in:', error);
    }
}

// Add Sale Function
async function addSale(saleData) {
    try {
        const currentUser = auth.currentUser;
    