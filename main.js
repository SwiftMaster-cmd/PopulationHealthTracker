// Reference to the Firebase authentication service
const auth = firebase.auth();

// Reference to the Firebase Realtime Database
const db = firebase.database();

// Registration function
function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const name = document.getElementById('register-name').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // User successfully registered
            const user = userCredential.user;

            // Add user data to the Realtime Database
            db.ref('users/' + user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });

            // Log in the user
            displayUserInfo(user.uid);
        })
        .catch(error => {
            console.error(error.message);
            alert("Registration failed. Please check your information.");
        });
}

// Login function
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            // User successfully logged in
            const user = userCredential.user;
            displayUserInfo(user.uid);
        })
        .catch(error => {
            console.error(error.message);
            alert("Login failed. Check your credentials.");
        });
}

// Logout function
function logout() {
    auth.signOut().then(() => {
        // User successfully logged out
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('user-info').style.display = 'none';
    });
}

// Display user information after login
function displayUserInfo(uid) {
    const userRef = db.ref("users/" + uid);

    // Subscribe to real-time updates
    userRef.on("value", snapshot => {
        const userData = snapshot.val();

        if (userData) {
            const userName = userData.name;

            document.getElementById('login-form').style.display = 'none';
            document.getElementById('user-info').style.display = 'block';
            document.getElementById('user-name').innerText = userName;
        } else {
            console.error("User data not found.");
        }
    }, error => {
        console.error(error.message);
    });
}
