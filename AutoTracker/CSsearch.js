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
    previousHighlights.forEach(element => {
      const parentElement = element.parentNode;
      parentElement.innerHTML = parentElement.innerHTML.replace('<span class="highlight">', '').replace('</span>', '');
    });
  
    containers.forEach(container => {
      const containerText = container.textContent.toLowerCase();
      if (containerText.includes(input)) {
        const containerTitle = container.querySelector('h2') ? container.querySelector('h2').textContent : 'Container';
        const resultButton = document.createElement('button');
        resultButton.classList.add('result-button');
        resultButton.textContent = containerTitle;
        resultButton.onclick = () => {
          showContainer(container.id, input);
        };
        resultsContainer.appendChild(resultButton);
      }
    });
  }
  
  function showContainer(containerId, searchTerm) {
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
      const innerHTML = selectedContainer.innerHTML.toLowerCase();
      const index = innerHTML.indexOf(searchTerm.toLowerCase());
      if (index >= 0) {
        const originalHTML = selectedContainer.innerHTML;
        const highlightedHTML = originalHTML.substring(0, index) + "<span class='highlight'>" + originalHTML.substring(index, index + searchTerm.length) + "</span>" + originalHTML.substring(index + searchTerm.length);
        selectedContainer.innerHTML = highlightedHTML;
      }
    }
  }