document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('resultsContainer');
    const containers = [
        { id: 'cheatSheet-title', title: 'Pop Health Cheat Sheet' },
        { id: 'services-paused', title: 'Services Paused 🚫' },
        // Add more containers here
    ];

    // Initialize buttons for all containers
    containers.forEach(container => {
        const resultButton = document.createElement('button');
        resultButton.classList.add('result-button');
        resultButton.textContent = container.title;
        resultButton.onclick = () => {
            showContainer(container.id);
        };
        resultsContainer.appendChild(resultButton);
    });
});

function liveSearch() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const buttons = document.querySelectorAll('.result-button');

    // Filter buttons based on input
    buttons.forEach(button => {
        if (button.textContent.toLowerCase().includes(input)) {
            button.classList.remove('hidden');
        } else {
            button.classList.add('hidden');
        }
    });
}

function showContainer(containerId) {
    // Hide all containers
    const allContainers = document.querySelectorAll('.container');
    allContainers.forEach(container => {
        container.classList.add('hidden');
    });

    // Show the selected container
    const selectedContainer = document.getElementById(containerId);
    if (selectedContainer) {
        selectedContainer.classList.remove('hidden');

        // Highlight the search term
        const input = document.getElementById('searchInput').value.toLowerCase();
        const innerHTML = selectedContainer.innerHTML;
        const index = innerHTML.toLowerCase().indexOf(input);
        if (index >= 0) {
            selectedContainer.innerHTML = innerHTML.substring(0, index) + "<span class='highlight'>" + innerHTML.substring(index, index + input.length) + "</span>" + innerHTML.substring(index + input.length);
        }
    }
}