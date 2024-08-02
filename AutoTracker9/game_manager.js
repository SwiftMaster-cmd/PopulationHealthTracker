import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, get, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

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

document.getElementById('add-node-field').addEventListener('click', () => addNodeField());
document.getElementById('add-rule-field').addEventListener('click', () => addRuleField());
document.getElementById('save-preset-button').addEventListener('click', savePreset);

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

document.getElementById('add-node-field').addEventListener('click', () => addNodeField());
document.getElementById('save-configuration').addEventListener('click', saveConfiguration);


function saveConfiguration() {
    const nodesContainer = document.getElementById('nodes-container');
    const nodeFields = nodesContainer.getElementsByClassName('node-field');
    let nodes = [];

    // Collect node values and counts
    for (let i = 0; i < nodeFields.length; i++) {
        const nodeValue = parseInt(nodeFields[i].querySelector('input[placeholder="Dollar Amount"]').value);
        const nodeCount = parseInt(nodeFields[i].querySelector('input[placeholder="Count"]').value);
        for (let j = 0; j < nodeCount; j++) {
            nodes.push(nodeValue);
        }
    }

    // Shuffle the nodes array to randomize the order
    nodes = shuffle(nodes);

    // Save each node individually to Firebase
    const nodesRef = ref(database, 'gameConfiguration/nodes');
    set(nodesRef, nodes).then(() => {
        console.log('Configuration updated successfully.');
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

function updateConfiguration() {
    const nodesContainer = document.getElementById('nodes-container');
    const nodeFields = nodesContainer.getElementsByClassName('node-field');
    let nodes = [];

    // Collect node values
    for (let i = 0; i < nodeFields.length; i++) {
        const nodeValue = parseInt(nodeFields[i].querySelector('input[type="number"]').value);
        nodes.push(nodeValue);
    }

    // Shuffle the nodes array to randomize the order
    nodes = shuffle(nodes);

    // Save each node individually to Firebase
    const nodesRef = ref(database, 'gameConfiguration/nodes');
    set(nodesRef, nodes).then(() => {
        console.log('Configuration updated successfully.');
    }).catch((error) => {
        console.error('Error updating configuration:', error);
    });
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
        for (let j = 0; j < nodeCount; j++) {
            nodes.push(nodeValue);
        }
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
        document.getElementById('nodes-container').innerHTML = ''; // Clear existing nodes
        if (nodes) {
            const counts = nodes.reduce((acc, value) => {
                acc[value] = (acc[value] || 0) + 1;
                return acc;
            }, {});
            Object.entries(counts).forEach(([value, count]) => addNodeField(parseInt(value), count));
        }
        updateSummary();
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
            updateSummary();
        }
    });
}

function listenForChanges() {
    const configRef = ref(database, 'gameConfiguration/nodes');
    const rulesRef = ref(database, 'gameRules');

    onValue(configRef, () => {
        loadCurrentConfiguration();
        updateSummary();
    });

    onValue(rulesRef, () => {
        loadCurrentRules();
        updateSummary();
    });
}

function updateSummary() {
    const configRef = ref(database, 'gameConfiguration/nodes');
    const rulesRef = ref(database, 'gameRules');

    get(configRef).then((snapshot) => {
        const nodes = snapshot.val();
        generateWheel(nodes); // Call the separated wheel generation function

        get(rulesRef).then((snapshot) => {
            const rules = snapshot.val();
            let summaryText = 'Spin Rules:\n';
            if (rules) {
                rules.forEach(rule => {
                    summaryText += `Sales Type: ${rule.salesType}, Quantity: ${rule.quantity}\n`;
                });
            }
            document.getElementById('summary-text').textContent = summaryText;
        });
    });
}



function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Event listener for the shuffle button
document.getElementById('shuffle-button').addEventListener('click', shuffleNodes);

function shuffleNodes() {
    const configRef = ref(database, 'gameConfiguration/nodes');
    get(configRef).then((snapshot) => {
        let nodes = snapshot.val();
        if (nodes) {
            nodes = shuffle(nodes);
            set(configRef, nodes).then(() => {
                console.log('Nodes shuffled successfully.');
                loadCurrentConfiguration(); // Reload the configuration to reflect changes
            }).catch((error) => {
                console.error('Error shuffling nodes:', error);
            });
        }
    });
}

// Event listener for the spin button
document.getElementById('spin-button').addEventListener('click', () => {
    const configRef = ref(database, 'gameConfiguration/nodes');
    get(configRef).then((snapshot) => {
        const nodes = snapshot.val();
        if (nodes) {
            spinWheel(nodes);
        }
    });
});

function spinWheel(nodes) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const totalNodes = nodes.length;
    const angleStep = (2 * Math.PI) / totalNodes;
    const radius = canvas.width / 2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let currentRotation = 0;
    let currentSegment = 0;

    const spinDuration = 5000; // Total duration of the spin in milliseconds
    const spinSpeed = 0.02; // Initial speed of the spin
    const deceleration = 0.00098; // Deceleration rate

    function drawWheel(rotation) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        nodes.forEach((nodeValue, index) => {
            const startAngle = index * angleStep + rotation;
            const endAngle = startAngle + angleStep;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            ctx.fillStyle = (index % 2 === 0) ? '#FFCC00' : '#FF9900';
            ctx.fill();
            ctx.stroke();

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((startAngle + endAngle) / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#000';
            ctx.font = '20px Arial';
            ctx.fillText(`$${nodeValue}`, radius - 10, 10);
            ctx.restore();
        });
    }

    function animateSpin(timestamp) {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;

        if (elapsed < spinDuration) {
            currentRotation += spinSpeed * (1 - (elapsed / spinDuration) * deceleration);
            currentSegment = Math.floor((totalNodes * currentRotation / (2 * Math.PI)) % totalNodes);
            drawWheel(currentRotation);
            requestAnimationFrame(animateSpin);
        } else {
            drawWheel(currentRotation);
            console.log('Selected segment:', nodes[currentSegment]);
        }
    }

    let start;
    requestAnimationFrame(animateSpin);
}




function generateWheel(nodes) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');

    if (nodes) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const totalNodes = nodes.length;
        const angleStep = (2 * Math.PI) / totalNodes;
        const radius = canvas.width / 2;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        let currentAngle = 0;

        nodes.forEach((nodeValue, index) => {
            const startAngle = currentAngle;
            const endAngle = startAngle + angleStep;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            // Alternate colors for each segment
            ctx.fillStyle = (index % 2 === 0) ? '#FFCC00' : '#FF9900';
            ctx.fill();
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((startAngle + endAngle) / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#000';
            ctx.font = '20px Arial';
            ctx.fillText(`$${nodeValue}`, radius - 10, 10);
            ctx.restore();

            currentAngle += angleStep;
        });
    }
}