import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

let isSpinning = false;
let animationFrameId;
let currentAngle = 0;

export function spinWheel(nodes, currentAngle) {
    if (isSpinning) return;
    isSpinning = true;

    const totalNodes = nodes.reduce((acc, node) => acc + node.count, 0);
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

        drawWheel(nodes, currentAngle);
        saveCurrentRotation(currentAngle); // Save current rotation

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

export function drawWheel(nodes, rotation = 0, canvasId = 'wheel-canvas') {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const totalNodes = nodes.reduce((acc, node) => acc + node.count, 0);
    const angleStep = (2 * Math.PI) / totalNodes;
    const radius = Math.min(canvas.width, canvas.height) / 2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let currentAngle = rotation;

    nodes.forEach((node, index) => {
        for (let i = 0; i < node.count; i++) {
            const startAngle = currentAngle;
            const endAngle = startAngle + angleStep;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            ctx.fillStyle = index % 2 === 0 ? '#FFCC00' : '#FF9900';
            ctx.fill();
            ctx.stroke();

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((startAngle + endAngle) / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000';
            ctx.font = '20px Arial';
            ctx.fillText(node.value, radius * 0.8, 0);
            ctx.restore();

            currentAngle += angleStep;
        }
    });

    drawNeedle(canvasId);
}

function drawNeedle(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const needleLength = centerY * 0.8;

    ctx.clearRect(centerX - 10, 0, 20, centerY);

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
    let flattenedNodes = [];

    // Flatten the nodes based on their counts
    nodes.forEach(node => {
        for (let i = 0; i < node.count; i++) {
            flattenedNodes.push(node.value);
        }
    });

    // Shuffle the flattened array
    for (let i = flattenedNodes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flattenedNodes[i], flattenedNodes[j]] = [flattenedNodes[j], flattenedNodes[i]];
    }

    // Save the shuffled nodes as a simple list
    const db = getDatabase();
    const shuffledNodesRef = ref(db, 'wheel/shuffledNodes');
    set(shuffledNodesRef, flattenedNodes);

    return flattenedNodes;
}
