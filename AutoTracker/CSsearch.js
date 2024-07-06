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
    const containers = document.querySelectorAll('.container');
    const resultsContainer = document.getElementById('resultsContainer');
  
    // Clear previous results
    resultsContainer.innerHTML = '';
    // Remove previous highlights
    const previousHighlights = document.querySelectorAll('.highlight');
    previousHighlights.forEach(element => element.classList.remove('highlight'));
  
    containers.forEach(container => {
      const containerText = container.textContent.toLowerCase();
      if (containerText.includes(input)) {
        const containerTitle = container.querySelector('h2') ? container.querySelector('h2').textContent : 'Container';
        const resultButton = document.createElement('button');
        resultButton.classList.add('result-button');
        resultButton.textContent = containerTitle;
        resultButton.onclick = () => {
          showContainer(container.id);
        };
        resultsContainer.appendChild(resultButton);
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
      selectedContainer.scrollIntoView({ behavior: 'smooth' });
  
      // Highlight the search term
      const input = document.getElementById('searchInput').value.toLowerCase();
      const innerHTML = selectedContainer.innerHTML;
      const index = innerHTML.toLowerCase().indexOf(input);
      if (index >= 0) {
        selectedContainer.innerHTML = innerHTML.substring(0, index) + "<span class='highlight'>" + innerHTML.substring(index, index + input.length) + "</span>" + innerHTML.substring(index + input.length);
      }
    }
  }