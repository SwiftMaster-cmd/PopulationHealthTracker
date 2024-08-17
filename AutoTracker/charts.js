let salesCharts = {};
let currentDate = new Date(); // Keeps track of the current date displayed

document.addEventListener('DOMContentLoaded', () => {
    changeChart('day'); // Load the default chart (day)
    
    // Load color palette from local storage if available
    const savedColor = localStorage.getItem('baseColor');
    if (savedColor) {
        applyColorPalette(savedColor);
    } else {
        const defaultColor = getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim();
        applyColorPalette(defaultColor);
    }

    // Add event listeners for the previous and next buttons
    document.getElementById('prevButton').addEventListener('click', () => navigateDate(-1));
    document.getElementById('nextButton').addEventListener('click', () => navigateDate(1));
});

function changeChart(period) {
    const chartIds = ['Day', 'Week', 'Month'];
    const selectedChartId = `chartContainer${period.charAt(0).toUpperCase() + period.slice(1)}`;

    chartIds.forEach(id => {
        const container = document.getElementById(`chartContainer${id}`);
        if (container) {
            if (`chartContainer${id}` === selectedChartId) {
                container.style.display = 'flex'; // Show the selected chart
            } else {
                container.style.display = 'none'; // Hide the others
            }
        }
    });

    const canvasId = `salesChart${period.charAt(0).toUpperCase() + period.slice(1)}`;
    loadChart(period, canvasId); // Load the selected chart data
}

// Adjusts the date and reloads the chart based on the current period
function navigateDate(direction) {
    const activeChart = document.querySelector('.picker-chart-container.container[style*="display: flex;"]');

    if (activeChart.id.includes('Day')) {
        currentDate.setDate(currentDate.getDate() + direction);
        loadChart('day', 'salesChartDay');
    } else if (activeChart.id.includes('Week')) {
        currentDate.setDate(currentDate.getDate() + (direction * 7));
        loadChart('week', 'salesChartWeek');
    } else if (activeChart.id.includes('Month')) {
        currentDate.setMonth(currentDate.getMonth() + direction);
        loadChart('month', 'salesChartMonth');
    }
}

