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

    auth.onAuthStateChanged(user => {
        if (user) {
            initializeDashboard(user);
        } else {
            console.error('User is not authenticated.');
            clearAllCharts(null, false); // Clear charts if user logs out
        }
    });

    function initializeDashboard(user) {
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

    function fetchSalesData(user, teamFilterValue, callback) {
        let salesRef;

        if (teamFilterValue === 'allData') {
            salesRef = database.ref('salesOutcomes');
        } else {
            salesRef = database.ref(`salesOutcomes/${user.uid}`);
        }

        if (fetchSalesData.listeners && fetchSalesData.listeners[salesRef.toString()]) {
            salesRef.off('value', fetchSalesData.listeners[salesRef.toString()]);
        }

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

        salesRef.on('value', listener, error => {
            console.error('Error fetching sales data in real-time:', error);
            if (callback) callback([]);
        });

        fetchSalesData.listeners = fetchSalesData.listeners || {};
        fetchSalesData.listeners[salesRef.toString()] = listener;
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
            return null;
        }
    }

    function populateActionTypes(actionTypes) {
        const actionTypeSelect = document.getElementById('actionType');
        if (!actionTypeSelect) {
            console.error('Action type select element not found.');
            return;
        }
        actionTypeSelect.innerHTML = '<option value="">Select Action Type</option>';

        actionTypes.forEach(actionType => {
            const option = document.createElement('option');
            option.value = actionType;
            option.textContent = actionType;
            actionTypeSelect.appendChild(option);
        });
    }

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

            saveChartConfig({ timeFrame, actionType, chartType, teamFilterValue });
        }

        const chartKey = `${timeFrame}_${actionType}_${chartType}_${teamFilterValue}`;

        if (chartRegistry[chartKey]) {
            console.warn('Chart with this configuration already exists.');
            return;
        }

        const chartContainer = document.createElement('div');
        chartContainer.classList.add('chart-wrapper');
        chartContainer.setAttribute('data-chart-key', chartKey);

        const removeButton = document.createElement('button');
        removeButton.innerHTML = '&times;';
        removeButton.classList.add('remove-chart-button');
        removeButton.addEventListener('click', () => {
            delete chartRegistry[chartKey];
            chartContainer.remove();
            removeChartListener(user, chartKey);
            saveChartsToFirebase(user);
        });
        chartContainer.appendChild(removeButton);

        const totalCountDisplay = document.createElement('div');
        totalCountDisplay.classList.add('total-count-display');
        totalCountDisplay.textContent = `${actionType} (${timeFrame}) - Total Count: Loading...`;
        chartContainer.appendChild(totalCountDisplay);

        const chartContent = document.createElement('div');
        chartContent.classList.add('chart-content');

        const canvas = document.createElement('canvas');
        chartContent.appendChild(canvas);
        chartContainer.appendChild(chartContent);

        const chartsContainer = document.querySelector('.charts-container');
        if (!chartsContainer) {
            console.error('Charts container element not found.');
            return;
        }
        chartsContainer.appendChild(chartContainer);

        const chartInstance = renderChart(canvas, chartType, { labels: [], data: [] }, actionType, timeFrame, teamFilterValue);

        chartRegistry[chartKey] = chartInstance;

        const salesRefPath = teamFilterValue === 'allData' ? 'salesOutcomes' : `salesOutcomes/${user.uid}`;
        const salesRef = database.ref(salesRefPath);

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

            const filteredData = filterSalesData(salesData, timeFrame, actionType);
            const chartData = prepareChartData(filteredData, timeFrame);
            const totalCount = filteredData.length;

            totalCountDisplay.textContent = `${actionType} (${timeFrame}) - Total Count: ${totalCount}`;

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

            chartInstance.update();
        };

        salesRef.on('value', chartListener, error => {
            console.error('Error fetching sales data in real-time:', error);
            totalCountDisplay.textContent = `${actionType} (${timeFrame}) - Total Count: Error`;
        });

        if (!fetchSalesData.listeners) {
            fetchSalesData.listeners = {};
        }
        fetchSalesData.listeners[chartKey] = chartListener;
    }

    function removeChartListener(user, chartKey) {
        const salesRefPath = chartKey.includes('allData') ? 'salesOutcomes' : `salesOutcomes/${user.uid}`;
        const salesRef = database.ref(salesRefPath);

        if (fetchSalesData.listeners && fetchSalesData.listeners[chartKey]) {
            salesRef.off('value', fetchSalesData.listeners[chartKey]);
            delete fetchSalesData.listeners[chartKey];
        }
    }

    function filterSalesData(salesData, timeFrame, actionType) {
        const now = new Date();
        let startDate = new Date();

        switch (timeFrame) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'currentWeek':
                const dayOfWeek = now.getDay(); 
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
                startDate = new Date(0);
        }

        const startTime = startDate.getTime();
        const endTime = now.getTime();

        return salesData.filter(sale => {
            const saleTime = new Date(sale.outcomeTime).getTime();
            const saleType = getSaleType(sale.assignAction || '', sale.notesValue || '');
            return saleType === actionType && saleTime >= startTime && saleTime <= endTime;
        });
    }

    // Updated function to prepare chart data, keeping all data points but skipping some date labels
