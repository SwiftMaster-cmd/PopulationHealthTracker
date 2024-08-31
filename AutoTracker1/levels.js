document.addEventListener('DOMContentLoaded', function() {
    function createNestedGrid(container, level) {
        if (level > 3) return; // Limit the depth to 3 levels

        const layoutSelector = document.createElement('div');
        layoutSelector.classList.add('layout-selector');
        layoutSelector.innerHTML = `
            <button data-layout="1x1">1x1</button>
            <button data-layout="2x1">2x1</button>
            <button data-layout="2x2">2x2</button>
            <button data-layout="1x2">1x2</button>
        `;

        // Create the toggle button
        const toggleButton = document.createElement('button');
        toggleButton.classList.add('toggle-customizer-btn');
        toggleButton.innerHTML = '⚙️';

        // Toggle the visibility of the layout selector
        toggleButton.addEventListener('click', function() {
            const isVisible = layoutSelector.style.display === 'block';
            layoutSelector.style.display = isVisible ? 'none' : 'block';
        });

        container.appendChild(toggleButton);
        container.appendChild(layoutSelector);

        const mainContainer = document.createElement('div');
        mainContainer.classList.add('dynamic-grid');
        container.appendChild(mainContainer);

        layoutSelector.addEventListener('click', function(event) {
            const layout = event.target.dataset.layout;

            // Remove the entire container content to replace it
            container.innerHTML = '';

            // Create a new main container
            const newMainContainer = document.createElement('div');
            newMainContainer.classList.add('dynamic-grid');
            newMainContainer.classList.add(`layout-${layout}`);
            container.appendChild(newMainContainer);

            // Re-add the toggle and layout selector
            container.appendChild(toggleButton);
            container.appendChild(layoutSelector);

            // Dynamically inject grid items based on the layout
            updateGridItems(newMainContainer, layout, level);
        });
    }

    function updateGridItems(container, layout, level) {
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
            default:
                itemCount = 1;
        }

        for (let i = 0; i < itemCount; i++) {
            const item = document.createElement('div');
            item.classList.add('grid-item');
            item.textContent = `Level ${level} - Container ${i + 1}`;
            container.appendChild(item);

            // Recursively create nested grids within each item
            if (level < 3) { // Allow nesting only up to 3 levels
                createNestedGrid(item, level + 1);
            }
        }
    }

    // Initialize the first level grid
    const rootContainer = document.querySelector('.main-container');
    createNestedGrid(rootContainer, 1);
});
