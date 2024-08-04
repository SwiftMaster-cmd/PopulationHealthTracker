
import { colorPalette } from './color-palette.js';
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

let currentAngle = 0;
let currentNodes = [];
let isSpinning = false;
let animationFrameId;

document.addEventListener('DOMContentLoaded', () => {
    loadConfiguration();
});

export function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;

    const totalNodes = currentNodes.length;
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

        drawWheel(currentNodes, newAngle);

        if (progress < spinDuration) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            currentAngle = newAngle;
            saveConfiguration();
            logWinningNode(currentNodes, currentAngle, angleStep);
        }
    }

    animationFrameId = requestAnimationFrame(animate);
}

function easeInQuad(t) { return t * t; }
function easeOutQuad(t) { return t * (2 - t); }

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
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Canvas context not found');
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const totalNodes = nodes.length;
    const angleStep = (2 * Math.PI) / totalNodes;
    const radius = Math.min(canvas.width, canvas.height) / 2;
    const centerX = radius;
    const centerY = canvas.height / 2;
    let drawAngle = rotation;

    const colors = [
        colorPalette.primary,
        colorPalette.secondary,
        colorPalette.tertiary,
        colorPalette.quaternary,
        colorPalette.quinary,
    ];

    nodes.forEach((value, index) => {
        const startAngle = drawAngle;
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

        drawAngle += angleStep;
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

function saveConfiguration() {
    const db = getDatabase();
    const configRef = ref(db, 'wheel');
    set(configRef, { nodes: currentNodes, rotation: currentAngle })
        .then(() => console.log('Configuration saved'))
        .catch((error) => console.error('Error saving configuration:', error));
}

function loadConfiguration() {
    const db = getDatabase();
    const configRef = ref(db, 'wheel');
    get(configRef)
        .then((snapshot) => {
            const config = snapshot.val();
            if (config) {
                currentNodes = config.nodes || [];
                currentAngle = config.rotation || 0;
                drawWheel(currentNodes, currentAngle);
            }
        })
        .catch((error) => console.error('Error loading configuration:', error));
}

export function shuffleNodes(nodes) {
    const values = nodes.flatMap(node => Array(node.count).fill(node.value));
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
}

export function shuffleAndUpdateWheel() {
    currentNodes = shuffleNodes(currentNodes);
    drawWheel(currentNodes, currentAngle);
    saveConfiguration();
}

export function updateNodes(newNodes) {
    currentNodes = newNodes;
    drawWheel(currentNodes, currentAngle);
    saveConfiguration();
}

