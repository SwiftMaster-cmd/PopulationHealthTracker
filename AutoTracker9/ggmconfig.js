import { database } from './firebase-init.js';
import { ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { drawWheel, spinWheel, shuffleNodes, saveNodesConfiguration, loadNodesConfiguration } from './wheel.js';

let currentNodes = [];
let currentRotation = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('add-node-field').addEventListener('click', () => addNodeField());
    document.getElementById('save-configuration').addEventListener('click', saveConfiguration);
    document.getElementById('spin-button').addEventListener('click', () => loadShuffledNodesAndSpin());
    document.getElementById('shuffle-button').addEventListener('click', shuffleCurrentNodes);

    loadCurrentConfiguration();
    listenForChanges();
    loadCurrentRandomConfiguration(); // Load current random configuration on page load
});

function addNodeField(value = 0, count = 1) {
    const nodeContainer = document.createElement('div');
    nodeContainer.className = 'node-field';

    const nodeValueInput = document.createElement('input');
    nodeValueInput.type = 'number';
    nodeValueInput.placeholder = 'Dollar Amount';
    nodeValueInput.value = value;
    nodeValueInput.className = 'node-input';

    const incrementButton = document.createElement('button');
    incrementButton.textContent = '+';
    incrementButton.className = 'increment-button';
    incrementButton.addEventListener('click', () => {
        nodeValueInput.value = parseInt(nodeValueInput.value) + 1;
    });

    const decrementButton = document.createElement('button');
    decrementButton.textContent = '-';
    decrementButton.className = 'decrement-button';
    decrementButton.addEventListener('click', () => {
        nodeValueInput.value = parseInt(nodeValueInput.value) - 1;
    });

    const nodeCountInput = document.createElement('input');
    nodeCountInput.type = 'number';
    nodeCountInput.placeholder = 'Count';
    nodeCountInput.value = count;
    nodeCountInput.className = 'node-input';

    const incrementCountButton = document.createElement('button');
    incrementCountButton.textContent = '+';
    incrementCountButton.className = 'increment-button';
    incrementCountButton.addEventListener('click', () => {
        nodeCountInput.value = parseInt(nodeCountInput.value) + 1;
    });

    const decrementCountButton = document.createElement('button');
    decrementCountButton.textContent = '-';
    decrementCountButton.className = 'decrement-button';
    decrementCountButton.addEventListener('click', () => {
        nodeCountInput.value = parseInt(nodeCountInput.value) - 1;
    });

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.className = 'remove-button';
    removeButton.addEventListener('click', () => {
        nodeContainer.remove();
        saveConfiguration();
    });

    nodeContainer.appendChild(decrementButton);
    nodeContainer.appendChild(nodeValueInput);
    nodeContainer.appendChild(incrementButton);
    nodeContainer.appendChild(decrementCountButton);
    nodeContainer.appendChild(nodeCountInput);
    nodeContainer.appendChild(incrementCountButton);
    nodeContainer.appendChild(removeButton);

    document.getElementById('nodes-container').appendChild(nodeContainer);
}

function saveConfiguration() {
    const nodesContainer = document.getElementById('nodes-container');
    const nodeFields = nodesContainer.getElementsByClassName('node-field');
    let nodes = [];

    for (let i = 0; i < nodeFields.length; i++) {
        const nodeValue = parseInt(nodeFields[i].querySelector('input[placeholder="Dollar Amount"]').value);
        const nodeCount = parseInt(nodeFields[i].querySelector('input[placeholder="Count"]').value);

        // Validation
        if (isNaN(nodeValue) || isNaN(nodeCount) || nodeValue <= 0 || nodeCount <= 0) {
            alert("Please enter valid numbers for all node fields.");
            return;
        }

        nodes.push({ value: nodeValue, count: nodeCount });
    }

    // Save nodes configuration
    saveNodesConfiguration(nodes);
    currentNodes = nodes;
    drawWheel(currentNodes, currentRotation);
    console.log('Configuration updated successfully.');

    // Shuffle nodes after saving the configuration
    shuffleCurrentNodes();  // This now automatically updates the shuffled nodes and redraws the wheel

    // Enable the summary section
    const summarySection = document.getElementById('summary');
    summarySection.style.display = 'block';
}


function loadCurrentConfiguration() {
    loadNodesConfiguration((nodes, rotation) => {
        document.getElementById('nodes-container').innerHTML = ''; // Clear existing nodes
        if (nodes) {
            nodes.forEach(node => addNodeField(node.value, node.count));
            currentNodes = nodes;
            currentRotation = rotation;
            drawWheel(currentNodes, currentRotation);
            drawCurrentConfiguration();

            // Shuffle nodes after loading the configuration to ensure the wheel is up-to-date
            shuffleCurrentNodes();  // This now ensures that the shuffled nodes are refreshed when a configuration is loaded
        } else {
            console.error('No nodes found in configuration.');
        }
    });
}


function drawCurrentConfiguration() {
    const currentNodesContainer = document.getElementById('current-nodes-container');
    currentNodesContainer.innerHTML = ''; // Clear existing nodes

    currentNodes.forEach(node => {
        const nodeElement = document.createElement('div');
        nodeElement.textContent = `Value: ${node.value}, Count: ${node.count}`;
        currentNodesContainer.appendChild(nodeElement);
    });
}

function listenForChanges() {
    const configRef = ref(database, 'wheel/nodes');

    onValue(configRef, () => {
        loadCurrentConfiguration();
    });
}

function shuffleCurrentNodes() {
    const shuffledNodes = shuffleNodes(currentNodes);
    drawWheel(shuffledNodes, currentRotation);

    // Save the shuffled nodes as a separate subnode
    const shuffledNodesRef = ref(database, 'wheel/shuffledNodes');
    set(shuffledNodesRef, shuffledNodes);

    drawRandomConfiguration(shuffledNodes); // Update the random configuration display
}

function loadCurrentRandomConfiguration() {
    const randomConfigRef = ref(database, 'wheel/shuffledNodes');
    onValue(randomConfigRef, (snapshot) => {
        const randomNodes = snapshot.val();
        if (randomNodes) {
            drawRandomConfiguration(randomNodes);
        } else {
            console.error('No shuffled nodes found in configuration.');
        }
    });
}

function drawRandomConfiguration(randomNodes) {
    const randomNodesContainer = document.getElementById('random-nodes-container');
    randomNodesContainer.innerHTML = ''; // Clear existing nodes

    randomNodes.forEach(value => {
        const nodeElement = document.createElement('div');
        nodeElement.textContent = `Value: ${value}`;
        randomNodesContainer.appendChild(nodeElement);
    });
}

function loadShuffledNodesAndSpin() {
    const shuffledNodesRef = ref(database, 'wheel/shuffledNodes');
    get(shuffledNodesRef).then(snapshot => {
        const shuffledNodes = snapshot.val();
        if (shuffledNodes) {
            spinWheel(shuffledNodes, currentRotation);
        } else {
            alert('No shuffled nodes found. Please shuffle the nodes first.');
        }
    });
}
