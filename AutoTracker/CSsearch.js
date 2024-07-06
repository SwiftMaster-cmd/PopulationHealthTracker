document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.container');
    const resultsContainer = document.getElementById('resultsContainer');
  
    // Initialize buttons for all containers
    containers.forEach(container => {
      const containerTitle = container.querySelector('h2') ? container.querySelector('h2').textContent : 'Container';
      const resultButton = document.createElement('button');
      resultButton.classList.add('result-button');
      resultButton.textContent = containerTitle;
      resultButton.onclick = () => {
        container.scrollIntoView({ behavior: 'smooth' });
        // Highlight the text
        const innerHTML = container.innerHTML;
        const input = document.getElementById('searchInput').value.toLowerCase();
        const index = innerHTML.toLowerCase().indexOf(input);
        if (index >= 0) {
          container.innerHTML = innerHTML.substring(0, index) + "<span class='highlight'>" + innerHTML.substring(index, index + input.length) + "</span>" + innerHTML.substring(index + input.length);
        }
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
  
    // Remove previous highlights
    const previousHighlights = document.querySelectorAll('.highlight');
    previousHighlights.forEach(element => element.classList.remove('highlight'));
  }