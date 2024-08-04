document.addEventListener('DOMContentLoaded', function () {
    const colorPicker = document.getElementById('colorPicker');
    const applyColorButton = document.getElementById('applyColor');

    // Apply the saved color palette on page load if it exists
    const savedColor = localStorage.getItem('baseColor');
    if (savedColor) {
        applyColorPalette(savedColor);
    } else {
        const defaultColor = getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim();
        applyColorPalette(defaultColor);
    }

    applyColorButton.addEventListener('click', function () {
        const selectedColor = colorPicker.value;
        applyColorPalette(selectedColor);
        localStorage.setItem('baseColor', selectedColor); // Save the selected color to local storage
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
        const whiteTextColor = '#ffffff';
        const brightPrimaryTextColor = chroma(styles.getPropertyValue('--color-primary')).brighten(2).hex();

        document.body.style.color = whiteTextColor;

        document.querySelectorAll('.button').forEach(btn => {
            btn.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-primary')}, ${chroma(styles.getPropertyValue('--color-primary')).darken(1).hex()})`;
            btn.style.color = brightPrimaryTextColor;
            btn.addEventListener('mouseenter', () => btn.style.opacity = '1.0');
            btn.addEventListener('mouseleave', () => btn.style.opacity = '0.8');
        });

        document.querySelectorAll('.container').forEach(container => {
            container.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-primary')}, ${chroma(styles.getPropertyValue('--color-primary')).darken(1).hex()})`;
            container.style.color = brightPrimaryTextColor;
            container.style.opacity = '0.8';
            container.addEventListener('mouseenter', () => container.style.opacity = '1.0');
            container.addEventListener('mouseleave', () => container.style.opacity = '0.8');
        });

        document.querySelectorAll('.leaderboard-container').forEach(container => {
            container.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-secondary')}, ${chroma(styles.getPropertyValue('--color-secondary')).darken(1).hex()})`;
            container.style.color = whiteTextColor;
            container.style.opacity = '0.8';
            container.addEventListener('mouseenter', () => container.style.opacity = '1.0');
            container.addEventListener('mouseleave', () => container.style.opacity = '0.8');
        });

        document.querySelectorAll('.leaderboard-item').forEach(item => {
            item.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-tertiary')}, ${chroma(styles.getPropertyValue('--color-tertiary')).darken(1).hex()})`;
            item.style.color = brightPrimaryTextColor;
            item.style.opacity = '0.8';
            item.addEventListener('mouseenter', () => item.style.opacity = '1.0');
            item.addEventListener('mouseleave', () => item.style.opacity = '0.8');
        });

        document.querySelectorAll('.outcome-item').forEach(item => {
            item.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-tertiary')}, ${chroma(styles.getPropertyValue('--color-tertiary')).darken(1).hex()})`;
            item.style.color = brightPrimaryTextColor;
            item.style.opacity = '0.8';
            item.addEventListener('mouseenter', () => item.style.opacity = '1.0');
            item.addEventListener('mouseleave', () => item.style.opacity = '0.8');
        });

        document.querySelectorAll('.sales-counts-container').forEach(container => {
            container.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-quaternary')}, ${chroma(styles.getPropertyValue('--color-quaternary')).darken(1).hex()})`;
            container.style.color = brightPrimaryTextColor;
            container.style.opacity = '0.8';
            container.addEventListener('mouseenter', () => container.style.opacity = '1.0');
            container.addEventListener('mouseleave', () => container.style.opacity = '0.8');
        });

        document.querySelectorAll('.account-container').forEach(container => {
            container.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-quaternary')}, ${chroma(styles.getPropertyValue('--color-quaternary')).darken(1).hex()})`;
            container.style.color = brightPrimaryTextColor;
            container.style.opacity = '0.8';
            container.addEventListener('mouseenter', () => container.style.opacity = '1.0');
            container.addEventListener('mouseleave', () => container.style.opacity = '0.8');
        });

        document.querySelectorAll('.customer-info').forEach(container => {
            container.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-tertiary')}, ${chroma(styles.getPropertyValue('--color-tertiary')).darken(1).hex()})`;
            container.style.color = brightPrimaryTextColor;
            container.style.opacity = '0.8';
            container.addEventListener('mouseenter', () => container.style.opacity = '1.0');
            container.addEventListener('mouseleave', () => container.style.opacity = '0.8');
        });
    }
});
export const colorPalette = {
    primary: 'rgba(75, 0, 130, 0.9)', // Indigo
    secondary: 'rgba(138, 43, 226, 0.9)', // BlueViolet
    tertiary: 'rgba(0, 191, 255, 0.9)', // DeepSkyBlue
    quaternary: 'rgba(50, 205, 50, 0.9)', // LimeGreen
    quinary: 'rgba(255, 215, 0, 0.9)', // Gold
    textWhite: 'rgba(255, 255, 255, 1)',
    backgroundColor: 'rgba(20, 20, 20, 1)', // Dark Background
};
