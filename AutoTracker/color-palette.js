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
        const primaryTextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
        const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
    
        document.body.style.color = primaryTextColor;
    
        document.querySelectorAll('.button').forEach(btn => {
            btn.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-primary')}, ${chroma(styles.getPropertyValue('--color-primary')).darken(1).hex()})`;
            btn.style.color = primaryTextColor;
        });
    
        document.querySelectorAll('.container').forEach(container => {
            container.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-primary')}, ${chroma(styles.getPropertyValue('--color-primary')).darken(1).hex()})`;
            container.style.color = primaryTextColor;
            container.style.opacity = '0.8';
        });
    
        document.querySelectorAll('.leaderboard-container').forEach(container => {
            container.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-secondary')}, ${chroma(styles.getPropertyValue('--color-secondary')).darken(1).hex()})`;
            container.style.color = secondaryTextColor;
            container.style.opacity = '0.8';
        });
    
        document.querySelectorAll('.leaderboard-item').forEach(item => {
            item.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-tertiary')}, ${chroma(styles.getPropertyValue('--color-tertiary')).darken(1).hex()})`;
            item.style.color = primaryTextColor;
            item.style.opacity = '0.8';
        });
    
        document.querySelectorAll('.outcome-item').forEach(item => {
            item.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-tertiary')}, ${chroma(styles.getPropertyValue('--color-tertiary')).darken(1).hex()})`;
            item.style.color = primaryTextColor;
            item.style.opacity = '0.8';
        });
    
        document.querySelectorAll('.sales-counts-container').forEach(container => {
            container.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-quaternary')}, ${chroma(styles.getPropertyValue('--color-quaternary')).darken(1).hex()})`;
            container.style.color = primaryTextColor;
            container.style.opacity = '0.8';
        });
    
        document.querySelectorAll('.account-container').forEach(container => {
            container.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-quaternary')}, ${chroma(styles.getPropertyValue('--color-quaternary')).darken(1).hex()})`;
            container.style.color = primaryTextColor;
            container.style.opacity = '0.8';
        });
    
        document.querySelectorAll('.customer-info').forEach(container => {
            container.style.background = `linear-gradient(to bottom, ${styles.getPropertyValue('--color-tertiary')}, ${chroma(styles.getPropertyValue('--color-tertiary')).darken(1).hex()})`;
            container.style.color = primaryTextColor;
            container.style.opacity = '0.8';
        });
    }
});