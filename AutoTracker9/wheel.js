import { colorPalette } from './color-palette.js';
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

let isSpinning = false;
let animationFrameId;
let currentAngle = 0; // This will hold the current angle and be updated to the final angle after spinning

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
    let previousTimestamp = null;
    let initialAngle = currentAngle; // Use the current angle as the initial angle
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
        currentAngle = (initialAngle + totalRotation) % (2 * Math.PI);

        if (progress < spinDuration) {
            drawWheel(nodes, currentAngle);
            animationFrameId = requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            currentAngle = currentAngle % (2 * Math.PI); // Ensure current angle is within bounds
            drawWheel(nodes, currentAngle);
            saveCurrentRotation(currentAngle); // Save current rotation
            logWinningNode(nodes, currentAngle, angleStep); // Log the winning node
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

export function drawWheel(nodes, rotation = 0) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const totalNodes = nodes.length;
    const angleStep = (2 * Math.PI) / totalNodes;
    const radius = Math.min(canvas.width, canvas.height) / 2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let currentAngle = rotation;

    const colors = [
        colorPalette.primary,
        colorPalette.secondary,
        colorPalette.tertiary,
        colorPalette.quaternary,
        colorPalette.quinary,
    ];

    nodes.forEach((node, index) => {
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
        ctx.font = 'bold 20px Arial';
        
        // Adjust text position based on text length
        const textRadius = radius * (node.value.length > 10 ? 0.7 : 0.8);
        ctx.fillText(node.value, textRadius, 0);
        
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
    set(rotationRef, rotation);
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
document.getElementById('shuffleButton').addEventListener('click', () => {
    const updatedNodes = shuffleAndUpdateAngle(nodes);
    nodes = updatedNodes; // Update the global nodes array
    saveNodesConfiguration(nodes); // Save the new configuration to the database
});
export function shuffleAndUpdateAngle(nodes) {
    const shuffledNodes = shuffleNodes(nodes);
    currentAngle = Math.random() * 2 * Math.PI; // Set the angle to a random value between 0 and 2π
    drawWheel(shuffledNodes, currentAngle);
    saveCurrentRotation(currentAngle); // Save the new rotation to the database
    return shuffledNodes;
}