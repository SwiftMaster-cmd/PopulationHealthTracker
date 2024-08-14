document.addEventListener('DOMContentLoaded', function() {
    // Ensure Firebase is initialized and authenticated user is available
    firebase.auth().onAuthStateChanged(async user => {
        if (user) {
            console.log('Authenticated user:', user.displayName);
            const lastWeekSalesData = await getLastWeekSalesData(user);
            const weeklyTotals = calculateWeeklyTotals(lastWeekSalesData);
            const dailyAverages = calculateDailyAverages(weeklyTotals);

            // Assuming currentDaySales is retrieved or calculated elsewhere
            const currentDaySales = await getCurrentDaySales(user);

            updateProgressBars(currentDaySales, dailyAverages);
        } else {
            console.error('User not authenticated');
        }
    });
});

async function getLastWeekSalesData(user) {
    const salesOutcomesRef = firebase.database().ref('salesOutcomes').child(user.uid);
    const { start, end } = getLastWeekRange();

    const salesDataSnapshot = await salesOutcomesRef
        .orderByChild('outcomeTime')
        .startAt(start.getTime())
        .endAt(end.getTime())
        .once('value');

    return salesDataSnapshot.val() || {};
}

function getLastWeekRange() {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const lastWeekEnd = new Date(now); // Last week's end is last Saturday
    lastWeekEnd.setDate(now.getDate() - currentDayOfWeek);
    const lastWeekStart = new Date(lastWeekEnd); // Last week's start is the previous Sunday
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6);

    return {
        start: lastWeekStart,
        end: lastWeekEnd
    };
}

function calculateWeeklyTotals(salesData) {
    const totals = {
        selectRX: 0,
        transfer: 0,
        billableHRA: 0,
        selectPatientManagement: 0
    };

    Object.values(salesData).forEach(outcome => {
        const saleType = getSaleType(outcome.assignAction, outcome.notesValue);
        if (saleType === 'Select RX') {
            totals.selectRX++;
        } else if (saleType === 'Transfer') {
            totals.transfer++;
        } else if (saleType === 'Billable HRA') {
            totals.billableHRA++;
        } else if (saleType === 'Select Patient Management') {
            totals.selectPatientManagement++;
        }
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

async function getCurrentDaySales(user) {
    const salesOutcomesRef = firebase.database().ref('salesOutcomes').child(user.uid);
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfDay = startOfDay + 86400000; // 24 hours in milliseconds

    const currentDaySalesSnapshot = await salesOutcomesRef
        .orderByChild('outcomeTime')
        .startAt(startOfDay)
        .endAt(endOfDay)
        .once('value');

    const currentDaySales = {
        selectRX: 0,
        transfer: 0,
        billableHRA: 0,
        selectPatientManagement: 0
    };

    const salesData = currentDaySalesSnapshot.val();
    if (salesData) {
        Object.values(salesData).forEach(outcome => {
            const saleType = getSaleType(outcome.assignAction, outcome.notesValue);
            if (saleType === 'Select RX') {
                currentDaySales.selectRX++;
            } else if (saleType === 'Transfer') {
                currentDaySales.transfer++;
            } else if (saleType === 'Billable HRA') {
                currentDaySales.billableHRA++;
            } else if (saleType === 'Select Patient Management') {
                currentDaySales.selectPatientManagement++;
            }
        });
    }

    return currentDaySales;
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

function getSaleType(action, notes) {
    const normalizedAction = action.toLowerCase();

    if (normalizedAction.includes('srx: enrolled - rx history received') || normalizedAction.includes('srx: enrolled - rx history not available')) {
        return 'Select RX';
    } else if (normalizedAction.includes('hra') && /bill|billable/i.test(notes)) {
        return 'Billable HRA';
    } else if (normalizedAction.includes('notes') && /(vbc|transfer|xfer|ndr|fe|final expense|national|national debt|national debt relief|value based care|dental|oak street|osh)/i.test(notes)) {
        return 'Transfer';
    } else if (normalizedAction.includes('notes') && /(spm|select patient management)/i.test(notes)) {
        return 'Select Patient Management';
    } else if (normalizedAction.includes('spm scheduled call')) {
        return 'Select Patient Management';
    }
    return action;
}
