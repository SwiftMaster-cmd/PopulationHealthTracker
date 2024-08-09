import { database } from './firebase-init.js';
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { drawWheel, saveNodesConfiguration, shuffleAndUpdateWheel } from './wheel.js';

let currentNodes = [];
let currentRotation = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('save-preset-button').addEventListener('click', savePreset);
    document.getElementById('scroll-left').addEventListener('click', () => scrollPresets('left'));
    document.getElementById('scroll-right').addEventListener('click', () => scrollPresets('right'));
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
    const presetContainer = document.getElementById('preset-container');
    presetContainer.innerHTML = '';

    presets.forEach(preset => {
        const presetItem = document.createElement('div');
        presetItem.className = 'preset-item';
        presetItem.textContent = preset.name;
        presetItem.addEventListener('click', () => displayPresetSummary(preset));
        presetContainer.appendChild(presetItem);
    });
}

function scrollPresets(direction) {
    const presetContainer = document.getElementById('preset-container');
    const scrollAmount = 100; // Adjust scroll amount as needed

    if (direction === 'left') {
        presetContainer.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    } else if (direction === 'right') {
        presetContainer.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }
}

function displayPresetSummary(preset) {
    const summaryText = document.getElementById('summary-text');
    summaryText.textContent = `Preset: ${preset.name}`;

    const nodes = preset.nodes;
    console.log('Preset nodes:', nodes); // Debugging
    currentNodes = nodes;
    currentRotation = 0; // Reset rotation to zero when loading a new preset

    // Shuffle and update wheel after loading the preset
    const shuffledNodes = shuffleAndUpdateWheel(currentNodes);

    // Update the UI with the current shuffled configuration
    drawCurrentConfiguration(shuffledNodes);

    // Disable the summary section
    const summarySection = document.getElementById('summary');
    summarySection.style.display = 'none';
}

function drawCurrentConfiguration(shuffledNodes) {
    const currentNodesContainer = document.getElementById('current-nodes-container');
    currentNodesContainer.innerHTML = ''; // Clear existing nodes

    shuffledNodes.forEach(value => {
        const nodeElement = document.createElement('div');
        nodeElement.textContent = `Value: ${value}`;
        currentNodesContainer.appendChild(nodeElement);
    });
}
