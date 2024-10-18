// dashboard.js

document.addEventListener('firebaseInitialized', function() {
    const auth = firebase.auth();
    const database = firebase.database();

    // Get references to DOM elements
    const toggleChartControlsButton = document.getElementById('toggleChartControlsButton');
    const filterContainer = document.querySelector('.filter-container');
    const addChartButton = document.getElementById('addChartButton');
    const teamFilter = document.getElementById('teamFilter');

    // New elements for presets
    const presetNameInput = document.getElementById('presetName');
    const savePresetButton = document.getElementById('savePresetButton');
    const presetSelect = document.getElementById('presetSelect');
    const loadPresetButton = document.getElementById('loadPresetButton');
    const deletePresetButton = document.getElementById('deletePresetButton');

    // Check if all elements are present
    if (!toggleChartControlsButton || !filterContainer || !addChartButton || !teamFilter ||
        !presetNameInput || !savePresetButton || !presetSelect || !loadPresetButton || !deletePresetButton) {
        console.error('One or more DOM elements are missing. Please ensure all elements are present in your HTML.');
        return;
    }

    // Initially hide the filter container
    filterContainer.style.display = 'none';

    // Add event listener to toggle chart controls
    toggleChartControlsButton.addEventListener('click', () => {
        if (filterContainer.style.display === 'none') {
            // Show chart controls
            filterContainer.style.display = 'flex';
            toggleChartControlsButton.textContent = 'Hide Chart Controls';
        } else {
            // Hide chart controls
            filterContainer.style.display = 'none';
            toggleChartControlsButton.textContent = 'Show Chart Controls';
        }
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            initializeDashboard(user);
        } else {
            console.error('User is not authenticated.');
        }
    });

    function initializeDashboard(user) {
        let salesRef;
        let salesData = [];
        let salesDataListener;

        // Set up event listener for team filter
        teamFilter.addEventListener('change', fetchSalesData);

        // Set up event listener for add chart button with debounce
        let isAddingChart = false;
        addChartButton.addEventListener('click', () => {
            if (isAddingChart) return; // Prevent multiple clicks
            isAddingChart = true;
            addChart(salesData, null, () => {
                isAddingChart = false; // Reset flag after chart is added
            });
        });

        // Event listener for saving a new preset
        savePresetButton.addEventListener('click', () => {
            const presetName = presetNameInput.value.trim();
            if (presetName) {
                savePreset(presetName);
            } else {
                alert('Please enter a name for the preset.');
            }
        });

        // Event listener for loading a preset
        loadPresetButton.addEventListener('click', () => {
            const selectedPreset = presetSelect.value;
            if (selectedPreset) {
                loadPreset(selectedPreset);
            } else {
                alert('Please select a preset to load.');
            }
        });

        // Event listener for deleting a preset
        deletePresetButton.addEventListener('click', () => {
            const selectedPreset = presetSelect.value;
            if (selectedPreset) {
                deletePreset(selectedPreset);
            } else {
                alert('Please select a preset to delete.');
            }
        });

        // Load existing presets
        loadPresets(user);

        function fetchSalesData() {
            // Remove previous listener if any
            if (salesRef && salesDataListener) {
                salesRef.off('value', salesDataListener);
            }

            const teamFilterValue = teamFilter.value;

            if (teamFilterValue === 'allData') {
                salesRef = database.ref('salesOutcomes');
            } else {
                salesRef = database.ref('salesOutcomes/' + user.uid);
            }

            salesDataListener = salesRef.on('value', snapshot => {
                salesData = [];

                if (teamFilterValue === 'allData') {
                    const allUsersData = snapshot.val();
                    if (allUsersData) {
                        for (let uid in allUsersData) {
                            const userData = allUsersData[uid];
                            const userSalesData = Object.values(userData);
                            salesData = salesData.concat(userSalesData);
                        }
                    }
                } else {
                    const userData = snapshot.val();
                    salesData = userData ? Object.values(userData) : [];
                }

                // Clear existing charts
                document.querySelector('.charts-container').innerHTML = '';

                // Load saved charts with new data
                loadSavedCharts(salesData, user);
            }, error => {
                console.error('Error fetching sales data:', error);
            });
        }

        // Initial data fetch
        fetchSalesData();
    }

    function getSaleType(action, notes) {
        const normalizedAction = action.toLowerCase();
        const normalizedNotes = notes.toLowerCase();

        if (/hra/i.test(normalizedAction) || /hra/i.test(normalizedNotes)) {
            return 'HRA';
        } else if (
            /(vbc|transfer|ndr|dental|fe|final expense|national|national debt|national debt relief|value based care|oak street|osh)/i.test(normalizedNotes)
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

    function populateActionTypes(actionTypes) {
        const actionTypeSelect = document.getElementById('actionType');
        if (!actionTypeSelect) {
            console.error('Action type select element not found.');
            return;
        }
        actionTypeSelect.innerHTML = ''; // Clear existing options

        actionTypes.forEach(actionType => {
            const option = document.createElement('option');
            option.value = actionType;
            option.textContent = actionType;
            actionTypeSelect.appendChild(option);
        });
    }

    function addChart(salesData, chartConfig = null, callback = null) {
        let timeFrame, actionType, chartType;

        if (chartConfig) {
            // Use provided chart configuration (from saved settings)
            timeFrame = chartConfig.timeFrame;
            actionType = chartConfig.actionType;
            chartType = chartConfig.chartType;
        } else {
            // Get values from UI
            const timeFrameSelect = document.getElementById('timeFrame');
            const actionTypeSelect = document.getElementById('actionType');
            const chartTypeSelect = document.getElementById('chartType');

            if (!timeFrameSelect || !actionTypeSelect || !chartTypeSelect) {
                console.error('One or more filter select elements are missing.');
                if (callback) callback();
                return;
            }

            timeFrame = timeFrameSelect.value;
            actionType = actionTypeSelect.value;
            chartType = chartTypeSelect.value;

            // Save the chart configuration
            saveChartConfig({ timeFrame, actionType, chartType });
        }

        // If salesData is empty, fetch it based on current teamFilter value
        if (salesData.length === 0) {
            fetchSalesDataForChart((fetchedSalesData) => {
                proceedWithChartCreation(fetchedSalesData);
            });
        } else {
            proceedWithChartCreation(salesData);
        }

        function proceedWithChartCreation(data) {
            // Filter data based on time frame and action type
            const filteredData = filterSalesData(data, timeFrame, actionType);

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
                saveChartsToFirebase(); // Update saved charts in Firebase
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
            const chartsContainer = document.querySelector('.charts-container');
            if (!chartsContainer) {
                console.error('Charts container element not found.');
                if (callback) callback();
                return;
            }
            chartsContainer.appendChild(chartContainer);

            // Render the chart
            const chartInstance = renderChart(canvas, chartType, chartData, actionType, timeFrame);

            // Save charts to Firebase
            saveChartsToFirebase();

            if (callback) callback(); // Invoke the callback if provided
        }
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
                startDate.setDate(now.getDate() - dayOfWeek);
                break;
            case 'previousWeek':
                const prevWeekStart = new Date(now);
                const prevWeekDay = now.getDay();
                prevWeekStart.setDate(now.getDate() - prevWeekDay - 7);
                startDate = prevWeekStart;
                now.setDate(prevWeekStart.getDate() + 6);
                break;
            case 'currentMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case '90days':
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

        // Set up the dataset
        const datasets = {
            label: `${actionType} (${timeFrame})`,
            data: chartData.data,
            borderWidth: 2,
        };

        if (chartType === 'line') {
            datasets.borderColor = '#FFFFFF'; // Line color
            datasets.pointBackgroundColor = colors; // Colors for data points
            datasets.fill = true; // Enable fill for line charts
            datasets.backgroundColor = createVerticalGradient(ctx, canvas); // Gradient fill
        } else {
            datasets.backgroundColor = colors;
            datasets.borderColor = colors;
            datasets.hoverBackgroundColor = colors;
            datasets.hoverBorderColor = colors;
        }

        // Set up the chart options
        const chartOptions = {
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
                actionType: actionType,
                chartType: chartType // Include chartType for rebuilding charts
            }
        };

        // Create the chart
        const chart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: chartData.labels,
                datasets: [datasets]
            },
            options: chartOptions,
        });

        return chart;
    }

    function createVerticalGradient(ctx, canvas) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'green');   // Top
        gradient.addColorStop(0.5, 'orange'); // Middle
        gradient.addColorStop(1, 'red');     // Bottom
        return gradient;
    }

    function generateValueBasedColors(data) {
        const maxValue = Math.max(...data);
        const minValue = Math.min(...data);

        return data.map(value => {
            const ratio = (value - minValue) / (maxValue - minValue || 1);
            // Create a gradient from red to green
            const color = chroma.scale(['red', 'orange', 'green'])(ratio).hex();
            return color;
        });
    }

    // Persistence Functions

    function saveChartConfig(chartConfig) {
        // Save chart configurations to an array and then to Firebase
        let savedCharts = JSON.parse(localStorage.getItem('savedCharts')) || [];
        savedCharts.push(chartConfig);
        localStorage.setItem('savedCharts', JSON.stringify(savedCharts));

        saveChartsToFirebase();
    }

    function saveChartsToFirebase() {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const charts = document.querySelectorAll('.chart-wrapper');
        const savedCharts = [];

        charts.forEach(chartWrapper => {
            const canvas = chartWrapper.querySelector('canvas');
            const chartInstance = Chart.getChart(canvas);

            const chartConfig = {
                timeFrame: chartInstance.options.custom.timeFrame,
                actionType: chartInstance.options.custom.actionType,
                chartType: chartInstance.options.custom.chartType
            };
            savedCharts.push(chartConfig);
        });

        database.ref('chartConfigs/' + user.uid).set(savedCharts);
    }

    function loadSavedCharts(salesData, user) {
        const chartsContainer = document.querySelector('.charts-container');
        if (!chartsContainer) {
            console.error('Charts container element not found.');
            return;
        }
        chartsContainer.innerHTML = '';

        database.ref('chartConfigs/' + user.uid).once('value').then(snapshot => {
            const savedCharts = snapshot.val() || [];

            if (savedCharts.length === 0) {
                // No saved charts, you can set up default charts here if desired
                return;
            }

            // Add saved charts
            savedCharts.forEach(chartConfig => {
                addChart(salesData, chartConfig);
            });
        }).catch(error => {
            console.error('Error loading saved charts:', error);
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
                chartType: chartInstance.options.custom.chartType
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

            if (chartConfig.chartType === 'line') {
                chartInstance.data.datasets[0].pointBackgroundColor = colors;
                // Update gradient fill
                const ctx = chartInstance.ctx;
                chartInstance.data.datasets[0].backgroundColor = createVerticalGradient(ctx, canvas);
            } else {
                chartInstance.data.datasets[0].backgroundColor = colors;
                chartInstance.data.datasets[0].borderColor = colors;
                chartInstance.data.datasets[0].hoverBackgroundColor = colors;
                chartInstance.data.datasets[0].hoverBorderColor = colors;
            }

            // Trigger an update
            chartInstance.update();
        });
    }

    // Preset Functions

    function savePreset(presetName) {
        const user = firebase.auth().currentUser;
        if (!user) return;

        // Retrieve current chart configurations
        const charts = document.querySelectorAll('.chart-wrapper');
        const savedCharts = [];

        charts.forEach(chartWrapper => {
            const canvas = chartWrapper.querySelector('canvas');
            const chartInstance = Chart.getChart(canvas);

            const chartConfig = {
                timeFrame: chartInstance.options.custom.timeFrame,
                actionType: chartInstance.options.custom.actionType,
                chartType: chartInstance.options.custom.chartType
            };
            savedCharts.push(chartConfig);
        });

        // Save the preset under the user's presets in Firebase
        database.ref('chartPresets/' + user.uid + '/' + presetName).set(savedCharts).then(() => {
            alert('Preset saved successfully!');
            presetNameInput.value = ''; // Clear the input field
            loadPresets(user); // Refresh the presets list
        }).catch(error => {
            console.error('Error saving preset:', error);
        });
    }

    function loadPresets(user) {
        database.ref('chartPresets/' + user.uid).once('value').then(snapshot => {
            const presets = snapshot.val() || {};
            presetSelect.innerHTML = '<option value="">Select a Preset</option>';
            Object.keys(presets).forEach(presetName => {
                const option = document.createElement('option');
                option.value = presetName;
                option.textContent = presetName;
                presetSelect.appendChild(option);
            });
        }).catch(error => {
            console.error('Error loading presets:', error);
        });
    }

    function loadPreset(presetName) {
        const user = firebase.auth().currentUser;
        if (!user) return;

        database.ref('chartPresets/' + user.uid + '/' + presetName).once('value').then(snapshot => {
            const savedCharts = snapshot.val() || [];

            // Clear existing charts
            const chartsContainer = document.querySelector('.charts-container');
            chartsContainer.innerHTML = '';

            // Add charts from the preset
            savedCharts.forEach(chartConfig => {
                addChart([], chartConfig); // Pass empty salesData; it will be fetched within addChart
            });
        }).catch(error => {
            console.error('Error loading preset:', error);
        });
    }

    function deletePreset(presetName) {
        const user = firebase.auth().currentUser;
        if (!user) return;

        database.ref('chartPresets/' + user.uid + '/' + presetName).remove().then(() => {
            alert('Preset deleted successfully!');
            loadPresets(user); // Refresh the presets list
        }).catch(error => {
            console.error('Error deleting preset:', error);
        });
    }

    function fetchSalesDataForChart(callback) {
        const teamFilterValue = teamFilter.value;
        let tempSalesRef;

        if (teamFilterValue === 'allData') {
            tempSalesRef = database.ref('salesOutcomes');
        } else {
            const user = firebase.auth().currentUser;
            tempSalesRef = database.ref('salesOutcomes/' + user.uid);
        }

        tempSalesRef.once('value', snapshot => {
            let tempSalesData = [];

            if (teamFilterValue === 'allData') {
                const allUsersData = snapshot.val();
                if (allUsersData) {
                    for (let uid in allUsersData) {
                        const userData = allUsersData[uid];
                        const userSalesData = Object.values(userData);
                        tempSalesData = tempSalesData.concat(userSalesData);
                    }
                }
            } else {
                const userData = snapshot.val();
                tempSalesData = userData ? Object.values(userData) : [];
            }

            callback(tempSalesData);
        }, error => {
            console.error('Error fetching sales data for chart:', error);
            callback([]);
        });
    }

    // Populate action types on page load
    const actionTypes = ['Select Patient Management', 'Transfer', 'HRA', 'Select RX'];
    populateActionTypes(actionTypes);
});
