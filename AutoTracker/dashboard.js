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

    function addChart(salesData) {
        const timeFrame = document.getElementById('timeFrame').value;
        const actionType = document.getElementById('actionType').value;
        const chartType = document.getElementById('chartType').value;

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
        removeButton.textContent = 'Remove Chart';
        removeButton.classList.add('remove-chart-button');
        removeButton.addEventListener('click', () => {
            chartContainer.remove();
        });
        chartContainer.appendChild(removeButton);

        // Add total count display
        const totalCountDisplay = document.createElement('div');
        totalCountDisplay.classList.add('total-count-display');
        totalCountDisplay.textContent = `Total Count: ${totalCount}`;
        chartContainer.appendChild(totalCountDisplay);

        // Create canvas for Chart.js
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);

        // Add chart container to the page
        document.querySelector('.charts-container').appendChild(chartContainer);

        // Render the chart
        renderChart(canvas, chartType, chartData, actionType, timeFrame);
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

    function renderChart(canvas, chartType, chartData, actionType, timeFrame) {
        // Determine canvas width based on data length
        const dataPointWidth = 50; // Width per data point in pixels
        const minCanvasWidth = 800; // Minimum width
        const maxCanvasWidth = 2000; // Maximum width
        const calculatedWidth = Math.min(Math.max(minCanvasWidth, chartData.labels.length * dataPointWidth), maxCanvasWidth);
        canvas.width = calculatedWidth;
        canvas.height = 400; // Fixed height

        const ctx = canvas.getContext('2d');

        const chart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: `${actionType} (${timeFrame})`,
                    data: chartData.data,
                    backgroundColor: chartType === 'pie' ? generateColors(chartData.data.length) : 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    fill: chartType !== 'line' // Fill area under the line for line charts
                }]
            },
            options: {
                responsive: false, // Disable responsiveness to maintain fixed size
                maintainAspectRatio: false,
                scales: chartType !== 'pie' ? {
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        ticks: {
                            autoSkip: false, // Show all labels
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Count'
                        },
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                } : {},
                plugins: {
                    legend: {
                        display: chartType !== 'pie'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                return `${label}: ${context.parsed.y}`;
                            }
                        }
                    }
                }
            }
        });
    }

    function generateColors(count) {
        const colors = [];
        const scale = chroma.scale(['#ff6384', '#36a2eb', '#ffce56']).mode('lch').colors(count);
        return scale;
    }
});
