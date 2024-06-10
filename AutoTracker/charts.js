document.addEventListener('DOMContentLoaded', () => {
    // Get the chart period picker
    const chartPeriodPicker = document.getElementById('chartPeriodPicker');

    // Add event listener to the chart period picker
    chartPeriodPicker.addEventListener('change', () => {
        loadChart(chartPeriodPicker.value);
    });

    // Load the default chart
    loadChart();

    // Apply the saved color palette on page load if it exists
    const savedColor = localStorage.getItem('baseColor');
    if (savedColor) {
        applyColorPalette(savedColor);
    } else {
        const defaultColor = getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim();
        applyColorPalette(defaultColor);
    }

    // Add event listener to the apply color button
    const applyColorButton = document.getElementById('applyColor');
    applyColorButton.addEventListener('click', () => {
        const selectedColor = document.getElementById('colorPicker').value;
        applyColorPalette(selectedColor);
        localStorage.setItem('baseColor', selectedColor); // Save the selected color to local storage
    });
});

let salesChart;

function loadChart(period = 'day') {
    const database = firebase.database();
    const salesCountsRef = database.ref('salesCounts');

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const currentUserId = user.uid;

            salesCountsRef.child(currentUserId).once('value', salesSnapshot => {
                const salesData = salesSnapshot.val();
                const salesCounts = salesData && salesData[period] ? salesData[period] : {
                    billableHRA: 0,
                    selectRX: 0,
                    selectPatientManagement: 0,
                    transfer: 0
                };

                // Prepare the data for the chart
                const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
                const borderColor = chroma(primaryColor).darken().hex();
                const textColor = chroma(primaryColor).luminance() < 0.5 ? '#ffffff' : '#000000';
                const chartData = {
                    labels: ['HRA', 'SRX', 'SPM', 'Transfer'],
                    datasets: [{
                        label: `Sales Counts (${period})`,
                        data: [
                            salesCounts.billableHRA,
                            salesCounts.selectRX,
                            salesCounts.selectPatientManagement,
                            salesCounts.transfer
                        ],
                        backgroundColor: primaryColor,
                        borderColor: borderColor,
                        borderWidth: 1
                    }]
                };

                const ctx = document.getElementById('salesChart').getContext('2d');

                if (salesChart instanceof Chart) {
                    // Update the chart data
                    salesChart.data = chartData;
                    salesChart.options.scales.x.ticks.color = textColor;
                    salesChart.options.scales.y.ticks.color = textColor;
                    salesChart.options.scales.x.ticks.font.size = 24; // Adjust text size
                    salesChart.options.scales.y.ticks.font.size = 24; // Adjust text size
                    salesChart.options.plugins.legend.labels.color = textColor;
                    salesChart.options.plugins.legend.labels.font.size = 24; // Adjust legend text size
                    salesChart.update();
                } else {
                    // Initialize the chart
                    salesChart = new Chart(ctx, {
                        type: 'bar',
                        data: chartData,
                        options: {
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: {
                                        display: false
                                    },
                                    ticks: {
                                        color: textColor,
                                        font: {
                                            size: 24 // Adjust text size
                                        }
                                    }
                                },
                                x: {
                                    grid: {
                                        display: false
                                    },
                                    ticks: {
                                        color: textColor,
                                        font: {
                                            size: 24, // Adjust text size
                                            family: 'Arial',
                                            weight: 'bold',
                                        },
                                        maxRotation: 0,
                                        minRotation: 0
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    labels: {
                                        color: textColor,
                                        font: {
                                            size: 24 // Adjust legend text size
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }).catch(error => {
                console.error('Error fetching sales data:', error);
            });
        } else {
            console.error('No user is signed in.');
        }
    });
}

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
    loadChart(); // Reload the chart with new colors
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