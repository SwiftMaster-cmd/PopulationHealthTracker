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
        const salesRef = database.ref('salesOutcomes/' + user.uid);

        // Listen for real-time updates
        salesRef.on('value', snapshot => {
            const salesData = snapshot.val() ? Object.values(snapshot.val()) : [];

            // Populate action types using predefined options
            const actionTypes = ['Select Patient Management', 'Transfer', 'HRA', 'Select RX'];
            populateActionTypes(actionTypes);

            // Populate time frames
            const timeFrames = ['today', 'currentWeek', 'previousWeek', 'currentMonth', '90days', 'quarter', 'yearToDate', 'allTime'];
            populateTimeFrames(timeFrames);

            // Populate chart types
            const chartTypes = ['bar', 'line', 'pie'];
            populateChartTypes(chartTypes);

            // Set up event listeners
            setupEventListeners(salesData);

            // Load saved charts after sales data is fetched
            loadSavedCharts(salesData);

            // Update existing charts
            updateCharts(salesData);

            // Calculate and display commission
            calculateAndDisplayCommission(salesData);
        });
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

    function populateTimeFrames(timeFrames) {
        const timeFrameSelect = document.getElementById('timeFrame');
        timeFrameSelect.innerHTML = ''; // Clear existing options

        timeFrames.forEach(timeFrame => {
            const option = document.createElement('option');
            option.value = timeFrame;
            option.textContent = timeFrame;
            timeFrameSelect.appendChild(option);
        });
    }

    function populateChartTypes(chartTypes) {
        const chartTypeSelect = document.getElementById('chartType');
        chartTypeSelect.innerHTML = ''; // Clear existing options

        chartTypes.forEach(chartType => {
            const option = document.createElement('option');
            option.value = chartType;
            option.textContent = chartType;
            chartTypeSelect.appendChild(option);
        });
    }

    function setupEventListeners(salesData) {
        const addChartButton = document.getElementById('addChartButton');
        const showChartControlsButton = document.getElementById('showChartControlsButton');
        const hideChartControlsButton = document.getElementById('hideChartControlsButton');

        addChartButton.addEventListener('click', () => {
            addChart(salesData);
        });

        showChartControlsButton.addEventListener('click', () => {
            document.querySelector('.chart-controls').style.display = 'flex';
            showChartControlsButton.style.display = 'none';
        });

        hideChartControlsButton.addEventListener('click', () => {
            document.querySelector('.chart-controls').style.display = 'none';
            showChartControlsButton.style.display = 'inline-block';
        });

        // Commission container click event for popup
        const commissionContainer = document.getElementById('commissionContainer');
        commissionContainer.addEventListener('click', () => {
            showCommissionDetailsPopup();
        });
    }

    function getSaleType(action, notes) {
        const normalizedAction = action.toLowerCase();
        const normalizedNotes = notes.toLowerCase();

        if (/hra/i.test(normalizedAction) || /hra/i.test(normalizedNotes)) {
            if (/billable|bill/i.test(normalizedNotes)) {
                return 'billableHRA';
            } else {
                return 'HRA';
            }
        } else if (
            /(vbc|transfer|ndr|fe|final expense|national|national debt|national debt relief|value based care|oak street|osh)/i.test(normalizedNotes)
        ) {
            return 'transfer';
        } else if (/spm|select patient management/i.test(normalizedAction) || /spm|select patient management/i.test(normalizedNotes)) {
            return 'spm';
        } else if (
            normalizedAction.includes('srx: enrolled - rx history received') ||
            normalizedAction.includes('srx: enrolled - rx history not available') ||
            /select rx/i.test(normalizedAction) ||
            /select rx/i.test(normalizedNotes)
        ) {
            return 'selectRX';
        } else {
            // Exclude other options
            return null;
        }
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
        removeButton.innerHTML = '&times;';
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

        // Create chart content container for scrolling
        const chartContent = document.createElement('div');
        chartContent.classList.add('chart-content');

        // Create canvas for Chart.js
        const canvas = document.createElement('canvas');
        chartContent.appendChild(canvas);

        chartContainer.appendChild(chartContent);

        // Add chart container to the page
        document.querySelector('.charts-container').appendChild(chartContainer);

        // Render the chart
        const chartInstance = renderChart(canvas, chartType, chartData, actionType, timeFrame);

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
            case 'allTime':
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

            // Format the date to exclude the year
            const options = { month: 'short', day: 'numeric' };
            const dateKey = date.toLocaleDateString(undefined, options);

            dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
        });

        // Sort dates
        const sortedDates = Object.keys(dateCounts).sort((a, b) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateA - dateB;
        });

        return {
            labels: sortedDates,
            data: sortedDates.map(date => dateCounts[date])
        };
    }

    function renderChart(canvas, chartType, chartData, actionType, timeFrame) {
        const dataPointCount = chartData.labels.length;

        // Set canvas width dynamically
        const canvasWidth = dataPointCount > 8 ? dataPointCount * 60 : '100%';
        canvas.style.width = typeof canvasWidth === 'number' ? `${canvasWidth}px` : canvasWidth;
        canvas.style.height = '400px'; // Fixed height

        const ctx = canvas.getContext('2d');

        // Generate colors based on data values
        const colors = generateValueBasedColors(chartData.data);

        const chart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: `${actionType} (${timeFrame})`,
                    data: chartData.data,
                    backgroundColor: chartType === 'line' ? 'rgba(75,192,192,0.4)' : colors,
                    borderColor: colors,
                    borderWidth: 2,
                    pointBackgroundColor: chartType === 'line' ? colors : undefined,
                    fill: chartType === 'line', // Fill area under the line for line charts
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        bottom: 20,
                    },
                },
                scales: chartType !== 'pie' ? {
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            color: '#ffffff',
                            font: {
                                family: 'Inter',
                                size: 16,
                                weight: '500',
                            },
                        },
                        ticks: {
                            color: '#ffffff',
                            font: {
                                family: 'Inter',
                                size: 14,
                            },
                            autoSkip: dataPointCount > 15,
                            maxTicksLimit: dataPointCount > 15 ? Math.floor(dataPointCount / 2) : undefined,
                            callback: function(value, index, values) {
                                if (dataPointCount > 15 && index % 2 !== 0) {
                                    return null;
                                }
                                return this.getLabelForValue(value);
                            },
                        },
                        grid: {
                            display: false,
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Count',
                            color: '#ffffff',
                            font: {
                                family: 'Inter',
                                size: 16,
                                weight: '500',
                            },
                        },
                        ticks: {
                            color: '#ffffff',
                            font: {
                                family: 'Inter',
                                size: 14,
                            },
                            beginAtZero: true,
                            precision: 0,
                        },
                        grid: {
                            color: '#444444',
                        },
                    },
                } : {},
                plugins: {
                    legend: {
                        display: chartType !== 'pie',
                        labels: {
                            color: '#ffffff',
                            font: {
                                family: 'Inter',
                                size: 14,
                            },
                        },
                    },
                    tooltip: {
                        backgroundColor: '#2e2e2e',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#444444',
                        borderWidth: 1,
                        titleFont: {
                            family: 'Inter',
                            size: 14,
                            weight: '500',
                        },
                        bodyFont: {
                            family: 'Inter',
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
                // Custom properties for updating charts
                custom: {
                    timeFrame: timeFrame,
                    actionType: actionType
                }
            },
        });

        return chart;
    }

    function generateValueBasedColors(data) {
        const maxValue = Math.max(...data);
        const minValue = Math.min(...data);

        return data.map(value => {
            const ratio = (value - minValue) / (maxValue - minValue || 1); // Avoid division by zero
            // Create a gradient from red to green
            const color = chroma.scale(['red', 'orange', 'green'])(ratio).hex();
            return color;
        });
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

        charts.forEach(chartWrapper => {
            const canvas = chartWrapper.querySelector('canvas');
            const chartInstance = Chart.getChart(canvas);

            const chartConfig = {
                timeFrame: chartInstance.options.custom.timeFrame,
                actionType: chartInstance.options.custom.actionType,
                chartType: chartInstance.config.type
            };
            savedCharts.push(chartConfig);
        });

        localStorage.setItem('savedCharts', JSON.stringify(savedCharts));
    }

    function loadSavedCharts(salesData) {
        const savedCharts = JSON.parse(localStorage.getItem('savedCharts')) || [];

        // Clear existing charts to avoid duplicates
        document.querySelector('.charts-container').innerHTML = '';

        // Add saved charts
        savedCharts.forEach(chartConfig => {
            addChart(salesData, chartConfig);
        });
    }

    function updateCharts(salesData) {
        // Update all charts with new data
        const charts = document.querySelectorAll('.chart-wrapper');
        charts.forEach(chartWrapper => {
            const canvas = chartWrapper.querySelector('canvas');
            const chartInstance = Chart.getChart(canvas);

            const totalCountDisplay = chartWrapper.querySelector('.total-count-display');
            const chartConfig = {
                timeFrame: chartInstance.options.custom.timeFrame,
                actionType: chartInstance.options.custom.actionType,
                chartType: chartInstance.config.type
            };

            // Filter data based on time frame and actionType
            const filteredData = filterSalesData(salesData, chartConfig.timeFrame, chartConfig.actionType);

            // Prepare data for the chart
            const chartData = prepareChartData(filteredData, chartConfig.timeFrame);

            // Update total count
            const totalCount = filteredData.length;
            totalCountDisplay.textContent = `${chartConfig.actionType} (${chartConfig.timeFrame}) - Total Count: ${totalCount}`;

            // Generate new colors based on updated data
            const colors = generateValueBasedColors(chartData.data);

            // Update chart data
            chartInstance.data.labels = chartData.labels;
            chartInstance.data.datasets[0].data = chartData.data;
            chartInstance.data.datasets[0].backgroundColor = chartConfig.chartType === 'line' ? 'rgba(75,192,192,0.4)' : colors;
            chartInstance.data.datasets[0].borderColor = colors;
            chartInstance.data.datasets[0].pointBackgroundColor = chartConfig.chartType === 'line' ? colors : undefined;
            chartInstance.update();
        });

        // Update commission display
        calculateAndDisplayCommission(salesData);
    }

    // Commission Calculation Functions

    function calculateAndDisplayCommission(salesData) {
        // Calculate sales totals for current month
        const salesTotals = calculateSalesTotals(salesData);

        // Assuming level is provided or determined elsewhere
        const level = getUserLevel(); // Implement this function as needed

        // Calculate commission
        const commission = calculateCommission(salesTotals, level);

        // Display commission
        displayCommission(commission, salesTotals);
    }

    function calculateSalesTotals(salesData) {
        const salesTotals = {
            selectRX: 0,
            transfer: 0,
            billableHRA: 0,
            spm: 0
        };

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startTime = startOfMonth.getTime();
        const endTime = now.getTime();

        salesData.forEach(sale => {
            const saleTime = new Date(sale.outcomeTime).getTime();
            if (saleTime >= startTime && saleTime <= endTime) {
                const saleType = getSaleType(sale.assignAction || '', sale.notesValue || '');
                if (saleType && saleType in salesTotals) {
                    salesTotals[saleType]++;
                }
            }
        });

        return salesTotals;
    }

    function calculateCommission(salesTotals, level) {
        let srxPayout;
        let transferPayout;
        let hraPayout;
        let spmPayout = 11;  // Example value, adjust accordingly

        if (level === 3) {
            srxPayout = getPayout(salesTotals.selectRX, [
                { min: 75, max: Infinity, payout: 17.00 },
                { min: 65, max: 74, payout: 16.50 },
                { min: 30, max: 64, payout: 16.00 },
                { min: 15, max: 29, payout: 15.50 },
                { min: 0, max: 14, payout: 15.00 }
            ]);
            transferPayout = getPayout(salesTotals.transfer, [
                { min: 50, max: Infinity, payout: 11.00 },
                { min: 35, max: 49, payout: 10.00 },
                { min: 20, max: 34, payout: 9.00 },
                { min: 10, max: 19, payout: 8.00 },
                { min: 0, max: 9, payout: 7.00 }
            ]);
            hraPayout = getPayout(salesTotals.billableHRA, [
                { min: 50, max: Infinity, payout: 6.00 },
                { min: 35, max: 49, payout: 5.00 },
                { min: 20, max: 34, payout: 4.00 },
                { min: 10, max: 19, payout: 3.00 },
                { min: 0, max: 9, payout: 2.00 }
            ]);
        } else if (level === 2) {
            srxPayout = getPayout(salesTotals.selectRX, [
                { min: 75, max: Infinity, payout: 18.00 },
                { min: 65, max: 74, payout: 17.50 },
                { min: 30, max: 64, payout: 17.00 },
                { min: 15, max: 29, payout: 16.50 },
                { min: 0, max: 14, payout: 16.00 }
            ]);
            transferPayout = getPayout(salesTotals.transfer, [
                { min: 40, max: Infinity, payout: 10.00 },
                { min: 30, max: 39, payout: 9.25 },
                { min: 15, max: 29, payout: 8.50 },
                { min: 10, max: 14, payout: 7.75 },
                { min: 0, max: 9, payout: 7.00 }
            ]);
            hraPayout = getPayout(salesTotals.billableHRA, [
                { min: 45, max: Infinity, payout: 5.00 },
                { min: 30, max: 44, payout: 4.25 },
                { min: 20, max: 29, payout: 3.50 },
                { min: 10, max: 19, payout: 2.75 },
                { min: 0, max: 9, payout: 2.00 }
            ]);
        } else if (level === 1) {
            srxPayout = getPayout(salesTotals.selectRX, [
                { min: 75, max: Infinity, payout: 19.00 },
                { min: 65, max: 74, payout: 18.50 },
                { min: 30, max: 64, payout: 18.00 },
                { min: 15, max: 29, payout: 17.50 },
                { min: 0, max: 14, payout: 17.00 }
            ]);
            transferPayout = getPayout(salesTotals.transfer, [
                { min: 25, max: Infinity, payout: 8.00 },
                { min: 20, max: 24, payout: 7.50 },
                { min: 10, max: 19, payout: 7.00 },
                { min: 5, max: 9, payout: 6.50 },
                { min: 0, max: 4, payout: 6.00 }
            ]);
            hraPayout = getPayout(salesTotals.billableHRA, [
                { min: 40, max: Infinity, payout: 4.00 },
                { min: 30, max: 39, payout: 3.50 },
                { min: 15, max: 29, payout: 3.00 },
                { min: 5, max: 14, payout: 2.50 },
                { min: 0, max: 4, payout: 2.00 }
            ]);
        }

        // Calculate total commissions
        const totalCommission = (
            (salesTotals.selectRX * srxPayout) +
            (salesTotals.transfer * transferPayout) +
            (salesTotals.billableHRA * hraPayout) +
            (salesTotals.spm * spmPayout)
        );

        return { srxPayout, transferPayout, hraPayout, spmPayout, totalCommission };
    }

    function getPayout(count, tiers) {
        for (let tier of tiers) {
            if (count >= tier.min && count <= tier.max) {
                return tier.payout;
            }
        }
        return 0;
    }

    function displayCommission(commission, salesTotals) {
        const commissionContainer = document.getElementById('commissionContainer');
        commissionContainer.innerHTML = `
            <p>Total Commission: $${commission.totalCommission.toFixed(2)}</p>
        `;
    }

    function showCommissionDetailsPopup() {
        const commissionDetailsPopup = document.getElementById('commissionDetailsPopup');
        const popupContent = commissionDetailsPopup.querySelector('.popup-content');

        // Populate popupContent with commission details
        popupContent.innerHTML = `
            <h2>Commission Breakdown</h2>
            <p>Select RX (${salesTotals.selectRX} sales): $${(salesTotals.selectRX * commission.srxPayout).toFixed(2)}</p>
            <p>Transfer (${salesTotals.transfer} sales): $${(salesTotals.transfer * commission.transferPayout).toFixed(2)}</p>
            <p>Billable HRA (${salesTotals.billableHRA} sales): $${(salesTotals.billableHRA * commission.hraPayout).toFixed(2)}</p>
            <p>SPM (${salesTotals.spm} sales): $${(salesTotals.spm * commission.spmPayout).toFixed(2)}</p>
        `;

        commissionDetailsPopup.style.display = 'flex';

        // Close the popup when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === commissionDetailsPopup) {
                commissionDetailsPopup.style.display = 'none';
            }
        });
    }

    function getUserLevel() {
        // Implement logic to retrieve the user's level
        // For example, you could store the level in the user's profile in Firebase
        // Here, we'll assume level 1 for demonstration purposes
        return 1; // Example level
    }
});
