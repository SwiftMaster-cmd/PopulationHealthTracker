document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.grid-container');
    let currentOpenButtonGroup = null;

    // Function to create a grid item
    function createGridItem(level) {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.dataset.level = level;

        // Add the button group (settings) to each level
        const buttonGroup = createButtonGroup(gridItem, level);
        gridItem.appendChild(buttonGroup);

        return gridItem;
    }

    // Function to create a grid layout with a specified number of columns and rows
    function createGrid(level, columns, rows) {
        const grid = document.createElement('div');
        grid.classList.add('custom-grid');
        grid.classList.add(`grid-${columns}x${rows}`);

        for (let i = 0; i < columns * rows; i++) {
            const gridItem = createGridItem(level);
            grid.appendChild(gridItem);
        }

        return grid;
    }

    // Function to change the layout at the current level
    function changeLayoutAtCurrentLevel(gridItem, columns, rows) {
        const level = parseInt(gridItem.dataset.level);
        const parentGrid = gridItem.closest('.custom-grid').parentElement;
        parentGrid.innerHTML = ''; // Clear the current grid items

        const newGrid = createGrid(level, columns, rows); // Create a new grid at the same level
        parentGrid.appendChild(newGrid); // Append the new grid to the parent element
    }

    // Function to show layout options for adding a new level
    function showNewLevelLayoutOptions(gridItem) {
        const layoutSelectionGroup = document.createElement('div');
        layoutSelectionGroup.classList.add('button-group');
        layoutSelectionGroup.classList.add('visible');

        const layout1x1 = document.createElement('button');
        layout1x1.textContent = '1x1';
        layout1x1.addEventListener('click', () => addNewLevel(gridItem, 1, 1));

        const layout2x1 = document.createElement('button');
        layout2x1.textContent = '2x1';
        layout2x1.addEventListener('click', () => addNewLevel(gridItem, 2, 1));

        const layout1x2 = document.createElement('button');
        layout1x2.textContent = '1x2';
        layout1x2.addEventListener('click', () => addNewLevel(gridItem, 1, 2));

        const layout2x2 = document.createElement('button');
        layout2x2.textContent = '2x2';
        layout2x2.addEventListener('click', () => addNewLevel(gridItem, 2, 2));

        gridItem.appendChild(layoutSelectionGroup); // Show layout options in the grid item
        layoutSelectionGroup.appendChild(layout1x1);
        layoutSelectionGroup.appendChild(layout2x1);
        layoutSelectionGroup.appendChild(layout1x2);
        layoutSelectionGroup.appendChild(layout2x2);
    }

    function addNewLevel(gridItem, columns, rows) {
        // Check if the grid-item already contains a new level
        if (gridItem.querySelector('.new-grid-container')) {
            console.log("A new level has already been added to this grid item.");
            return; // Exit the function if a new level is already present
        }
    
        const level = parseInt(gridItem.dataset.level);
    
        const newGridContainer = document.createElement('div');
        newGridContainer.classList.add('new-grid-container'); // Ensure it has the correct class
        newGridContainer.dataset.level = level + 1;
    
        const newGrid = createGrid(level + 1, columns, rows);
        newGridContainer.appendChild(newGrid);
    
        gridItem.appendChild(newGridContainer); // Add the new grid as a child of the existing grid item
        newGridContainer.style.height = "100%"; // Ensures full height in JavaScript
    
        // Remove the "Add New Level" button from this grid item
        const addNewLevelButton = gridItem.querySelector('button:contains("➕ Add New Level")');
        if (addNewLevelButton) {
            addNewLevelButton.remove(); // Remove the button if it exists
        }
    }
    
    

    // Function to create a button group for changing layouts and adding levels
    function createButtonGroup(gridItem, level) {
        const buttonGroup = document.createElement('div');
        buttonGroup.classList.add('button-group');

        // Button to change layout at the current level (always available)
        const changeLayoutButton = document.createElement('button');
        changeLayoutButton.textContent = '🔄 Change Layout';
        changeLayoutButton.addEventListener('click', () => showChangeLayoutOptions(gridItem));
        buttonGroup.appendChild(changeLayoutButton);

        // Button to add a new level (only available at level 1)
        if (level < 2) {
            const addNewLevelButton = document.createElement('button');
            addNewLevelButton.textContent = '➕ Add New Level';
            addNewLevelButton.addEventListener('click', () => showNewLevelLayoutOptions(gridItem));
            buttonGroup.appendChild(addNewLevelButton);
        }

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

    // Function to show layout options for changing the current level
    function showChangeLayoutOptions(gridItem) {
        const layoutSelectionGroup = document.createElement('div');
        layoutSelectionGroup.classList.add('button-group');
        layoutSelectionGroup.classList.add('visible');

        const layout1x1 = document.createElement('button');
        layout1x1.textContent = '1x1';
        layout1x1.addEventListener('click', () => changeLayoutAtCurrentLevel(gridItem, 1, 1));

        const layout2x1 = document.createElement('button');
        layout2x1.textContent = '2x1';
        layout2x1.addEventListener('click', () => changeLayoutAtCurrentLevel(gridItem, 2, 1));

        const layout1x2 = document.createElement('button');
        layout1x2.textContent = '1x2';
        layout1x2.addEventListener('click', () => changeLayoutAtCurrentLevel(gridItem, 1, 2));

        const layout2x2 = document.createElement('button');
        layout2x2.textContent = '2x2';
        layout2x2.addEventListener('click', () => changeLayoutAtCurrentLevel(gridItem, 2, 2));

        gridItem.appendChild(layoutSelectionGroup); // Show layout options in the grid item
        layoutSelectionGroup.appendChild(layout1x1);
        layoutSelectionGroup.appendChild(layout2x1);
        layoutSelectionGroup.appendChild(layout1x2);
        layoutSelectionGroup.appendChild(layout2x2);
    }

    // Start with a 2x2 grid on page load
    const initialGrid = createGrid(1, 2, 2);
    container.appendChild(initialGrid);
});
