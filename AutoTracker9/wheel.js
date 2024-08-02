let isSpinning = false;
let currentAngle = 0;
let animationFrameId;

export function spinWheel(nodes) {
    if (isSpinning) return;
    isSpinning = true;

    const totalNodes = nodes.reduce((acc, node) => acc + parseInt(node.count), 0);
    const angleStep = (2 * Math.PI) / totalNodes;

    let spinDuration = 5000 + Math.random() * 2000; // Spin duration between 5000ms to 7000ms
    let maxSpinSpeed = 5 + Math.random() * 5; // Spin speed between 5 and 10
    let accelerationDuration = spinDuration * 0.4; // 40% of the duration for acceleration
    let decelerationDuration = spinDuration * 0.6; // 60% of the duration for deceleration
    let peakTime = accelerationDuration;
    let start = null;

    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;

        if (progress <= accelerationDuration) {
            const easedProgress = easeInOutCubic(progress / accelerationDuration);
            currentAngle += (maxSpinSpeed * easedProgress) % (2 * Math.PI);
        } else if (progress <= spinDuration) {
            const decelerationProgress = (progress - peakTime) / decelerationDuration;
            const easedProgress = easeInOutCubic(1 - decelerationProgress);
            currentAngle += (maxSpinSpeed * easedProgress) % (2 * Math.PI);
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

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function drawWheel(nodes, rotation = 0) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const totalNodes = nodes.reduce((acc, node) => acc + parseInt(node.count), 0);
    const angleStep = (2 * Math.PI) / totalNodes;
    const radius = canvas.width / 2;
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

            ctx.fillStyle = (i % 2 === 0) ? '#FFCC00' : '#FF9900';
            ctx.fill();
            ctx.stroke();

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
    ctx.lineTo(centerX - 10, centerY);
    ctx.lineTo(centerX + 10, centerY);
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();
}

function displayResult(nodes, rotation, angleStep) {
    const totalNodes = nodes.reduce((acc, node) => acc + parseInt(node.count), 0);
    const winningIndex = Math.floor((2 * Math.PI - rotation) / angleStep) % totalNodes;
    let currentNodeIndex = 0;
    let result;

    nodes.forEach((node) => {
        for (let i = 0; i < node.count; i++) {
            if (currentNodeIndex === winningIndex) {
                result = node.value;
            }
            currentNodeIndex++;
        }
    });

    const resultElement = document.getElementById('result');
    resultElement.textContent = `Result: ${result}`;
}
