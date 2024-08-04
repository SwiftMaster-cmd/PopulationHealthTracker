import { auth, database } from './firebase-init.js';
import { drawWheel, spinWheel, shuffleNodes } from './wheel.js';

let currentNodes = [];
let currentRotation = 0;

document.addEventListener('DOMContentLoaded', () => {
    const addNodeFieldButton = document.getElementById('add-node-field');
    const addRuleFieldButton = document.getElementById('add-rule-field');
    const savePresetButton = document.getElementById('save-preset-button');
    const saveConfigurationButton = document.getElementById('save-configuration');
    const spinButton = document.getElementById('spin-button');
    const shuffleButton = document.getElementById('shuffle-button');

    if (addNodeFieldButton) addNodeFieldButton.addEventListener('click', () => addNodeField());
    if (addRuleFieldButton) addRuleFieldButton.addEventListener('click', () => addRuleField());
    if (savePresetButton) savePresetButton.addEventListener('click', savePreset);
    if (saveConfigurationButton) saveConfigurationButton.addEventListener('click', saveConfiguration);
    if (spinButton) spinButton.addEventListener('click', () => spinWheel(currentNodes, currentRotation));
    if (shuffleButton) shuffleButton.addEventListener('click', shuffleCurrentNodes);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userAuthorityRef = ref(database, 'users/' + user.uid + '/authority');
            get(userAuthorityRef).then((snapshot) => {
                const authorityLevel = snapshot.val();
                if (authorityLevel >= 9) {
                    loadCurrentConfiguration();
                    loadCurrentRules();
                    listenForChanges();
                } else {
                    alert("You do not have permission to view this page.");
                    window.location.href = 'index.html';
                }
            });
        } else {
            window.location.href = 'index.html';
        }
    });
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

    const nodesRef = ref(database, 'gameConfiguration/nodes');
    set(nodesRef, nodes).then(() => {
        console.log('Configuration updated successfully.');
        loadCurrentConfiguration(); // Reload the configuration to reflect changes
    }).catch((error) => {
        console.error('Error updating configuration:', error);
    });
}

function addRuleField(salesType = 'billableHRA', quantity = 0) {
    const ruleContainer = document.createElement('div');
    ruleContainer.className = 'rule-field';

    const salesTypeSelect = document.createElement('select');
    salesTypeSelect.innerHTML = `
        <option value="billableHRA" ${salesType === 'billableHRA' ? 'selected' : ''}>Billable HRA</option>
        <option value="selectPatientManagement" ${salesType === 'selectPatientManagement' ? 'selected' : ''}>Select Patient Management</option>
        <option value="selectRX" ${salesType === 'selectRX' ? 'selected' : ''}>Select RX</option>
        <option value="transfer" ${salesType === 'transfer' ? 'selected' : ''}>Transfer</option>
    `;
    salesTypeSelect.addEventListener('change', updateRules);

    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.placeholder = 'Quantity';
    quantityInput.value = quantity;
    quantityInput.addEventListener('input', updateRules);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
        ruleContainer.remove();
        updateRules();
    });

    ruleContainer.appendChild(salesTypeSelect);
    ruleContainer.appendChild(quantityInput);
    ruleContainer.appendChild(removeButton);

    document.getElementById('rules-container').appendChild(ruleContainer);
}

function updateRules() {
    const rulesContainer = document.getElementById('rules-container');
    const ruleFields = rulesContainer.getElementsByClassName('rule-field');
    const rules = [];

    for (let i = 0; i < ruleFields.length; i++) {
        const salesType = ruleFields[i].querySelector('select').value;
        const quantity = ruleFields[i].querySelector('input').value;
        rules.push({ salesType, quantity });
    }

    const rulesRef = ref(database, 'gameRules');
    set(rulesRef, rules).then(() => {
        console.log('Rules updated successfully.');
    }).catch((error) => {
        console.error('Error updating rules:', error);
    });
}

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

function loadCurrentConfiguration() {
    const configRef = ref(database, 'gameConfiguration/nodes');
    onValue(configRef, (snapshot) => {
        const nodes = snapshot.val();
        console.log('Loaded nodes:', nodes); // Debugging
        document.getElementById('nodes-container').innerHTML = ''; // Clear existing nodes
        if (nodes) {
            const counts = nodes.reduce((acc, value) => {
                acc[value] = (acc[value] || 0) + 1;
                return acc;
            }, {});
            Object.entries(counts).forEach(([value, count]) => addNodeField(parseInt(value), count));
            currentNodes = nodes;
            drawWheel(currentNodes, currentRotation);
        } else {
            console.error('No nodes found in configuration.');
        }
    });
}

function loadCurrentRules() {
    const rulesRef = ref(database, 'gameRules');
    onValue(rulesRef, (snapshot) => {
        const rules = snapshot.val();
        document.getElementById('rules-list').innerHTML = ''; // Clear existing rules
        document.getElementById('rules-container').innerHTML = ''; // Clear existing rule fields
        if (rules) {
            rules.forEach(rule => addRuleField(rule.salesType, rule.quantity));
        }
    });
}

function listenForChanges() {
    const configRef = ref(database, 'gameConfiguration/nodes');
    const rulesRef = ref(database, 'gameRules');

    onValue(configRef, () => {
        loadCurrentConfiguration();
    });

    onValue(rulesRef, () => {
        loadCurrentRules();
    });
}

function shuffleCurrentNodes() {
    currentNodes = shuffleNodes(currentNodes);
    drawWheel(currentNodes, currentRotation);
    saveConfiguration();
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
    drawWheel(currentNodes, currentRotation);
}
