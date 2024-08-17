document.addEventListener('DOMContentLoaded', () => {
    changeChart('day'); // Load the default chart (day)
    loadColorPalette();
    checkChartHeight();
});

function loadColorPalette() {
    const savedColor = localStorage.getItem('baseColor');
    if (savedColor) {
        applyColorPalette(savedColor);
    } else {
        const defaultColor = getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim();
        applyColorPalette(defaultColor);
    }
}

function changeChart(period) {
    const chartIds = ['Day', 'Week', 'Month'];
    const selectedChartId = `chartContainer${capitalize(period)}`;

    chartIds.forEach(id => {
        const container = document.getElementById(`chartContainer${id}`);
        container.style.display = (`chartContainer${id}` === selectedChartId) ? 'flex' : 'none';
    });

    loadChart(period, `salesChart${capitalize(period)}`);
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

let salesCharts = {};

function loadChart(period, canvasId) {
    const database = firebase.database();
    const salesTimeFramesRef = database.ref('salesTimeFrames');

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const currentUserId = user.uid;

            salesTimeFramesRef.child(currentUserId).on('value', salesSnapshot => {
                const salesData = salesSnapshot.val();
                const chartData = getChartData(period, salesData);
                const ctx = document.getElementById(canvasId).getContext('2d');

                updateChart(canvasId, chartData, ctx);
            }, error => {
                console.error('Error fetching sales data:', error);
            });
        } else {
            console.error('No user is signed in.');
        }
    });
}

function getChartData(period, salesData) {
    if (period === 'day') return getDailyChartData(salesData);
    if (period === 'week') return getWeeklyChartData(salesData);
    if (period === 'month') return getMonthlyChartData(salesData);
    return { labels: [], datasets: [] };
}

function updateChart(canvasId, chartData, ctx) {
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    const textColor = chroma(primaryColor).luminance() < 0.5 ? '#ffffff' : '#000000';

    if (salesCharts[canvasId] instanceof Chart) {
        salesCharts[canvasId].data = chartData;
        updateChartOptions(salesCharts[canvasId], textColor);
        salesCharts[canvasId].update();
    } else {
        salesCharts[canvasId] = new Chart(ctx, getChartConfig(chartData, textColor));
    }
}

function updateChartOptions(chart, textColor) {
    chart.options.scales.x.ticks.color = textColor;
    chart.options.scales.y.ticks.color = textColor;
    chart.options.scales.x.ticks.font.size = 24;
    chart.options.scales.y.ticks.font.size = 24;
    chart.options.plugins.legend.labels.color = textColor;
    chart.options.plugins.legend.labels.font.size = 24;
}

function getChartConfig(chartData, textColor) {
    return {
        type: 'line',
        data: chartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, font: { size: 24 } },
                    grid: { color: 'rgba(255, 255, 255, 0.25)', lineWidth: 1 }
                },
                x: {
                    ticks: { color: textColor, font: { size: 24, family: 'Arial', weight: 'bold' } },
                    grid: { color: 'rgba(255, 255, 255, 0.25)', lineWidth: 1 }
                }
            },
            plugins: {
                legend: {
                    labels: { color: textColor, font: { size: 24 } }
                }
            },
            elements: {
                line: {
                    tension: 0.4, borderWidth: 3, fill: 'origin',
                    backgroundColor: context => hexToRgba(context.dataset.borderColor, 0.1)
                },
                point: {
                    backgroundColor: '#ffffff',
                    borderColor: context => context.dataset.borderColor,
                    borderWidth: 2
                }
            }
        }
    };
}

function getDailyChartData(salesData) {
    const { earliestTime, latestTime } = getSalesTimeRange(salesData, 30);
    const hours = generateTimeLabels(earliestTime, latestTime);
    const currentDayData = getCurrentDayData(salesData);

    return {
        labels: hours,
        datasets: createDatasets(hours, currentDayData, 'day')
    };
}

function getSalesTimeRange(salesData, daysAgo) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
    let earliestTime = 24, latestTime = 0;

    Object.values(salesData).forEach(account => {
        Object.values(account).forEach(sales => {
            sales.forEach(saleTime => {
                const saleDate = new Date(saleTime);
                if (saleDate >= startDate && saleDate <= now) {
                    const saleHour = saleDate.getHours();
                    if (saleHour < earliestTime) earliestTime = saleHour;
                    if (saleHour > latestTime) latestTime = saleHour;
                }
            });
        });
    });

    return { earliestTime, latestTime };
}

