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
  
    // Remove previous highlights
    containers.forEach(container => {
      const instance = new Mark(container);
      instance.unmark();
    });
  
    let anyContainerVisible = false;
    containers.forEach(container => {
      const containerText = container.textContent.toLowerCase();
      if (containerText.includes(input)) {
        container.classList.add('visible');
        container.classList.remove('hidden');
        highlightSearchTerm(container, input);
        anyContainerVisible = true;
      } else {
        container.classList.add('hidden');
        container.classList.remove('visible');
      }
    });
  
    // If no container is visible, clear highlights
    if (!anyContainerVisible) {
      containers.forEach(container => {
        const instance = new Mark(container);
        instance.unmark();
      });
    }
  }
  
  function highlightSearchTerm(container, searchTerm) {
    const instance = new Mark(container);
    instance.mark(searchTerm, {
      separateWordSearch: false,
      accuracy: "partially"
    });
  }