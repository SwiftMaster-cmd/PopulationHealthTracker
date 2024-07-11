document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User authenticated:', user);
            window.displaySalesOutcomes(user); // Call the global function
        } else {
            auth.signInWithPopup(googleProvider).then((result) => {
                const user = result.user;
                console.log('User signed in:', user);
                window.displaySalesOutcomes(user); // Call the global function
            }).catch((error) => {
                console.error('Authentication error:', error);
            }); 
        }
    });

    // Email/Password Authentication
    const email = "user@example.com"; // Replace with user's email
    const password = "userpassword"; // Replace with user's password

    auth.signInWithEmailAndPassword(email, password)
        .then((result) => {
            const user = result.user;
            console.log('User signed in with email:', user);
            window.displaySalesOutcomes(user); // Call the global function
        })
        .catch((error) => {
            console.error('Email authentication error:', error);
        });
});