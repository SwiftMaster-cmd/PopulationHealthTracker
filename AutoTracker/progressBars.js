document.addEventListener('DOMContentLoaded', () => {
    loadProgressBars();
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

    for (const saleType in salesData) {
        let total = 0;
        let count = 0;

        for (const day in salesData[saleType]) {
            const saleDate = new Date(day);

            if (saleDate >= weekAgo && saleDate < today) {
                total += salesData[saleType][day];
                count++;
            }
        }

        lastWeekSales[saleType] = count ? total / count : 0; // Calculate the average
    }

    return lastWeekSales;
}

function calculateTodayTotals(salesData) {
    const todayTotals = {};
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

    for (const saleType in salesData) {
        todayTotals[saleType] = salesData[saleType][today] || 0; // Get today's total or 0 if none
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
