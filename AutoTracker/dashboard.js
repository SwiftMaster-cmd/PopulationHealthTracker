// dashboard.js

document.addEventListener('firebaseInitialized', function() {
    const auth = firebase.auth();
    const database = firebase.database();

    // Chart registry to keep track of existing charts
    const chartRegistry = {};

    // Get references to DOM elements
    const toggleChartControlsButton = document.getElementById('toggleChartControlsButton');
    const filterContainer = document.querySelector('.filter-container');
    const addChartButton = document.getElementById('addChartButton');
    const clearChartsButton = document.getElementById('clearChartsButton');
    const teamFilter = document.getElementById('teamFilter');

    // New elements for presets
    const presetNameInput = document.getElementById('presetName');
    const savePresetButton = document.getElementById('savePresetButton');
    const presetSelect = document.getElementById('presetSelect');
    const loadPresetButton = document.getElementById('loadPresetButton');
    const deletePresetButton = document.getElementById('deletePresetButton');

    // Check if all elements are present
    if (!toggleChartControlsButton || !filterContainer || !addChartButton || !teamFilter ||
        !presetNameInput || !savePresetButton || !presetSelect || !loadPresetButton || !deletePresetButton || !clearChartsButton) {
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

    // Initialize the dashboard once the user is authenticated
    auth.onAuthStateChanged(user => {
        if (user) {
            initializeDashboard(user);
        } else {
            console.error('User is not authenticated.');
        }
    });

    function initializeDashboard(user) {
        // Ensure event listeners are attached only once
        if (!initializeDashboard.initialized) {
            initializeDashboard.initialized = true;

            // Event listener for adding a chart
            addChartButton.addEventListener('click', () => {
                addChart(user, null);
            });

            // Event listener for clearing all charts
            clearChartsButton.addEventListener('click', () => {
                clearAllCharts(user);
            });

            // Event listener for saving a new preset
            savePresetButton.addEventListener('click', () => {
                const presetName = presetNameInput.value.trim();
                if (presetName) {
                    savePreset(user, presetName);
                } else {
                    alert('Please enter a name for the preset.');
                }
            });

            // Event listener for loading a preset
            loadPresetButton.addEventListener('click', () => {
                const selectedPreset = presetSelect.value;
                if (selectedPreset) {
                    loadPreset(user, selectedPreset);
                } else {
                    alert('Please select a preset to load.');
                }
            });

            // Event listener for deleting a preset
            deletePresetButton.addEventListener('click', () => {
                const selectedPreset = presetSelect.value;
                if (selectedPreset) {
                    deletePreset(user, selectedPreset);
                } else {
                    alert('Please select a preset to delete.');
                }
            });
        }

        // Load existing presets and charts
        loadPresets(user);
        loadSavedCharts(user);
    }

    // Function to fetch sales data in real-time
    function fetchSalesData(user, teamFilterValue, callback) {
        let salesRef;

        if (teamFilterValue === 'allData') {
            salesRef = database.ref('salesOutcomes');
        } else {
            salesRef = database.ref(`salesOutcomes/${user.uid}`);
        }

        // Remove any existing listeners to prevent duplication
        if (fetchSalesData.listeners && fetchSalesData.listeners[salesRef.toString()]) {
            salesRef.off('value', fetchSalesData.listeners[salesRef.toString()]);
        }

        // Define the listener function
        const listener = snapshot => {
            let salesData = [];

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

            if (callback) {
                callback(salesData);
            }
        };

        // Attach the listener
        salesRef.on('value', listener, error => {
            console.error('Error fetching sales data in real-time:', error);
            if (callback) callback([]);
        });

        // Store the listener so it can be removed later
        fetchSalesData.listeners = fetchSalesData.listeners || {};
        fetchSalesData.listeners[salesRef.toString()] = listener;
    }

    // Function to determine the sale type based on action and notes
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

    // Function to populate action types in the select element
    function populateActionTypes(actionTypes) {
        const actionTypeSelect = document.getElementById('actionType');
        if (!actionTypeSelect) {
            console.error('Action type select element not found.');
            return;
        }
        actionTypeSelect.innerHTML = '<option value="">Select Action Type</option>'; // Add default option

        actionTypes.forEach(actionType => {
            const option = document.createElement('option');
            option.value = actionType;
            option.textContent = actionType;
            actionTypeSelect.appendChild(option);
        });
    }

    // Function to add a chart
    function addChart(user, chartConfig = null) {
        let timeFrame, actionType, chartType, teamFilterValue;

        if (chartConfig) {
            timeFrame = chartConfig.timeFrame;
            actionType = chartConfig.actionType;
            chartType = chartConfig.chartType;
            teamFilterValue = chartConfig.teamFilterValue || 'myData';
        } else {
            const timeFrameSelect = document.getElementById('timeFrame');
            const actionTypeSelect = document.getElementById('actionType');
            const chartTypeSelect = document.getElementById('chartType');
            const teamFilterSelect = document.getElementById('teamFilter');

            if (!timeFrameSelect || !actionTypeSelect || !chartTypeSelect || !teamFilterSelect) {
                console.error('One or more filter select elements are missing.');
                return;
            }

            timeFrame = timeFrameSelect.value;
            actionType = actionTypeSelect.value;
            chartType = chartTypeSelect.value;
            teamFilterValue = teamFilterSelect.value;

            if (!timeFrame || !actionType || !chartType || !teamFilterValue) {
                alert('Please select all chart options.');
                return;
            }

            // Save the chart configuration to Firebase
            saveChartConfig({ timeFrame, actionType, chartType, teamFilterValue });
        }

        // Generate a unique key for the chart configuration
        const chartKey = `${timeFrame}_${actionType}_${chartType}_${teamFilterValue}`;

        // Check if the chart already exists to prevent duplication
        if (chartRegistry[chartKey]) {
            console.warn('Chart with this configuration already exists.');
            return;
        }

        // Create the chart container
        const chartContainer = document.createElement('div');
        chartContainer.classList.add('chart-wrapper');
        chartContainer.setAttribute('data-chart-key', chartKey);

        // Add a remove button
        const removeButton = document.createElement('button');
        removeButton.innerHTML = '&times;';
        removeButton.classList.add('remove-chart-button');
        removeButton.addEventListener('click', () => {
            // Remove chart from registry
            delete chartRegistry[chartKey];
            // Remove chart container from DOM
            chartContainer.remove();
            // Update saved charts in Firebase
            saveChartsToFirebase(user);
        });
        chartContainer.appendChild(removeButton);

        // Add total count display
        const totalCountDisplay = document.createElement('div');
        totalCountDisplay.classList.add('total-count-display');
        totalCountDisplay.textContent = `${actionType} (${timeFrame}) - Total Count: Loading...`;
        chartContainer.appendChild(totalCountDisplay);

        // Add chart content container
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
            return;
        }
        chartsContainer.appendChild(chartContainer);

        // Render the chart
        const chartInstance = renderChart(canvas, chartType, { labels: [], data: [] }, actionType, timeFrame, teamFilterValue);

        // Register the chart to prevent duplication
        chartRegistry[chartKey] = chartInstance;

        // Listen for real-time updates to refresh the chart data
        const salesRefPath = teamFilterValue === 'allData' ? 'salesOutcomes' : `salesOutcomes/${user.uid}`;
        const salesRef = database.ref(salesRefPath);

        // Define a listener specific to this chart
        const chartListener = snapshot => {
            let salesData = [];

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

            // Filter data based on time frame and action type
            const filteredData = filterSalesData(salesData, timeFrame, actionType);
            const chartData = prepareChartData(filteredData, timeFrame);
            const totalCount = filteredData.length;

            // Update total count display
            totalCountDisplay.textContent = `${actionType} (${timeFrame}) - Total Count: ${totalCount}`;

            // Update chart data
            chartInstance.data.labels = chartData.labels;
            chartInstance.data.datasets[0].data = chartData.data;

            if (chartType === 'line') {
                chartInstance.data.datasets[0].pointBackgroundColor = generateValueBasedColors(chartData.data);
                chartInstance.data.datasets[0].backgroundColor = 'rgba(33, 150, 243, 0.5)';
            } else {
                const colors = generateValueBasedColors(chartData.data);
                chartInstance.data.datasets[0].backgroundColor = colors;
                chartInstance.data.datasets[0].borderColor = colors;
                chartInstance.data.datasets[0].hoverBackgroundColor = colors;
                chartInstance.data.datasets[0].hoverBorderColor = colors;
            }

            // Trigger an update
            chartInstance.update();
        };

        // Attach the listener
        salesRef.on('value', chartListener, error => {
            console.error('Error fetching sales data in real-time:', error);
            totalCountDisplay.textContent = `${actionType} (${timeFrame}) - Total Count: Error`;
        });

        // Store the listener so it can be detached if the chart is removed
        if (!fetchSalesData.listeners) {
            fetchSalesData.listeners = {};
        }
        fetchSalesData.listeners[chartKey] = chartListener;
    }

    // Function to filter sales data based on time frame and action type
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

    // Function to prepare chart data, showing hourly data when timeFrame is 'today'
    function prepareChartData(filteredData, timeFrame) {
        const dateCounts = {};

        filteredData.forEach(sale => {
            const date = new Date(sale.outcomeTime);

            let dateKey;

            if (timeFrame === 'today') {
                // Format the date to include the hour
                const hours = date.getHours();
                dateKey = `${hours}:00`;
            } else {
                // Format the date to exclude the year
                const options = { month: 'short', day: 'numeric' };
                dateKey = date.toLocaleDateString(undefined, options);
            }

            dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
        });

        // Sort the keys (hours or dates)
        const sortedKeys = Object.keys(dateCounts).sort((a, b) => {
            if (timeFrame === 'today') {
                return parseInt(a) - parseInt(b);
            } else {
                const dateA = new Date(a);
                const dateB = new Date(b);
                return dateA - dateB;
            }
        });

        return {
            labels: sortedKeys,
            data: sortedKeys.map(key => dateCounts[key])
        };
    }

    // Function to render a chart using Chart.js
    function renderChart(canvas, chartType, chartData, actionType, timeFrame, teamFilterValue) {
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
            datasets.backgroundColor = 'rgba(33, 150, 243, 0.5)'; // Semi-transparent blue
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
                        text: timeFrame === 'today' ? 'Hour of Day' : 'Date',
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
                            if (timeFrame === 'today') {
                                return this.getLabelForValue(value); // Show every hour
                            } else {
                                if (dataPointCount > 15 && index % 2 !== 0) {
                                    return null;
                                }
                                return this.getLabelForValue(value);
                            }
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
                    displayColors: false,
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
            animation: {
                duration: 1500,
                easing: 'easeInOutQuad',
            },
            custom: {
                timeFrame: timeFrame,
                actionType: actionType,
                chartType: chartType, // Include chartType for rebuilding charts
                teamFilterValue: teamFilterValue // Include teamFilterValue
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

    // Function to generate colors based on data values
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

    // Function to save chart configurations to Firebase
    function saveChartConfig(chartConfig) {
        const user = firebase.auth().currentUser;
        if (!user) return;

        // Retrieve existing charts from Firebase
        database.ref(`chartConfigs/${user.uid}`).once('value').then(snapshot => {
            let savedCharts = snapshot.val() || [];

            // Check if the chart already exists to prevent duplication
            const exists = savedCharts.some(existingConfig =>
                existingConfig.timeFrame === chartConfig.timeFrame &&
                existingConfig.actionType === chartConfig.actionType &&
                existingConfig.chartType === chartConfig.chartType &&
                existingConfig.teamFilterValue === chartConfig.teamFilterValue
            );

            if (!exists) {
                savedCharts.push(chartConfig);
                database.ref(`chartConfigs/${user.uid}`).set(savedCharts).then(() => {
                    console.log('Chart configuration saved.');
                }).catch(error => {
                    console.error('Error saving chart configuration:', error);
                });
            } else {
                console.warn('Chart configuration already exists.');
            }
        }).catch(error => {
            console.error('Error retrieving chart configurations:', error);
        });
    }

    // Function to save all current charts to Firebase
    function saveChartsToFirebase(user) {
        if (!user) return;

        const charts = document.querySelectorAll('.chart-wrapper');
        const savedCharts = [];

        charts.forEach(chartWrapper => {
            const chartKey = chartWrapper.getAttribute('data-chart-key');
            const chartInstance = chartRegistry[chartKey];
            if (chartInstance) {
                const chartConfig = {
                    timeFrame: chartInstance.options.custom.timeFrame,
                    actionType: chartInstance.options.custom.actionType,
                    chartType: chartInstance.options.custom.chartType,
                    teamFilterValue: chartInstance.options.custom.teamFilterValue
                };
                savedCharts.push(chartConfig);
            }
        });

        database.ref(`chartConfigs/${user.uid}`).set(savedCharts).then(() => {
            console.log('All charts saved to Firebase.');
        }).catch(error => {
            console.error('Error saving charts to Firebase:', error);
        });
    }

    // Function to load saved charts from Firebase
    function loadSavedCharts(user) {
        const chartsContainer = document.querySelector('.charts-container');
        if (!chartsContainer) {
            console.error('Charts container element not found.');
            return;
        }

        database.ref(`chartConfigs/${user.uid}`).once('value').then(snapshot => {
            const savedCharts = snapshot.val() || [];

            // Clear any existing charts to prevent duplication
            clearAllCharts(user, false); // Pass false to avoid removing from Firebase again

            // Add each saved chart
            savedCharts.forEach(chartConfig => {
                addChart(user, chartConfig);
            });
        }).catch(error => {
            console.error('Error loading saved charts:', error);
        });
    }

    // Function to clear all charts
    function clearAllCharts(user, removeFromFirebase = true) {
        const chartsContainer = document.querySelector('.charts-container');
        if (chartsContainer) {
            chartsContainer.innerHTML = '';
            // Clear the chart registry
            for (let key in chartRegistry) {
                delete chartRegistry[key];
            }
        }

        if (removeFromFirebase && user) {
            database.ref(`chartConfigs/${user.uid}`).remove().then(() => {
                console.log('All charts cleared from Firebase.');
            }).catch(error => {
                console.error('Error clearing charts from Firebase:', error);
            });
        }
    }

    // Preset Functions

    // Function to save a preset
    function savePreset(user, presetName) {
        if (!presetName) {
            alert('Preset name cannot be empty.');
            return;
        }

        // Retrieve current chart configurations
        const charts = document.querySelectorAll('.chart-wrapper');
        const savedCharts = [];

        charts.forEach(chartWrapper => {
            const chartKey = chartWrapper.getAttribute('data-chart-key');
            const chartInstance = chartRegistry[chartKey];
            if (chartInstance) {
                const chartConfig = {
                    timeFrame: chartInstance.options.custom.timeFrame,
                    actionType: chartInstance.options.custom.actionType,
                    chartType: chartInstance.options.custom.chartType,
                    teamFilterValue: chartInstance.options.custom.teamFilterValue
                };
                savedCharts.push(chartConfig);
            }
        });

        // Save the preset under the user's presets in Firebase
        const presetData = {
            charts: savedCharts
        };

        database.ref(`chartPresets/${user.uid}/${presetName}`).set(presetData).then(() => {
            alert('Preset saved successfully!');
            presetNameInput.value = ''; // Clear the input field
            loadPresets(user); // Refresh the presets list
        }).catch(error => {
            console.error('Error saving preset:', error);
        });
    }

    // Function to load all presets
    function loadPresets(user) {
        database.ref(`chartPresets/${user.uid}`).once('value').then(snapshot => {
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

    // Function to load a specific preset
    function loadPreset(user, presetName) {
        if (!presetName) {
            alert('Preset name is required.');
            return;
        }

        // Clear existing charts before loading new ones
        clearAllCharts(user, false); // Pass false to avoid removing from Firebase

        database.ref(`chartPresets/${user.uid}/${presetName}`).once('value').then(snapshot => {
            const presetData = snapshot.val();

            if (!presetData) {
                console.error('Preset data not found.');
                return;
            }

            const { charts: savedCharts } = presetData;

            // Add charts from the preset
            savedCharts.forEach(chartConfig => {
                addChart(user, chartConfig);
            });

            console.log(`Preset "${presetName}" loaded successfully.`);
        }).catch(error => {
            console.error('Error loading preset:', error);
        });
    }

    // Function to delete a preset
    function deletePreset(user, presetName) {
        if (!presetName) {
            alert('Preset name is required.');
            return;
        }

        database.ref(`chartPresets/${user.uid}/${presetName}`).remove().then(() => {
            alert('Preset deleted successfully!');
            loadPresets(user); // Refresh the presets list
        }).catch(error => {
            console.error('Error deleting preset:', error);
        });
    }

    // Populate action types on page load
    const actionTypes = ['Select Patient Management', 'Transfer', 'HRA', 'Select RX'];
    populateActionTypes(actionTypes);
});
