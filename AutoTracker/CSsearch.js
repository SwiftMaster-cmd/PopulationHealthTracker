document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.container');
  
    // Ensure all containers are hidden initially
    containers.forEach(container => {
      container.classList.add('hidden');
    });
  });
  
  function liveSearch() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const containers = document.querySelectorAll('.container');
  
    // Remove previous highlights using mark.js
    containers.forEach(container => {
      const instance = new Mark(container);
      instance.unmark();
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
    const instance = new Mark(container);
    instance.mark(searchTerm);
  }