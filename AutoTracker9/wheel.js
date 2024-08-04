let isSpinning = false;
let animationFrameId;
let currentAngle = 0;

import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

export function spinWheel(nodes, currentAngle) {
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

        drawWheel(nodes, currentAngle);
        drawNeedle(); // Ensure the needle is always drawn after the wheel
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

function drawWheel(nodes, rotation = 0) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const totalNodes = nodes.length;
    const angleStep = (2 * Math.PI) / totalNodes;
    const radius = Math.min(canvas.height, canvas.height) / 2; // Corrected
    const centerX = radius; // Align wheel to the left
    const centerY = canvas.height / 2;
    let currentAngle = rotation;

    const colors = ['#007BFF', '#5A9EF9']; // Two shades of blue

    nodes.forEach((value, index) => {
        const startAngle = currentAngle;
        const endAngle = startAngle + angleStep;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((startAngle + endAngle) / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.fillText(value, radius * 0.8, 0);
        ctx.restore();

        currentAngle += angleStep;
    });

    drawNeedle(); // Ensure the needle is always drawn after the wheel
}

function drawNeedle() {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const needleImg = new Image();
    needleImg.src = './nav.png'; // Replace with the path to the uploaded needle image

    needleImg.onload = () => {
        const needleWidth = needleImg.width * 0.735; // Adjust the size to 70% of the original
        const needleHeight = needleImg.height * 0.735; // Adjust the size to 70% of the original
        const needleXPosition = (canvas.width / 2) - (needleWidth / 2); // Center horizontally
        const needleYPosition = 10; // Adjust as needed for vertical positioning

        ctx.save();
        ctx.drawImage(needleImg, needleXPosition, needleYPosition, needleWidth, needleHeight);
        ctx.restore();
    };

    // Draw the needle immediately if the image is already loaded
    if (needleImg.complete) {
        const needleWidth = needleImg.width * 0.735; // Adjust the size to 70% of the original
        const needleHeight = needleImg.height * 0.735; // Adjust the size to 70% of the original
        const needleXPosition = (canvas.width / 2) - (needleWidth / 2); // Center horizontally
        const needleYPosition = 10; // Adjust as needed for vertical positioning

        ctx.save();
        ctx.drawImage(needleImg, needleXPosition, needleYPosition, needleWidth, needleHeight);
        ctx.restore();
    }
}


function displayResult(nodes, rotation, angleStep) {
    const totalNodes = nodes.length;
    const adjustedRotation = (rotation + Math.PI / 2) % (2 * Math.PI);
    const winningIndex = Math.floor(adjustedRotation / angleStep) % totalNodes;
    const result = nodes[winningIndex];

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
    const values = nodes.flatMap(node => Array(node.count).fill(node.value));
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
}
