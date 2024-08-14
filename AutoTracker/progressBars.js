document.addEventListener('DOMContentLoaded', function() {
    // Authenticate and then load the progress bars
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log(`User signed in: ${user.displayName}`);
            calculateAndStoreWeeklyAverages(); // Calculate and store weekly averages
            loadProgressBars(); // Load progress bars comparing today with weekly averages
        } else {
            console.error('No user is signed in.');
        }
    });
});
function sanitizeForFirebaseKey(key) {
    return key.replace(/[.#$[\]]/g, '_'); // Replace invalid characters with underscores
}

async function calculateAndStoreWeeklyAverages() {
    const salesOutcomesRef = firebase.database().ref('salesOutcomes');
    const salesCountsRef = firebase.database().ref('salesCounts');
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    try {
        const salesSnapshot = await salesOutcomesRef.once('value');
        const salesData = salesSnapshot.val();

        if (!salesData) {
            console.error('No sales data found.');
            return;
        }

        const weeklyAverages = {};

        // Iterate through sales data to calculate weekly averages
        for (const userId in salesData) {
            for (const saleId in salesData[userId]) {
                const sale = salesData[userId][saleId];
                const saleDate = new Date(sale.outcomeTime);

                if (saleDate >= weekAgo && saleDate < today) {
                    const saleType = sanitizeForFirebaseKey(sale.notesValue || 'unknown'); // Sanitize the sale type
                    if (!weeklyAverages[saleType]) {
                        weeklyAverages[saleType] = { total: 0, count: 0 };
                    }
                    weeklyAverages[saleType].total += 1;
                    weeklyAverages[saleType].count += 1;
                }
            }
        }

        // Calculate and store the average for each sale type
        for (const saleType in weeklyAverages) {
            const average = weeklyAverages[saleType].count
                ? weeklyAverages[saleType].total / weeklyAverages[saleType].count
                : 0;

            await salesCountsRef.child(`weeklyAverages/${saleType}`).set(average);
        }

        console.log('Weekly averages stored successfully.');

    } catch (error) {
        console.error('Error calculating and storing weekly averages:', error);
    }
}

// Function to load progress bars by comparing today's sales with weekly averages
async function loadProgressBars() {
    const salesCountsRef = firebase.database().ref('salesCounts');
    const salesOutcomesRef = firebase.database().ref('salesOutcomes');
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

    try {
        const [averagesSnapshot, salesSnapshot] = await Promise.all([
            salesCountsRef.child('weeklyAverages').once('value'),
            salesOutcomesRef.once('value')
        ]);

        const weeklyAverages = averagesSnapshot.val();
        const salesData = salesSnapshot.val();

        if (!weeklyAverages || !salesData) {
            console.error('No data found.');
            return;
        }

        const todayTotals = {};

        // Calculate today's totals
        for (const userId in salesData) {
            for (const saleId in salesData[userId]) {
                const sale = salesData[userId][saleId];
                const saleDate = new Date(sale.outcomeTime).toISOString().split('T')[0];

                if (saleDate === today) {
                    const saleType = sale.notesValue; // Assuming notesValue represents the sale type
                    if (!todayTotals[saleType]) {
                        todayTotals[saleType] = 0;
                    }
                    todayTotals[saleType] += 1;
                }
            }
        }

        // Update progress bars based on today's totals compared to weekly averages
        updateProgressBars(weeklyAverages, todayTotals);

    } catch (error) {
        console.error('Error loading progress bars:', error);
    }
}

// Function to update progress bars
function updateProgressBars(weeklyAverages, todayTotals) {
    for (const saleType in weeklyAverages) {
        const average = weeklyAverages[saleType];
        const todayTotal = todayTotals[saleType] || 0;
        const progressBar = document.getElementById(`${saleType}-progress-bar`);

        if (progressBar) {
            const progressPercentage = average ? (todayTotal / average) * 100 : 0;
            progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;

            const progressLabel = document.getElementById(`${saleType}-progress-label`);
            if (progressLabel) {
                progressLabel.textContent = `${Math.round(progressPercentage)}% of weekly average`;
            }
        }
    }
}
