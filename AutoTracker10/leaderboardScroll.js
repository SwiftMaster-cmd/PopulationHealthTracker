document.addEventListener('DOMContentLoaded', () => {
    let currentStartIndex = 0;
    const usersPerPage = 5; // Adjust this value to the number of users displayed per page
    const leaderboardSection = document.getElementById('leaderboard-section');

    const upButton = document.createElement('button');
    upButton.textContent = 'Scroll Up';
    upButton.classList.add('scroll-button');
    leaderboardSection.parentElement.insertBefore(upButton, leaderboardSection);

    const downButton = document.createElement('button');
    downButton.textContent = 'Scroll Down';
    downButton.classList.add('scroll-button');
    leaderboardSection.parentElement.appendChild(downButton);

    upButton.addEventListener('click', () => scrollLeaderboard(-1));
    downButton.addEventListener('click', () => scrollLeaderboard(1));

    function scrollLeaderboard(direction) {
        const totalUsers = leaderboardSection.children.length;
        const newIndex = currentStartIndex + direction;

        if (newIndex < 0 || newIndex + usersPerPage > totalUsers) {
            return; // Do nothing if the new index is out of bounds
        }

        currentStartIndex = newIndex;
        updateLeaderboardDisplay();
    }

    function updateLeaderboardDisplay() {
        const totalUsers = leaderboardSection.children.length;

        // Hide all leaderboard items
        for (let i = 0; i < totalUsers; i++) {
            leaderboardSection.children[i].style.display = 'none';
        }

        // Show the items in the current range
        for (let i = currentStartIndex; i < currentStartIndex + usersPerPage; i++) {
            if (i < totalUsers) {
                leaderboardSection.children[i].style.display = 'block';
            }
        }

        // Disable buttons if at the bounds
        upButton.disabled = currentStartIndex === 0;
        downButton.disabled = currentStartIndex + usersPerPage >= totalUsers;
    }

    // Initial load
    updateLeaderboardDisplay();
});