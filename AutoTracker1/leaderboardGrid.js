document.addEventListener('DOMContentLoaded', function() {
    const availableComponents = {
        leaderboard: `
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
            </div>`
        // Add other components like charts, live activities, etc.
    };

    // Function to handle selecting a component
    function placeComponent(container, component) {
        if (container && !container.classList.contains('occupied')) {
            container.innerHTML = availableComponents[component];
            container.classList.add('occupied');
        }
    }

    // Attach event listeners to each grid-item
    document.querySelectorAll('.grid-item').forEach(item => {
        item.addEventListener('click', function() {
            const component = prompt("Enter the component you want to place (e.g., leaderboard):");
            if (availableComponents[component]) {
                placeComponent(item, component);
            } else {
                alert('Invalid component selected.');
            }
        });
    });
});
