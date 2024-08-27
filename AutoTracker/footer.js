document.addEventListener('DOMContentLoaded', function() {
    const footerButtonsContainer = document.getElementById('footer-buttons');

    function showSection(section) {
        const sections = document.querySelectorAll('.dynamic-content-container > div');
        sections.forEach(sec => sec.style.display = 'none'); // Hide all sections

        switch (section) {
            case 'leaderboard':
                document.querySelector('.leaderboard-container').style.display = 'block';
                break;
            case 'live-activities':
                document.querySelector('.live-activities-container').style.display = 'block';
                break;
            case 'sales-history':
                document.getElementById('salesHistoryContainer').style.display = 'block';
                break;
            case 'monthly-sales-totals':
                document.getElementById('monthlySalesTotalsContainer').style.display = 'block';
                break;
            case 'day-chart':
                changeChart('day');
                showChartFooter();
                break;
            case 'week-chart':
                changeChart('week');
                showChartFooter();
                break;
            case 'month-chart':
                changeChart('month');
                showChartFooter();
                break;
            case 'settings':
                showSettings();
                break;
            default:
                document.querySelector('.leaderboard-container').style.display = 'block';
        }
    }

    function showChartFooter() {
        footerButtonsContainer.innerHTML = `
            <button id="backButton" class="footer-button">Back</button>
            <button data-chart="day" class="footer-button">Day Chart</button>
            <button data-chart="week" class="footer-button">Week Chart</button>
            <button data-chart="month" class="footer-button">Month Chart</button>
        `;

        document.getElementById('backButton').addEventListener('click', () => {
            resetFooter(); // Reset the footer buttons back to the original state
        });

        document.querySelectorAll('[data-chart]').forEach(button => {
            button.addEventListener('click', function() {
                const chartType = this.getAttribute('data-chart') + '-chart';
                showSection(chartType);
            });
        });
    }

    function showSettings() {
        const settingsContainer = document.getElementById('settingsContainer');
        hideAllSections();
        settingsContainer.style.display = 'block';
    }

    function hideAllSections() {
        const sections = document.querySelectorAll('.dynamic-content-container > div');
        sections.forEach(sec => sec.style.display = 'none'); // Hide all sections
    }

    function resetFooter() {
        footerButtonsContainer.innerHTML = `
            <button data-section="leaderboard" class="footer-button">Leaderboard</button>
            <button data-section="live-activities" class="footer-button">Live Activities</button>
            <button data-section="sales-history" class="footer-button">Sales History</button>
            <button data-section="monthly-sales-totals" class="footer-button">Monthly Totals</button>
            <button id="chartsButton" class="footer-button">Charts</button>
            <button id="settingsButton" class="footer-button">Settings</button>
        `;

        document.getElementById('chartsButton').addEventListener('click', () => {
            showSection('day-chart'); // Default to day chart when charts are selected
        });

        document.getElementById('settingsButton').addEventListener('click', () => {
            showSection('settings'); // Show settings when settings button is clicked
        });

        document.querySelectorAll('[data-section]').forEach(button => {
            button.addEventListener('click', function() {
                const section = this.getAttribute('data-section');
                showSection(section);
            });
        });
    }

    // Initialize the footer with the default buttons
    resetFooter();

    // Load the previously selected section or default to leaderboard
    let currentSection = localStorage.getItem('currentSection') || 'leaderboard';
    if (currentSection.startsWith('chart') || currentSection === 'settings') {
        showSection(currentSection);
    } else {
        showSection('leaderboard');
    }
});
