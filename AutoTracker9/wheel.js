let isSpinning = false;
let currentAngle = 0;
let animationFrameId;

export function spinWheel(nodes) {
    if (isSpinning) return;
    isSpinning = true;

    const totalNodes = nodes.reduce((acc, node) => acc + node.count, 0);
    const angleStep = (2 * Math.PI) / totalNodes;

    let spinDuration = 8000; // Total spin duration of 8 seconds
    let maxSpinSpeed = 5; // Max spin speed reduced by 60%
    let accelerationDuration = 1000; // 1 second to reach max speed
    let decelerationStart = 1000; // Start deceleration after 1 second
    let dramaticSlowdownStart = 4000; // Start dramatic slowdown after 4 seconds
    let dramaticSlowdownDuration = 3000; // Last 3 seconds for dramatic slowdown
    let peakTime = accelerationDuration;
    let start = null;

    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;

        if (progress <= accelerationDuration) {
            const easedProgress = easeInQuad(progress / accelerationDuration);
            currentAngle += (maxSpinSpeed * easedProgress) % (2 * Math.PI);
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

export function drawWheel(nodes, rotation = 0) {
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