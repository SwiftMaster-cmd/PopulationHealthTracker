import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { spinWheel, drawWheel } from './wheel.js'; // Ensure this import path is correct

document.addEventListener('DOMContentLoaded', () => {
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

    let presets = [];
    let currentPage = 0;
    const presetsPerPage = 5;
    let shuffledNodes = []; // Define shuffledNodes here

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userAuthorityRef = ref(database, 'users/' + user.uid + '/authority');
            get(userAuthorityRef).then((snapshot) => {
                const authorityLevel = snapshot.val();
                if (authorityLevel >= 9) {
                    loadPresets();
                } else {
                    alert("You do not have permission to view this page.");
                    window.location.href = 'index.html';
                }
            });
        } else {
            window.location.href = 'index.html';
        }
    });

    function loadPresets() {
        const presetsRef = ref(database, 'spinTheWheelPresets');
        onValue(presetsRef, (snapshot) => {
            const data = snapshot.val();
            presets = data ? Object.entries(data).reverse() : [];
            displayPresets();
        });
    }

    function displayPresets() {
        const presetsContainer = document.getElementById('presets-container');
        presetsContainer.innerHTML = '';

        const start = currentPage * presetsPerPage;
        const end = Math.min(start + presetsPerPage, presets.length);

        for (let i = start; i < end; i++) {
            const [presetName, presetData] = presets[i];
            const presetButton = document.createElement('button');
            presetButton.textContent = presetName;
            presetButton.addEventListener('click', () => displayPresetSummary(presetData));
            presetsContainer.appendChild(presetButton);
        }

        document.getElementById('prev-button').disabled = currentPage === 0;
        document.getElementById('next-button').disabled = end >= presets.length;
    }

    document.getElementById('prev-button').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            displayPresets();
        }
    });

    document.getElementById('next-button').addEventListener('click', () => {
        if ((currentPage + 1) * presetsPerPage < presets.length) {
            currentPage++;
            displayPresets();
        }
    });

    function displayPresetSummary(preset) {
        const summaryText = document.getElementById('summary-text');
        summaryText.textContent = `Preset: ${preset.name}`;

        const nodes = preset.nodes;
        console.log('Preset nodes:', nodes); // Debugging
        shuffledNodes = shuffleNodes(nodes); // Define shuffledNodes here
        drawWheel(shuffledNodes); // Use drawWheel from wheel.js
    }

    function shuffleNodes(nodes) {
        let flatNodes = [];
        nodes.forEach(node => {
            for (let i = 0; i < node.count; i++) {
                flatNodes.push(node.value);
            }
        });

        for (let i = flatNodes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [flatNodes[i], flatNodes[j]] = [flatNodes[j], flatNodes[i]];
        }

        let shuffledNodes = [];
        flatNodes.forEach(value => {
            let node = shuffledNodes.find(node => node.value === value);
            if (node) {
                node.count++;
            } else {
                shuffledNodes.push({ value, count: 1 });
            }
        });

        return shuffledNodes;
    }

    // Event listener for spin button
    document.getElementById('spin-button').addEventListener('click', () => {
        if (shuffledNodes.length > 0) {
            spinWheel(shuffledNodes); // Use spinWheel from wheel.js
        } else {
            alert('Please select a preset first.');
        }
    });
});