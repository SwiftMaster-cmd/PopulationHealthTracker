const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const outerRadius = Math.min(centerX, centerY) - 20;
const innerRadius = 20;
let angle = 0;
let spinning = false;
let spinTime = 0;
let spinTimeTotal = 0;

const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A6', '#A633FF', '#33FFF2', '#FFDA33'];
let nodes = [];

function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const arc = Math.PI / (nodes.length / 2);

    for (let i = 0; i < nodes.length; i++) {
        const angleStart = angle + i * arc;
        const angleEnd = angleStart + arc;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, angleStart, angleEnd, false);
        ctx.arc(centerX, centerY, innerRadius, angleEnd, angleStart, true);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((angleStart + angleEnd) / 2);
        ctx.fillStyle = '#000';
        ctx.fillText(nodes[i], outerRadius - 70, 0);
        ctx.restore();
    }

    // Draw the center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Draw the needle
    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY - outerRadius);
    ctx.lineTo(centerX + 10, centerY - outerRadius);
    ctx.lineTo(centerX, centerY - outerRadius - 20);
    ctx.fillStyle = 'red';
    ctx.fill();
}

function rotateWheel() {
    if (spinning) {
        spinTime += 30;
        if (spinTime >= spinTimeTotal) {
            spinning = false;
            return;
        }
        const spinAngle = easeOut(spinTime, 0, Math.PI * 4, spinTimeTotal);
        angle += spinAngle * Math.PI / 180;
        drawWheel();
        setTimeout(rotateWheel, 30);
    }
}

function easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
}

startButton.addEventListener('click', () => {
    if (!spinning) {
        spinning = true;
        spinTime = 0;
        spinTimeTotal = Math.random() * 3000 + 4000;
        rotateWheel();
    }
});

function drawWheelWithNodes(newNodes) {
    nodes = newNodes;
    drawWheel();
}

// Export the drawWheelWithNodes function for use in other scripts
export { drawWheelWithNodes };
