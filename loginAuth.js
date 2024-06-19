import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
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

        const roleRef = ref(database, `users/${user.uid}/role`);
        const snapshot = await get(roleRef);

        if (snapshot.exists()) {
            const role = snapshot.val();
            if (role === 'manager') {
                window.location.href = 'owner-portal.html';
            } else {
                window.location.href = 'user-dashboard.html';
            }
        } else {
            window.location.href = 'user-dashboard.html';
        }
    } catch (error) {
        console.error('Error during Google sign-in:', error);
    }
}

async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDataRef = ref(database, 'users/' + user.uid);
        await set(userDataRef, { email: user.email });
    } catch (error) {
        console.error('Registration error:', error);
    }
}

async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('User logged in:', user);
    } catch (error) {
        console.error('Login error:', error);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('googleSignInButton').addEventListener('click', googleSignIn);
    document.getElementById('emailSignInButton').addEventListener('click', () => {
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
        loginUser(email, password);
    });
    document.getElementById('registerButton').addEventListener('click', () => {
        const email = document.getElementById('regEmailInput').value;
        const password = document.getElementById('regPasswordInput').value;
        registerUser(email, password);
    });
});