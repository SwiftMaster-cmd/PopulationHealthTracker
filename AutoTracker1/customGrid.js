document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.grid-container');
    let currentOpenOptionsContainer = null; // Keep track of the currently open options container

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
        grid.dataset.level = level; // Store the level in the grid

        for (let i = 0; i < columns * rows; i++) {
            const gridItem = createGridItem(level);
            grid.appendChild(gridItem);
        }

        return grid;
    }

    // Function to change the layout at the current level
    function changeLayoutAtCurrentLevel(gridItem, columns, rows) {
        const level = parseInt(gridItem.dataset.level);
        const parentGrid = gridItem.closest('.custom-grid');
        const grandParent = parentGrid.parentElement;

        // Remove the existing grid
        grandParent.removeChild(parentGrid);

        // Create a new grid with the selected layout
        const newGrid = createGrid(level, columns, rows);
        grandParent.appendChild(newGrid);
    }

    // Function to show the main options container
    function showOptionsContainer(gridItem) {
        // Close any open options containers on other grid items
        if (currentOpenOptionsContainer && currentOpenOptionsContainer !== gridItem) {
            const visibleOptionsContainer = currentOpenOptionsContainer.querySelector('.options-container');
            if (visibleOptionsContainer) {
                visibleOptionsContainer.remove();
                currentOpenOptionsContainer.optionsContainerEnabled = false; // Disable re-showing on hover
            }
        }
    
        currentOpenOptionsContainer = gridItem;
    
        // If optionsContainerEnabled is false, do not proceed
        if (!gridItem.optionsContainerEnabled) return;
    
        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add('options-container');
    
        // Main options
        const optionsList = document.createElement('div');
        optionsList.classList.add('options-list');
    
        // Option buttons
        const selectItemButton = document.createElement('button');
        selectItemButton.textContent = 'Select Item';
        selectItemButton.addEventListener('click', () => {
            showSelectItemOptions(optionsContainer, gridItem);
        });
        optionsList.appendChild(selectItemButton);
    
        const changeLayoutButton = document.createElement('button');
        changeLayoutButton.textContent = 'Change Layout';
        changeLayoutButton.addEventListener('click', () => {
            showChangeLayoutOptions(optionsContainer, gridItem);
        });
        optionsList.appendChild(changeLayoutButton);
    
        if (parseInt(gridItem.dataset.level) < 3) {
            const addNewLevelButton = document.createElement('button');
            addNewLevelButton.textContent = 'Add New Level';
            addNewLevelButton.addEventListener('click', () => {
                showNewLevelLayoutOptions(optionsContainer, gridItem);
            });
            optionsList.appendChild(addNewLevelButton);
        }
    
        optionsContainer.appendChild(optionsList);
    
        // Variables to track mouse over gridItem or optionsContainer
        let mouseOverGridItem = false;
        let mouseOverOptionsContainer = false;
    
        function checkMouseLeave() {
            if (!mouseOverGridItem && !mouseOverOptionsContainer) {
                optionsContainer.remove();
                // Remove event listeners
                gridItem.removeEventListener('mouseenter', onGridItemMouseEnter);
                gridItem.removeEventListener('mouseleave', onGridItemMouseLeave);
                optionsContainer.removeEventListener('mouseenter', onOptionsContainerMouseEnter);
                optionsContainer.removeEventListener('mouseleave', onOptionsContainerMouseLeave);
            }
        }
    
        function onGridItemMouseEnter() {
            mouseOverGridItem = true;
            if (gridItem.optionsContainerEnabled && !gridItem.contains(optionsContainer)) {
                gridItem.appendChild(optionsContainer);
            }
        }
    
        function onGridItemMouseLeave() {
            mouseOverGridItem = false;
            setTimeout(checkMouseLeave, 0);
        }
    
        function onOptionsContainerMouseEnter() {
            mouseOverOptionsContainer = true;
        }
    
        function onOptionsContainerMouseLeave() {
            mouseOverOptionsContainer = false;
            setTimeout(checkMouseLeave, 0);
        }
    
        gridItem.addEventListener('mouseenter', onGridItemMouseEnter);
        gridItem.addEventListener('mouseleave', onGridItemMouseLeave);
        optionsContainer.addEventListener('mouseenter', onOptionsContainerMouseEnter);
        optionsContainer.addEventListener('mouseleave', onOptionsContainerMouseLeave);
    
        // Event listener for clicks outside
        function onDocumentClick(event) {
            if (!gridItem.contains(event.target) && !optionsContainer.contains(event.target)) {
                gridItem.optionsContainerEnabled = false; // Disable re-showing on hover
                optionsContainer.remove();
                currentOpenOptionsContainer = null;
                // Remove all event listeners
                gridItem.removeEventListener('mouseenter', onGridItemMouseEnter);
                gridItem.removeEventListener('mouseleave', onGridItemMouseLeave);
                optionsContainer.removeEventListener('mouseenter', onOptionsContainerMouseEnter);
                optionsContainer.removeEventListener('mouseleave', onOptionsContainerMouseLeave);
                document.removeEventListener('click', onDocumentClick);
            }
        }
    
        document.addEventListener('click', onDocumentClick);
    
        gridItem.appendChild(optionsContainer);
    }

    // Function to show Select Item options within the same container
    function showSelectItemOptions(optionsContainer, gridItem) {
        // Clear current content
        optionsContainer.innerHTML = '';

        // Back button
        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.classList.add('back-button');
        backButton.addEventListener('click', () => {
            // Return to main options
            optionsContainer.remove();
            showOptionsContainer(gridItem);
        });
        optionsContainer.appendChild(backButton);

        // Selection options
        const selectionList = document.createElement('div');
        selectionList.classList.add('selection-list');

        const liveActivitiesOption = document.createElement('button');
        liveActivitiesOption.textContent = 'Show Live Activities';
        liveActivitiesOption.addEventListener('click', () => {
            insertLiveActivities(gridItem);
            optionsContainer.remove();
            currentOpenOptionsContainer = null;
        });
        selectionList.appendChild(liveActivitiesOption);

        // Additional options can be added here

        optionsContainer.appendChild(selectionList);
    }

    // Function to show Change Layout options within the same container
    function showChangeLayoutOptions(optionsContainer, gridItem) {
        // Clear current content
        optionsContainer.innerHTML = '';

        // Back button
        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.classList.add('back-button');
        backButton.addEventListener('click', () => {
            // Return to main options
            optionsContainer.remove();
            showOptionsContainer(gridItem);
        });
        optionsContainer.appendChild(backButton);

        // Layout options
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
                optionsContainer.remove();
                currentOpenOptionsContainer = null;
            });
            layoutSelectionGroup.appendChild(button);
        });

        optionsContainer.appendChild(layoutSelectionGroup);
    }

    // Function to show Add New Level options within the same container
    function showNewLevelLayoutOptions(optionsContainer, gridItem) {
        // Clear current content
        optionsContainer.innerHTML = '';

        // Back button
        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.classList.add('back-button');
        backButton.addEventListener('click', () => {
            // Return to main options
            optionsContainer.remove();
            showOptionsContainer(gridItem);
        });
        optionsContainer.appendChild(backButton);

        // Layout options for new level
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
                optionsContainer.remove();
                currentOpenOptionsContainer = null;
            });
            layoutSelectionGroup.appendChild(button);
        });

        optionsContainer.appendChild(layoutSelectionGroup);
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

    function createButtonGroup(gridItem, level) {
        const buttonGroupWrapper = document.createElement('div');
        buttonGroupWrapper.classList.add('button-group-wrapper');
    
        const toggleButton = document.createElement('button');
        toggleButton.classList.add('toggle-button');
        toggleButton.textContent = ''; // Ensure no text content
    
        toggleButton.addEventListener('click', (event) => {
            event.stopPropagation();
            gridItem.optionsContainerEnabled = true; // Enable options container
            showOptionsContainer(gridItem);
        });
    
        buttonGroupWrapper.appendChild(toggleButton);
    
        return buttonGroupWrapper;
    }

    // Start with a 2x2 grid on page load
    const initialGrid = createGrid(1, 2, 2);
    container.appendChild(initialGrid);
});