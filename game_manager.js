import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, update, get, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
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

document.getElementById('save-configuration').addEventListener('click', saveConfiguration);
document.getElementById('add-rule-field').addEventListener('click', addRuleField);
document.getElementById('save-rules').addEventListener('click', saveRules);
document.getElementById('save-all').addEventListener('click', saveAllSettings);

onAuthStateChanged(auth, (user) => {
    if (user) {
        const userAuthorityRef = ref(database, 'users/' + user.uid + '/authority');
        get(userAuthorityRef).then((snapshot) => {
            const authorityLevel = snapshot.val();
            if (authorityLevel !== 3) {
                alert("You do not have permission to view this page.");
                window.location.href = 'index.html';
            }
        });
    } else {
        window.location.href = 'index.html';
    }
});

function saveConfiguration() {
    const node1 = document.getElementById('node1').value;
    const node2 = document.getElementById('node2').value;
    const node3 = document.getElementById('node3').value;
    const totalSpins = document.getElementById('total-spins').value;

    const configuration = {
        node1,
        node2,
        node3,
        totalSpins
    };

    update(ref(database, 'gameConfiguration'), configuration).then(() => {
        console.log('Configuration saved successfully.');
    }).catch((error) => {
        console.error('Error saving configuration:', error);
    });
}

function addRuleField() {
    const ruleContainer = document.createElement('div');
    ruleContainer.className = 'rule-field';

    const salesTypeSelect = document.createElement('select');
    salesTypeSelect.innerHTML = `
        <option value="billableHRA">Billable HRA</option>
        <option value="selectPatientManagement">Select Patient Management</option>
        <option value="selectRX">Select RX</option>
        <option value="transfer">Transfer</option>
    `;

    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.value = 0;

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

function saveRules() {
    const rulesContainer = document.getElementById('rules-container');
    const ruleFields = rulesContainer.getElementsByClassName('rule-field');
    const rules = [];

    for (let i = 0; i < ruleFields.length; i++) {
        const salesType = ruleFields[i].querySelector('select').value;
        const quantity = ruleFields[i].querySelector('input').value;
        rules.push({ salesType, quantity });
    }

    const newRuleKey = ref(database, 'gameRules').push().key;
    const updates = {};
    updates[`/gameRules/${newRuleKey}`] = rules;
    update(ref(database), updates).then(() => {
        console.log('Rules saved successfully.');

        const ruleList = document.getElementById('rules-list');
        const listItem = document.createElement('li');
        listItem.textContent = JSON.stringify(rules);
        ruleList.appendChild(listItem);

        rulesContainer.innerHTML = ''; // Clear the rules container after saving
    }).catch((error) => {
        console.error('Error saving rules:', error);
    });
}

function saveAllSettings() {
    saveConfiguration();
    saveRules();
    console.log('All settings saved.');
}