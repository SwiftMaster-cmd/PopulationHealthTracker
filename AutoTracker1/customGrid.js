// Initialize Firebase
const firebaseConfig = {
    // Your Firebase configuration here
};

firebase.initializeApp(firebaseConfig);

document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.grid-container');

    // Function to create a grid item
    function createGridItem(level) {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.dataset.level = level;

        // Create the options container but hide it by default
        const optionsContainer = createOptionsContainer(gridItem);
        gridItem.appendChild(optionsContainer);

        // Event listeners to show/hide the options container
        gridItem.addEventListener('mouseenter', () => {
            optionsContainer.classList.add('visible');
        });

        gridItem.addEventListener('mouseleave', (event) => {
            // Check if the mouse has entered the options container
            if (!optionsContainer.contains(event.relatedTarget)) {
                optionsContainer.classList.remove('visible');
            }
        });

        optionsContainer.addEventListener('mouseleave', (event) => {
            // Hide the options container when the mouse leaves it
            if (!gridItem.contains(event.relatedTarget)) {
                optionsContainer.classList.remove('visible');
            }
        });

        return gridItem;
    }

    // Function to create the options container for a grid item
    function createOptionsContainer(gridItem) {
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

        // Add the Leaderboard button
        const leaderboardButton = document.createElement('button');
        leaderboardButton.textContent = 'Leaderboard';
        leaderboardButton.addEventListener('click', () => {
            showLeaderboard(optionsContainer, gridItem);
        });
        optionsList.appendChild(leaderboardButton);

        if (parseInt(gridItem.dataset.level) < 3) {
            const addNewLevelButton = document.createElement('button');
            addNewLevelButton.textContent = 'Add New Level';
            addNewLevelButton.addEventListener('click', () => {
                showNewLevelLayoutOptions(optionsContainer, gridItem);
            });
            optionsList.appendChild(addNewLevelButton);
        }

        optionsContainer.appendChild(optionsList);

        // Hide the options container by default
        optionsContainer.classList.add('hidden');

        return optionsContainer;
    }

    // Function to show Select Item options within the options container
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
            const newOptionsContainer = createOptionsContainer(gridItem);
            gridItem.appendChild(newOptionsContainer);
        });
        optionsContainer.appendChild(backButton);

        // Selection options
        const selectionList = document.createElement('div');
        selectionList.classList.add('selection-list');

        const liveActivitiesOption = document.createElement('button');
        liveActivitiesOption.textContent = 'Show Live Activities';
        liveActivitiesOption.addEventListener('click', () => {
            insertLiveActivities(gridItem);
            optionsContainer.classList.remove('visible');
        });
        selectionList.appendChild(liveActivitiesOption);

        // Additional options can be added here

        optionsContainer.appendChild(selectionList);
    }

    // Function to show Change Layout options within the options container
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
            const newOptionsContainer = createOptionsContainer(gridItem);
            gridItem.appendChild(newOptionsContainer);
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
                optionsContainer.classList.remove('visible');
            });
            layoutSelectionGroup.appendChild(button);
        });

        optionsContainer.appendChild(layoutSelectionGroup);
    }

    // Function to show the Leaderboard within the options container
    function showLeaderboard(optionsContainer, gridItem) {
        // Clear current content
        optionsContainer.innerHTML = '';

        // Back button
        const backButton = document.createElement('button');
        backButton.textContent = 'Back';
        backButton.classList.add('back-button');
        backButton.addEventListener('click', () => {
            // Return to main options
            optionsContainer.remove();
            const newOptionsContainer = createOptionsContainer(gridItem);
            gridItem.appendChild(newOptionsContainer);
        });
        optionsContainer.appendChild(backButton);

        // Create a container for the leaderboard
        const leaderboardContainer = document.createElement('div');
        leaderboardContainer.classList.add('leaderboard-container');

        // Call your function to load the leaderboard into this container
        loadLeaderboardIntoContainer(leaderboardContainer);

        optionsContainer.appendChild(leaderboardContainer);
    }

    // Function to show Add New Level options within the options container
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
            const newOptionsContainer = createOptionsContainer(gridItem);
            gridItem.appendChild(newOptionsContainer);
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
                optionsContainer.classList.remove('visible');
            });
            layoutSelectionGroup.appendChild(button);
        });

        optionsContainer.appendChild(layoutSelectionGroup);
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

    // Start with a 2x2 grid on page load
    const initialGrid = createGrid(1, 2, 2);
    container.appendChild(initialGrid);

    // Include your existing leaderboard and live activities code here

    // ... Your Firebase authentication and initialization code ...

    // Function to load the leaderboard into a container
    function loadLeaderboardIntoContainer(container) {
        // Create period and sale type pickers
        const periodPicker = document.createElement('select');
        periodPicker.id = 'periodPicker';
        periodPicker.innerHTML = `
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
        `;

        const saleTypePicker = document.createElement('select');
        saleTypePicker.id = 'saleTypePicker';
        saleTypePicker.innerHTML = `
            <option value="selectRX">Select RX</option>
            <option value="spmScheduledCall">SPM Scheduled Call</option>
            <option value="transfer">Transfer</option>
            <option value="billableHRA">Billable HRA</option>
        `;

        const leaderboardTitle = document.createElement('h2');
        leaderboardTitle.id = 'leaderboard-title';
        leaderboardTitle.textContent = `Leaderboard: ${getReadableTitle(saleTypePicker.value)}`;

        const leaderboardSection = document.createElement('div');
        leaderboardSection.id = 'leaderboard-section';

        container.appendChild(periodPicker);
        container.appendChild(saleTypePicker);
        container.appendChild(leaderboardTitle);
        container.appendChild(leaderboardSection);

        periodPicker.addEventListener('change', () => {
            loadLeaderboard(periodPicker.value, saleTypePicker.value, leaderboardSection);
            leaderboardTitle.textContent = `Leaderboard: ${getReadableTitle(saleTypePicker.value)}`;
        });

        saleTypePicker.addEventListener('change', () => {
            loadLeaderboard(periodPicker.value, saleTypePicker.value, leaderboardSection);
            leaderboardTitle.textContent = `Leaderboard: ${getReadableTitle(saleTypePicker.value)}`;
        });

        // Initial load
        loadLeaderboard(periodPicker.value, saleTypePicker.value, leaderboardSection);
    }

    // Function to load the leaderboard
    async function loadLeaderboard(period = 'day', saleType = 'selectRX', container) {
        const database = firebase.database();
        const salesCountsRef = database.ref('salesCounts');
        const usersRef = database.ref('users');

        const leaderboardSection = container;
        if (!leaderboardSection) {
            console.error('Leaderboard section element not found');
            return;
        }

        salesCountsRef.off('value');

        salesCountsRef.on('value', salesSnapshot => {
            const salesData = salesSnapshot.val();
            if (!salesData) {
                console.log('No sales data found. Leaderboard will not be loaded.');
                leaderboardSection.innerHTML = ''; // Clear the section if no sales data
                return;
            }

            let hasSales = false;

            for (const userId in salesData) {
                const userData = salesData[userId];
                if (period === 'day' && userData.day && userData.day[saleType] !== undefined) {
                    hasSales = true;
                    break;
                } else if (period === 'week' && userData.week && userData.week[saleType]) {
                    hasSales = true;
                    break;
                } else if (period === 'month' && userData.month && userData.month[saleType]) {
                    hasSales = true;
                    break;
                }
            }

            if (!hasSales) {
                console.log('No sales matching the criteria. Leaderboard will not be loaded.');
                leaderboardSection.innerHTML = ''; // Clear the section if no matching sales
                return;
            }

            const users = [];

            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    usersRef.once('value', usersSnapshot => {
                        const usersData = usersSnapshot.val();
                        const currentUserId = user.uid;

                        for (const userId in salesData) {
                            const userData = salesData[userId];
                            let count = 0;

                            if (period === 'day') {
                                if (userData.day && userData.day[saleType] !== undefined) {
                                    count = userData.day[saleType]; // Access the count directly
                                }
                            } else if (period === 'week') {
                                count = userData.week && userData.week[saleType] ? userData.week[saleType] : 0;
                            } else if (period === 'month') {
                                count = userData.month && userData.month[saleType] ? userData.month[saleType] : 0;
                            }

                            let name = usersData && usersData[userId] && usersData[userId].name ? usersData[userId].name : 'Unknown User';
                            users.push({ userId, name, count });
                        }

                        users.sort((a, b) => b.count - a.count);

                        leaderboardSection.innerHTML = ''; // Clear the section before adding new items

                        users.forEach((user, index) => {
                            // Create the leaderboard item container
                            const leaderboardItem = document.createElement('div');
                            leaderboardItem.classList.add('leaderboard-item');

                            // Add the appropriate class based on rank
                            if (index === 0) {
                                leaderboardItem.classList.add('first-place');
                            } else if (index === 1) {
                                leaderboardItem.classList.add('second-place');
                            } else if (index === 2) {
                                leaderboardItem.classList.add('third-place');
                            }

                            // Create the position container
                            const positionContainer = document.createElement('div');
                            positionContainer.classList.add('leaderboard-position');
                            positionContainer.innerHTML = `<span class="position-number">${index + 1}</span>`;

                            // Create the name container
                            const nameContainer = document.createElement('div');
                            nameContainer.classList.add('leaderboard-name');
                            nameContainer.textContent = user.name;

                            // Create the score container
                            const scoreContainer = document.createElement('div');
                            scoreContainer.classList.add('leaderboard-score');
                            scoreContainer.innerHTML = `<span class="score-number">${user.count}</span>`;

                            // Append the containers to the leaderboard item
                            leaderboardItem.appendChild(positionContainer);
                            leaderboardItem.appendChild(nameContainer);
                            leaderboardItem.appendChild(scoreContainer);

                            // Append the leaderboard item to the section
                            leaderboardSection.appendChild(leaderboardItem);
                        });
                    });
                } else {
                    console.error('No user is signed in.');
                }
            });
        }, error => {
            console.error('Error fetching sales data:', error);
        });
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

        // Load live activities
        loadLiveActivities();
    }

    // Include your live activities functions here
    // ... Your live activities code ...

    // Function to get readable title
    function getReadableTitle(saleType) {
        switch (saleType) {
            case 'Notes':
                return 'Notes';
            case 'HRA Completed':
                return 'HRA Completed';
            case 'Select RX':
                return 'Select RX';
            case 'selectPatientManagement':
                return 'Select Patient Management';
            case 'spmScheduledCall':
                return 'SPM Scheduled Call';
            case 'transfer':
                return 'Transfer';
            case 'billableHRA':
                return 'Billable HRA';
            default:
                return saleType;
        }
    }

    // ... Rest of your code ...

});