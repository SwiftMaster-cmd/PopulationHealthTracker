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
    loadCurrentRandomConfiguration();
    loadPresets(); // Add this line to load presets
});

function addNodeField(value = 0, count = 1) {
    const nodeContainer = document.createElement('div');
    nodeContainer.className = 'node-field';

    const nodeValueInput = document.createElement('input');
    nodeValueInput.type = 'number';
    nodeValueInput.placeholder = 'Dollar Amount';
    nodeValueInput.value = value;

    const nodeCountInput = document.createElement('input');
    nodeCountInput.type = 'number';
    nodeCountInput.placeholder = 'Count';
    nodeCountInput.value = count;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
        nodeContainer.remove();
        saveConfiguration();
    });

    nodeContainer.appendChild(nodeValueInput);
    nodeContainer.appendChild(nodeCountInput);
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

    saveNodesConfiguration(nodes);
    currentNodes = nodes;
    drawWheel(currentNodes, currentRotation);
    console.log('Configuration updated successfully.');
    shuffleCurrentNodes(); // Automatically shuffle after saving the configuration
}

function loadPresets() {
    const presetsRef = ref(database, 'spinTheWheelPresets');
    onValue(presetsRef, (snapshot) => {
        const data = snapshot.val();
        const presets = data ? Object.entries(data).map(([key, value]) => ({ name: key, nodes: value.nodes })) : [];
        displayPresets(presets);
    });
}

function displayPresets(presets) {
    const presetsContainer = document.getElementById('presets-container');
    presetsContainer.innerHTML = '';

    presets.forEach(preset => {
        const presetButton = document.createElement('button');
        presetButton.textContent = preset.name;
        presetButton.addEventListener('click', () => loadPreset(preset));
        presetsContainer.appendChild(presetButton);
    });
}

function loadPreset(preset) {
    currentNodes = preset.nodes;
    currentRotation = 0; // Reset rotation when loading a new preset
    
    // Update the wheel configuration display
    document.getElementById('nodes-container').innerHTML = ''; // Clear existing nodes
    currentNodes.forEach(node => addNodeField(node.value, node.count));
    
    drawWheel(currentNodes, currentRotation);
    drawCurrentConfiguration();
    saveNodesConfiguration(currentNodes);
    console.log(`Loaded preset: ${preset.name}`);
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
        } else {
            console.error('No nodes found in configuration.');
        }
    });
}

function drawCurrentConfiguration(nodes = currentNodes) {
    const currentNodesContainer = document.getElementById('current-nodes-container');
    currentNodesContainer.innerHTML = ''; // Clear existing nodes

    nodes.forEach(node => {
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
