document.addEventListener('DOMContentLoaded', function () {
    const colorPicker = document.getElementById('colorPicker');
    const applyColorButton = document.getElementById('applyColor');

    applyColorButton.addEventListener('click', function () {
        const selectedColor = colorPicker.value;
        applyColorPalette(selectedColor);
    });

    function applyColorPalette(baseColor) {
        const isDark = chroma(baseColor).luminance() < 0.5;
        const palette = chroma.scale([baseColor, isDark ? chroma(baseColor).brighten(3) : chroma(baseColor).darken(3)]).mode('lab').colors(5);

        document.documentElement.style.setProperty('--color-primary', palette[0]);
        document.documentElement.style.setProperty('--color-secondary', palette[1]);
        document.documentElement.style.setProperty('--color-tertiary', palette[2]);
        document.documentElement.style.setProperty('--color-quaternary', palette[3]);
        document.documentElement.style.setProperty('--color-quinary', palette[4]);

        document.body.style.backgroundColor = palette[0]; // Update body background color

        updateStyles(isDark);
    }

    function updateStyles(isDark) {
        const styles = document.documentElement.style;
        const textColor = isDark ? '#ffffff' : '#000000';

        document.body.style.color = textColor;

        document.querySelectorAll('.button').forEach(btn => {
            btn.style.backgroundColor = styles.getPropertyValue('--color-primary');
            btn.style.color = textColor;
        });

        document.querySelectorAll('.container').forEach(container => {
            container.style.backgroundColor = styles.getPropertyValue('--color-tertiary');
            container.style.color = textColor;
        });

        document.querySelectorAll('.leaderboard-container').forEach(container => {
            container.style.backgroundColor = styles.getPropertyValue('--color-secondary');
            container.style.color = textColor;
        });

        document.querySelectorAll('.leaderboard-item').forEach(item => {
            item.style.backgroundColor = styles.getPropertyValue('--color-tertiary');
            item.style.color = textColor;
        });

        document.querySelectorAll('.outcome-item').forEach(item => {
            item.style.backgroundColor = styles.getPropertyValue('--color-tertiary');
            item.style.color = textColor;
        });

        document.querySelectorAll('.sales-counts-container').forEach(container => {
            container.style.backgroundColor = styles.getPropertyValue('--color-quaternary');
            container.style.color = textColor;
        });

        document.querySelectorAll('.account-container').forEach(container => {
            container.style.backgroundColor = styles.getPropertyValue('--color-quaternary');
            container.style.color = textColor;
        });

        document.querySelectorAll('.customer-info').forEach(container => {
            container.style.backgroundColor = styles.getPropertyValue('--color-tertiary');
            container.style.color = textColor;
        });
    }
});