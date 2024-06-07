// color-palette.js
document.addEventListener('DOMContentLoaded', function () {
    const colorPicker = document.getElementById('colorPicker');
    const applyColorButton = document.getElementById('applyColor');

    applyColorButton.addEventListener('click', function () {
        const selectedColor = colorPicker.value;
        applyColorPalette(selectedColor);
    });

    function applyColorPalette(baseColor) {
        const palette = chroma.scale([baseColor, chroma(baseColor).darken(3)]).mode('lab').colors(5);

        document.documentElement.style.setProperty('--color-primary', palette[0]);
        document.documentElement.style.setProperty('--color-secondary', palette[1]);
        document.documentElement.style.setProperty('--color-tertiary', palette[2]);
        document.documentElement.style.setProperty('--color-quaternary', palette[3]);
        document.documentElement.style.setProperty('--color-quinary', palette[4]);

        updateStyles();
    }

    function updateStyles() {
        const styles = document.documentElement.style;
        document.querySelectorAll('.button').forEach(btn => {
            btn.style.backgroundColor = styles.getPropertyValue('--color-primary');
        });
        document.querySelectorAll('.button:hover').forEach(btn => {
            btn.style.backgroundColor = styles.getPropertyValue('--color-secondary');
        });
        document.querySelectorAll('.container').forEach(container => {
            container.style.backgroundColor = styles.getPropertyValue('--color-tertiary');
        });
        // Add more style updates as needed
    }
});