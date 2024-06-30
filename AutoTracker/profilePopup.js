document.addEventListener('DOMContentLoaded', () => {
    const profileButton = document.querySelector('.profile-button');
    const colorPickerContainer = document.getElementById('colorPickerContainer');
    const signOutButton = document.getElementById('signOut');

    profileButton.addEventListener('click', () => {
        colorPickerContainer.style.display = colorPickerContainer.style.display === 'none' ? 'block' : 'none';
    });

    signOutButton.addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            window.location.href = '/Users/micah/Documents/GitHub/PopulationHealthTracker';
        }).catch((error) => {
            console.error('Sign out error:', error);
        });
    });
});