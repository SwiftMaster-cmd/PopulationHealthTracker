// JavaScript function to handle search
function searchFunction() {
    // Remove previous highlights
    const previousHighlights = document.querySelectorAll('.highlight');
    previousHighlights.forEach(element => element.classList.remove('highlight'));
  
    const input = document.getElementById('searchInput').value.toLowerCase();
    const containers = document.querySelectorAll('.container');
  
    for (let container of containers) {
      const containerText = container.textContent.toLowerCase();
  
      if (containerText.includes(input)) {
        const containerTitle = container.querySelector('h2') ? container.querySelector('h2').textContent : 'Container';
        if (confirm(`Found in "${containerTitle}". Do you want to go to this section?`)) {
          container.scrollIntoView({ behavior: 'smooth' });
          // Highlight the text
          const innerHTML = container.innerHTML;
          const index = innerHTML.toLowerCase().indexOf(input);
          if (index >= 0) {
            container.innerHTML = innerHTML.substring(0, index) + "<span class='highlight'>" + innerHTML.substring(index, index + input.length) + "</span>" + innerHTML.substring(index + input.length);
          }
          break;
        }
      }
    }
  }