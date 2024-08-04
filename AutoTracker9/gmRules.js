import { database, auth } from './firebase-init.js';
import { ref, get, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('add-rule-field').addEventListener('click', () => addRuleField());

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userAuthorityRef = ref(database, 'users/' + user.uid + '/authority');
            get(userAuthorityRef).then((snapshot) => {
                const authorityLevel = snapshot.val();
                if (authorityLevel >= 9) {
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
    const rulesRef = ref(database, 'gameRules');
    onValue(rulesRef, () => {
        loadCurrentRules();
    });
}
