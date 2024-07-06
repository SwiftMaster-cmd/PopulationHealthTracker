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
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    traverseDOM(container, regex);
  }
  
  function traverseDOM(node, regex) {
    if (node.nodeType === 3) { // Text node
      const match = node.data.match(regex);
      if (match) {
        const highlight = document.createElement('span');
        highlight.className = 'highlight';
        const wordNode = node.splitText(match.index);
        wordNode.splitText(match[0].length);
        const wordClone = wordNode.cloneNode(true);
        highlight.appendChild(wordClone);
        wordNode.parentNode.replaceChild(highlight, wordNode);
      }
    } else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
      for (let i = 0; i < node.childNodes.length; i++) {
        traverseDOM(node.childNodes[i], regex);
      }
    }
  }