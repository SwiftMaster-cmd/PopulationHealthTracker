document.addEventListener('DOMContentLoaded', () => {
    const containers = [
      { id: 'cheatSheet-title', title: 'Pop Health Cheat Sheet' },
      { id: 'services-paused', title: 'Services Paused 🚫' },
      // Add more containers here
    ];
  
    // Ensure all containers are hidden initially
    const allContainers = document.querySelectorAll('.container');
    allContainers.forEach(container => {
      container.classList.add('hidden');
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
        container.classList.remove('hidden');
        highlightSearchTerm(container, input);
      } else {
        container.classList.add('hidden');
        container.classList.remove('visible');
      }
    });
  }
  
  function highlightSearchTerm(container, searchTerm) {
    const regex = new RegExp(`\\b(${searchTerm})\\b`, 'gi');
    container.innerHTML = container.innerHTML.replace(regex, '<span class="highlight">$1</span>');
  }