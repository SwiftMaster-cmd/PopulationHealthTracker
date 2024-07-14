import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const firebaseConfig = {
        apiKey: "AIzaSyBhSqBwrg8GYyaqpYHOZS8HtFlcXZ09OJA",
        authDomain: "track-dac15.firebaseapp.com",
        databaseURL: "https://track-dac15-default-rtdb.firebaseio.com",
        projectId: "track-dac15",
        storageBucket: "track-dac15.appspot.com",
        messagingSenderId: "495156821305",
        appId: "1:495156821305:web:7cbb86d257ddf9f0c3bce8",
        measurementId: "G-RVBYB0RR06"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const database = getDatabase(app);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userAuthorityRef = ref(database, 'users/' + user.uid + '/authority');
            get(userAuthorityRef).then((snapshot) => {
                const authorityLevel = snapshot.val();
                if (authorityLevel >= 2) {
                    loadPresets();
                } else {
                    alert("You do not have permission to view this page.");
                    window.location.href = 'index.html';
                }
            });
        } else {
            window.location.href = 'index.html';
        }
    });

    function loadPresets() {
        const presetsRef = ref(database, 'spinTheWheelPresets');
        onValue(presetsRef, (snapshot) => {
            const presets = snapshot.val();
            const presetsContainer = document.getElementById('presets-container');
            presetsContainer.innerHTML = ''; // Clear existing presets

            if (presets) {
                Object.keys(presets).forEach(presetName => {
                    const presetButton = document.createElement('button');
                    presetButton.textContent = presetName;
                    presetButton.addEventListener('click', () => displayPresetSummary(presets[presetName]));
                    presetsContainer.appendChild(presetButton);
                });
            }
        });
    }

    function displayPresetSummary(preset) {
        const summaryText = document.getElementById('summary-text');
        summaryText.textContent = `Preset: ${preset.name}`;

        const nodes = preset.nodes;
        console.log('Preset nodes:', nodes); // Debugging
        const shuffledNodes = shuffleNodes(nodes);
        generateWheel(shuffledNodes);
    }

    function shuffleNodes(nodes) {
        // Flatten nodes into an array where each node value appears `count` times
        let flatNodes = [];
        nodes.forEach(node => {
            for (let i = 0; i < node.count; i++) {
                flatNodes.push(node.value);
            }
        });
    
        // Shuffle the flattened array
        for (let i = flatNodes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [flatNodes[i], flatNodes[j]] = [flatNodes[j], flatNodes[i]];
        }
    
        // Reassemble the shuffled array into nodes with their counts
        let shuffledNodes = [];
        flatNodes.forEach(value => {
            let node = shuffledNodes.find(node => node.value === value);
            if (node) {
                node.count++;
            } else {
                shuffledNodes.push({ value, count: 1 });
            }
        });
    
        return shuffledNodes;
    }

    let isSpinning = false;
    let currentAngle = 0;
    let animationFrameId;

    function generateWheel(nodes) {
        const canvas = document.getElementById('wheel-canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            console.error('Failed to get canvas context');
            return;
        }

        if (nodes) {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const totalNodes = nodes.reduce((acc, node) => acc + parseInt(node.count), 0);
            const angleStep = (2 * Math.PI) / totalNodes;
            const radius = canvas.width / 2;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            let currentAngle = 0;

            nodes.forEach((node) => {
                for (let i = 0; i < node.count; i++) {
                    const startAngle = currentAngle;
                    const endAngle = startAngle + angleStep;

                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                    ctx.closePath();

                    // Alternate colors for each segment
                    ctx.fillStyle = (i % 2 === 0) ? '#FFCC00' : '#FF9900';
                    ctx.fill();
                    ctx.stroke();

                    // Draw text
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
        }

        document.getElementById('spin-button').addEventListener('click', () => spinWheel(nodes));
    }

    function spinWheel(nodes) {
        if (isSpinning) return;
        isSpinning = true;

        const totalNodes = nodes.reduce((acc, node) => acc + parseInt(node.count), 0);
        const angleStep = (2 * Math.PI) / totalNodes;

        // Generate a random spin duration and speed
        let spinDuration = 5000 + Math.random() * 2000; // Spin duration between 5000ms to 7000ms
        let maxSpinSpeed = 5 + Math.random() * 5; // Spin speed between 5 and 10
        let accelerationDuration = spinDuration * 0.4; // 40% of the duration for acceleration
        let decelerationDuration = spinDuration * 0.6; // 60% of the duration for deceleration
        let peakTime = accelerationDuration;
        let start = null;

        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;

            // Acceleration phase
            if (progress <= accelerationDuration) {
                const easedProgress = easeInOutCubic(progress / accelerationDuration);
                currentAngle += (maxSpinSpeed * easedProgress) % (2 * Math.PI);
            }
            // Deceleration phase
            else if (progress <= spinDuration) {
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

    function drawWheel(nodes, rotation) {
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

                // Alternate colors for each segment
                ctx.fillStyle = (i % 2 === 0) ? '#FFCC00' : '#FF9900';
                ctx.fill();
                ctx.stroke();

                // Draw text
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
});