function generateTimeLabels(earliestTime, latestTime) {
    return Array.from({ length: (latestTime - earliestTime + 1) }, (_, i) => {
        let hour = i + earliestTime;
        let period = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${hour} ${period}`;
    });
}

function getWeeklyChartData(salesData) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentWeekSales = filterSalesByDateRange(salesData, getWeekDateRange());

    return {
        labels: days,
        datasets: createDatasets(days, currentWeekSales, 'week')
    };
}

function getMonthlyChartData(salesData) {
    const now = new Date();
    const daysInMonth = Array.from({ length: now.getDate() }, (_, i) => (i + 1).toString());
    const currentMonthData = filterSalesByDateRange(salesData, getMonthDateRange());

    return {
        labels: daysInMonth,
        datasets: createDatasets(daysInMonth, currentMonthData, 'month')
    };
}

function getWeekDateRange() {
    const now = new Date();
    const firstDayOfWeek = now.getDate() - now.getDay();
    const startOfWeek = new Date(now.setDate(firstDayOfWeek)).setHours(0, 0, 0, 0);
    const endOfWeek = new Date(now.setDate(firstDayOfWeek + 6)).setHours(23, 59, 59, 999);
    return { startOfWeek, endOfWeek };
}

function getMonthDateRange() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).setHours(0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).setHours(23, 59, 59, 999);
    return { startOfMonth, endOfMonth };
}

function filterSalesByDateRange(salesData, { startOfWeek, endOfWeek }) {
    const filteredSales = {};
    for (const account in salesData) {
        filteredSales[account] = {};
        for (const saleType in salesData[account]) {
            filteredSales[account][saleType] = salesData[account][saleType].filter(saleTime => {
                const saleDate = new Date(saleTime).getTime();
                return saleDate >= startOfWeek && saleDate <= endOfWeek;
            });
        }
    }
    return filteredSales;
}

function getCurrentDayData(salesData) {
    return filterSalesByDateRange(salesData, getDayDateRange());
}

function getDayDateRange() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    return { startOfDay, endOfDay };
}

function createDatasets(labels, salesData, period) {
    const datasets = ['SPM', 'Transfer', 'HRA', 'SRX'].map((saleType, index) => {
        const colors = ['rgb(255, 102, 102)', 'rgb(148, 255, 119)', 'rgb(255, 249, 112)', 'rgb(255, 95, 236)'];
        return {
            label: saleType,
            data: labels.map(label => getSaleCountForLabel(salesData, period, saleType, label)),
            borderColor: colors[index],
            backgroundColor: hexToRgba(colors[index], 0.25),
            pointBackgroundColor: '#ffffff',
            pointBorderColor: colors[index],
            pointBorderWidth: 2,
            fill: 'origin',
            order: 4 - index
        };
    });

    return datasets;
}

function getSaleCountForLabel(salesData, period, saleType, label) {
    let count = 0;

    for (const account in salesData) {
        const sales = salesData[account][saleType];
        if (sales) {
            sales.forEach(saleTime => {
                const saleDate = new Date(saleTime);
                if ((period === 'day' && formatHour(saleDate) === label && saleDate.getHours() >= 7 && saleDate.getHours() <= 21) ||
                    (period === 'week' && formatDay(saleDate) === label) ||
                    (period === 'month' && saleDate.getDate().toString() === label)) {
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
    return `rgba(${r}, ${b}, ${b}, ${alpha})`;
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

document.getElementById('applyColor').addEventListener('click', () => {
    const colorPicker = document.getElementById('colorPicker');
    saveColorPalette(colorPicker.value);
});

function saveColorPalette(color) {
    localStorage.setItem('baseColor', color);
    applyColorPalette(color);
}

window.addEventListener('resize', () => {
    if (salesChart) salesChart.resize();
    checkChartHeight();
});

function checkChartHeight() {
    document.querySelectorAll('.chart-container').forEach(chartContainer => {
        const rotateMessage = chartContainer.querySelector('#rotateMessage');
        const shouldRotate = chartContainer.clientHeight < 300;

        chartContainer.style.display = shouldRotate ? 'none' : 'flex';
        rotateMessage.style.display = shouldRotate ? 'block' : 'none';
    });
}
