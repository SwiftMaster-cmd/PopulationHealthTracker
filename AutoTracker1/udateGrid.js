document.addEventListener('DOMContentLoaded', function() {
    const layoutSelector = document.querySelector('.layout-selector');
    const mainContainer = document.querySelector('.main-container');

    layoutSelector.addEventListener('click', function(event) {
        const layout = event.target.dataset.layout;

        // Remove any existing layout classes
        mainContainer.classList.remove('layout-1x1', 'layout-2x1', 'layout-2x2', 'layout-1x2');
        
        // Add the selected layout class
        mainContainer.classList.add(`layout-${layout}`);

        // Dynamically inject grid items based on the layout
        updateGridItems(layout);
    });

    function updateGridItems(layout) {
        mainContainer.innerHTML = ''; // Clear existing items

        let itemCount;
        switch (layout) {
            case '1x1':
                itemCount = 1;
                break;
            case '2x1':
                itemCount = 2;
                break;
            case '2x2':
                itemCount = 4;
                break;
            case '1x2':
                itemCount = 2;
                break;
            // Add more cases as needed
            default:
                itemCount = 1;
        }

        for (let i = 0; i < itemCount; i++) {
            const item = document.createElement('div');
            item.classList.add('grid-item');
            item.textContent = `Container ${i + 1}`;
            mainContainer.appendChild(item);
        }
    }
});
