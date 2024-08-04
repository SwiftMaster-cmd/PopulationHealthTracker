import { colorPalette } from './color-palette.js';
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

let isSpinning = false;
let animationFrameId;
let currentAngle = 0;

export function spinWheel(nodes) {
    if (isSpinning) return;
    isSpinning = true;

    const totalNodes = nodes.length;
    const angleStep = (2 * Math.PI) / totalNodes;

    const spinDuration = 9000; // Total spin duration of 9 seconds
    const accelerationDuration = 2000; // 2 seconds to reach max speed
    const maxSpinSpeed = (218 / 60) * 2 * Math.PI; // 7 RPM converted to radians per second
    const speedAt4Seconds = (96 / 60) * 2 * Math.PI; // 4 RPM converted to radians per second
    const speedAt6Seconds = (3 / 60) * 2 * Math.PI; // 2 RPM converted to radians per second

    let start = null;

    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        let currentSpeed = 0;

        if (progress <= accelerationDuration) {
            const easedProgress = easeInQuad(progress / accelerationDuration);
            currentSpeed = maxSpinSpeed * easedProgress;
            currentAngle += (currentSpeed / 60) % (2 * Math.PI);
        } else if (progress <= 4000) {
            const easedProgress = easeOutQuad((progress - accelerationDuration) / (4000 - accelerationDuration));
            currentSpeed = maxSpinSpeed - ((maxSpinSpeed - speedAt4Seconds) * easedProgress);
            currentAngle += (currentSpeed / 60) % (2 * Math.PI);
        } else if (progress <= 6000) {
            const easedProgress = easeOutQuad((progress - 4000) / (6000 - 4000));
            currentSpeed = speedAt4Seconds - ((speedAt4Seconds - speedAt6Seconds) * easedProgress);
            currentAngle += (currentSpeed / 60) % (2 * Math.PI);
        } else if (progress <= spinDuration) {
            const easedProgress = easeOutQuad((progress - 6000) / (spinDuration - 6000));
            currentSpeed = speedAt6Seconds - (speedAt6Seconds * easedProgress);
            currentAngle += (currentSpeed / 60) % (2 * Math.PI);
        }

        if (progress < spinDuration) {
            drawWheel(nodes, currentAngle);
            animationFrameId = requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            drawWheel(nodes, currentAngle);
            saveCurrentRotation(currentAngle); // Save current rotation

            const winningNode = calculateWinningNode(nodes, currentAngle);
            displayWinningNode(winningNode);
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

export function drawWheel(nodes, rotation = 0) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const totalNodes = nodes.length;
    const angleStep = (2 * Math.PI) / totalNodes;
    const radius = Math.min(canvas.height, canvas.height) / 2;
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
    needleImg.src = './nav.png'; // Replace with the path to the uploaded needle image

    needleImg.onload = () => {
        const needleWidth = needleImg.width * 0.735; // Adjust the size to 70% of the original
        const needleHeight = needleImg.height * 0.735; // Adjust the size to 70% of the original
        const needleXPosition = centerX + radius - needleWidth / 2 + 160; // Move needle 160px to the right
        const needleYPosition = centerY - needleHeight / 2; // Center the needle vertically

        ctx.save();
        ctx.translate(needleXPosition, needleYPosition);
        ctx.rotate(Math.PI / 2); // Rotate needle to 90 degrees
        ctx.drawImage(needleImg, 0, 0, needleWidth, needleHeight);
        ctx.restore();
    };

    // Draw the needle immediately if the image is already loaded
    if (needleImg.complete) {
        const needleWidth = needleImg.width * 0.735; // Adjust the size to 70% of the original
        const needleHeight = needleImg.height * 0.735; // Adjust the size to 70% of the original
        const needleXPosition = centerX + radius - needleWidth / 2 + 160; // Move needle 160px to the right
        const needleYPosition = centerY - needleHeight / 2; // Center the needle vertically

        ctx.save();
        ctx.translate(needleXPosition, needleYPosition);
        ctx.rotate(Math.PI / 2); // Rotate needle to 90 degrees
        ctx.drawImage(needleImg, 0, 0, needleWidth, needleHeight);
        ctx.restore();
    }
}

function saveCurrentRotation(rotation) {
    const db = getDatabase();
    const rotationRef = ref(db, 'wheel/rotation');
    set(rotationRef, rotation);
}

function calculateWinningNode(nodes, rotation) {
    const totalNodes = nodes.length;
    const angleStep = (2 * Math.PI) / totalNodes;
    const needleAngle = Math.PI / 2; // 90 degrees in radians

    // Calculate the angle of the winning node
    const winningAngle = (rotation + needleAngle) % (2 * Math.PI);
    const nodeIndex = Math.floor(winningAngle / angleStep);

    return nodes[nodeIndex];
}

function displayWinningNode(winningNode) {
    const resultElement = document.getElementById('result');
    resultElement.textContent = `Result: ${winningNode}`;
}

export function saveNodesConfiguration(nodes) {
    const db = getDatabase();
    const nodesRef = ref(db, 'wheel/nodes');
    set(nodesRef, nodes);
}

export function loadNodesConfiguration(callback) {
    const db = getDatabase();
    const nodesRef = ref(db, 'wheel/nodes');
    const rotationRef = ref(db, 'wheel/rotation');

    get(nodesRef).then((snapshot) => {
        const nodes = snapshot.val();
        get(rotationRef).then((rotationSnapshot) => {
            const rotation = rotationSnapshot.val();
            callback(nodes, rotation);
        });
    });
}

export function shuffleNodes(nodes) {
    const values = nodes.flatMap(node => Array(node.count).fill(node.value));
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
}
