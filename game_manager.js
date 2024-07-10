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
document.getElementById('save-all').addEventListener('click', saveAllSettings);

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

    const nodeCountInput = document.createElement('input');
    nodeCountInput.type = 'number';
    nodeCountInput.placeholder = 'Count';
    nodeCountInput.value = count;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
        nodeContainer.remove();
        updateSummary();
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

    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.placeholder = 'Quantity';
    quantityInput.value = quantity;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
        ruleContainer.remove();
        updateSummary();
    });

    ruleContainer.appendChild(salesTypeSelect);
    ruleContainer.appendChild(quantityInput);
    ruleContainer.appendChild(removeButton);

    document.getElementById('rules-container').appendChild(ruleContainer);
}

function saveAllSettings() {
    saveConfiguration().then(() => {
        return saveRules();
    }).then(() => {
        console.log('All settings saved.');
    }).catch((error) => {
        console.error('Error saving settings:', error);
    });
}

function saveConfiguration() {
    return new Promise((resolve, reject) => {
        const nodesContainer = document.getElementById('nodes-container');
        const nodeFields = nodesContainer.getElementsByClassName('node-field');
        const nodes = [];

        for (let i = 0; i < nodeFields.length; i++) {
            const nodeValue = nodeFields[i].querySelector('input[type="number"]').value;
            const nodeCount = nodeFields[i].querySelector('input[type="number"]:nth-child(2)').value;
            nodes.push({ value: nodeValue, count: nodeCount });
        }

        update(ref(database, 'gameConfiguration'), { nodes }).then(() => {
            console.log('Configuration saved successfully.');
            resolve();
        }).catch((error) => {
            reject(error);
        });
    });
}

function saveRules() {
    return new Promise((resolve, reject) => {
        const rulesContainer = document.getElementById('rules-container');
        const ruleFields = rulesContainer.getElementsByClassName('rule-field');
        const rules = [];

        for (let i = 0; i < ruleFields.length; i++) {
            const salesType = ruleFields[i].querySelector('select').value;
            const quantity = ruleFields[i].querySelector('input').value;
            rules.push({ salesType, quantity });
        }

        set(ref(database, 'gameRules'), rules).then(() => {
            console.log('Rules saved successfully.');
            resolve();
        }).catch((error) => {
            reject(error);
        });
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




function generateWheel(nodes) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');

    if (nodes) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const totalNodes = nodes.reduce((acc, node) => acc + parseInt(node.count), 0);
        const angleStep = (2 * Math.PI) / totalNodes;
        const radius = canvas.width / 2;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        let currentAngle = 0;

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
    }
}