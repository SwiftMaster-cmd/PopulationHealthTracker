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
        toggleButton.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent clicks from affecting other elements
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
            updateGridItems(newMainContainer, layout, level + 1);
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

            // Only show the settings icon for the top-level containers
            if (level === 1) {
                const nestedToggleButton = document.createElement('button');
                nestedToggleButton.classList.add('toggle-customizer-btn');
                nestedToggleButton.innerHTML = '⚙️';
                item.appendChild(nestedToggleButton);

                // Toggle visibility of the nested grid customizer
                const nestedLayoutSelector = document.createElement('div');
                nestedLayoutSelector.classList.add('layout-selector');
                nestedLayoutSelector.innerHTML = `
                    <button data-layout="1x1">1x1</button>
                    <button data-layout="2x1">2x1</button>
                    <button data-layout="2x2">2x2</button>
                    <button data-layout="1x2">1x2</button>
                `;
                nestedToggleButton.addEventListener('click', function(event) {
                    event.stopPropagation();
                    const isVisible = nestedLayoutSelector.style.display === 'block';
                    nestedLayoutSelector.style.display = isVisible ? 'none' : 'block';
                });
                item.appendChild(nestedLayoutSelector);

                nestedLayoutSelector.addEventListener('click', function(event) {
                    const layout = event.target.dataset.layout;
                    item.innerHTML = ''; // Clear current content
                    const newMainContainer = document.createElement('div');
                    newMainContainer.classList.add('dynamic-grid');
                    newMainContainer.classList.add(`layout-${layout}`);
                    item.appendChild(newMainContainer);

                    // Re-add nested toggles and customizer
                    item.appendChild(nestedToggleButton);
                    item.appendChild(nestedLayoutSelector);

                    // Dynamically inject grid items based on the layout
                    updateGridItems(newMainContainer, layout, level + 1);
                });
            } else {
                // Only add nested grids, no settings icon for lower levels unless clicked
                createNestedGrid(item, level);
            }
        }
    }

    // Initialize the first level grid
    const rootContainer = document.querySelector('.main-container');
    createNestedGrid(rootContainer, 1);
});