function loadChart(period, canvasId) {
    const database = firebase.database();
    const salesTimeFramesRef = database.ref('salesTimeFrames');

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const currentUserId = user.uid;

            salesTimeFramesRef.child(currentUserId).on('value', salesSnapshot => {
                const salesData = salesSnapshot.val();
                let chartData = {
                    labels: [],
                    datasets: []
                };

                if (period === 'day') {
                    chartData = getDailyChartData(salesData, currentDate);
                } else if (period === 'week') {
                    chartData = getWeeklyChartData(salesData, currentDate);
                } else if (period === 'month') {
                    chartData = getMonthlyChartData(salesData, currentDate);
                }

                const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
                const textColor = chroma(primaryColor).luminance() < 0.5 ? '#ffffff' : '#000000';

                const ctx = document.getElementById(canvasId).getContext('2d');

                if (salesCharts[canvasId] instanceof Chart) {
                    salesCharts[canvasId].data = chartData;
                    salesCharts[canvasId].options.scales.x.ticks.color = textColor;
                    salesCharts[canvasId].options.scales.y.ticks.color = textColor;
                    salesCharts[canvasId].options.scales.x.ticks.font.size = 24;
                    salesCharts[canvasId].options.scales.y.ticks.font.size = 24;
                    salesCharts[canvasId].options.plugins.legend.labels.color = textColor;
                    salesCharts[canvasId].options.plugins.legend.labels.font.size = 24;
                    salesCharts[canvasId].update();
                } else {
                    salesCharts[canvasId] = new Chart(ctx, {
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
                                        color: 'rgba(255, 255, 255, 0.25)', // White grid lines with 0.25 opacity
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
                                        color: 'rgba(255, 255, 255, 0.25)', // White grid lines with 0.25 opacity
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
                                    borderWidth: 3, // set line width to 3 for thicker lines
                                    fill: 'origin', // fill only the area below
                                    backgroundColor: function(context) {
                                        const color = context.dataset.borderColor;
                                        return hexToRgba(color, 0.1); // reduce fill opacity
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
            }, error => {
                console.error('Error fetching sales data:', error);
            });
        } else {
            console.error('No user is signed in.');
        }
    });
}

function getDailyChartData(salesData, date) {
    const now = date || new Date();
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    let earliestTime = 24; // Start with the latest possible hour
    let latestTime = 0; // Start with the earliest possible hour

    // Find the earliest and latest sale times in the last 30 days
    for (const account in salesData) {
        for (const saleType in salesData[account]) {
            salesData[account][saleType].forEach(saleTime => {
                const saleDate = new Date(saleTime);
                if (saleDate >= thirtyDaysAgo && saleDate <= now) {
                    const saleHour = saleDate.getHours();
                    if (saleHour < earliestTime) earliestTime = saleHour;
                    if (saleHour > latestTime) latestTime = saleHour;
                }
            });
        }
    }

    // Generate time labels based on the earliest and latest times in 12-hour format
    const hours = Array.from({ length: (latestTime - earliestTime + 1) }, (_, i) => {
        let hour = i + earliestTime;
        let period = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12; // Convert to 12-hour format, with 12 instead of 0
        return `${hour} ${period}`;
    });

    const currentDayData = getCurrentDayData(salesData, now);

    const data = {
        labels: hours,
        datasets: createDatasets(hours, currentDayData, 'day')
    };
    return data;
}

function getWeeklyChartData(salesData, date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = date || new Date();
    const firstDayOfWeek = now.getDate() - now.getDay(); // Get the first day of the current week (Sunday)
    const startOfWeek = new Date(now.setDate(firstDayOfWeek)).setHours(0, 0, 0, 0);
    const endOfWeek = new Date(now.setDate(firstDayOfWeek + 6)).setHours(23, 59, 59, 999);

    const currentWeekSales = {};

    for (const account in salesData) {
        currentWeekSales[account] = {};

        for (const saleType in salesData[account]) {
            currentWeekSales[account][saleType] = salesData[account][saleType].filter(saleTime => {
                const saleDate = new Date(saleTime).getTime();
                return saleDate >= startOfWeek && saleDate <= endOfWeek;
            });
        }
    }

    const data = {
        labels: days,
        datasets: createDatasets(days, currentWeekSales, 'week')
    };
    return data;
}

function getMonthlyChartData(salesData, date) {
    const now = date || new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).setHours(0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).setHours(23, 59, 59, 999);
    
    const daysInMonth = Array.from({ length: now.getDate() }, (_, i) => (i + 1).toString());
    const currentMonthData = {};

    for (const account in salesData) {
        currentMonthData[account] = {};

        for (const saleType in salesData[account]) {
            currentMonthData[account][saleType] = salesData[account][saleType].filter(saleTime => {
                const saleDate = new Date(saleTime).getTime();
                return saleDate >= startOfMonth && saleDate <= endOfMonth;
            });
        }
    }

    const data = {
        labels: daysInMonth,
        datasets: createDatasets(daysInMonth, currentMonthData, 'month')
    };
    return data;
}

function getCurrentDayData(salesData, date) {
    const currentDaySales = {};
    const now = date || new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    for (const account in salesData) {
        currentDaySales[account] = {};

        for (const saleType in salesData[account]) {
            currentDaySales[account][saleType] = salesData[account][saleType].filter(saleTime => {
                const saleDate = new Date(saleTime).getTime();
                return saleDate >= startOfDay && saleDate < endOfDay;
            });
        }
    }

    return currentDaySales;
}

function getCurrentWeekData(salesData, date) {
    const currentWeekSales = {};
    const now = date || new Date();
    const firstDayOfWeek = now.getDate() - now.getDay(); // Sunday

    for (const account in salesData) {
        currentWeekSales[account] = {};

        for (const saleType in salesData[account]) {
            currentWeekSales[account][saleType] = salesData[account][saleType].filter(saleTime => {
                const saleDate = new Date(saleTime);
                const dayDifference = Math.floor((saleDate - new Date(saleDate.getFullYear(), saleDate.getMonth(), firstDayOfWeek)) / (1000 * 60 * 60 * 24));
                return dayDifference >= 0 && dayDifference < 7;
            });
        }
    }

    return currentWeekSales;
}

