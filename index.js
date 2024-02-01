import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

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

// Add Sale Function
async function addSale(saleData) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        const newSaleRef = push(ref(database, 'sales/' + currentUser.uid));
        await set(newSaleRef, saleData);
        console.log('Sale added successfully:', newSaleRef.key);
    } catch (error) {
        console.error('Error adding sale:', error);
    }
}

// Export the functions for use in other modules
export { registerUser, loginUser, addSale };
