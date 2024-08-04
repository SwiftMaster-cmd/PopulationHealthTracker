import { database } from './firebase-init.js';
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { drawWheel, spinWheel, shuffleNodes, saveNodesConfiguration, loadNodesConfiguration } from './wheel.js';

let currentNodes = [];
let currentRotation = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('add-node-field').addEventListener('click', () => addNodeField());
    document.getElementById('save-configuration').addEventListener('click', saveConfiguration);
    document.getElementById('spin-button').addEventListener('click', () => spinWheel(currentNodes, currentRotation));
    document.getElementById('shuffle-button').addEventListener('click', shuffleCurrentNodes);

    loadCurrentConfiguration();
    listenForChanges();
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
    drawCurrentConfiguration();
    drawWheel(currentNodes, currentRotation);
    console.log('Configuration updated successfully.');
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
    const configRef = ref(database, 'gameConfiguration/nodes');

    onValue(configRef, () => {
        loadCurrentConfiguration();
    });
}

function shuffleCurrentNodes() {
    currentNodes = shuffleNodes(currentNodes);
    drawWheel(currentNodes, currentRotation);
    saveNodesConfiguration(currentNodes); // Save the shuffled nodes configuration to Firebase
}
