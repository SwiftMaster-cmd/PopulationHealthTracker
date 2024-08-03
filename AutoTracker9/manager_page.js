import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// Initialize Firebase
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
let isSpinning = false;
let currentAngle = 0;
let animationFrameId;

document.addEventListener('DOMContentLoaded', () => {
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

    document.getElementById('shuffle-button').addEventListener('click', () => {
        shuffledNodes = flattenAndShuffleNodes(shuffledNodes);
        drawWheel(shuffledNodes); // Redraw the wheel with shuffled nodes
    });

    document.getElementById('spin-button').addEventListener('click', () => {
        spinWheel(shuffledNodes);
    });

    fetchAndDrawWheel();
});

function loadPresets() {
    const presetsRef = ref(database, 'spinTheWheelPresets');
    onValue(presetsRef, (snapshot) => {
        const data = snapshot.val();
        presets = data ? Object.entries(data).map(([key, value]) => ({ name: key, nodes: value.nodes })) : [];
        displayPresets();
    });
}

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

function displayPresetSummary(preset) {
    const summaryText = document.getElementById('summary-text');
    summaryText.textContent = `Preset: ${preset.name}`;

    const nodes = Object.entries(preset.nodes).map(([_, node]) => ({
        value: node.value,
        count: node.count
    }));
    console.log('Preset nodes:', nodes); // Debugging
    shuffledNodes = flattenAndShuffleNodes(nodes); // Define shuffledNodes here
    drawWheel(shuffledNodes); // Use drawWheel function
}

function flattenAndShuffleNodes(nodes) {
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

    return flatNodes.map(value => ({ value, count: 1 }));
}

function fetchAndDrawWheel() {
    const nodesRef = ref(database, 'shuffledGameConfiguration/nodes');
    onValue(nodesRef, (snapshot) => {
        const nodes = snapshot.val();
        if (nodes) {
            const formattedNodes = flattenAndShuffleNodes(Object.values(nodes).map(node => ({
                value: node.value,
                count: node.count
            })));
            shuffledNodes = formattedNodes;
            drawWheel(formattedNodes);
        }
    });
}

function drawWheel(nodes) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const totalNodes = nodes.reduce((acc, node) => acc + node.count, 0);
    const angleStep = (2 * Math.PI) / totalNodes;
    const radius = Math.min(canvas.width, canvas.height) / 2;
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

            ctx.fillStyle = (Math.random() > 0.5) ? '#FFCC00' : '#FF9900';
            ctx.fill();
            ctx.stroke();

            // Draw spike
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle);
            ctx.beginPath();
            ctx.moveTo(radius, 0);
            ctx.lineTo(radius + 10, -5);
            ctx.lineTo(radius + 10, 5);
            ctx.closePath();
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.restore();

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
    ctx.lineTo(centerX - 5, centerY - needleLength + 15);
    ctx.lineTo(centerX + 5, centerY - needleLength + 15);
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();
}

function spinWheel(nodes) {
    if (isSpinning) return;
    isSpinning = true;

    const totalNodes = nodes.reduce((acc, node) => acc + node.count, 0);
    const angleStep = (2 * Math.PI) / totalNodes;

    let spinDuration = 8000; // Total spin duration of 8 seconds
    let maxSpinSpeed = 2; // Reduced max spin speed
    let accelerationDuration = 1000; // 1 second to reach max speed
    let decelerationStart = 4000; // Start deceleration after 4 seconds
    let dramaticSlowdownStart = 5000; // Start dramatic slowdown after 5 seconds
    let dramaticSlowdownDuration = 3000; // Last 3 seconds for dramatic slowdown
    let start = null;

    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;

        if (progress <= accelerationDuration) {
            const easedProgress = easeInQuad(progress / accelerationDuration);
            currentAngle += (maxSpinSpeed * easedProgress) % (2 * Math.PI);
        } else if (progress <= decelerationStart) {
            const decelerationProgress = (progress - accelerationDuration) / (decelerationStart - accelerationDuration);
            const easedProgress = easeOutQuad(1 - decelerationProgress);
            currentAngle += (maxSpinSpeed * easedProgress * (1 - getNeedleEffect(currentAngle, nodes, angleStep))) % (2 * Math.PI);
        } else if (progress <= dramaticSlowdownStart) {
            const decelerationProgress = (progress - decelerationStart) / (dramaticSlowdownStart - decelerationStart);
            const easedProgress = easeOutQuad(1 - decelerationProgress);
            currentAngle += (maxSpinSpeed * easedProgress * (1 - getNeedleEffect(currentAngle, nodes, angleStep))) % (2 * Math.PI);
        } else if (progress <= spinDuration) {
            const dramaticSlowdownProgress = (progress - dramaticSlowdownStart) / dramaticSlowdownDuration;
            const easedProgress = easeOutQuint(1 - dramaticSlowdownProgress);
            currentAngle += (maxSpinSpeed * easedProgress * (1 - getNeedleEffect(currentAngle, nodes, angleStep))) % (2 * Math.PI);
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

function easeInQuad(t) {
    return t * t;
}

function easeOutQuad(t) {
    return t * (2 - t);
}

function easeOutQuint(t) {
    return 1 + (--t) * t * t * t * t;
}

function getNeedleEffect(angle, nodes, angleStep) {
    const totalNodes = nodes.reduce((acc, node) => acc + node.count, 0);
    const segment = Math.floor(angle / angleStep) % totalNodes;
    const spikeEffect = 0.05; // Slow down by 5% when passing a node
    return (segment < totalNodes) ? spikeEffect : 0;
}

function drawWheel(nodes, rotation = 0) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const totalNodes = nodes.reduce((acc, node) => acc + node.count, 0);
    const angleStep = (2 * Math.PI) / totalNodes;
    const radius = Math.min(canvas.width, canvas.height) / 2;
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

            ctx.fillStyle = (Math.random() > 0.5) ? '#FFCC00' : '#FF9900';
            ctx.fill();
            ctx.stroke();

            // Draw spike
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle);
            ctx.beginPath();
            ctx.moveTo(radius, 0);
            ctx.lineTo(radius + 10, -5);
            ctx.lineTo(radius + 10, 5);
            ctx.closePath();
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.restore();

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
    ctx.lineTo(centerX - 5, centerY - needleLength + 15);
    ctx.lineTo(centerX + 5, centerY - needleLength + 15);
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();
}

function displayResult(nodes, rotation, angleStep) {
    const totalNodes = nodes.reduce((acc, node) => acc + node.count, 0);
    const winningIndex = Math.floor((2 * Math.PI - rotation) / angleStep) % totalNodes;
    let currentNodeIndex = 0;
    let result;

    nodes.forEach((node) => {
        for (let i = 0; i < node.count; i++) {
            if (currentNodeIndex === winningIndex) {
                result = node.value;
                break;
            }
            currentNodeIndex++;
        }
    });

    const resultElement = document.getElementById('result');
    resultElement.textContent = `Result: ${result}`;
}
