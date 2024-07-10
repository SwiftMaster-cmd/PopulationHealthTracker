
function updateSummary() {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');

    const configRef = ref(database, 'gameConfiguration/nodes');
    const rulesRef = ref(database, 'gameRules');

    get(configRef).then((snapshot) => {
        const nodes = snapshot.val();
        if (nodes) {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const numNodes = nodes.length;
            const angleStep = (2 * Math.PI) / numNodes;
            const radius = canvas.width / 2;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            nodes.forEach((node, index) => {
                const startAngle = index * angleStep;
                const endAngle = startAngle + angleStep;

                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                ctx.closePath();

                // Alternate colors for each segment
                ctx.fillStyle = index % 2 === 0 ? '#FFCC00' : '#FF9900';
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
            });
        }

        get(rulesRef).then((snapshot) => {
            const rules = snapshot.val();
            let summaryText = 'Spin Rules:\n';
            if (rules) {
                rules.forEach(rule => {
                    summaryText += `Sales Type: ${rule.salesType}, Quantity: ${rule.quantity}\n`;
                });
            }
            document.getElementById('summary-text').textContent = summaryText;
        });
    });
}




function generateWheel(nodes) {
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');

    if (nodes) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const numNodes = nodes.length;
        const angleStep = (2 * Math.PI) / numNodes;
        const radius = canvas.width / 2;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        nodes.forEach((node, index) => {
            const startAngle = index * angleStep;
            const endAngle = startAngle + angleStep;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            // Alternate colors for each segment
            ctx.fillStyle = index % 2 === 0 ? '#FFCC00' : '#FF9900';
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
        });
    }
}