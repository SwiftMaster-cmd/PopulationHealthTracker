document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadAllCharts();
    loadSavedColorPalette();
    addResizeListeners();
}

function loadAllCharts() {
    loadChart('day', 'salesChartDay');
    loadChart('week', 'salesChartWeek');
    loadChart('month', 'salesChartMonth');
}

function loadSavedColorPalette() {
    const savedColor = localStorage.getItem('baseColor');
    const defaultColor = getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim();
    applyColorPalette(savedColor || defaultColor);
}

function addResizeListeners() {
    window.addEventListener('resize', () => {
        resizeCharts();
        checkChartHeight();
    });
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
                let chartData = getChartDataForPeriod(period, salesData);

                const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
                const textColor = chroma(primaryColor).luminance() < 0.5 ? '#ffffff' : '#000000';

                const ctx = document.getElementById(canvasId).getContext('2d');

                if (salesCharts[canvasId] instanceof Chart) {
                    updateExistingChart(canvasId, chartData, textColor);
                } else {
                    createNewChart(ctx, canvasId, chartData, textColor);
                }
            }, error => {
                console.error('Error fetching sales data:', error);
            });
        } else {
            console.error('No user is signed in.');
        }
    });
}

function getChartDataForPeriod(period, salesData) {
    switch (period) {
        case 'day': return getDailyChartData(salesData);
        case 'week': return getWeeklyChartData(salesData);
        case 'month': return getMonthlyChartData(salesData);
        default: return { labels: [], datasets: [] };
    }
}

function updateExistingChart(canvasId, chartData, textColor) {
    const chart = salesCharts[canvasId];
    chart.data = chartData;
    applyChartTextStyle(chart, textColor);
    chart.update();
}

function createNewChart(ctx, canvasId, chartData, textColor) {
    salesCharts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            scales: getChartScales(textColor),
            plugins: { legend: { display: false } },
            elements: getChartElements()
        }
    });
}

function getChartScales(textColor) {
    return {
        y: getChartAxisOptions(textColor),
        x: getChartAxisOptions(textColor)
    };
}

function getChartAxisOptions(textColor) {
    return {
        beginAtZero: true,
        ticks: {
            color: textColor,
            font: { size: 24 }
        },
        grid: {
            color: 'rgba(255, 255, 255, 0.25)',
            lineWidth: 1
        }
    };
}

function getChartElements() {
    return {
        line: {
            tension: 0.4,
            borderWidth: 3,
            fill: 'origin',
            backgroundColor: context => hexToRgba(context.dataset.borderColor, 0.1)
        },
        point: {
            backgroundColor: '#ffffff',
            borderColor: context => context.dataset.borderColor,
            borderWidth: 2
        }
    };
}

function getDailyChartData(salesData) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    const { earliestTime, latestTime } = getEarliestAndLatestTimes(salesData, thirtyDaysAgo, now);
    const hours = generateTimeLabels(earliestTime, latestTime);
    const currentDayData = filterSalesDataByTimeRange(salesData, thirtyDaysAgo.getTime(), now.getTime());

    return {
        labels: hours,
        datasets: createDatasets(hours, currentDayData, 'day')
    };
}

function getWeeklyChartData(salesData) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const firstDayOfWeek = now.getDate() - now.getDay();
    const startOfWeek = new Date(now.setDate(firstDayOfWeek)).setHours(0, 0, 0, 0);
    const endOfWeek = new Date(now.setDate(firstDayOfWeek + 6)).setHours(23, 59, 59, 999);
    const currentWeekData = filterSalesDataByTimeRange(salesData, startOfWeek, endOfWeek);

    return {
        labels: days,
        datasets: createDatasets(days, currentWeekData, 'week')
    };
}

function getMonthlyChartData(salesData) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).setHours(0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).setHours(23, 59, 59, 999);
    const daysInMonth = Array.from({ length: now.getDate() }, (_, i) => (i + 1).toString());
    const currentMonthData = filterSalesDataByTimeRange(salesData, startOfMonth, endOfMonth);

    return {
        labels: daysInMonth,
        datasets: createDatasets(daysInMonth, currentMonthData, 'month')
    };
}

function getEarliestAndLatestTimes(salesData, startDate, endDate) {
    let earliestTime = 24;
    let latestTime = 0;

    Object.values(salesData).forEach(accountData => {
        Object.values(accountData).forEach(sales => {
            sales.forEach(saleTime => {
                const saleDate = new Date(saleTime);
                if (saleDate >= startDate && saleDate <= endDate) {
                    const saleHour = saleDate.getHours();
                    earliestTime = Math.min(earliestTime, saleHour);
                    latestTime = Math.max(latestTime, saleHour);
                }
            });
        });
    });

    return { earliestTime, latestTime };
}

function generateTimeLabels(earliestTime, latestTime) {
    return Array.from({ length: (latestTime - earliestTime + 1) }, (_, i) => {
        let hour = i + earliestTime;
        const period = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${hour} ${period}`;
    });
}

function filterSalesDataByTimeRange(salesData, startTime, endTime) {
    const filteredData = {};

    Object.entries(salesData).forEach(([account, accountData]) => {
        filteredData[account] = {};

        Object.entries(accountData).forEach(([saleType, sales]) => {
            filteredData[account][saleType] = sales.filter(saleTime => {
                const saleDate = new Date(saleTime).getTime();
                return saleDate >= startTime && saleDate <= endTime;
            });
        });
    });

    return filteredData;
}

function createDatasets(labels, salesData, period) {
    const saleTypes = [
        { label: 'SPM', color: 'rgb(255, 102, 102)' }, // Red
        { label: 'Transfer', color: 'rgb(148, 255, 119)' }, // Keylime
        { label: 'HRA', color: 'rgb(255, 249, 112)' }, // Yellow
        { label: 'SRX', color: 'rgb(255, 95, 236)' } // Magenta
    ];

    return saleTypes.map(({ label, color }) => ({
        label,
        data: labels.map(lbl => getSaleCountForLabel(salesData, period, label, lbl)),
        borderColor: color,
        backgroundColor: hexToRgba(color, 0.25),
        pointBackgroundColor: '#ffffff',
        pointBorderColor: color,
        pointBorderWidth: 2,
        fill: 'origin',
        order: 4 - saleTypes.findIndex(s => s.label === label) // Ensure ordering based on label
    }));
}

function getSaleCountForLabel(salesData, period, saleType, label) {
    let count = 0;

    Object.values(salesData).forEach(accountData => {
        const sales = accountData[saleType];
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
    });

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

function applyColorPalette(color) {
    document.documentElement.style.setProperty('--color-primary', color);
    document.documentElement.style.setProperty('--color-secondary', chroma(color).darken(1.5).hex());
    document.documentElement.style.setProperty('--background-color', chroma(color).brighten(3).hex());

    resizeCharts();
}

function saveColorPalette(color) {
    localStorage.setItem('baseColor', color);
    applyColorPalette(color);
}

document.getElementById('applyColor').addEventListener('click', () => {
    const colorPicker = document.getElementById('colorPicker');
    const selectedColor = colorPicker.value;
    saveColorPalette(selectedColor);
});

function resizeCharts() {
    Object.values(salesCharts).forEach(chart => chart.resize());
}

function checkChartHeight() {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(chartContainer => {
        const rotateMessage = chartContainer.querySelector('#rotateMessage');
        const isHeightTooSmall = chartContainer.clientHeight < 300;
        chartContainer.style.display = isHeightTooSmall ? 'none' : 'flex';
        rotateMessage.style.display = isHeightTooSmall ? 'block' : 'none';
    });
}
