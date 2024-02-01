// Import Firebase modules
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

// Initialize Firebase Auth and Database
const auth = getAuth();
const database = getDatabase();

document.getElementById('registerBtn').addEventListener('click', signUp);

function signUp() {
    const email = document.getElementById('signup_email').value.trim();
    const password = document.getElementById('signup_password').value.trim();
    const fullName = document.getElementById('full_name').value.trim();
    const favouriteSong = document.getElementById('favourite_song').value.trim();
    const milkBeforeCereal = document.getElementById('milk_before_cereal').value.trim();

    if (!validateEmail(email) || !validatePassword(password)) {
        alert('Invalid email or password. Make sure your email is correct and password is at least 6 characters long.');
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // User registration successful
            const user = userCredential.user;
            const userData = {
                email: email,
                full_name: fullName,
                favourite_song: favouriteSong,
                milk_before_cereal: milkBeforeCereal,
                last_login: Date.now()
            };

            set(ref(database, `users/${user.uid}`), userData);

            alert('User Created!');
            // Redirect or other actions
        })
        .catch((error) => {
            // Handle Errors here
            const errorMessage = error.message;
            alert(`Registration failed: ${errorMessage}`);
        });
}

function validateEmail(email) {
    const expression = /^[^@]+@\w+(\.\w+)+\w$/;
    return expression.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}
