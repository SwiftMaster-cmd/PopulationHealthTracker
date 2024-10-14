// dashboard.js

document.addEventListener('firebaseInitialized', function() {
    const auth = firebase.auth();
    const database = firebase.database();

    auth.onAuthStateChanged(user => {
        if (user) {
            initializeDashboard(user);
        }
    });

    function initializeDashboard(user) {
        fetchSalesData(user).then(salesData => {
            // Populate action types using predefined options
            const actionTypes = ['Select Patient Management', 'Transfer', 'HRA', 'Select RX'];
            populateActionTypes(actionTypes);

            // Set up event listeners
            document.getElementById('addChartButton').addEventListener('click', () => {
                addChart(salesData);
            });

            // Load saved charts after sales data is fetched
            loadSavedCharts(salesData);
        }).catch(error => {
            console.error('Error fetching sales data:', error);
        });
    }

    function fetchSalesData(user) {
        return new Promise((resolve, reject) => {
            const salesRef = database.ref('salesOutcomes/' + user.uid);
            salesRef.once('value', snapshot => {
                const data = snapshot.val();
                if (data) {
                    // Convert data to an array
                    const salesData = Object.values(data);
                    resolve(salesData);
                } else {
                    resolve([]);
                }
            }).catch(error => {
                reject(error);
            });
        });
    }

    // getSaleType function remains the same
    function getSaleType(action, notes) {
        const normalizedAction = action.toLowerCase();
        const normalizedNotes = notes.toLowerCase();

        if (/hra/i.test(normalizedAction) || /hra/i.test(normalizedNotes)) {
            return 'HRA';
        } else if (
            /(vbc|transfer|ndr|fe|final expense|national|national debt|national debt relief|value based care|oak street|osh)/i.test(normalizedNotes)
        ) {
            return 'Transfer';
        } else if (/spm|select patient management/i.test(normalizedAction) || /spm|select patient management/i.test(normalizedNotes)) {
            return 'Select Patient Management';
        } else if (
            normalizedAction.includes('srx: enrolled - rx history received') ||
            normalizedAction.includes('srx: enrolled - rx history not available') ||
            /select rx/i.test(normalizedAction) ||
            /select rx/i.test(normalizedNotes)
        ) {
            return 'Select RX';
        } else {
            // Exclude other options
            return null;
        }
    }

    function getUniqueActionTypes(salesData) {
        // We already have predefined action types
        return ['Select Patient Management', 'Transfer', 'HRA', 'Select RX'];
    }

    function populateActionTypes(actionTypes) {
        const actionTypeSelect = document.getElementById('actionType');
        actionTypeSelect.innerHTML = ''; // Clear existing options

        actionTypes.forEach(actionType => {
            const option = document.createElement('option');
            option.value = actionType;
            option.textContent = actionType;
            actionTypeSelect.appendChild(option);
        });
    }

    function addChart(salesData, chartConfig = null) {
        let timeFrame, actionType, chartType;

        if (chartConfig) {
            // Use provided chart configuration (from saved settings)
            timeFrame = chartConfig.timeFrame;
            actionType = chartConfig.actionType;
            chartType = chartConfig.chartType;
        } else {
            // Get values from UI
            timeFrame = document.getElementById('timeFrame').value;
            actionType = document.getElementById('actionType').value;
            chartType = document.getElementById('chartType').value;

            // Save the chart configuration
            saveChartConfig({ timeFrame, actionType, chartType });
        }

        // Filter data based on time frame and action type
        const filteredData = filterSalesData(salesData, timeFrame, actionType);

        // Prepare data for the chart
        const chartData = prepareChartData(filteredData, timeFrame);

        // Calculate total count
        const totalCount = filteredData.length;

        // Create chart container
        const chartContainer = document.createElement('div');
        chartContainer.classList.add('chart-wrapper');

        // Add a remove button
        const removeButton = document.createElement('button');
        removeButton.textContent = '×';
        removeButton.classList.add('remove-chart-button');
        removeButton.addEventListener('click', () => {
            chartContainer.remove();
            saveChartsToLocalStorage();
        });
        chartContainer.appendChild(removeButton);

        // Add total count display
        const totalCountDisplay = document.createElement('div');
        totalCountDisplay.classList.add('total-count-display');
        totalCountDisplay.textContent = `${actionType} (${timeFrame}) - Total Count: ${totalCount}`;
        chartContainer.appendChild(totalCountDisplay);

        // Create canvas for Chart.js
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);

        // Add chart container to the page
        document.querySelector('.charts-container').appendChild(chartContainer);

        // Render the chart
        renderChart(canvas, chartType, chartData, actionType, timeFrame);

        // Save charts to localStorage
        saveChartsToLocalStorage();
    }

    function filterSalesData(salesData, timeFrame, actionType) {
        const now = new Date();
        let startDate = new Date();

        // Determine start date based on time frame
        switch (timeFrame) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'currentWeek':
                const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
                startDate = new Date(now);
                startDate.setDate(now.getDate() - dayOfWeek);
                break;
            case 'previousWeek':
                const previousWeekStart = new Date(now);
                const prevWeekDayOfWeek = now.getDay();
                previousWeekStart.setDate(now.getDate() - prevWeekDayOfWeek - 7);
                startDate = previousWeekStart;
                now.setDate(previousWeekStart.getDate() + 6);
                break;
            case 'currentMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case '90days':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 90);
                break;
            case 'quarter':
                const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
                startDate = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
                break;
            case 'yearToDate':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(0); // All time
        }

        // Convert dates to timestamps
        const startTime = startDate.getTime();
        const endTime = now.getTime();

        // Filter data
        return salesData.filter(sale => {
            const saleTime = new Date(sale.outcomeTime).getTime();
            const saleType = getSaleType(sale.assignAction || '', sale.notesValue || '');
            return saleType === actionType && saleTime >= startTime && saleTime <= endTime;
        });
    }

    function prepareChartData(filteredData, timeFrame) {
        // Group data by date
        const dateCounts = {};

        filteredData.forEach(sale => {
            const date = new Date(sale.outcomeTime);

            // Format the date to be more readable
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            const dateKey = date.toLocaleDateString(undefined, options);

            dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
        });

        // Sort dates
        const sortedDates = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b));

        return {
            labels: sortedDates,
            data: sortedDates.map(date => dateCounts[date])
        };
    }
