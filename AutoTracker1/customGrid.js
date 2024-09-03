document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.grid-container');

    // Function to create a grid item
    function createGridItem(level) {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.textContent = `Level ${level} Item`;

        if (level < 3) {
            // Add button to change layout
            const buttonGroup = createButtonGroup(gridItem, level);
            gridItem.appendChild(buttonGroup);
        }

        return gridItem;
    }

    // Function to create a grid layout with a specified number of columns and rows
    function createGrid(level, columns, rows) {
        const grid = document.createElement('div');
        grid.classList.add('custom-grid');

        if (level < 3) { // Limit to 3 levels deep
            grid.classList.add(`grid-${columns}x${rows}`);
            for (let i = 0; i < columns * rows; i++) {
                const nestedGridItem = createGridItem(level);
                if (i % 2 === 0 && level < 3) {
                    // Recursive call to add another level of grid inside even index items
                    const nestedGrid = createGrid(level + 1, columns, rows);
                    nestedGridItem.appendChild(nestedGrid);
                }
                grid.appendChild(nestedGridItem);
            }
        } else {
            // When max depth is reached, just fill with grid items
            grid.classList.add('grid-1x1');
            grid.appendChild(createGridItem(level));
        }

        return grid;
    }

    // Function to handle layout change
    function changeLayout(gridItem, columns, rows) {
        gridItem.innerHTML = ''; // Clear the grid item
        const newGrid = createGrid(parseInt(gridItem.dataset.level), columns, rows); // Create new grid at the current level
        gridItem.appendChild(newGrid);
    }

    // Function to create a button group for changing layouts
    function createButtonGroup(gridItem, level) {
        const buttonGroup = document.createElement('div');
        buttonGroup.classList.add('button-group');

        // Layout buttons
        const layout1x1 = document.createElement('button');
        layout1x1.textContent = '1x1';
        layout1x1.addEventListener('click', () => changeLayout(gridItem, 1, 1));

        const layout2x1 = document.createElement('button');
        layout2x1.textContent = '2x1';
        layout2x1.addEventListener('click', () => changeLayout(gridItem, 2, 1));

        const layout1x2 = document.createElement('button');
        layout1x2.textContent = '1x2';
        layout1x2.addEventListener('click', () => changeLayout(gridItem, 1, 2));

        const layout2x2 = document.createElement('button');
        layout2x2.textContent = '2x2';
        layout2x2.addEventListener('click', () => changeLayout(gridItem, 2, 2));

        buttonGroup.appendChild(layout1x1);
        buttonGroup.appendChild(layout2x1);
        buttonGroup.appendChild(layout1x2);
        buttonGroup.appendChild(layout2x2);

        // Add a toggle button to show/hide the button group
        const toggleButton = document.createElement('button');
        toggleButton.classList.add('toggle-button');
        toggleButton.textContent = '⚙️';
        toggleButton.addEventListener('click', () => {
            buttonGroup.classList.toggle('visible');
        });

        const wrapper = document.createElement('div');
        wrapper.classList.add('button-group-wrapper');
        wrapper.appendChild(toggleButton);
        wrapper.appendChild(buttonGroup);

        return wrapper;
    }

    // Start with a 1x1 grid on page load
    const initialGrid = createGrid(1, 1, 1);
    container.appendChild(initialGrid);
});
