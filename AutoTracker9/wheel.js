import { colorPalette } from './color-palette.js';
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

let currentAngle = 0;
let isSpinning = false;
let animationFrameId;
let currentWheelConfig = [];

// Initialize Firebase (assuming firebase-init.js initializes Firebase app)
import firebaseConfig from './firebase-init';

// Initialize Firebase app and get a database instance
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Reference to the wheel configuration in the database
const wheelConfigRef = ref(database, 'wheelConfiguration');

// Function to set the wheel configuration
export function setWheelConfiguration(config) {
    currentWheelConfig = config;
    // Update the wheel viewer here if needed
}

// Function to load and display the current wheel configuration
function loadWheelConfiguration() {
    onValue(wheelConfigRef, (snapshot) => {
        const config = snapshot.val();
        if (config) {
            currentWheelConfig = config;
            displayWheelConfiguration(config);
        }
    });
}

// Function to display the wheel configuration
function displayWheelConfiguration(config) {
    const nodesContainer = document.getElementById('nodes-container');
    nodesContainer.innerHTML = ''; // Clear existing nodes

    config.forEach((node, index) => {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'node';
        nodeElement.innerText = `$${node}`;
        nodesContainer.appendChild(nodeElement);
    });
}

// Function to save the current configuration
function saveConfiguration() {
    set(wheelConfigRef, currentWheelConfig);
}

// Function to handle adding a new node to the configuration
function addNodeToConfiguration(amount) {
    currentWheelConfig.push(amount);
    saveConfiguration();
    displayWheelConfiguration(currentWheelConfig);
}

// Event listeners for buttons
const addNodeButton = document.getElementById('add-node-field');
const saveConfigButton = document.getElementById('save-configuration');

addNodeButton.addEventListener('click', () => {
    const nodeAmount = prompt('Enter dollar amount:');
    if (nodeAmount) {
        addNodeToConfiguration(parseInt(nodeAmount, 10));
    }
});

saveConfigButton.addEventListener('click', saveConfiguration);

// Function to load and display the wheel configuration on page load
document.addEventListener('DOMContentLoaded', loadWheelConfiguration);