function createDatasets(labels, salesData, period) {
    const datasets = [
        {
            label: 'SPM',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Select Patient Management', label)),
            borderColor: 'rgb(255, 102, 102)', // Red
            backgroundColor: hexToRgba('rgb(255, 102, 102)', 0.25), // Red with 0.25 opacity
            pointBackgroundColor: '#ffffff', // white dots
            pointBorderColor: 'rgb(255, 102, 102)', // border color same as line
            pointBorderWidth: 2,
            fill: 'origin',
            order: 4 // Ensure this dataset is always in front
        },
        {
            label: 'Transfer',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Transfer', label)),
            borderColor: 'rgb(148, 255, 119)', // Keylime
            backgroundColor: hexToRgba('rgb(148, 255, 119)', 0.25), // Keylime with 0.25 opacity
            pointBackgroundColor: '#ffffff', // white dots
            pointBorderColor: 'rgb(148, 255, 119)', // border color same as line
            pointBorderWidth: 2,
            fill: 'origin',
            order: 3 // Ensure this dataset is behind SPM but in front of others
        },
        {
            label: 'HRA',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Billable HRA', label)),
            borderColor: 'rgb(255, 249, 112)', // Yellow
            backgroundColor: hexToRgba('rgb(255, 249, 112)', 0.25), // Yellow with 0.25 opacity
            pointBackgroundColor: '#ffffff', // white dots
            pointBorderColor: 'rgb(255, 249, 112)', // border color same as line
            pointBorderWidth: 2,
            fill: 'origin',
            order: 2 // Ensure this dataset is behind Transfer but in front of SRX
        },
        {
            label: 'SRX',
            data: labels.map(label => getSaleCountForLabel(salesData, period, 'Select RX', label)),
            borderColor: 'rgb(255, 95, 236)', // Magenta
            backgroundColor: hexToRgba('rgb(255, 95, 236)', 0.25), // Magenta with 0.25 opacity
            pointBackgroundColor: '#ffffff', // white dots
            pointBorderColor: 'rgb(255, 95, 236)', // border color same as line
            pointBorderWidth: 2,
            fill: 'origin',
            order: 1 // Ensure this dataset is at the back
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
                const saleHour = saleDate.getHours();
                if (period === 'day' && formatHour(saleDate) === label && saleHour >= 7 && saleHour <= 21) {
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
    return `${hours}:00`;
}
function formatDay(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

function hexToRgba(hex, alpha) {
    const [r, g, b] = hex.match(/\d+/g).map(Number);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Apply color palette to the chart
function applyColorPalette(color) {
    document.documentElement.style.setProperty('--color-primary', color);
    document.documentElement.style.setProperty('--color-secondary', chroma(color).darken(1.5).hex());
    document.documentElement.style.setProperty('--background-color', chroma(color).brighten(3).hex());

    if (salesChart instanceof Chart) {
        const textColor = chroma(color).luminance() < 0.5 ? '#ffffff' : '#000000';
        salesChart.options.scales.x.ticks.color = textColor;
        salesChart.options.scales.y.ticks.color = textColor;
        salesChart.options.plugins.legend.labels.color = textColor;
        salesChart.update();
    }
}

// Save the color palette
function saveColorPalette(color) {
    localStorage.setItem('baseColor', color);
    applyColorPalette(color);
}

// Initialize color picker
document.getElementById('applyColor').addEventListener('click', () => {
    const colorPicker = document.getElementById('colorPicker');
    const selectedColor = colorPicker.value;
    saveColorPalette(selectedColor);
});

window.addEventListener('resize', () => {
    if (salesChart) {
        salesChart.resize();
    }
});

function checkChartHeight() {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(chartContainer => {
        const rotateMessage = chartContainer.querySelector('#rotateMessage');

        if (chartContainer.clientHeight < 300) {
            chartContainer.style.display = 'none';
            rotateMessage.style.display = 'block';
        } else {
            chartContainer.style.display = 'flex';
            rotateMessage.style.display = 'none';
        }
    });
}

window.addEventListener('resize', () => {
    checkChartHeight();
    if (salesChart) {
        salesChart.resize();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    checkChartHeight();
    // Your existing code...
});
