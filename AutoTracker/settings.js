// settings.js

document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const database = firebase.database();

    const userNameInput = document.getElementById('userNameInput');
    const saveNameButton = document.getElementById('saveNameButton');

    auth.onAuthStateChanged(user => {
        if (user) {
            loadUserName(user);
        }
    });

    function loadUserName(user) {
        const userRef = database.ref('Users/' + user.uid);

        userRef.once('value').then(snapshot => {
            const userData = snapshot.val();
            if (userData && userData.name) {
                userNameInput.value = userData.name;
            } else {
                userNameInput.value = '';
            }
        }).catch(error => {
            console.error('Error loading user name:', error);
        });
    }

    saveNameButton.addEventListener('click', () => {
        const user = auth.currentUser;
        if (user) {
            const userName = userNameInput.value.trim() || 'No name';
            const userRef = database.ref('Users/' + user.uid);
            userRef.update({ name: userName }).then(() => {
                alert('Name updated successfully!');
            }).catch(error => {
                console.error('Error updating user name:', error);
            });
        } else {
            alert('User not authenticated.');
        }
    });
});
