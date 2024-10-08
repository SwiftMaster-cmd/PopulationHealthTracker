// custom-grid.js
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
        grid.classList.add(`grid-level-${level}`); // Add class for level

        // Set up hover behavior for this grid
        setupGridHoverBehavior(grid, level);

        for (let i = 0; i < columns * rows; i++) {
            const gridItem = createGridItem(level);
            grid.appendChild(gridItem);
        }

        return grid;
    }

    // Function to set up hover behavior for grids
    function setupGridHoverBehavior(grid, level) {
        let inactivityTimer;

        function showToggleButtons() {
            // Show the toggle buttons of grid items at this level
            const gridItems = grid.querySelectorAll('.grid-item');
            gridItems.forEach(gridItem => {
                const buttonGroupWrapper = gridItem.querySelector('.button-group-wrapper');
                if (buttonGroupWrapper) {
                    buttonGroupWrapper.style.opacity = '1';
                }
            });
        }

        function hideToggleButtons() {
            // Hide the toggle buttons of grid items at this level
            const gridItems = grid.querySelectorAll('.grid-item');
            gridItems.forEach(gridItem => {
                const buttonGroupWrapper = gridItem.querySelector('.button-group-wrapper');
                if (buttonGroupWrapper) {
                    buttonGroupWrapper.style.opacity = '0';
                }
            });
        }

        function resetInactivityTimer() {
            if (inactivityTimer) {
                clearTimeout(inactivityTimer);
            }
            inactivityTimer = setTimeout(() => {
                hideToggleButtons();
            }, 5000);
        }

        grid.addEventListener('mouseenter', () => {
            showToggleButtons();
            resetInactivityTimer();
        });

        grid.addEventListener('mouseleave', () => {
            hideToggleButtons();
            if (inactivityTimer) {
                clearTimeout(inactivityTimer);
            }
        });

        grid.addEventListener('mousemove', () => {
            resetInactivityTimer();
        });
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
        // Close any open options containers
        if (currentOpenOptionsContainer && currentOpenOptionsContainer !== gridItem) {
            const visibleOptionsContainer = currentOpenOptionsContainer.querySelector('.options-container');
            if (visibleOptionsContainer) {
                visibleOptionsContainer.remove();
            }
        }

        currentOpenOptionsContainer = gridItem;

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

        // Prevent click events inside the optionsContainer from propagating
        optionsContainer.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        // Close the options container when clicking outside
        function outsideClickListener(event) {
            if (!optionsContainer.contains(event.target)) {
                optionsContainer.remove();
                currentOpenOptionsContainer = null;
                document.removeEventListener('click', outsideClickListener);
            }
        }

        document.addEventListener('click', outsideClickListener);

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

    // Function to create a button group for settings
    function createButtonGroup(gridItem, level) {
        const buttonGroupWrapper = document.createElement('div');
        buttonGroupWrapper.classList.add('button-group-wrapper');

        const toggleButton = document.createElement('button');
        toggleButton.classList.add('toggle-button');
        // No icon or text as per your request

        toggleButton.addEventListener('click', (event) => {
            event.stopPropagation();
            showOptionsContainer(gridItem);
        });

        buttonGroupWrapper.appendChild(toggleButton);

        return buttonGroupWrapper;
    }

    // Function to insert live activities into a grid item
    function insertLiveActivities(gridItem) {
        // Check if Firebase is initialized
        if (!firebase.apps.length) {
            console.error('Firebase is not initialized');
            return;
        }

        // Remove existing content from the grid item
        gridItem.innerHTML = '';

        // Create a container for the live activities
        const liveActivitiesContainer = document.createElement('div');
        liveActivitiesContainer.classList.add('live-activities-container');

        // Append the container to the grid item
        gridItem.appendChild(liveActivitiesContainer);

        // Check if user is authenticated
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in.
                fetchSalesData();
            } else {
                // No user is signed in, sign in anonymously
                firebase.auth().signInAnonymously().catch(function(error) {
                    console.error('Authentication error:', error);
                });
            }
        });

        function fetchSalesData() {
            // Get a reference to the 'salesOutcomes' in Firebase
            const salesOutcomesRef = firebase.database().ref('salesOutcomes');

            // Listen for data changes
            salesOutcomesRef.on('value', (snapshot) => {
                const data = snapshot.val();

                // Process data to compute 'sales per day'
                const salesPerDay = computeSalesPerDay(data);

                // Display the sales per day in the liveActivitiesContainer
                liveActivitiesContainer.innerHTML = '';

                const salesPerDayElement = document.createElement('div');
                salesPerDayElement.classList.add('sales-per-day');
                salesPerDayElement.textContent = `Sales Today: ${salesPerDay}`;

                liveActivitiesContainer.appendChild(salesPerDayElement);
            }, (error) => {
                console.error('Error fetching salesOutcomes:', error);
            });
        }
    }

    // Function to compute sales per day from salesOutcomes data
    function computeSalesPerDay(data) {
        const salesByDay = {};

        for (const userId in data) {
            const userSales = data[userId];

            for (const saleId in userSales) {
                const sale = userSales[saleId];

                // Check if sale.outcomeTime exists
                if (sale.outcomeTime) {
                    // Parse the date and get the day in YYYY-MM-DD format
                    const date = new Date(sale.outcomeTime);
                    const day = date.toISOString().substring(0, 10);

                    if (!salesByDay[day]) {
                        salesByDay[day] = 0;
                    }
                    salesByDay[day] += 1; // Assuming each sale counts as 1
                }
            }
        }

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().substring(0, 10);

        const salesToday = salesByDay[today] || 0;

        return salesToday;
    }

    // Start with a 2x2 grid on page load
    const initialGrid = createGrid(1, 2, 2);
    container.appendChild(initialGrid);
});