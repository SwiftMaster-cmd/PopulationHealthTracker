

document.addEventListener('DOMContentLoaded', () => {

  const cheatSheetButton = document.getElementById('cheatSheetButton');
  if (cheatSheetButton) {
      cheatSheetButton.addEventListener('click', () => {
          window.location.href = 'cheatSheet.html';
      });
  }

});




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
  
    if (input === "") {
      // If the input is empty, hide all containers
      containers.forEach(container => {
        container.classList.add('hidden');
        container.classList.remove('visible');
      });
      return; // Exit the function early
    }
  
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
  
  function refineSearch() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const containers = document.querySelectorAll('.container');
    const refineButton = document.getElementById('refineButton');
  
    if (refineButton.textContent === "Refine") {
      if (input === "") {
        // If the input is empty, hide all containers
        containers.forEach(container => {
          container.classList.add('hidden');
          container.classList.remove('visible');
        });
        return; // Exit the function early
      }
  
      containers.forEach(container => {
        const containerText = container.textContent.toLowerCase();
        if (containerText.includes(input)) {
          const lines = container.innerHTML.split('\n');
          const matchingLines = lines.filter(line => line.toLowerCase().includes(input));
          container.dataset.originalContent = container.innerHTML; // Save original content
          container.innerHTML = matchingLines.join('\n');
          container.classList.add('visible');
          container.classList.remove('hidden');
          highlightSearchTerm(container, input);
        } else {
          container.classList.add('hidden');
          container.classList.remove('visible');
        }
      });
  
      refineButton.textContent = "Show All";
    } else {
      showAll();
    }
  }
  
  function showAll() {
    const containers = document.querySelectorAll('.container');
    const refineButton = document.getElementById('refineButton');
  
    containers.forEach(container => {
      if (container.dataset.originalContent) {
        container.innerHTML = container.dataset.originalContent; // Restore original content
        delete container.dataset.originalContent;
      }
      container.classList.add('visible');
      container.classList.remove('hidden');
    });
  
    refineButton.textContent = "Refine";
  }