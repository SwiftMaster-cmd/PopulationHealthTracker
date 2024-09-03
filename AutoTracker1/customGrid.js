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

    // Create initial button group to select the starting layout
    const initialButtonGroup = document.createElement('div');
    initialButtonGroup.classList.add('button-group');

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

    initialButtonGroup.appendChild(layout1x1);
    initialButtonGroup.appendChild(layout2x1);
    initialButtonGroup.appendChild(layout1x2);
    initialButtonGroup.appendChild(layout2x2);

    container.appendChild(initialButtonGroup); // Add the initial button group to the container

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
