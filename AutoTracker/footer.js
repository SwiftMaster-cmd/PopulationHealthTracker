document.addEventListener('DOMContentLoaded', function() {
    const footerButtons = document.querySelectorAll('.footer-button');

    function showSection(section) {
        const sections = document.querySelectorAll('.dynamic-content-container > div');
        sections.forEach(sec => sec.style.display = 'none'); // Hide all sections

        switch (section) {
            case 'leaderboard':
                document.querySelector('.leaderboard-container').style.display = 'block';
                document.querySelector('.live-activities-container').style.display = 'block';
                break;
            case 'live-activities':
                document.querySelector('.live-activities-container').style.display = 'block';
                break;
            case 'day-chart':
                document.getElementById('chartContainerDay').style.display = 'block';
                break;
            case 'week-chart':
                document.getElementById('chartContainerWeek').style.display = 'block';
                break;
            case 'month-chart':
                document.getElementById('chartContainerMonth').style.display = 'block';
                break;
            default:
                document.querySelector('.leaderboard-container').style.display = 'block';
                document.querySelector('.live-activities-container').style.display = 'block';
        }
    }

    // Add event listeners to footer buttons
    footerButtons.forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Show default sections (leaderboard and live activities)
    showSection('leaderboard');
});
