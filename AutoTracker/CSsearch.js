document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('resultsContainer');
  
    // Define the containers with their titles and ids
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
        openModal(container.id);
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
  
  function openModal(containerId) {
    const modal = document.getElementById('myModal');
    const iframe = document.getElementById('iframeContainer');
    iframe.src = `content.html#${containerId}`;
    modal.style.display = 'block';
  
    // Highlight text in iframe
    iframe.onload = () => {
      const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
      const input = document.getElementById('searchInput').value.toLowerCase();
      const container = iframeDocument.getElementById(containerId);
      if (container) {
        const innerHTML = container.innerHTML;
        const index = innerHTML.toLowerCase().indexOf(input);
        if (index >= 0) {
          container.innerHTML = innerHTML.substring(0, index) + "<span class='highlight'>" + innerHTML.substring(index, index + input.length) + "</span>" + innerHTML.substring(index + input.length);
        }
      }
    };
  }
  
  function closeModal() {
    const modal = document.getElementById('myModal');
    modal.style.display = 'none';
  }