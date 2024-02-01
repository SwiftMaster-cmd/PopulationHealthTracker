// Import Firebase modules
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

// Initialize Firebase Auth and Database
const auth = getAuth();
const database = getDatabase();
const provider = new GoogleAuthProvider(); // Google Auth Provider

document.getElementById('registerBtn').addEventListener('click', signUp);
document.getElementById('googleSignInBtn').addEventListener('click', googleSignIn);

function signUp() {
    // existing signUp code
}

function googleSignIn() {
    signInWithPopup(auth, provider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = result.credential;
            const token = credential.accessToken;
            // The signed-in user info.
            const user = result.user;

            // Update or set user data in the database
            const userData = {
                email: user.email,
                full_name: user.displayName,
                // Add or modify fields as needed
            };

            set(ref(database, `users/${user.uid}`), userData);

            alert('User signed in with Google!');
            // Redirect or other actions
        })
        .catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.email;
            // The AuthCredential type that was used.
            const credential = error.credential;

            alert(`Google sign-in failed: ${errorMessage}`);
        });
}

function validateEmail(email) {
    // existing validateEmail code
}

function validatePassword(password) {
    // existing validatePassword code
}