// Updated function to prepare chart data, keeping all data points but skipping some date labels
function prepareChartData(filteredData, timeFrame) {
    const dateCounts = {};

    // Group data by date or hour depending on the timeframe
    filteredData.forEach(sale => {
        const date = new Date(sale.outcomeTime);

        let dateKey;

        if (timeFrame === 'today') {
            // Format the date to include the hour
            const hours = date.getHours();
            dateKey = `${hours}:00`;
        } else {
            // Format the date to exclude the year for other time frames
            const options = { month: 'short', day: 'numeric' };
            dateKey = date.toLocaleDateString(undefined, options);
        }

        // Count the sales for each date or hour
        dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
    });

    // Sort the date keys
    const sortedKeys = Object.keys(dateCounts).sort((a, b) => {
        if (timeFrame === 'today') {
            return parseInt(a) - parseInt(b);
        } else {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateA - dateB;
        }
    });

    const MAX_LABELS = 15;  // Adjust the number of visible labels

    // Show all data points but limit the number of labels
    const displayedLabels = sortedKeys.map((key, index) => {
        // Show only selected labels to avoid overcrowding
        if (sortedKeys.length > MAX_LABELS && index % Math.ceil(sortedKeys.length / MAX_LABELS) !== 0) {
            return '';  // Skip some date labels
        }
        return key;
    });

    return {
        labels: displayedLabels,  // Limited number of labels
        data: sortedKeys.map(key => dateCounts[key])  // All data points
    };
}


    function renderChart(canvas, chartType, chartData, actionType, timeFrame, teamFilterValue) {
        const dataPointCount = chartData.labels.length;

        const canvasWidth = dataPointCount > 8 ? dataPointCount * 60 : '100%';
        canvas.style.width = typeof canvasWidth === 'number' ? `${canvasWidth}px` : canvasWidth;
        canvas.style.height = '400px';

        const ctx = canvas.getContext('2d');

        const colors = generateValueBasedColors(chartData.data);

        const datasets = {
            label: `${actionType} (${timeFrame})`,
            data: chartData.data,
            borderWidth: 2,
        };

        if (chartType === 'line') {
            datasets.borderColor = '#FFFFFF'; 
            datasets.pointBackgroundColor = colors; 
            datasets.fill = true; 
            datasets.backgroundColor = 'rgba(33, 150, 243, 0.5)';
        } else {
            datasets.backgroundColor = colors;
            datasets.borderColor = colors;
            datasets.hoverBackgroundColor = colors;
            datasets.hoverBorderColor = colors;
        }

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
                                return this.getLabelForValue(value); 
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
                chartType: chartType,
                teamFilterValue: teamFilterValue
            }
        };

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

    function generateValueBasedColors(data) {
        const maxValue = Math.max(...data);
        const minValue = Math.min(...data);

        return data.map(value => {
            const ratio = (value - minValue) / (maxValue - minValue || 1);
            const color = chroma.scale(['red', 'orange', 'green'])(ratio).hex();
            return color;
        });
    }

    function saveChartConfig(chartConfig) {
        const user = firebase.auth().currentUser;
        if (!user) return;

        database.ref(`chartConfigs/${user.uid}`).once('value').then(snapshot => {
            let savedCharts = snapshot.val() || [];

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

    function loadSavedCharts(user) {
        const chartsContainer = document.querySelector('.charts-container');
        if (!chartsContainer) {
            console.error('Charts container element not found.');
            return;
        }

        database.ref(`chartConfigs/${user.uid}`).once('value').then(snapshot => {
            const savedCharts = snapshot.val() || [];

            clearAllCharts(user, false);

            savedCharts.forEach(chartConfig => {
                addChart(user, chartConfig);
            });
        }).catch(error => {
            console.error('Error loading saved charts:', error);
        });
    }

    function clearAllCharts(user, removeFromFirebase = true) {
        const chartsContainer = document.querySelector('.charts-container');
        if (chartsContainer) {
            chartsContainer.innerHTML = '';
            for (let key in chartRegistry) {
                removeChartListener(user, key);
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

    function savePreset(user, presetName) {
        if (!presetName) {
            alert('Preset name cannot be empty.');
            return;
        }

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

        const presetData = {
            charts: savedCharts
        };

        database.ref(`chartPresets/${user.uid}/${presetName}`).set(presetData).then(() => {
            alert('Preset saved successfully!');
            presetNameInput.value = '';
            loadPresets(user);
        }).catch(error => {
            console.error('Error saving preset:', error);
        });
    }

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

    function loadPreset(user, presetName) {
        if (!presetName) {
            alert('Preset name is required.');
            return;
        }

        clearAllCharts(user, false);

        database.ref(`chartPresets/${user.uid}/${presetName}`).once('value').then(snapshot => {
            const presetData = snapshot.val();

            if (!presetData) {
                console.error('Preset data not found.');
                return;
            }

            const { charts: savedCharts } = presetData;

            savedCharts.forEach(chartConfig => {
                addChart(user, chartConfig);
            });

            console.log(`Preset "${presetName}" loaded successfully.`);
        }).catch(error => {
            console.error('Error loading preset:', error);
        });
    }

    function deletePreset(user, presetName) {
        if (!presetName) {
            alert('Preset name is required.');
            return;
        }

        database.ref(`chartPresets/${user.uid}/${presetName}`).remove().then(() => {
            alert('Preset deleted successfully!');
            loadPresets(user);
        }).catch(error => {
            console.error('Error deleting preset:', error);
        });
    }

    function removeAllListeners(user) {
        if (fetchSalesData.listeners) {
            for (let refPath in fetchSalesData.listeners) {
                const listener = fetchSalesData.listeners[refPath];
                const ref = database.ref(refPath);
                ref.off('value', listener);
            }
            fetchSalesData.listeners = {};
        }
    }

    window.addEventListener('beforeunload', () => {
        removeAllListeners();
    });

});
