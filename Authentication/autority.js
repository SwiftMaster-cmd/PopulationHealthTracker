<!DOCTYPE html>
<html>
<head>
    <title>Welcome to Work!</title>
    <link rel="stylesheet" href="login-style.css">
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
        import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
        import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

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

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const database = getDatabase(app);

        // Function to set authority level for a user
        async function setAuthorityLevel(userId, level) {
            const userRef = ref(database, `users/${userId}/authorityLevel`);
            await set(userRef, level);
        }

        // Function to get authority level for a user
        async function getAuthorityLevel(userId) {
            const userRef = ref(database, `users/${userId}/authorityLevel`);
            const snapshot = await get(userRef);
            return snapshot.val();
        }

        // Function to check and set default authority level if not set
        async function checkAndSetAuthorityLevel(userId) {
            const currentLevel = await getAuthorityLevel(userId);
            if (currentLevel === null) {
                await setAuthorityLevel(userId, 1); // Set default level to 1 (employee)
                return 1;
            }
            return currentLevel;
        }

        // Function to redirect based on authority level
        function redirectBasedOnAuthority(authorityLevel) {
            switch(authorityLevel) {
                case 1:
                    window.location.href = 'AutoTracker/Dash2.html';
                    break;
                case 2:
                    window.location.href = 'manager.html';
                    break;
                case 3:
                    window.location.href = 'owner.html';
                    break;
                default:
                    console.error('Unknown authority level');
                    alert('Error: Unknown user type. Please contact support.');
            }
        }

        async function emailPasswordSignIn(email, password) {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const authorityLevel = await checkAndSetAuthorityLevel(userCredential.user.uid);
                redirectBasedOnAuthority(authorityLevel);
            } catch (error) {
                console.error('Error during email sign-in:', error);
                alert('Failed to sign in. Please check your email and password.');
            }
        }

        async function registerUser(email, password) {
            if (!email.includes('@') || !email.includes('.')) {
                alert('Please enter a valid email address.');
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(userCredential.user);

                const userDataRef = ref(database, 'users/' + userCredential.user.uid);
                await set(userDataRef, {
                    email: email,
                    authorityLevel: 1 // Set default authority level for new users
                });

                alert('Registration successful. A verification email has been sent. Please check your email.');
                window.location.href = 'index.html';
            } catch (error) {
                if (error.code === 'auth/email-already-in-use') {
                    alert('This email is already in use. Please use a different email or reset your password.');
                } else {
                    console.error('Error during registration:', error);
                    alert(`Registration failed: ${error.message}`);
                }
            }
        }

        // Listen for authentication state changes
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const authorityLevel = await checkAndSetAuthorityLevel(user.uid);
                console.log(`User ${user.uid} has authority level: ${authorityLevel}`);
                redirectBasedOnAuthority(authorityLevel);
            } else {
                console.log('No user is signed in.');
            }
        });

        window.addEventListener('DOMContentLoaded', () => {
            document.getElementById('emailSignInButton').addEventListener('click', () => {
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                emailPasswordSignIn(email, password);
            });
            document.getElementById('registerButton').addEventListener('click', () => {
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                registerUser(email, password);
            });
            document.getElementById('setupButton').addEventListener('click', () => {
                window.location.href = 'AutoTracker/NewUser.html';
            });
        });
    </script>
</head>
<body>
    <div class="container">
        <div class="login-container">
            <h2>Please Sign In</h2>
            <div class="form-group">
                <input type="email" id="loginEmail" placeholder="Email" required>
                <input type="password" id="loginPassword" placeholder="Password" required>
                <button id="emailSignInButton">Login</button>
            </div>
        </div>
        <div class="register-container">
            <h2>Create an Account</h2>
            <div class="form-group">
                <input type="email" id="registerEmail" placeholder="Email" required>
                <input type="password" id="registerPassword" placeholder="Password" required>
                <button id="registerButton">Register</button>
            </div>
        </div>
        <div class="setup-container">
            <button id="setupButton">New here? Click me to set up the AutoTracker</button>
        </div>
    </div>
</body>
</html>