export function spinWheel(nodes) {
    if (isSpinning) return;
    isSpinning = true;
    // Hide the shuffle button
    const shuffleButton = document.getElementById('shuffle-button');
    if (shuffleButton) {
        shuffleButton.style.display = 'none';
    }
    const totalNodes = nodes.length;
    const angleStep = (2 * Math.PI) / totalNodes;
    const spinDuration = 9000;
    const accelerationDuration = 2000;
    const maxSpinSpeed = (218 / 60) * 2 * Math.PI;
    const speedAt4Seconds = (96 / 60) * 2 * Math.PI;
    const speedAt6Seconds = (3 / 60) * 2 * Math.PI;

    let start = null;
    let previousTimestamp = null;
    let initialAngle = currentAngle;
    let totalRotation = 0;

    function animate(timestamp) {
        if (!start) {
            start = timestamp;
            previousTimestamp = timestamp;
        }

        const progress = timestamp - start;
        const deltaTime = timestamp - previousTimestamp;
        previousTimestamp = timestamp;

        let currentSpeed = 0;

        if (progress <= accelerationDuration) {
            const easedProgress = easeInQuad(progress / accelerationDuration);
            currentSpeed = maxSpinSpeed * easedProgress;
        } else if (progress <= 4000) {
            const easedProgress = easeOutQuad((progress - accelerationDuration) / (4000 - accelerationDuration));
            currentSpeed = maxSpinSpeed - ((maxSpinSpeed - speedAt4Seconds) * easedProgress);
        } else if (progress <= 6000) {
            const easedProgress = easeOutQuad((progress - 4000) / (6000 - 4000));
            currentSpeed = speedAt4Seconds - ((speedAt4Seconds - speedAt6Seconds) * easedProgress);
        } else if (progress <= spinDuration) {
            const easedProgress = easeOutQuad((progress - 6000) / (spinDuration - 6000));
            currentSpeed = speedAt6Seconds - (speedAt6Seconds * easedProgress);
        }

        totalRotation += (currentSpeed * deltaTime / 1000);
        let newAngle = (initialAngle + totalRotation) % (2 * Math.PI);

        drawWheel(nodes, newAngle);

        if (progress < spinDuration) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            currentAngle = newAngle;
            saveCurrentRotation(currentAngle);
            logWinningNode(nodes, currentAngle, angleStep);
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

function logWinningNode(nodes, currentAngle, angleStep) {
    const winningAngle = (currentAngle + Math.PI / 2) % (2 * Math.PI);
    const winningNodeIndex = Math.floor(winningAngle / angleStep);
    const winningNode = nodes[winningNodeIndex];
    console.log("Current Angle (radians):", currentAngle);
    console.log("Winning Angle (radians):", winningAngle);
    console.log("Winning Node Index:", winningNodeIndex);
    console.log("Winning Node:", winningNode);
}

export function drawWheel(nodes, rotation) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const totalNodes = nodes.length;
    const angleStep = (2 * Math.PI) / totalNodes;
    const radius = Math.min(canvas.width, canvas.height) / 2;
    const centerX = radius;
    const centerY = canvas.height / 2;
    let currentAngle = rotation;

    const colors = [
        colorPalette.primary,
        colorPalette.secondary,
        colorPalette.tertiary,
        colorPalette.quaternary,
        colorPalette.quinary,
    ];

    nodes.forEach((value, index) => {
        const startAngle = currentAngle;
        const endAngle = startAngle + angleStep;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        ctx.strokeStyle = colorPalette.textWhite;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((startAngle + endAngle) / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorPalette.textWhite;
        ctx.font = '20px Arial';
        ctx.fillText(value, radius * 0.8, 0);
        ctx.restore();

        currentAngle += angleStep;
    });

    drawNeedle(centerX, centerY, radius);
}

function drawNeedle(centerX, centerY, radius) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const needleImg = new Image();
    needleImg.src = './nav.png';
    needleImg.onload = () => {
        const needleWidth = needleImg.width * 0.735;
        const needleHeight = needleImg.height * 0.735;
        const needleXPosition = centerX + radius - needleWidth / 2 + 160;
        const needleYPosition = centerY - needleHeight / 2;

        ctx.save();
        ctx.translate(needleXPosition, needleYPosition);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(needleImg, 0, 0, needleWidth, needleHeight);
        ctx.restore();
    };

    if (needleImg.complete) {
        needleImg.onload();
    }
}

function saveCurrentRotation(rotation) {
    const rotationRef = ref(database, 'wheel/rotation');
    set(rotationRef, rotation);
}

export function saveNodesConfiguration(nodes) {
    const nodesRef = ref(database, 'wheel/nodes');
    set(nodesRef, nodes);
}

export function loadNodesConfiguration(callback) {
    const nodesRef = ref(database, 'wheel/nodes');
    const rotationRef = ref(database, 'wheel/rotation');
    get(nodesRef).then((snapshot) => {
        const nodes = snapshot.val();
        get(rotationRef).then((rotationSnapshot) => {
            const rotation = rotationSnapshot.val();
            currentAngle = rotation || 0;
            callback(nodes, currentAngle);
        });
    });
}

export async function shuffleNodes(nodes) {
    let shuffledNodes = shuffleArray(nodes); // Assuming shuffleArray is an imported utility function
    await saveNodesConfiguration(shuffledNodes);
    document.getElementById('shuffle-button').disabled = false; // Re-enable shuffle post-operation or spin
    return shuffledNodes;
}

export function shuffleAndUpdateWheel(nodes) {
    shuffleNodes(nodes).then(shuffledNodes => {
        drawWheel(shuffledNodes, currentAngle);
        // Optionally update other UI elements or Firebase nodes if needed
    });
}

// Initial loading of the configuration
loadWheelConfiguration();
