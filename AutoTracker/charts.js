document.addEventListener('DOMContentLoaded', () => {
    const chartPeriodPicker = document.getElementById('chartPeriodPicker');

    // Set default picker value to 'month'
    chartPeriodPicker.value = 'month';

    chartPeriodPicker.addEventListener('change', () => {
        loadChart(chartPeriodPicker.value);
    });

    loadChart('month');

    const savedColor = localStorage.getItem('baseColor');
    if (savedColor) {
        applyColorPalette(savedColor);
    } else {
        const defaultColor = getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim();
        applyColorPalette(defaultColor);
    }
});

let salesChart;

function loadChart(period = 'month') {
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
                    salesChart.options.scales.x.ticks.font.size = 24;
                    salesChart.options.scales.y.ticks.font.size = 24;
                    salesChart.options.plugins.legend.labels.color = textColor;
                    salesChart.options.plugins.legend.labels.font.size = 24;
                    salesChart.update();
                } else {
                    salesChart = new Chart(ctx, {
                        type: 'line',
                        data: chartData,
                        options: {
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        color: textColor,
                                        font: {
                                            size: 24
                                        }
                                    },
                                    grid: {
                                        color: 'rgba(255, 255, 255, 0.75)', // White grid lines with 0.75 opacity
                                        lineWidth: 1
                                    }
                                },
                                x: {
                                    ticks: {
                                        color: textColor,
                                        font: {
                                            size: 24,
                                            family: 'Arial',
                                            weight: 'bold'
                                        }
                                    },
                                    grid: {
                                        color: 'rgba(255, 255, 255, 0.75)', // White grid lines with 0.75 opacity
                                        lineWidth: 1
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    labels: {
                                        color: textColor,
                                        font: {
                                            size: 24
                                        }
                                    }
                                }
                            },
                            elements: {
                                line: {
                                    tension: 0.4, // smooth curves
                                    borderWidth: 2, // set line width
                                    fill: 'origin', // fill only the area below
                                    backgroundColor: function(context) {
                                        const color = context.dataset.backgroundColor;
                                        return color.replace('0.25', '0.1'); // reduce fill opacity
                                    }
                                },
                                point: {
                                    backgroundColor: '#ffffff', // white dots
                                    borderColor: function(context) {
                                        return context.dataset.borderColor;
                                    },
                                    borderWidth: 2
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
    const datasets = [
        {
            label: 'SPM',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Select Patient Management', label)),
            borderColor: 'rgba(255, 0, 255, 1)', // Magenta
            backgroundColor: 'rgba(255, 0, 255, 0.25)', // Magenta with 0.25 opacity
            pointBackgroundColor: '#ffffff', // white dots
            pointBorderColor: 'rgba(255, 0, 255, 1)', // border color same as line
            pointBorderWidth: 2,
            fill: '-1'
        },
        {
            label: 'Transfer',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Transfer', label)),
            borderColor: 'rgba(0, 255, 255, 1)', // Cyan
            backgroundColor: 'rgba(0, 255, 255, 0.25)', // Cyan with 0.25 opacity
            pointBackgroundColor: '#ffffff', // white dots
            pointBorderColor: 'rgba(0, 255, 255, 1)', // border color same as line
            pointBorderWidth: 2,
            fill: '-1'
        },
        {
            label: 'HRA',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Billable HRA', label)),
            borderColor: 'rgba(0, 255, 0, 1)', // Keylime
            backgroundColor: 'rgba(0, 255, 0, 0.25)', // Keylime with 0.25 opacity
            pointBackgroundColor: '#ffffff', // white dots
            pointBorderColor: 'rgba(0, 255, 0, 1)', // border color same as line
            pointBorderWidth: 2,
            fill: '-1'
        },
        {
            label: 'SRX',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Select RX', label)),
            borderColor: 'rgba(0, 255, 127, 1)', // Spring Green
            backgroundColor: 'rgba(0, 255, 127, 0.25)', // Spring Green with 0.25 opacity
            pointBackgroundColor: '#ffffff', // white dots
            pointBorderColor: 'rgba(0, 255, 127, 1)', // border color same as line
            pointBorderWidth: 2,
            fill: '-1'
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

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
