import { colorPalette } from './color-palette.js';
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

let currentAngle = 0;
let isSpinning = false;
let animationFrameId;

document.addEventListener('DOMContentLoaded', () => {
    loadNodesConfiguration((nodes, rotation) => {
        drawWheel(nodes, rotation);
    });
});

export function spinWheel(nodes) {
    if (isSpinning) return;
    isSpinning = true;

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
    // Calculate the angle for the right side of the wheel (90 degrees from the top)
    const rightSideAngle = (currentAngle + Math.PI / 2) % (2 * Math.PI);
    const winningNodeIndex = Math.floor(rightSideAngle / angleStep);
    const winningNode = nodes[winningNodeIndex];
    console.log("Current Angle (radians):", currentAngle);
    console.log("Right Side Angle (radians):", rightSideAngle);
    console.log("Winning Node Index:", winningNodeIndex);
    console.log("Winning Node:", winningNode);
}


export function drawWheel(nodes, rotation = 0) {
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
    const db = getDatabase();
    const rotationRef = ref(db, 'wheel/rotation');
    set(rotationRef, rotation)
        .then(() => console.log('Rotation saved'))
        .catch((error) => console.error('Error saving rotation:', error));
}

export function saveNodesConfiguration(nodes) {
    const db = getDatabase();
    const nodesRef = ref(db, 'wheel/nodes');
    set(nodesRef, nodes)
        .then(() => console.log('Nodes configuration saved'))
        .catch((error) => console.error('Error saving nodes configuration:', error));
}

export function loadNodesConfiguration(callback) {
    const db = getDatabase();
    const nodesRef = ref(db, 'wheel/nodes');
    const rotationRef = ref(db, 'wheel/rotation');
    get(nodesRef).then((snapshot) => {
        const nodes = snapshot.val();
        get(rotationRef).then((rotationSnapshot) => {
            const rotation = rotationSnapshot.val();
            currentAngle = rotation || 0;
            callback(nodes, currentAngle);
        });
    }).catch((error) => console.error('Error loading configuration:', error));
}
export function shuffleNodes(nodes) {
    const values = nodes.flatMap(node => Array(node.count).fill(node.value));
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
}

export function shuffleAndUpdateWheel(nodes) {
    const savedAngle = currentAngle; // Save the current angle
    const shuffledNodes = shuffleNodes(nodes); // Shuffle the nodes
    drawWheel(shuffledNodes, savedAngle); // Draw the wheel with the saved angle
    saveNodesConfiguration(shuffledNodes); // Save the new node configuration
    saveCurrentRotation(savedAngle); // Save the current rotation angle
    return shuffledNodes;
}