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
document.getElementById('add-rule').addEventListener('click', addRule);
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

function addRule() {
    const billableHRA = document.getElementById('billableHRA').value;
    const selectPatientManagement = document.getElementById('selectPatientManagement').value;
    const selectRX = document.getElementById('selectRX').value;
    const transfer = document.getElementById('transfer').value;

    const ruleDescription = `Billable HRA: ${billableHRA}, Select Patient Management: ${selectPatientManagement}, Select RX: ${selectRX}, Transfer: ${transfer}`;
    if (ruleDescription) {
        const ruleList = document.getElementById('rules-list');
        const listItem = document.createElement('li');
        listItem.textContent = ruleDescription;
        ruleList.appendChild(listItem);

        // Clear the input fields
        document.getElementById('billableHRA').value = 0;
        document.getElementById('selectPatientManagement').value = 0;
        document.getElementById('selectRX').value = 0;
        document.getElementById('transfer').value = 0;

        // Save the rule to the database
        const newRuleKey = ref(database, 'gameRules').push().key;
        const ruleData = {
            billableHRA,
            selectPatientManagement,
            selectRX,
            transfer
        };
        const updates = {};
        updates[`/gameRules/${newRuleKey}`] = ruleData;
        update(ref(database), updates).then(() => {
            console.log('Rule added successfully.');
        }).catch((error) => {
            console.error('Error adding rule:', error);
        });
    }
}

function saveAllSettings() {
    saveConfiguration();
    console.log('All settings saved.');
}