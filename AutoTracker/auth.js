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

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
        // Signed in
        var user = userCredential.user;
        console.log('User signed in:', user);
        // Perform any additional actions
    })
    .catch(error => {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;

        if (errorCode === 'auth/wrong-password') {
            alert('Wrong password. Please try again.');
        } else if (errorCode === 'auth/user-not-found') {
            alert('No user found with this email. Please sign up.');
        } else if (errorCode === 'auth/invalid-email') {
            alert('Invalid email format.');
        } else {
            alert(errorMessage);
        }
        console.error('Authentication error:', error);
    });