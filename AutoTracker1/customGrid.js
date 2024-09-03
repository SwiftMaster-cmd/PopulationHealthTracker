document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.grid-container');
    let currentOpenButtonGroup = null;

    // Function to create a grid item
    function createGridItem(level) {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');

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
        grid.classList.add(`grid-${columns}x${rows}`);

        for (let i = 0; i < columns * rows; i++) {
            const gridItem = createGridItem(level);
            gridItem.dataset.level = level;
            grid.appendChild(gridItem);
        }

        return grid;
    }

    // Function to handle layout change
    function changeLayout(columns, rows) {
        container.innerHTML = ''; // Clear the container
        const newGrid = createGrid(1, columns, rows); // Start with level 1 grid
        container.appendChild(newGrid);
    }

    // Create initial button to select the level 1 structure
    const initialSelectButton = document.createElement('button');
    initialSelectButton.textContent = 'Select Layout';
    initialSelectButton.classList.add('initial-select-button');
    initialSelectButton.addEventListener('click', () => showLayoutOptions());

    container.appendChild(initialSelectButton); // Add the initial button to the container

    // Function to show layout options
    function showLayoutOptions() {
        container.innerHTML = ''; // Clear the container

        const layoutSelectionGroup = document.createElement('div');
        layoutSelectionGroup.classList.add('button-group');

        const layout1x1 = document.createElement('button');
        layout1x1.textContent = '1x1';
        layout1x1.addEventListener('click', () => changeLayout(1, 1));

        const layout2x1 = document.createElement('button');
        layout2x1.textContent = '2x1';
        layout2x1.addEventListener('click', () => changeLayout(2, 1));

        const layout1x2 = document.createElement('button');
        layout1x2.textContent = '1x2';
        layout1x2.addEventListener('click', () => changeLayout(1, 2));

        const layout2x2 = document.createElement('button');
        layout2x2.textContent = '2x2';
        layout2x2.addEventListener('click', () => changeLayout(2, 2));

        layoutSelectionGroup.appendChild(layout1x1);
        layoutSelectionGroup.appendChild(layout2x1);
        layoutSelectionGroup.appendChild(layout1x2);
        layoutSelectionGroup.appendChild(layout2x2);

        container.appendChild(layoutSelectionGroup); // Show layout options in the container
    }

    // Function to create a button group for changing layouts inside containers
    function createButtonGroup(gridItem, level) {
        const buttonGroup = document.createElement('div');
        buttonGroup.classList.add('button-group');

        const layout1x1 = document.createElement('button');
        layout1x1.textContent = '1x1';
        layout1x1.addEventListener('click', () => changeLayoutInGridItem(gridItem, 1, 1));

        const layout2x1 = document.createElement('button');
        layout2x1.textContent = '2x1';
        layout2x1.addEventListener('click', () => changeLayoutInGridItem(gridItem, 2, 1));

        const layout1x2 = document.createElement('button');
        layout1x2.textContent = '1x2';
        layout1x2.addEventListener('click', () => changeLayoutInGridItem(gridItem, 1, 2));

        const layout2x2 = document.createElement('button');
        layout2x2.textContent = '2x2';
        layout2x2.addEventListener('click', () => changeLayoutInGridItem(gridItem, 2, 2));

        buttonGroup.appendChild(layout1x1);
        buttonGroup.appendChild(layout2x1);
        buttonGroup.appendChild(layout1x2);
        buttonGroup.appendChild(layout2x2);

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

    // Function to change layout inside a grid item
    function changeLayoutInGridItem(gridItem, columns, rows) {
        gridItem.innerHTML = ''; // Clear the grid item
        const newGrid = createGrid(parseInt(gridItem.dataset.level) + 1, columns, rows); // Create new grid at the next level
        gridItem.appendChild(newGrid);
    }
});
