
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
        container.scrollIntoView({ behavior: 'smooth' });
        // Highlight the text
        const innerHTML = container.innerHTML;
        const index = innerHTML.toLowerCase().indexOf(input);
        if (index >= 0) {
          container.innerHTML = innerHTML.substring(0, index) + "<span class='highlight'>" + innerHTML.substring(index, index + input.length) + "</span>" + innerHTML.substring(index + input.length);
        }
      };
      resultsContainer.appendChild(resultButton);
    }
  });
}