import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, update, get, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
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

function addNodeField(value = 0) {
    const nodeContainer = document.createElement('div');
    nodeContainer.className = 'node-field';

    const nodeValueInput = document.createElement('input');
    nodeValueInput.type = 'number';
    nodeValueInput.placeholder = 'Node Value';
    nodeValueInput.value = value;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
        nodeContainer.remove();
    });

    nodeContainer.appendChild(nodeValueInput);
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
            const nodeValue = nodeFields[i].querySelector('input').value;
            nodes.push({ value: nodeValue });
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

        const newRuleKey = push(ref(database, 'gameRules')).key;
        const updates = {};
        updates[`/gameRules/${newRuleKey}`] = rules;
        update(ref(database), updates).then(() => {
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
            nodes.forEach(node => addNodeField(node.value));
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
            Object.values(rules).forEach(ruleSet => {
                ruleSet.forEach(rule => addRuleField(rule.salesType, rule.quantity));
            });
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
        let summaryText = 'Wheel Configuration:\n';
        if (nodes) {
            nodes.forEach(node => {
                summaryText += `Node Value: ${node.value}\n`;
            });
        }

        get(rulesRef).then((snapshot) => {
            const rules = snapshot.val();
            summaryText += '\nSpin Rules:\n';
            if (rules) {
                Object.values(rules).forEach(ruleSet => {
                    ruleSet.forEach(rule => {
                        summaryText += `Sales Type: ${rule.salesType}, Quantity: ${rule.quantity}\n`;
                    });
                });
            }

            document.getElementById('summary-text').textContent = summaryText;
        });
    });
}