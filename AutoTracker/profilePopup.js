import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const profileButton = document.querySelector('.profile-button');
    const auth = getAuth();

    if (!profileButton) {
        console.error('Profile button element not found');
        return;
    }

    // Create popup container
    const popupContainer = document.createElement('div');
    popupContainer.classList.add('popup-container');
    popupContainer.style.display = 'none';

    // Create sign out button
    const signOutButton = document.createElement('button');
    signOutButton.textContent = 'Sign Out';
    signOutButton.classList.add('sign-out-button');

    popupContainer.appendChild(signOutButton);
    document.body.appendChild(popupContainer);

    // Show popup on profile button click
    profileButton.addEventListener('click', () => {
        popupContainer.style.display = 'block';
        const rect = profileButton.getBoundingClientRect();
        popupContainer.style.position = 'absolute';
        popupContainer.style.top = `${rect.bottom + window.scrollY}px`;
        popupContainer.style.left = `${rect.left + window.scrollX}px`;
    });

    // Hide popup when clicking outside of it
    document.addEventListener('click', (event) => {
        if (!popupContainer.contains(event.target) && !profileButton.contains(event.target)) {
            popupContainer.style.display = 'none';
        }
    });

    // Sign out user
    signOutButton.addEventListener('click', () => {
        signOut(auth).then(() => {
            console.log('User signed out');
            popupContainer.style.display = 'none';
        }).catch((error) => {
            console.error('Error signing out:', error);
        });
    });
});