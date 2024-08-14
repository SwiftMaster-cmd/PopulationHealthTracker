document.addEventListener('DOMContentLoaded', function() {
    // Authenticate and then load the progress bars
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log(`User signed in: ${user.displayName}`);
            loadProgressBars(user);
        } else {
            console.error('No user is signed in.');
        }
    });
});

async function loadProgressBars() {
    const salesOutcomesRef = firebase.database().ref('salesOutcomes');
    const currentUser = firebase.auth().currentUser;
    
    if (!currentUser) {
        console.error('No user signed in.');
        return;
    }

    try {
        const salesSnapshot = await salesOutcomesRef.once('value');
        const salesData = salesSnapshot.val();

        if (!salesData) {
            console.error('No sales data found.');
            return;
        }

        const previousWeekAverages = calculatePreviousWeekAverages(salesData);
        const todayTotals = calculateTodayTotals(salesData);

        updateProgressBars(previousWeekAverages, todayTotals);
    } catch (error) {
        console.error('Error loading progress bars:', error);
    }
}

function calculatePreviousWeekAverages(salesData) {
    const lastWeekSales = {};
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    for (const userId in salesData) {
        for (const saleId in salesData[userId]) {
            const sale = salesData[userId][saleId];
            const saleDate = new Date(sale.outcomeTime);

            if (saleDate >= weekAgo && saleDate < today) {
                const saleType = sale.notesValue; // Assuming notesValue represents the sale type
                if (!lastWeekSales[saleType]) {
                    lastWeekSales[saleType] = { total: 0, count: 0 };
                }
                lastWeekSales[saleType].total += 1;
                lastWeekSales[saleType].count += 1;
            }
        }
    }

    // Calculate the average for each sale type
    for (const saleType in lastWeekSales) {
        lastWeekSales[saleType] = lastWeekSales[saleType].count
            ? lastWeekSales[saleType].total / lastWeekSales[saleType].count
            : 0;
    }

    return lastWeekSales;
}


function calculateTodayTotals(salesData) {
    const todayTotals = {};
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

    for (const userId in salesData) {
        for (const saleId in salesData[userId]) {
            const sale = salesData[userId][saleId];
            const saleDate = new Date(sale.outcomeTime).toISOString().split('T')[0];

            if (saleDate === today) {
                const saleType = sale.notesValue; // Assuming notesValue represents the sale type
                if (!todayTotals[saleType]) {
                    todayTotals[saleType] = 0;
                }
                todayTotals[saleType] += 1; // Increment the count
            }
        }
    }

    return todayTotals;
}


function updateProgressBars(previousWeekAverages, todayTotals) {
    for (const saleType in previousWeekAverages) {
        const average = previousWeekAverages[saleType];
        const todayTotal = todayTotals[saleType];
        const progressBar = document.getElementById(`${saleType}-progress-bar`);

        if (progressBar) {
            const progressPercentage = (todayTotal / average) * 100;
            progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;

            // Optionally, you can also update a label to show progress percentage
            const progressLabel = document.getElementById(`${saleType}-progress-label`);
            if (progressLabel) {
                progressLabel.textContent = `${Math.round(progressPercentage)}% of weekly average`;
            }
        }
    }
}