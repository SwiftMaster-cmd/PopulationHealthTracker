document.addEventListener('DOMContentLoaded', () => {
    const leaderboardSection = document.getElementById('leaderboard-section');
    const currentUserElement = leaderboardSection.querySelector('.leaderboard-item[style*="color: var(--color-quinary)"]');

    let scrollTimeout;

    // Scroll up
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            scrollLeaderboard(-1);
        }
    });

    // Scroll down
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            scrollLeaderboard(1);
        }
    });

    // Scroll leaderboard by a certain number of items
    function scrollLeaderboard(offset) {
        if (!leaderboardSection) return;

        const items = leaderboardSection.querySelectorAll('.leaderboard-item');
        const visibleItems = Array.from(items).filter(item => isVisible(item));

        if (visibleItems.length === 0) return;

        const firstVisibleItem = visibleItems[0];
        const lastVisibleItem = visibleItems[visibleItems.length - 1];
        let targetItem;

        if (offset < 0) {
            targetItem = firstVisibleItem.previousElementSibling;
        } else {
            targetItem = lastVisibleItem.nextElementSibling;
        }

        if (targetItem) {
            targetItem.scrollIntoView({ behavior: 'smooth' });
        }

        resetScrollTimeout();
    }

    // Check if an item is visible in the container
    function isVisible(el) {
        const rect = el.getBoundingClientRect();
        const containerRect = leaderboardSection.getBoundingClientRect();

        return rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
    }

    // Reset scroll timeout and set it again
    function resetScrollTimeout() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        scrollTimeout = setTimeout(() => {
            scrollToCurrentUser();
        }, 10000); // 10 seconds
    }

    // Scroll to the current user's position and center it
    function scrollToCurrentUser() {
        if (currentUserElement) {
            const parentRect = leaderboardSection.getBoundingClientRect();
            const currentUserRect = currentUserElement.getBoundingClientRect();
            const scrollPosition = currentUserElement.offsetTop - parentRect.height / 2 + currentUserRect.height / 2;

            leaderboardSection.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        }
    }

    // Initially center the leaderboard on the current user
    scrollToCurrentUser();
});
