import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, update, get, push, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
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
            if (authorityLevel !== 3) {
                alert("You do not have permission to view this page.");
                window.location.href = 'index.html';
            } else {
                loadCurrentConfiguration();
                loadCurrentRules();
                listenForChanges();
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
    nodeValueInput.placeholder = 'Node Value';
    nodeValueInput.value = value;
    nodeValueInput.addEventListener('input', updateConfiguration);

    const nodeCountInput = document.createElement('input');
    nodeCountInput.type = 'number';
    nodeCountInput.placeholder = 'Count';
    nodeCountInput.value = count;
    nodeCountInput.addEventListener('input', updateConfiguration);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
        nodeContainer.remove();
        updateConfiguration();
    });

    nodeContainer.appendChild(nodeValueInput);
    nodeContainer.appendChild(nodeCountInput);
    nodeContainer.appendChild(removeButton);

    document.getElementById('nodes-container').appendChild(nodeContainer);
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
    const nodes = [];

    for (let i = 0; i < nodeFields.length; i++) {
        const nodeValue = nodeFields[i].querySelector('input[type="number"]').value;
        const nodeCount = nodeFields[i].querySelector('input[type="number"]:nth-child(2)').value;
        nodes.push({ value: nodeValue, count: nodeCount });
    }

    set(ref(database, 'gameConfiguration'), { nodes }).then(() => {
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

    const configRef = ref(database, 'gameConfiguration/nodes');
    const rulesRef = ref(database, 'gameRules');

    Promise.all([get(configRef), get(rulesRef)]).then((snapshots) => {
        const nodes = snapshots[0].val();
        const rules = snapshots[1].val();
        const preset = { nodes, rules };

        set(ref(database, `spinTheWheelPresets/${presetName}`), preset).then(() => {
            alert('Preset saved successfully.');
        }).catch((error) => {
            console.error('Error saving preset:', error);
        });
    }).catch((error) => {
        console.error('Error retrieving configuration or rules:', error);
    });
}

function loadCurrentConfiguration() {
    const configRef = ref(database, 'gameConfiguration/nodes');
    onValue(configRef, (snapshot) => {
        const nodes = snapshot.val();
        document.getElementById('nodes-container').innerHTML = ''; // Clear existing nodes
        if (nodes) {
            nodes.forEach(node => addNodeField(node.value, node.count));
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



   
function spinWheel(nodes) {
    if (isSpinning) return;
    isSpinning = true;

    const totalNodes = nodes.reduce((acc, node) => acc + parseInt(node.count), 0);
    const angleStep = (2 * Math.PI) / totalNodes;

    // Generate a random spin duration and speed
    let spinDuration = 5000 + Math.random() * 2000; // Spin duration between 5000ms to 7000ms
    let maxSpinSpeed = 5 + Math.random() * 5; // Spin speed between 5 and 10
    let accelerationDuration = spinDuration * 0.4; // 40% of the duration for acceleration
    let decelerationDuration = spinDuration * 0.6; // 60% of the duration for deceleration
    let peakTime = accelerationDuration;
    let start = null;

    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;

        // Acceleration phase
        if (progress <= accelerationDuration) {
            const easedProgress = easeInOutCubic(progress / accelerationDuration);
            currentAngle += (maxSpinSpeed * easedProgress) % (2 * Math.PI);
        }
        // Deceleration phase
        else if (progress <= spinDuration) {
            const decelerationProgress = (progress - peakTime) / decelerationDuration;
            const easedProgress = easeInOutCubic(1 - decelerationProgress);
            currentAngle += (maxSpinSpeed * easedProgress) % (2 * Math.PI);
        }

        drawWheel(nodes, currentAngle);

        if (progress < spinDuration) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            displayResult(nodes, currentAngle, angleStep);
        }
    }

    animationFrameId = requestAnimationFrame(animate);
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function drawWheel(nodes, rotation) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const totalNodes = nodes.reduce((acc, node) => acc + parseInt(node.count), 0);
    const angleStep = (2 * Math.PI) / totalNodes;
    const radius = canvas.width / 2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let currentAngle = rotation;

    nodes.forEach((node) => {
        for (let i = 0; i < node.count; i++) {
            const startAngle = currentAngle;
            const endAngle = startAngle + angleStep;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            // Alternate colors for each segment
            ctx.fillStyle = (i % 2 === 0) ? '#FFCC00' : '#FF9900';
            ctx.fill();
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((startAngle + endAngle) / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#000';
            ctx.font = '20px Arial';
            ctx.fillText(node.value, radius - 10, 10);
            ctx.restore();

            currentAngle += angleStep;
        }
    });

    drawNeedle();
}

function drawNeedle() {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const needleLength = centerY * 0.8;

    ctx.clearRect(centerX - 10, 0, 20, centerY); // Clear any previous needle

    ctx.beginPath();
    ctx.moveTo(centerX, centerY - needleLength);
    ctx.lineTo(centerX - 10, centerY);
    ctx.lineTo(centerX + 10, centerY);
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();
}

function displayResult(nodes, rotation, angleStep) {
    const totalNodes = nodes.reduce((acc, node) => acc + parseInt(node.count), 0);
    const winningIndex = Math.floor((2 * Math.PI - rotation) / angleStep) % totalNodes;
    let currentNodeIndex = 0;
    let result;

    nodes.forEach((node) => {
        for (let i = 0; i < node.count; i++) {
            if (currentNodeIndex === winningIndex) {
                result = node.value;
            }
            currentNodeIndex++;
        }
    });

    const resultElement = document.getElementById('result');
    resultElement.textContent = `Result: ${result}`;
}
});