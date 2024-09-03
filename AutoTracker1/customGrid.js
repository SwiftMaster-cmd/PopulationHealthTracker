document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.grid-container');

    // Function to create a grid item
    function createGridItem(level) {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.textContent = `Level ${level} Item`;
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
    function changeLayout(columns, rows) {
        container.innerHTML = ''; // Clear the container
        const newGrid = createGrid(1, columns, rows); // Start with level 1 grid
        container.appendChild(newGrid);
    }

    // Example usage
    document.getElementById('layout-1x1').addEventListener('click', () => changeLayout(1, 1));
    document.getElementById('layout-2x1').addEventListener('click', () => changeLayout(2, 1));
    document.getElementById('layout-1x2').addEventListener('click', () => changeLayout(1, 2));
    document.getElementById('layout-2x2').addEventListener('click', () => changeLayout(2, 2));
});
