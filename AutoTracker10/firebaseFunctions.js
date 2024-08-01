import { ref, get, update } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { auth, database } from './firebaseConfig.js';

async function fetchUserProfiles() {
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);
    const usersData = usersSnapshot.val();

    const profiles = {};
    for (const uid in usersData) {
        profiles[uid] = {
            email: usersData[uid].email,
            name: usersData[uid].name || usersData[uid].email // Fallback to email if name is not available
        };
    }
    return profiles;
}

async function fetchAccountNumbersAndTimes(data) {
    const accountNumbers = {};
    const outcomeTimes = {};

    function extractData(obj, path) {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (obj[key].hasOwnProperty('accountNumber')) {
                    accountNumbers[`${path}/${key}`] = obj[key].accountNumber;
                }
                if (obj[key].hasOwnProperty('outcomeTime')) {
                    outcomeTimes[`${path}/${key}`] = obj[key].outcomeTime;
                }
                extractData(obj[key], `${path}/${key}`);
            }
        }
    }

    extractData(data, '');
    return { accountNumbers, outcomeTimes };
}

function formatTimeFrame(timestamp) {
    const date = new Date(timestamp);
    const options = { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
    return date.toLocaleString('en-US', options);
}

function createNodeElement(key, value, profiles, accountNumbers, outcomeTimes, path) {
    const nodeContainer = document.createElement('div');
    nodeContainer.className = 'node-container';

    let displayKey = profiles[key]?.name || profiles[key]?.email || accountNumbers[`${path}/${key}`] || key;
    if (displayKey === key && key.startsWith('-')) {
        displayKey = accountNumbers[`${path}/${key}`] || key;
    }

    if (outcomeTimes[`${path}/${key}`]) {
        displayKey += ` (${formatTimeFrame(outcomeTimes[`${path}/${key}`])})`;
    }

    const keyElement = document.createElement('h3');
    keyElement.textContent = displayKey;
    keyElement.style.cursor = 'pointer';
    keyElement.addEventListener('click', () => {
        const isHidden = subContainer.style.display === 'none';
        subContainer.style.display = isHidden ? 'block' : 'none';
        keyElement.style.color = isHidden ? '#0056b3' : '#007bff';
    });

    const subContainer = document.createElement('div');
    subContainer.className = 'sub-container';

    if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([subKey, subValue]) => {
            const subNodeElement = createNodeElement(subKey, subValue, profiles, accountNumbers, outcomeTimes, `${path}/${key}`);
            subContainer.appendChild(subNodeElement);
        });
    } else {
        const valueElement = document.createElement('p');
        valueElement.textContent = value;

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            subContainer.replaceChild(input, valueElement);
            editButton.style.display = 'none';
            saveButton.style.display = 'inline';
        });

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.style.display = 'none';
        saveButton.addEventListener('click', async () => {
            const newValue = subContainer.querySelector('input').value;
            valueElement.textContent = newValue;
            subContainer.replaceChild(valueElement, subContainer.querySelector('input'));
            editButton.style.display = 'inline';
            saveButton.style.display = 'none';

            // Update the value in the database
            const updates = {};
            updates[`${path}/${key}`] = newValue;
            await update(ref(database), updates);
        });

        subContainer.appendChild(valueElement);
        subContainer.appendChild(editButton);
        subContainer.appendChild(saveButton);
    }

    subContainer.style.display = 'none'; // Start hidden
    nodeContainer.appendChild(keyElement);
    nodeContainer.appendChild(subContainer);

    return nodeContainer;
}

function displayData(data, profiles, accountNumbers, outcomeTimes) {
    const container = document.getElementById('dataContainer');
    container.innerHTML = ''; // Clear previous content

    Object.entries(data).forEach(([key, value]) => {
        const nodeElement = createNodeElement(key, value, profiles, accountNumbers, outcomeTimes, '');
        container.appendChild(nodeElement);
    });
}

export { fetchUserProfiles, fetchAccountNumbersAndTimes, formatTimeFrame, createNodeElement, displayData };