// dashboard.js

// ... [other code remains the same]

function renderChart(canvas, chartType, chartData, actionType, timeFrame) {
    // Set fixed dimensions for the canvas
    canvas.style.width = '100%';
    canvas.style.height = '400px'; // Fixed height

    const ctx = canvas.getContext('2d');

    const chart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: chartData.labels,
            datasets: [{
                label: `${actionType} (${timeFrame})`,
                data: chartData.data,
                backgroundColor: chartType === 'pie' ? generateColors(chartData.data.length) : '#007bff',
                borderColor: '#0056b3',
                borderWidth: 2,
                hoverBackgroundColor: '#0056b3',
                hoverBorderColor: '#003f7f',
                fill: chartType === 'line', // Fill area under the line for line charts
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to fill the fixed container size
            scales: chartType !== 'pie' ? {
                x: {
                    title: {
                        display: true,
                        text: 'Date',
                        color: '#555',
                        font: {
                            family: 'Roboto',
                            size: 14,
                            weight: '500',
                        },
                    },
                    ticks: {
                        color: '#555',
                        font: {
                            family: 'Roboto',
                            size: 12,
                        },
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 45,
                    },
                    grid: {
                        display: false,
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Count',
                        color: '#555',
                        font: {
                            family: 'Roboto',
                            size: 14,
                            weight: '500',
                        },
                    },
                    ticks: {
                        color: '#555',
                        font: {
                            family: 'Roboto',
                            size: 12,
                        },
                        beginAtZero: true,
                        precision: 0,
                    },
                    grid: {
                        color: '#e0e0e0',
                    },
                },
            } : {},
            plugins: {
                legend: {
                    display: chartType !== 'pie',
                    labels: {
                        color: '#555',
                        font: {
                            family: 'Roboto',
                            size: 14,
                        },
                    },
                },
                tooltip: {
                    backgroundColor: '#fff',
                    titleColor: '#333',
                    bodyColor: '#555',
                    borderColor: '#ccc',
                    borderWidth: 1,
                    titleFont: {
                        family: 'Roboto',
                        size: 14,
                        weight: '500',
                    },
                    bodyFont: {
                        family: 'Roboto',
                        size: 12,
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            if (chartType === 'pie') {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.parsed;
                                const percentage = ((value / total) * 100).toFixed(2) + '%';
                                return `${label}: ${value} (${percentage})`;
                            } else {
                                return `${label}: ${context.parsed.y}`;
                            }
                        }
                    },
                },
            },
        },
    });
}


    function generateColors(count) {
        const colors = [];
        const scale = chroma.scale(['#007bff', '#00c851', '#ff4444']).mode('lch').colors(count);
        return scale;
    }

    // Persistence Functions

    function saveChartConfig(chartConfig) {
        let savedCharts = JSON.parse(localStorage.getItem('savedCharts')) || [];
        savedCharts.push(chartConfig);
        localStorage.setItem('savedCharts', JSON.stringify(savedCharts));
    }

    function saveChartsToLocalStorage() {
        const charts = document.querySelectorAll('.chart-wrapper');
        const savedCharts = [];

        charts.forEach(chart => {
            const chartConfig = {
                timeFrame: chart.querySelector('.total-count-display').textContent.match(/\(([^)]+)\)/)[1],
                actionType: chart.querySelector('.total-count-display').textContent.split('(')[0].trim(),
                chartType: chart.querySelector('canvas').chartInstance.config.type
            };
            savedCharts.push(chartConfig);
        });

        localStorage.setItem('savedCharts', JSON.stringify(savedCharts));
    }

    function loadSavedCharts(salesData) {
        const savedCharts = JSON.parse(localStorage.getItem('savedCharts')) || [];

        // Add saved charts
        savedCharts.forEach(chartConfig => {
            addChart(salesData, chartConfig);
        });
    }
});
