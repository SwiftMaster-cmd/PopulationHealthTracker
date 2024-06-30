document.addEventListener('DOMContentLoaded', () => {
    const profileButton = document.querySelector('.profile-button');
    const colorPickerContainer = document.getElementById('colorPickerContainer');

    profileButton.addEventListener('click', () => {
        colorPickerContainer.style.display = colorPickerContainer.style.display === 'none' ? 'block' : 'none';
    });
});