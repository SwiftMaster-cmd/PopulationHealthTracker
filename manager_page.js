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
        generateWheel(nodes);
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

        let spinDuration = 3000; // Spin duration in ms
        let start = null;

        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;

            // Calculate the current angle based on the progress
            currentAngle = (progress / spinDuration) * 2 * Math.PI;
            currentAngle %= 2 * Math.PI; // Keep the angle within [0, 2π]

            // Slow down the spin towards the end
            const easing = 1 - Math.pow(1 - (progress / spinDuration), 3);
            currentAngle *= easing;

            drawWheel(nodes, currentAngle);

            if (progress < spinDuration) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                isSpinning = false;
                highlightWinningSegment(nodes, currentAngle, angleStep);
            }
        }

        animationFrameId = requestAnimationFrame(animate);
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

        ctx.beginPath();
        ctx.moveTo(centerX, centerY - needleLength);
        ctx.lineTo(centerX - 5, centerY);
        ctx.lineTo(centerX + 5, centerY);
        ctx.closePath();
        ctx.fillStyle = 'red';
        ctx.fill();
    }

    function highlightWinningSegment(nodes, rotation, angleStep) {
        const canvas = document.getElementById('wheel-canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        const totalNodes = nodes.reduce((acc, node) => acc + parseInt(node.count), 0);
        const radius = canvas.width / 2;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Find the winning segment
        let accumulatedAngle = 0;
        let winningNode = null;

        for (const node of nodes) {
            for (let i = 0; i < node.count; i++) {
                if (rotation >= accumulatedAngle && rotation < accumulatedAngle + angleStep) {
                    winningNode = node;
                    break;
                }
                accumulatedAngle += angleStep;
            }
            if (winningNode) break;
        }

        // Redraw the wheel with the winning segment highlighted
        let currentAngle = rotation;

        nodes.forEach((node) => {
            for (let i = 0; i < node.count; i++) {
                const startAngle = currentAngle;
                const endAngle = startAngle + angleStep;

                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                ctx.closePath();

                // Highlight the winning segment
                if (rotation >= accumulatedAngle && rotation < accumulatedAngle + angleStep) {
                    ctx.fillStyle = '#FFFF00'; // Bright yellow
                } else {
                    // Alternate colors for each segment
                    ctx.fillStyle = (i % 2 === 0) ? '#FFCC00' : '#FF9900';
                }
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
});