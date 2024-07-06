document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User authenticated:', user);
            window.displaySalesOutcomes(user); // Call the global function
        } else {
            // Show the sign-in form or Google sign-in button if no user is authenticated
            document.getElementById('auth-container').style.display = 'block';
        }
    });

    // Handle Google Sign-In
    document.getElementById('google-signin-button').addEventListener('click', () => {
        auth.signInWithPopup(googleProvider)
            .then((result) => {
                const user = result.user;
                console.log('User signed in with Google:', user);
                window.displaySalesOutcomes(user); // Call the global function
            })
            .catch((error) => {
                console.error('Google authentication error:', error);
            });
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
                window.displaySalesOutcomes(user); // Call the global function
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