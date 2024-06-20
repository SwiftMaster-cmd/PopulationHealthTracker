import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

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
const provider = new GoogleAuthProvider();

async function googleSignIn() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Save user email to the database under the 'users' node
        const userRef = ref(database, 'users/' + user.uid);
        await set(userRef, {
            email: user.email
        });

        // Redirect to the user dashboard
        window.location.href = 'user-dashboard.html';
    } catch (error) {
        console.error('Error during Google sign-in:', error);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('googleSignInButton').addEventListener('click', googleSignIn);
});