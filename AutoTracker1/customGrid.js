document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.grid-container');
    let currentOpenButtonGroup = null;
    let currentOpenGridSelector = null; // Keep track of the currently open selector

    // Function to create a grid item
    function createGridItem(level) {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.dataset.level = level;

        // Add the button group (settings) to each grid item
        const buttonGroupWrapper = createButtonGroup(gridItem, level);
        gridItem.appendChild(buttonGroupWrapper);

        return gridItem;
    }

    // Function to create a grid layout with specified columns and rows
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
        parentGrid.innerHTML = ''; // Clear current grid items

        const newGrid = createGrid(level, columns, rows); // Create new grid at same level
        parentGrid.appendChild(newGrid); // Append new grid to parent element
    }

    // Function to show layout options for adding a new level
    function showNewLevelLayoutOptions(gridItem) {
        // Hide any open selectors
        if (currentOpenGridSelector && currentOpenGridSelector !== gridItem) {
            const visibleSelector = currentOpenGridSelector.querySelector('.layout-selection-group');
            if (visibleSelector) {
                visibleSelector.remove(); // Remove the previously open selector
            }
        }

        currentOpenGridSelector = gridItem;

        const layoutSelectionGroup = document.createElement('div');
        layoutSelectionGroup.classList.add('layout-selection-group');

        const layouts = [
            { columns: 1, rows: 1, label: '1x1' },
            { columns: 2, rows: 1, label: '2x1' },
            { columns: 1, rows: 2, label: '1x2' },
            { columns: 2, rows: 2, label: '2x2' },
        ];

        layouts.forEach(layout => {
            const button = document.createElement('button');
            button.textContent = layout.label;
            button.addEventListener('click', () => {
                addNewLevel(gridItem, layout.columns, layout.rows);
                layoutSelectionGroup.remove(); // Hide after selection
                currentOpenGridSelector = null; // Reset after selection
            });
            layoutSelectionGroup.appendChild(button);
        });

        gridItem.appendChild(layoutSelectionGroup); // Show layout options in the grid item
    }

    // Function to add a new level with the selected layout
    function addNewLevel(gridItem, columns, rows) {
        // Check if the grid-item already contains a new level
        if (gridItem.querySelector('.new-grid-container')) {
            console.log("A new level has already been added to this grid item.");
            return; // Exit if a new level is already present
        }

        const level = parseInt(gridItem.dataset.level);

        const newGridContainer = document.createElement('div');
        newGridContainer.classList.add('new-grid-container');
        newGridContainer.dataset.level = level + 1;

        const newGrid = createGrid(level + 1, columns, rows);
        newGridContainer.appendChild(newGrid);

        gridItem.appendChild(newGridContainer);

        // Remove the "Add New Level" button from this grid item
        const addNewLevelButton = gridItem.querySelector('button.add-new-level-button');
        if (addNewLevelButton) {
            addNewLevelButton.remove();
        }
    }

    // Function to create a button group for settings
    function createButtonGroup(gridItem, level) {
        const buttonGroupWrapper = document.createElement('div');
        buttonGroupWrapper.classList.add('button-group-wrapper');

        const toggleButton = document.createElement('button');
        toggleButton.classList.add('toggle-button');
        // No icon or text as per your request

        toggleButton.addEventListener('click', () => {
            if (currentOpenButtonGroup && currentOpenButtonGroup !== buttonGroup) {
                currentOpenButtonGroup.classList.remove('visible');
            }
            buttonGroup.classList.toggle('visible');
            currentOpenButtonGroup = buttonGroup.classList.contains('visible') ? buttonGroup : null;
        });

        const buttonGroup = document.createElement('div');
        buttonGroup.classList.add('button-group');

        // Add the "Select Item" button
        const selectItemButton = document.createElement('button');
        selectItemButton.textContent = 'Select Item';
        selectItemButton.addEventListener('click', () => showSelectItemOptions(gridItem));
        buttonGroup.appendChild(selectItemButton);

        // Button to change layout at the current level
        const changeLayoutButton = document.createElement('button');
        changeLayoutButton.textContent = 'Change Layout';
        changeLayoutButton.addEventListener('click', () => showChangeLayoutOptions(gridItem));
        buttonGroup.appendChild(changeLayoutButton);

        // Button to add a new level (only available at level 1)
        if (level < 3) {
            const addNewLevelButton = document.createElement('button');
            addNewLevelButton.textContent = 'Add New Level';
            addNewLevelButton.classList.add('add-new-level-button');
            addNewLevelButton.addEventListener('click', () => showNewLevelLayoutOptions(gridItem));
            buttonGroup.appendChild(addNewLevelButton);
        }

        buttonGroupWrapper.appendChild(toggleButton);
        buttonGroupWrapper.appendChild(buttonGroup);

        return buttonGroupWrapper;
    }

    // Function to show layout options for changing the current level
    function showChangeLayoutOptions(gridItem) {
        // Hide any open selectors
        if (currentOpenGridSelector && currentOpenGridSelector !== gridItem) {
            const visibleSelector = currentOpenGridSelector.querySelector('.layout-selection-group');
            if (visibleSelector) {
                visibleSelector.remove();
            }
        }

        currentOpenGridSelector = gridItem;

        const layoutSelectionGroup = document.createElement('div');
        layoutSelectionGroup.classList.add('layout-selection-group');

        const layouts = [
            { columns: 1, rows: 1, label: '1x1' },
            { columns: 2, rows: 1, label: '2x1' },
            { columns: 1, rows: 2, label: '1x2' },
            { columns: 2, rows: 2, label: '2x2' },
        ];

        layouts.forEach(layout => {
            const button = document.createElement('button');
            button.textContent = layout.label;
            button.addEventListener('click', () => {
                changeLayoutAtCurrentLevel(gridItem, layout.columns, layout.rows);
                layoutSelectionGroup.remove();
                currentOpenGridSelector = null;
            });
            layoutSelectionGroup.appendChild(button);
        });

        gridItem.appendChild(layoutSelectionGroup);
    }

    // Function to show the "Select Item" options
    function showSelectItemOptions(gridItem) {
        // Hide any open selectors
        if (currentOpenGridSelector && currentOpenGridSelector !== gridItem) {
            const visibleSelector = currentOpenGridSelector.querySelector('.selection-list');
            if (visibleSelector) {
                visibleSelector.remove();
            }
        }

        currentOpenGridSelector = gridItem;

        // Remove any existing selection list
        const existingSelectionList = gridItem.querySelector('.selection-list');
        if (existingSelectionList) {
            existingSelectionList.remove();
        }

        // Create a list for selection
        const selectionList = document.createElement('div');
        selectionList.classList.add('selection-list');

        // Option: Show Live Activities
        const liveActivitiesOption = document.createElement('button');
        liveActivitiesOption.textContent = 'Show Live Activities';
        liveActivitiesOption.addEventListener('click', () => {
            insertLiveActivities(gridItem);  // Insert Live Activities into the container
            selectionList.remove();
            currentOpenGridSelector = null;
        });
        selectionList.appendChild(liveActivitiesOption);

        // Additional options can be added here

        gridItem.appendChild(selectionList);
    }

    // Function to insert Live Activities into the selected grid item
    function insertLiveActivities(gridItem) {
        const liveActivitiesContainer = document.createElement('div');
        liveActivitiesContainer.classList.add('live-activities-container');
        liveActivitiesContainer.innerHTML = `
            <h4 class="live-activities-title">Live Activities</h4>
            <!-- Toggle buttons for Show/Hide Non-sellable and Self Sales -->
            <div class="toggle-buttons">
                <button id="toggleSellableButton" class="toggle-button">Hide Non-sellable</button>
                <button id="toggleSelfSalesButton" class="toggle-button">Hide Self Sales</button>
            </div>
            <div id="live-activities-section"></div>
        `;

        // Clear the previous content of the grid item and add Live Activities
        gridItem.innerHTML = '';
        gridItem.appendChild(liveActivitiesContainer);
    }

    // Start with a 2x2 grid on page load
    const initialGrid = createGrid(1, 2, 2);
    container.appendChild(initialGrid);
});
