document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    function signInWithGoogle() {
        auth.signInWithPopup(googleProvider).then((result) => {
            const user = result.user;
            console.log('User signed in:', user);
            window.displaySalesOutcomes(user); // Call the global function
        }).catch((error) => {
            console.error('Authentication error:', error);
            showErrorMessage('loginError', 'Failed to sign in with Google. Please try again.');
        });
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User authenticated:', user);
            window.displaySalesOutcomes(user); // Call the global function
        } else {
            signInWithGoogle();
        }
    });
});