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
  
    // Remove previous highlights
    const previousHighlights = document.querySelectorAll('.highlight');
    previousHighlights.forEach(element => {
      const parentElement = element.parentNode;
      parentElement.innerHTML = parentElement.innerHTML.replace(/<span class="highlight">|<\/span>/gi, '');
    });
  
    containers.forEach(container => {
      const containerText = container.textContent.toLowerCase();
      if (containerText.includes(input)) {
        container.classList.add('visible');
        highlightSearchTerm(container, input);
      } else {
        container.classList.remove('visible');
      }
    });
  }
  
  function highlightSearchTerm(container, searchTerm) {
    const regex = new RegExp(`\\b(${searchTerm})\\b`, 'gi');
    container.innerHTML = container.innerHTML.replace(regex, '<span class="highlight">$1</span>');
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    // Ensure all containers are hidden initially
    const containers = document.querySelectorAll('.container');
    containers.forEach(container => {
      container.classList.remove('visible');
      container.classList.add('hidden');
    });
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    // Ensure all containers are hidden initially
    const containers = document.querySelectorAll('.container');
    containers.forEach(container => {
      container.classList.remove('visible');
      container.classList.add('hidden');
    });
  });
  
  function showContainer(containerId, searchTerm) {
    // Hide all containers
    const allContainers = document.querySelectorAll('.container');
    allContainers.forEach(container => {
      container.classList.remove('visible');
    });
  
    // Show the selected container
    const selectedContainer = document.getElementById(containerId);
    if (selectedContainer) {
      selectedContainer.classList.add('visible');
      selectedContainer.scrollIntoView({ behavior: 'smooth' });
  
      // Highlight the search term
      highlightSearchTerm(selectedContainer, searchTerm);
    }
  }
  
  function highlightSearchTerm(container, searchTerm) {
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    container.innerHTML = container.innerHTML.replace(regex, '<span class="highlight">$1</span>');
  }