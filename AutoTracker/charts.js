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
        loadChart(); // Ensure the chart updates with the new colors
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

    // Load the chart initially with the default period
    loadChart();
});

let salesChart;

function loadChart(period = 'day') {
    const database = firebase.database();
    const salesTimeFramesRef = database.ref('salesTimeFrames');

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const currentUserId = user.uid;

            salesTimeFramesRef.child(currentUserId).once('value', salesSnapshot => {
                const salesData = salesSnapshot.val();
                let chartData = {
                    labels: [],
                    datasets: []
                };

                if (period === 'day') {
                    chartData = getDailyChartData(salesData);
                } else if (period === 'week') {
                    chartData = getWeeklyChartData(salesData);
                } else if (period === 'month') {
                    chartData = getMonthlyChartData(salesData);
                }

                const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
                const textColor = chroma(primaryColor).luminance() < 0.5 ? '#ffffff' : '#000000';

                const ctx = document.getElementById('salesChart').getContext('2d');

                if (salesChart instanceof Chart) {
                    salesChart.data = chartData;
                    salesChart.options.scales.x.ticks.color = textColor;
                    salesChart.options.scales.y.ticks.color = textColor;
                    salesChart.options.plugins.tooltip.callbacks.label = tooltipLabelCallback;
                    salesChart.update();
                } else {
                    salesChart = new Chart(ctx, {
                        type: 'line',
                        data: chartData,
                        options: {
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: {
                                        color: 'rgba(255, 255, 255, 0.2)'
                                    },
                                    ticks: {
                                        color: textColor,
                                        font: {
                                            size: 14
                                        },
                                        beginAtZero: true
                                    },
                                    title: {
                                        display: true,
                                        text: 'Number/Quantity',
                                        color: textColor,
                                        font: {
                                            size: 16,
                                            weight: 'bold'
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
                                            size: 14,
                                            weight: 'bold'
                                        }
                                    },
                                    title: {
                                        display: true,
                                        text: 'Time',
                                        color: textColor,
                                        font: {
                                            size: 16,
                                            weight: 'bold'
                                        }
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    labels: {
                                        color: textColor,
                                        font: {
                                            size: 14
                                        }
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: tooltipLabelCallback
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

function getDailyChartData(salesData) {
    const hours = Array.from({ length: 13 }, (_, i) => `${i + 8}am`);
    const data = {
        labels: hours,
        datasets: createDatasets(hours, salesData, 'day')
    };
    return data;
}

function getWeeklyChartData(salesData) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const data = {
        labels: days,
        datasets: createDatasets(days, salesData, 'week')
    };
    return data;
}

function getMonthlyChartData(salesData) {
    const today = new Date().getDate();
    const daysInMonth = Array.from({ length: today }, (_, i) => (i + 1).toString());
    const data = {
        labels: daysInMonth,
        datasets: createDatasets(daysInMonth, salesData, 'month')
    };
    return data;
}

function createDatasets(labels, salesData, period) {
    const colorBlindFriendlyPalette = ['#377eb8', '#e41a1c', '#4daf4a', '#984ea3'];

    const datasets = [
        {
            label: 'Billable HRA',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Billable HRA', label)),
            borderColor: colorBlindFriendlyPalette[0],
            backgroundColor: colorBlindFriendlyPalette[0],
            fill: false,
            pointStyle: 'circle'
        },
        {
            label: 'Select RX',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Select RX', label)),
            borderColor: colorBlindFriendlyPalette[1],
            backgroundColor: colorBlindFriendlyPalette[1],
            fill: false,
            pointStyle: 'triangle'
        },
        {
            label: 'Select Patient Management',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Select Patient Management', label)),
            borderColor: colorBlindFriendlyPalette[2],
            backgroundColor: colorBlindFriendlyPalette[2],
            fill: false,
            pointStyle: 'rect'
        },
        {
            label: 'Transfer',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Transfer', label)),
            borderColor: colorBlindFriendlyPalette[3],
            backgroundColor: colorBlindFriendlyPalette[3],
            fill: false,
            pointStyle: 'star'
        }
    ];

    return datasets;
}

function getSaleCountForLabel(salesData, period, saleType, label) {
    let count = 0;

    for (const account in salesData) {
        const sales = salesData[account][saleType];

        if (sales) {
            sales.forEach(saleTime => {
                const saleDate = new Date(saleTime);
                if (period === 'day' && formatHour(saleDate) === label) {
                    count++;
                } else if (period === 'week' && formatDay(saleDate) === label) {
                    count++;
                } else if (period === 'month' && saleDate.getDate().toString() === label) {
                    count++;
                }
            });
        }
    }

    return count;
}

function formatHour(date) {
    const hours = date.getHours();
    return hours < 12 ? `${hours}am` : `${hours - 12}pm`;
}

function formatDay(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

function tooltipLabelCallback(tooltipItem) {
    return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
}
