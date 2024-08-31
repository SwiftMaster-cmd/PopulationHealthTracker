document.addEventListener('DOMContentLoaded', function() {
    const leaderboardHTML = `
        <div class="leaderboard-container">
            <div class="leaderboard-header">
                <h3 id="leaderboard-title">Leaderboard: Select RX</h3>
                <div class="picker-header">
                    <select id="periodPicker" class="picker">
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                    </select>
                    <select id="saleTypePicker" class="picker">
                        <option value="selectRX">S.R.X.</option>
                        <option value="billableHRA">H.R.A.</option>
                        <option value="transfer">Partner</option>
                        <option value="selectPatientManagement">S.P.M.</option>
                    </select>
                </div>
            </div>
            <div id="leaderboard-section">
                <div class="leaderboard-item">
                    <!-- Leaderboard items here -->
                </div>
            </div>
        </div>`;

    // Function to place the leaderboard in the selected container
    function placeLeaderboard(container) {
        if (container && !container.classList.contains('occupied')) {
            container.innerHTML = leaderboardHTML;
            container.classList.add('occupied');
        }
    }

    // Attach event listeners to each grid-item
    document.querySelectorAll('.grid-item').forEach(item => {
        item.addEventListener('click', function() {
            // Only proceed if the container is not occupied
            if (!item.classList.contains('occupied')) {
                // Prompt or automatically place the leaderboard in the container
                const confirmed = confirm("Do you want to place the leaderboard here?");
                if (confirmed) {
                    placeLeaderboard(item);
                }
            }
        });
    });
});
