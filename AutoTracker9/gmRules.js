import { database } from './firebase-init.js';
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { drawWheel, saveNodesConfiguration } from './wheel.js';

let currentNodes = [];
let currentRotation = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('save-preset-button').addEventListener('click', savePreset);
    loadPresets();
});

function savePreset() {
    const presetName = document.getElementById('preset-name').value;
    if (!presetName) {
        alert('Please enter a preset name.');
        return;
    }

    const preset = { nodes: currentNodes };

    const presetsRef = ref(database, `spinTheWheelPresets/${presetName}`);
    set(presetsRef, preset).then(() => {
        alert('Preset saved successfully.');
        loadPresets(); // Refresh the presets list after saving
    }).catch((error) => {
        console.error('Error saving preset:', error);
    });
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

    const presetsPerPage = 5;
    const currentPage = 0;

    const start = currentPage * presetsPerPage;
    const end = Math.min(start + presetsPerPage, presets.length);

    for (let i = start; i < end; i++) {
        const preset = presets[i];
        const presetButton = document.createElement('button');
        presetButton.textContent = preset.name;
        presetButton.addEventListener('click', () => displayPresetSummary(preset));
        presetsContainer.appendChild(presetButton);
    }

    document.getElementById('prev-button').disabled = currentPage === 0;
    document.getElementById('next-button').disabled = end >= presets.length;
}

function displayPresetSummary(preset) {
    const summaryText = document.getElementById('summary-text');
    summaryText.textContent = `Preset: ${preset.name}`;

    const nodes = preset.nodes;
    console.log('Preset nodes:', nodes); // Debugging
    currentNodes = nodes;
    currentRotation = 0; // Reset rotation to zero when loading a new preset
    drawWheel(currentNodes, currentRotation, 'selected-preset-wheel-canvas');
    drawCurrentConfiguration();
    saveNodesConfiguration(currentNodes); // Save the nodes configuration to Firebase

    // Disable the summary section
    const summarySection = document.getElementById('summary');
    summarySection.style.display = 'none';
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
