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
                                    fill: true // enable area fill
                                },
                                point: {
                                    backgroundColor: '#ffffff', // white dots
                                    borderColor: '#000000', // black border for contrast
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
    const lineColor1 = getComputedStyle(document.documentElement).getPropertyValue('--line-color-1').trim();
    const lineColor2 = getComputedStyle(document.documentElement).getPropertyValue('--line-color-2').trim();
    const lineColor3 = getComputedStyle(document.documentElement).getPropertyValue('--line-color-3').trim();
    const lineColor4 = getComputedStyle(document.documentElement).getPropertyValue('--line-color-4').trim();

    const datasets = [
        {
            label: 'HRA',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Billable HRA', label)),
            borderColor: lineColor1,
            backgroundColor: lineColor1,
            pointBackgroundColor: '#ffffff', // white dots
            pointBorderColor: lineColor1, // border color same as line
            pointBorderWidth: 2,
            fill: 'origin'
        },
        {
            label: 'SRX',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Select RX', label)),
            borderColor: lineColor2,
            backgroundColor: lineColor2,
            pointBackgroundColor: '#ffffff', // white dots
            pointBorderColor: lineColor2, // border color same as line
            pointBorderWidth: 2,
            fill: 'origin'
        },
        {
            label: 'SPM',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Select Patient Management', label)),
            borderColor: lineColor3,
            backgroundColor: lineColor3,
            pointBackgroundColor: '#ffffff', // white dots
            pointBorderColor: lineColor3, // border color same as line
            pointBorderWidth: 2,
            fill: 'origin'
        },
        {
            label: 'Transfer',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Transfer', label)),
            borderColor: lineColor4,
            backgroundColor: lineColor4,
            pointBackgroundColor: '#ffffff', // white dots
            pointBorderColor: lineColor4, // border color same as line
            pointBorderWidth: 2,
            fill: 'origin'
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