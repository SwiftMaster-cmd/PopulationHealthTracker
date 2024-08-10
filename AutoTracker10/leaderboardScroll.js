document.addEventListener('DOMContentLoaded', function () {
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const scrollUpButton = document.getElementById('scroll-up');
    const scrollDownButton = document.getElementById('scroll-down');

    // Adjust the scroll amount as needed (e.g., 100px per click)
    const scrollAmount = 100;

    scrollUpButton.addEventListener('click', function () {
        leaderboardContainer.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        updateRankingPosition();
    });

    scrollDownButton.addEventListener('click', function () {
        leaderboardContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        updateRankingPosition();
    });

    function updateRankingPosition() {
        const leaderboardItems = document.querySelectorAll('#leaderboard .leaderboard-item');
        leaderboardItems.forEach((item, index) => {
            // Calculate the current position based on the order of items
            const position = index + 1;
            item.querySelector('.rank').textContent = `#${position}`;
        });
    }

    // Optional: Initialize the ranking positions when the page loads
    updateRankingPosition();
});