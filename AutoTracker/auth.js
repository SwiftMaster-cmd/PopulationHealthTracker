document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const MAX_LOGIN_DURATION = 9 * 60 * 60 * 1000; // 9 hours in milliseconds

    auth.onAuthStateChanged(user => {
        if (user) {
            const loginTime = localStorage.getItem('loginTime');
            if (loginTime) {
                const elapsedTime = Date.now() - parseInt(loginTime, 10);
                if (elapsedTime > MAX_LOGIN_DURATION) {
                    console.log('Login duration exceeded. Logging out.');
                    auth.signOut();
                    localStorage.removeItem('loginTime');
                    document.getElementById('auth-container').style.display = 'block'; // Show the sign-in form
                } else {
                    console.log('User authenticated:', user);
                    window.displaySalesOutcomes(user); // Call the global function
                }
            } else {
                // Set the login time if not already set
                localStorage.setItem('loginTime', Date.now().toString());
                console.log('User authenticated:', user);
                window.displaySalesOutcomes(user); // Call the global function
            }
        } else {
            // Show the sign-in form if no user is authenticated
            document.getElementById('auth-container').style.display = 'block';
        }
    });

    // Handle Email/Password Sign-In
    document.getElementById('email-signin-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;

        auth.signInWithEmailAndPassword(email, password)
            .then((result) => {
                const user = result.user;
                console.log('User signed in with email:', user);
                localStorage.setItem('loginTime', Date.now().toString()); // Set the login time
                window.displaySalesOutcomes(user); // Call the global function
                document.getElementById('auth-container').style.display = 'none'; // Hide the sign-in form
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;

                if (errorCode === 'auth/wrong-password') {
                    alert('Wrong password. Please try again.');
                } else if (errorCode === 'auth/user-not-found') {
                    alert('No user found with this email. Please sign up.');
                } else if (errorCode === 'auth/invalid-email') {
                    alert('Invalid email format.');
                } else {
                    alert(errorMessage);
                }
                console.error('Email authentication error:', error);
            });
    });
});