document.addEventListener('DOMContentLoaded', () => {
    const wheel = new Winwheel({
        'canvasId': 'wheel-canvas',
        'numSegments': 6, // Adjust the number of segments as needed
        'outerRadius': 200, // Adjust the size of the wheel
        'segments': [
            { 'fillStyle': '#eae56f', 'text': '1' },
            { 'fillStyle': '#89f26e', 'text': '2' },
            { 'fillStyle': '#7de6ef', 'text': '3' },
            { 'fillStyle': '#e7706f', 'text': '4' },
            { 'fillStyle': '#eae56f', 'text': '5' },
            { 'fillStyle': '#89f26e', 'text': '6' }
        ],
        'animation': {
            'type': 'spinToStop',
            'duration': 8, // Duration of the spin
            'spins': 5, // Number of complete spins
            'callbackFinished': alertPrize
        }
    });

    document.getElementById('spin-button').addEventListener('click', () => {
        wheel.startAnimation();
    });

    function alertPrize(indicatedSegment) {
        document.getElementById('result').innerText = `Result: ${indicatedSegment.text}`;
    }
});