// auth.js
document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User authenticated:', user);
            window.displaySalesOutcomes(user); // Call the global function
        } else {
            auth.signInWithPopup(provider).then((result) => {
                const user = result.user;
                console.log('User signed in:', user);
                window.displaySalesOutcomes(user); // Call the global function
            }).catch((error) => {
                console.error('Authentication error:', error);
            });
        }
    });
});