import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, get, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { drawWheel, spinWheel, shuffleNodes } from './wheel.js'; // Correct import statement

const firebaseConfig = {
    apiKey: "AIzaSyBhSqBwrg8GYyaqpYHOZS8HtFlcXZ09OJA",
    authDomain: "track-dac15.firebaseapp.com",
    databaseURL: "https://track-dac15-default-rtdb.firebaseio.com",
    projectId: "track-dac15",
    storageBucket: "track-dac15.appspot.com",
    messagingSenderId: "495156821305",
    appId: "1:495156821305:web:7cbb86d257ddf9f0c3bce8",
    measurementId: "G-RVBYB0RR06"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

let currentNodes = [];
let currentRotation = 0;

document.getElementById('add-node-field').addEventListener('click', () => addNodeField());
document.getElementById('add-rule-field').addEventListener('click', () => addRuleField());
document.getElementById('save-preset-button').addEventListener('click', savePreset);
document.getElementById('save-configuration').addEventListener('click', saveConfiguration);
document.getElementById('spin-button').addEventListener('click', () => spinWheel(currentNodes, currentRotation));
document.getElementById('shuffle-button').addEventListener('click', shuffleCurrentNodes);

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

    set(ref(database, 'gameRules'), rules).then(() => {
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

    const nodesContainer = document.getElementById('nodes-container');
    const nodeFields = nodesContainer.getElementsByClassName('node-field');
    let nodes = [];

    for (let i = 0; i < nodeFields.length; i++) {
        const nodeValue = parseInt(nodeFields[i].querySelector('input[placeholder="Dollar Amount"]').value);
        const nodeCount = parseInt(nodeFields[i].querySelector('input[placeholder="Count"]').value);
        nodes.push({ value: nodeValue, count: nodeCount });
    }

    const preset = { nodes };

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
    drawWheel(currentNodes, currentRotation);
}
