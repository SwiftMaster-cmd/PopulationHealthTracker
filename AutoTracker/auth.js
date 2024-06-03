// auth.js
document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User authenticated:', user);
            displaySalesOutcomes(user);
        } else {
            auth.signInWithPopup(provider).then((result) => {
                const user = result.user;
                console.log('User signed in:', user);
                displaySalesOutcomes(user);
            }).catch((error) => {
                console.error('Authentication error:', error);
            });
        }
    });
});