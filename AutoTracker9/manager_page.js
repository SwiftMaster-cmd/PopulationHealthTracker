import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, onValue, get, set } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { drawWheel, spinWheel } from './wheel.js';

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
    const presetsPerPage = 5;
    let currentPage = 0;
    let shuffledNodes = [];
    let currentAngle = 0;
    let isSpinning = false;

    function loadPresets() {
        const presetsRef = ref(database, 'spinTheWheelPresets');
        onValue(presetsRef, (snapshot) => {
            const data = snapshot.val();
            presets = data ? Object.entries(data).map(([key, value]) => ({ name: key, nodes: value.nodes })) : [];
            displayPresets();
        });
    }

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

    function displayPresets() {
        const presetsContainer = document.getElementById('presets-container');
        presetsContainer.innerHTML = '';

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

        const nodes = Object.entries(preset.nodes).map(([_, node]) => ({
            value: node.value,
            count: node.count
        }));
        shuffledNodes = flattenNodes(nodes); 
        drawWheel(shuffledNodes, currentAngle);
    }

    function flattenNodes(nodes) {
        let flatNodes = [];
        nodes.forEach(node => {
            for (let i = 0; i < node.count; i++) {
                flatNodes.push(node);
            }
        });
        return flatNodes;
    }

    function shuffleNodes(nodes) {
        for (let i = nodes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
        }
        return nodes;
    }

    document.getElementById('shuffle-button').addEventListener('click', () => {
        if (isSpinning) return;
        shuffledNodes = shuffleNodes(flattenNodes(shuffledNodes));
        saveShuffleOrientation();
        drawWheel(shuffledNodes, currentAngle);
    });

    document.getElementById('spin-button').addEventListener('click', () => {
        if (isSpinning) return;
        isSpinning = true;
        saveSpinState();
        spinWheel(shuffledNodes);
    });

    function fetchAndDrawWheel() {
        const nodesRef = ref(database, 'shuffledGameConfiguration/nodes');
        onValue(nodesRef, (snapshot) => {
            const nodes = snapshot.val();
            if (nodes) {
                shuffledNodes = nodes;
                drawWheel(shuffledNodes, currentAngle);
            }
        });
    }

    function saveShuffleOrientation() {
        set(ref(database, 'shuffledGameConfiguration'), {
            nodes: shuffledNodes,
            angle: currentAngle
        });
    }

    function saveSpinState() {
        set(ref(database, 'spinState'), {
            angle: currentAngle
        });
    }

    function loadShuffleOrientation() {
        get(ref(database, 'shuffledGameConfiguration')).then(snapshot => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                shuffledNodes = data.nodes;
                currentAngle = data.angle;
                drawWheel(shuffledNodes, currentAngle);
            }
        }).catch(error => {
            console.error(error);
        });
    }

    function loadSpinState() {
        get(ref(database, 'spinState')).then(snapshot => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                currentAngle = data.angle;
                drawWheel(shuffledNodes, currentAngle);
            }
        }).catch(error => {
            console.error(error);
        });
    }

    loadShuffleOrientation();
    loadSpinState();
    fetchAndDrawWheel();
});
