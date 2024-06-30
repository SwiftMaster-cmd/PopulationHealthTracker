document.addEventListener('DOMContentLoaded', () => {
    const profileButton = document.querySelector('.profile-button');
    const colorPickerContainer = document.getElementById('colorPickerContainer');
    const changeNameButton = document.getElementById('changeName');
    const nameInput = document.getElementById('nameInput');

    profileButton.addEventListener('click', (event) => {
        event.stopPropagation();
        colorPickerContainer.style.display = colorPickerContainer.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (event) => {
        if (!colorPickerContainer.contains(event.target) && !profileButton.contains(event.target)) {
            colorPickerContainer.style.display = 'none';
        }
    });

    changeNameButton.addEventListener('click', () => {
        const newName = nameInput.value.trim();
        if (newName) {
            const user = firebase.auth().currentUser;
            if (user) {
                const usersRef = firebase.database().ref('users/' + user.uid);
                usersRef.update({ name: newName }).then(() => {
                    alert('Name updated successfully');
                    nameInput.value = '';
                }).catch((error) => {
                    console.error('Error updating name:', error);
                });
            }
        } else {
            alert('Please enter a valid name');
        }
    });

    const signOutButton = document.getElementById('signOut');
    signOutButton.addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            window.location.href = '/Users/micah/Documents/GitHub/PopulationHealthTracker';
        }).catch((error) => {
            console.error('Sign out error:', error);
        });
    });
});