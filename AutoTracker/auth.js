// auth.js

document.addEventListener('firebaseInitialized', function() {
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
});
// auth.js
// auth.js

auth.onAuthStateChanged(user => {
    if (user) {
        // Check if user's name is saved; if not, prompt for it
        checkUserName(user);
    } else {
        // Handle user not logged in
    }
});

function checkUserName(user) {
    const userRef = database.ref('Users/' + user.uid);

    userRef.once('value').then(snapshot => {
        const userData = snapshot.val();
        if (userData && userData.name) {
            // Name exists; proceed as normal
        } else {
            // Name does not exist; prompt user to enter it
            promptForUserName(user);
        }
    }).catch(error => {
        console.error('Error fetching user data:', error);
    });
}

function promptForUserName(user) {
    let userName = prompt('Please enter your name:');
    if (userName === null || userName.trim() === '') {
        userName = 'No name';
    }

    // Save the name in the database
    const userRef = database.ref('Users/' + user.uid);
    userRef.update({ name: userName }).then(() => {
        console.log('User name saved successfully.');
    }).catch(error => {
        console.error('Error saving user name:', error);
    });
}
