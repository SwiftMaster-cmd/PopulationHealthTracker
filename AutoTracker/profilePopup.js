document.addEventListener('DOMContentLoaded', () => {
    const profileButton = document.querySelector('.profile-button');
    const colorPickerContainer = document.getElementById('colorPickerContainer');

    profileButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the click from closing the popup
        colorPickerContainer.style.display = colorPickerContainer.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (event) => {
        if (!colorPickerContainer.contains(event.target) && !profileButton.contains(event.target)) {
            colorPickerContainer.style.display = 'none';
        }
    });
});