// settings.js
document.addEventListener('DOMContentLoaded', function() {
    const settingsContainer = document.getElementById('settingsContainer');
    const backToMainButton = document.getElementById('backToMain');

    // Show settings section
    function showSettings() {
        hideAllSections();
        settingsContainer.style.display = 'block';
    }

    // Go back to the main section (e.g., leaderboard)
    backToMainButton.addEventListener('click', function() {
        settingsContainer.style.display = 'none';
        // Adjust this to go back to the default or previously selected section
        document.querySelector('.leaderboard-container').style.display = 'block';
    });

    // Hide all sections initially
    function hideAllSections() {
        const sections = document.querySelectorAll('.dynamic-content-container > div');
        sections.forEach(section => section.style.display = 'none');
    }

    // Additional logic for each settings button can be added here
    // e.g., handling color changes, linking with Google, etc.
});
