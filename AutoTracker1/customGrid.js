document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.grid-container');
    let currentOpenButtonGroup = null;

    // Function to create a grid item
    function createGridItem(level) {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');

        if (level < 3) {
            // Add button group to change layout or add new level
            const buttonGroup = createButtonGroup(gridItem, level);
            gridItem.appendChild(buttonGroup);
        }

        return gridItem;
    }

    // Function to create a grid layout with a specified number of columns and rows
    function createGrid(level, columns, rows) {
        const grid = document.createElement('div');
        grid.classList.add('custom-grid');
        grid.classList.add(`grid-${columns}x${rows}`);

        for (let i = 0; i < columns * rows; i++) {
            const gridItem = createGridItem(level);
            gridItem.dataset.level = level;
            grid.appendChild(gridItem);
        }

        return grid;
    }

    // Function to change the layout at the current level
    function changeLayoutAtCurrentLevel(gridItem, columns, rows) {
        const level = parseInt(gridItem.dataset.level);
        const parent = gridItem.parentElement;
        parent.innerHTML = ''; // Clear the current grid items

        const newGrid = createGrid(level, columns, rows); // Create a new grid at the same level
        parent.appendChild(newGrid); // Append the new grid to the parent element
    }

    // Function to add a new level with the selected layout
    function addNewLevel(gridItem, columns, rows) {
        gridItem.innerHTML = ''; // Clear the grid item
        const newGrid = createGrid(parseInt(gridItem.dataset.level) + 1, columns, rows); // Create new grid at the next level
        gridItem.appendChild(newGrid);
    }

    // Function to create a button group for changing layouts
    function createButtonGroup(gridItem, level) {
        const buttonGroup = document.createElement('div');
        buttonGroup.classList.add('button-group');

        // Button to change layout at the current level
        const changeLayoutButton = document.createElement('button');
        changeLayoutButton.textContent = '🔄 Change Layout';
        changeLayoutButton.addEventListener('click', () => changeLayoutAtCurrentLevel(gridItem, 2, 2));

        // Button to add a new level
        const addNewLevelButton = document.createElement('button');
        addNewLevelButton.textContent = '➕ Add New Level';
        addNewLevelButton.addEventListener('click', () => addNewLevel(gridItem, 2, 2));

        // Add both buttons to the button group
        buttonGroup.appendChild(changeLayoutButton);
        buttonGroup.appendChild(addNewLevelButton);

        // Add a toggle button to show/hide the button group
        const toggleButton = document.createElement('button');
        toggleButton.classList.add('toggle-button');
        toggleButton.textContent = '⚙️';
        toggleButton.addEventListener('click', () => {
            if (currentOpenButtonGroup && currentOpenButtonGroup !== buttonGroup) {
                currentOpenButtonGroup.classList.remove('visible');
            }
            buttonGroup.classList.toggle('visible');
            currentOpenButtonGroup = buttonGroup.classList.contains('visible') ? buttonGroup : null;
        });

        const wrapper = document.createElement('div');
        wrapper.classList.add('button-group-wrapper');
        wrapper.appendChild(toggleButton);
        wrapper.appendChild(buttonGroup);

        return wrapper;
    }

    // Start with a 2x2 grid on page load
    const initialGrid = createGrid(1, 2, 2);
    container.appendChild(initialGrid);
});
