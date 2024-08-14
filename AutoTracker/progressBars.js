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
    try {
        const salesCountsRef = firebase.database().ref('salesCounts');
        const usersRef = firebase.database().ref('users');
        const currentUserId = firebase.auth().currentUser?.uid;

        if (!currentUserId) {
            console.error('No user is signed in.');
            return;
        }

        const currentDate = new Date();
        const currentDayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const lastWeekStart = new Date();
        lastWeekStart.setDate(currentDate.getDate() - currentDayOfWeek - 7);
        const lastWeekEnd = new Date();
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);

        // Get sales data for the last week
        const lastWeekSalesRef = salesCountsRef.child(currentUserId).orderByKey()
            .startAt(formatDateKey(lastWeekStart))
            .endAt(formatDateKey(lastWeekEnd));
        
        const lastWeekSalesSnapshot = await lastWeekSalesRef.once('value');
        const lastWeekSalesData = lastWeekSalesSnapshot.val();

        if (!lastWeekSalesData) {
            console.error('No sales data for last week.');
            return;
        }

        const weeklyTotals = calculateWeeklyTotals(lastWeekSalesData);
        const dailyAverages = calculateDailyAverages(weeklyTotals);

        // Get current day's sales data
        const currentDaySalesRef = salesCountsRef.child(currentUserId).child(getCurrentDateKey());
        const currentDaySalesSnapshot = await currentDaySalesRef.once('value');
        const currentDaySales = currentDaySalesSnapshot.val() || { selectRX: 0, transfer: 0, billableHRA: 0, selectPatientManagement: 0 };

        // Update progress bars
        updateProgressBars(currentDaySales, dailyAverages);
    } catch (error) {
        console.error('Error loading progress bars:', error);
    }
}

function calculateWeeklyTotals(salesData) {
    const totals = {
        selectRX: 0,
        transfer: 0,
        billableHRA: 0,
        selectPatientManagement: 0
    };

    Object.values(salesData).forEach(dayData => {
        totals.selectRX += dayData.selectRX || 0;
        totals.transfer += dayData.transfer || 0;
        totals.billableHRA += dayData.billableHRA || 0;
        totals.selectPatientManagement += dayData.selectPatientManagement || 0;
    });

    return totals;
}

function calculateDailyAverages(weeklyTotals) {
    const daysInWeek = 5; // Assuming a 5-day work week
    return {
        selectRX: weeklyTotals.selectRX / daysInWeek,
        transfer: weeklyTotals.transfer / daysInWeek,
        billableHRA: weeklyTotals.billableHRA / daysInWeek,
        selectPatientManagement: weeklyTotals.selectPatientManagement / daysInWeek
    };
}

function updateProgressBars(currentDaySales, dailyAverages) {
    updateProgressBar('srx', currentDaySales.selectRX, dailyAverages.selectRX);
    updateProgressBar('transfer', currentDaySales.transfer, dailyAverages.transfer);
    updateProgressBar('hra', currentDaySales.billableHRA, dailyAverages.billableHRA);
    updateProgressBar('spm', currentDaySales.selectPatientManagement, dailyAverages.selectPatientManagement);
}

function updateProgressBar(salesType, currentValue, goalValue) {
    const progressBar = document.getElementById(`${salesType}-progress-bar`);
    if (!progressBar) {
        console.error(`Progress bar element not found for ${salesType}`);
        return;
    }

    const percentage = Math.min(100, (currentValue / goalValue) * 100).toFixed(2);
    console.log(`Updating ${salesType} progress bar: ${currentValue} / ${goalValue} (${percentage}%)`);

    progressBar.style.width = `${percentage}%`;
    progressBar.textContent = `${currentValue} / ${goalValue} (${percentage}%)`;
}

function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getCurrentDateKey() {
    const now = new Date();
    return formatDateKey(now);
}
