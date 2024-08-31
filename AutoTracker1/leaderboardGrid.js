document.addEventListener('DOMContentLoaded', function() {
    // Define the available components as HTML strings
    const components = {
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
            </div>`,
        // Additional components can be added here
    };

    // Function to place a selected component into a container
    function placeComponent(container, component) {
        if (container && !container.classList.contains('occupied')) {
            container.innerHTML = component;
            container.classList.add('occupied'); // Mark the container as occupied
        }
    }

    // Attach event listeners to each grid-item
    document.querySelectorAll('.grid-item').forEach(item => {
        item.addEventListener('click', function() {
            if (!item.classList.contains('occupied')) {
                // Prompt user to select a component to place
                const component = prompt("Enter the component you want to place (e.g., leaderboard):");

                // Check if the selected component exists
                if (components[component]) {
                    placeComponent(item, components[component]);
                } else {
                    alert('Invalid component selected.');
                }
            }
        });
    });
});
