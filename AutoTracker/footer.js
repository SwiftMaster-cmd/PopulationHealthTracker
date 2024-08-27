document.addEventListener('DOMContentLoaded', function() {
    const footerButtonsContainer = document.getElementById('footer-buttons');
    let currentSection = localStorage.getItem('currentSection') || 'leaderboard'; // Default to leaderboard if none saved

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
                showSettingsFooter();
                break;
            default:
                document.querySelector('.leaderboard-container').style.display = 'block';
        }

        if (section !== 'leaderboard') {
            currentSection = section; // Track the current section
            localStorage.setItem('currentSection', section); // Save the current section to localStorage
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

    function showSettingsFooter() {
        footerButtonsContainer.innerHTML = `
            <button id="backButton" class="footer-button">Back</button>
            <button id="cheatSheetButton" class="footer-button">Cheat Sheet</button>
            <button onclick="window.location.href='Dash2.html'" class="footer-button">Donate</button>
            <input type="color" id="colorPicker" class="footer-input" />
            <button id="applyColor" class="footer-button">Apply Color Palette</button>
            <input type="text" id="nameInput" class="footer-input" placeholder="Enter new name" />
            <button id="changeName" class="footer-button">Change Name</button>
            <button id="signOut" class="footer-button">Sign Out</button>
            <button id="googleSignInButton" class="footer-button">Link with Google</button>
            <button id="copyBookmarkletButton" class="footer-button">Copy AutoTracker Script</button>
        `;

        document.getElementById('backButton').addEventListener('click', () => {
            resetFooter(); // Reset the footer buttons back to the original state
        });

        // Add your event listeners here for settings buttons if needed
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
    if (currentSection.startsWith('chart') || currentSection === 'settings') {
        showSection(currentSection);
    } else {
        showSection('leaderboard');
    }
});
