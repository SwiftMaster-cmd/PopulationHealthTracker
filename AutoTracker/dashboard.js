// dashboard.js

document.addEventListener('firebaseInitialized', function() {
    const auth = firebase.auth();
    const database = firebase.database();

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
        }
    });

    function initializeDashboard(user) {
        // Remove existing event listeners (if any) to avoid duplication
        addChartButton.replaceWith(addChartButton.cloneNode(true)); 
        clearChartsButton.replaceWith(clearChartsButton.cloneNode(true)); 
        savePresetButton.replaceWith(savePresetButton.cloneNode(true)); 
        loadPresetButton.replaceWith(loadPresetButton.cloneNode(true)); 
        deletePresetButton.replaceWith(deletePresetButton.cloneNode(true)); 
    
        // Reassign the elements after cloning
        const newAddChartButton = document.getElementById('addChartButton');
        const newClearChartsButton = document.getElementById('clearChartsButton');
        const newSavePresetButton = document.getElementById('savePresetButton');
        const newLoadPresetButton = document.getElementById('loadPresetButton');
        const newDeletePresetButton = document.getElementById('deletePresetButton');
    
        // Now attach event listeners to the new (cloned) buttons
        newAddChartButton.addEventListener('click', () => {
            addChart(user);
        });
    
        newClearChartsButton.addEventListener('click', () => {
            clearAllCharts();
        });
    
        newSavePresetButton.addEventListener('click', () => {
            const presetName = presetNameInput.value.trim();
            if (presetName) {
                savePreset(presetName);
            } else {
                alert('Please enter a name for the preset.');
            }
        });
    
        newLoadPresetButton.addEventListener('click', () => {
            const selectedPreset = presetSelect.value;
            if (selectedPreset) {
                loadPreset(selectedPreset);
            } else {
                alert('Please select a preset to load.');
            }
        });
    
        newDeletePresetButton.addEventListener('click', () => {
            const selectedPreset = presetSelect.value;
            if (selectedPreset) {
                deletePreset(selectedPreset);
            } else {
                alert('Please select a preset to delete.');
            }
        });
    
        // Load existing presets and charts
        loadPresets(user);
        loadSavedCharts(user);
    }
    

    function fetchSalesData(user, teamFilterValue, callback) {
        let salesRef;
    
        if (teamFilterValue === 'allData') {
            salesRef = database.ref('salesOutcomes');
        } else {
            salesRef = database.ref('salesOutcomes/' + user.uid);
        }
    
        salesRef.on('value', snapshot => {
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
    
        }, error => {
            console.error('Error fetching sales data in real-time:', error);
            if (callback) callback([]);
        });
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

    function addChart(user, chartConfig = null, callback = null) {
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
    
            timeFrame = timeFrameSelect.value;
            actionType = actionTypeSelect.value;
            chartType = chartTypeSelect.value;
            teamFilterValue = teamFilterSelect.value;
    
            // Save the chart configuration
            saveChartConfig({ timeFrame, actionType, chartType, teamFilterValue });
        }
    
        // Check if this chart configuration already exists
        const existingChart = checkExistingChart(timeFrame, actionType, chartType, teamFilterValue);
        if (existingChart) {
            console.warn('Chart with the same configuration already exists.');
            if (callback) callback(); 
            return;
        }
    
        fetchSalesData(user, teamFilterValue, salesData => {
            proceedWithChartCreation(salesData, teamFilterValue);
            if (callback) callback();
        });
    
        function proceedWithChartCreation(data, teamFilterValue) {
            const filteredData = filterSalesData(data, timeFrame, actionType);
            const chartData = prepareChartData(filteredData, timeFrame);
            const totalCount = filteredData.length;
    
            const chartContainer = document.createElement('div');
            chartContainer.classList.add('chart-wrapper');
    
            const removeButton = document.createElement('button');
            removeButton.innerHTML = '&times;';
            removeButton.classList.add('remove-chart-button');
            removeButton.addEventListener('click', () => {
                chartContainer.remove();
                saveChartsToFirebase();
            });
            chartContainer.appendChild(removeButton);
    
            const totalCountDisplay = document.createElement('div');
            totalCountDisplay.classList.add('total-count-display');
            totalCountDisplay.textContent = `${actionType} (${timeFrame}) - Total Count: ${totalCount}`;
            chartContainer.appendChild(totalCountDisplay);
    
            const chartContent = document.createElement('div');
            chartContent.classList.add('chart-content');
    
            const canvas = document.createElement('canvas');
            chartContent.appendChild(canvas);
            chartContainer.appendChild(chartContent);
    
            const chartsContainer = document.querySelector('.charts-container');
            chartsContainer.appendChild(chartContainer);
    
            const chartInstance = renderChart(canvas, chartType, chartData, actionType, timeFrame, teamFilterValue);
    
            saveChartsToFirebase();
    
            // Listen for real-time updates to refresh the chart data
            fetchSalesData(user, teamFilterValue, updatedSalesData => {
                const updatedFilteredData = filterSalesData(updatedSalesData, timeFrame, actionType);
                const updatedChartData = prepareChartData(updatedFilteredData, timeFrame);
    
                chartInstance.data.labels = updatedChartData.labels;
                chartInstance.data.datasets[0].data = updatedChartData.data;
                chartInstance.update(); // Update the chart in real-time
            });
        }
    }
    
    // Function to check if a chart with the same configuration already exists
    function checkExistingChart(timeFrame, actionType, chartType, teamFilterValue) {
        const charts = document.querySelectorAll('.chart-wrapper');
        return Array.from(charts).some(chartWrapper => {
            const canvas = chartWrapper.querySelector('canvas');
            const chartInstance = Chart.getChart(canvas);
            if (!chartInstance) return false;
    
            const options = chartInstance.options.custom;
            return options.timeFrame === timeFrame && 
                   options.actionType === actionType && 
                   options.chartType === chartType && 
                   options.teamFilterValue === teamFilterValue;
        });
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

    // Updated function to prepare chart data, showing hourly data when timeFrame is 'today'
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
                chartType: chartInstance.options.custom.chartType,
                teamFilterValue: chartInstance.options.custom.teamFilterValue
            };
            savedCharts.push(chartConfig);
        });

        database.ref('chartConfigs/' + user.uid).set(savedCharts);
    }

    function loadSavedCharts(user) {
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
                addChart(user, chartConfig);
            });
        }).catch(error => {
            console.error('Error loading saved charts:', error);
        });
    }

    function updateCharts() {
        const user = firebase.auth().currentUser;
        if (!user) return;

        // Update all charts with their own data
        const charts = document.querySelectorAll('.chart-wrapper');
        charts.forEach(chartWrapper => {
            const canvas = chartWrapper.querySelector('canvas');
            const chartInstance = Chart.getChart(canvas);

            const totalCountDisplay = chartWrapper.querySelector('.total-count-display');
            const chartConfig = {
                timeFrame: chartInstance.options.custom.timeFrame,
                actionType: chartInstance.options.custom.actionType,
                chartType: chartInstance.options.custom.chartType,
                teamFilterValue: chartInstance.options.custom.teamFilterValue
            };

            // Fetch sales data specific to this chart's teamFilterValue
            fetchSalesData(user, chartConfig.teamFilterValue, salesData => {
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
                    // Update background color
                    chartInstance.data.datasets[0].backgroundColor = 'rgba(33, 150, 243, 0.5)';
                } else {
                    chartInstance.data.datasets[0].backgroundColor = colors;
                    chartInstance.data.datasets[0].borderColor = colors;
                    chartInstance.data.datasets[0].hoverBackgroundColor = colors;
                    chartInstance.data.datasets[0].hoverBorderColor = colors;
                }

                // Trigger an update
                chartInstance.update();
            });
        });
    }

    // New function to clear all charts
    function clearAllCharts() {
        const chartsContainer = document.querySelector('.charts-container');
        if (chartsContainer) {
            chartsContainer.innerHTML = '';
        }
        // Remove saved charts from Firebase
        const user = firebase.auth().currentUser;
        if (user) {
            database.ref('chartConfigs/' + user.uid).remove().then(() => {
                console.log('All charts cleared.');
            }).catch(error => {
                console.error('Error clearing charts:', error);
            });
        }
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
                chartType: chartInstance.options.custom.chartType,
                teamFilterValue: chartInstance.options.custom.teamFilterValue
            };
            savedCharts.push(chartConfig);
        });

        // Save the preset under the user's presets in Firebase
        const presetData = {
            charts: savedCharts
        };

        database.ref('chartPresets/' + user.uid + '/' + presetName).set(presetData).then(() => {
            alert('Preset saved successfully!');
            presetNameInput.value = ''; // Clear the input field
            loadPresets(user); // Refresh the presets list
        }).catch(error => {
            console.error('Error saving preset:', error);
        });
    }

    function loadPreset(presetName) {
        const user = firebase.auth().currentUser;
        if (!user) return;
    
        // Clear existing charts
        clearAllCharts();
    
        database.ref('chartPresets/' + user.uid + '/' + presetName).once('value').then(snapshot => {
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
    
        }).catch(error => {
            console.error('Error loading preset:', error);
        });
    }
    

    function loadPreset(presetName) {
        const user = firebase.auth().currentUser;
        if (!user) return;

        database.ref('chartPresets/' + user.uid + '/' + presetName).once('value').then(snapshot => {
            const presetData = snapshot.val();

            if (!presetData) {
                console.error('Preset data not found.');
                return;
            }

            const { charts: savedCharts } = presetData;

            // Clear existing charts
            const chartsContainer = document.querySelector('.charts-container');
            chartsContainer.innerHTML = '';

            // Add charts from the preset
            savedCharts.forEach(chartConfig => {
                addChart(user, chartConfig);
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

    // Populate action types on page load
    const actionTypes = ['Select Patient Management', 'Transfer', 'HRA', 'Select RX'];
    populateActionTypes(actionTypes);
});
