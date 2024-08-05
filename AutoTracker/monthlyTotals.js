document.addEventListener('DOMContentLoaded', () => {
    createLevelPicker();
    loadMonthlyTotals();
});

function createLevelPicker() {
    const levelPickerContainer = document.createElement('div');
    levelPickerContainer.className = 'select-level-container';

    const levelLabel = document.createElement('label');
    levelLabel.htmlFor = 'levelPicker';
    levelLabel.textContent = 'Select Level';

    const levelPicker = document.createElement('select');
    levelPicker.id = 'levelPicker';
    levelPicker.className = 'picker'; // Add this line to apply CSS
    levelPicker.innerHTML = `
        <option value="1">Level 1</option>
        <option value="2">Level 2</option>
        <option value="3">Level 3</option>
    `;

    // Apply Chroma.js colors
    applyChromaColors(levelPicker);

    // Set the saved level if exists
    const savedLevel = localStorage.getItem('userLevel');
    if (savedLevel) {
        levelPicker.value = savedLevel;
    }

    levelPickerContainer.appendChild(levelLabel);
    levelPickerContainer.appendChild(levelPicker);

    document.querySelector('.monthly-sales-totals-container').prepend(levelPickerContainer);

    levelPicker.addEventListener('change', () => {
        localStorage.setItem('userLevel', levelPicker.value);
        loadMonthlyTotals();
    });
}

function applyChromaColors(levelPicker) {
    const baseColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    const palette = chroma.scale([baseColor, chroma(baseColor).darken(2)]).mode('lab').colors(3);

    Array.from(levelPicker.options).forEach((option, index) => {
        option.style.backgroundColor = palette[index];
        option.style.color = chroma(palette[index]).luminance() < 0.5 ? '#ffffff' : '#000000';
    });
}

function loadMonthlyTotals() {
    const database = firebase.database();
    const salesCountsRef = database.ref('salesCounts');
    const trendsRef = database.ref('Trends');

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const currentUserId = user.uid;
            const currentMonthKey = getCurrentMonthKey();
            const monthlyTotalsRef = salesCountsRef.child(currentUserId).child('month');

            monthlyTotalsRef.on('value', salesSnapshot => {
                try {
                    const salesData = salesSnapshot.val();
                    if (!salesData) {
                        updateSalesDisplay({
                            billableHRA: 0,
                            selectRX: 0,
                            selectPatientManagement: 0,
                            transfer: 0
                        }, 0, 'N/A', { selectRX: 0, transfer: 0, billableHRA: 0, selectPatientManagement: 0 });
                        return;
                    }

                    const salesTotals = {
                        billableHRA: salesData.billableHRA || 0,
                        selectRX: salesData.selectRX || 0,
                        selectPatientManagement: salesData.selectPatientManagement || 0,
                        transfer: salesData.transfer || 0
                    };

                    const level = parseInt(document.getElementById('levelPicker').value);
                    const commission = calculateCommission(salesTotals, level);

                    const previousMonthKey = getPreviousMonthKey();
                    salesCountsRef.child(currentUserId).child('month').child(previousMonthKey).once('value', prevSnapshot => {
                        const prevSalesData = prevSnapshot.val();
                        const prevTotal = prevSalesData ? calculateTotal(prevSalesData, level) : 'N/A';

                        salesCountsRef.child(currentUserId).once('value', allSnapshot => {
                            const allSalesData = allSnapshot.val();
                            const average = calculateAverage(allSalesData, level);

                            const daysPassed = new Date().getDate();
                            const workingDaysLeft = getWorkingDaysLeft();

                            const trendValues = {
                                selectRX: calculateTrend(salesTotals.selectRX, daysPassed),
                                transfer: calculateTrend(salesTotals.transfer, daysPassed),
                                billableHRA: calculateTrend(salesTotals.billableHRA, daysPassed),
                                selectPatientManagement: calculateTrend(salesTotals.selectPatientManagement, daysPassed)
                            };

                            const dailyAverages = {
                                selectRX: calculateDailyAverage(salesTotals.selectRX, daysPassed),
                                transfer: calculateDailyAverage(salesTotals.transfer, daysPassed),
                                billableHRA: calculateDailyAverage(salesTotals.billableHRA, daysPassed),
                                selectPatientManagement: calculateDailyAverage(salesTotals.selectPatientManagement, daysPassed)
                            };

                            const pushValues = {
                                selectRX: salesTotals.selectRX + trendValues.selectRX,
                                transfer: salesTotals.transfer + trendValues.transfer,
                                billableHRA: salesTotals.billableHRA + trendValues.billableHRA,
                                selectPatientManagement: salesTotals.selectPatientManagement + trendValues.selectPatientManagement
                            };

                            const trendData = {
                                dailyAverages,
                                trendValues,
                                pushValues
                            };

                            // Save the trend data back to Firebase
                            trendsRef.child(currentUserId).child(currentMonthKey).set(trendData);

                            updateSalesDisplay(salesTotals, commission, prevTotal, average, trendValues, dailyAverages, pushValues);
                        });
                    });
                } catch (error) {
                    console.error('Error processing sales data:', error);
                }
            });
        } else {
            console.error('No user is signed in.');
        }
    });
}

function updateSalesDisplay(salesTotals, commission, prevTotal, average, trendValues, dailyAverages, pushValues) {
    // ... existing code ...

    // Calculate current total commission
    const currentCommissionTotal = (salesTotals.selectRX * commission.srxPayout) +
                                   (salesTotals.transfer * commission.transferPayout) +
                                   (salesTotals.billableHRA * commission.hraPayout) +
                                   (salesTotals.selectPatientManagement * commission.spmPayout);

    // Display current totals
    document.getElementById('srx-value').textContent = `Current: $${(salesTotals.selectRX * commission.srxPayout).toFixed(2)} (${salesTotals.selectRX})`;
    document.getElementById('transfer-value').textContent = `Current: $${(salesTotals.transfer * commission.transferPayout).toFixed(2)} (${salesTotals.transfer})`;
    document.getElementById('hra-value').textContent = `Current: $${(salesTotals.billableHRA * commission.hraPayout).toFixed(2)} (${salesTotals.billableHRA})`;
    document.getElementById('spm-value').textContent = `Current: $${(salesTotals.selectPatientManagement * commission.spmPayout).toFixed(2)} (${salesTotals.selectPatientManagement})`;

    // Display trend values
    document.getElementById('srx-trend').textContent = `Trend: $${((salesTotals.selectRX + trendValues.selectRX) * commission.srxPayout).toFixed(2)}`;
    document.getElementById('transfer-trend').textContent = `Trend: $${((salesTotals.transfer + trendValues.transfer) * commission.transferPayout).toFixed(2)}`;
    document.getElementById('hra-trend').textContent = `Trend: $${((salesTotals.billableHRA + trendValues.billableHRA) * commission.hraPayout).toFixed(2)}`;
    document.getElementById('spm-trend').textContent = `Trend: $${((salesTotals.selectPatientManagement + trendValues.selectPatientManagement) * commission.spmPayout).toFixed(2)}`;

    // Display push values
    document.getElementById('srx-push').textContent = `Push: $${((dailyAverages.selectRX * getWorkingDaysLeft()) * commission.srxPayout).toFixed(2)}`;
    document.getElementById('transfer-push').textContent = `Push: $${((dailyAverages.transfer * getWorkingDaysLeft()) * commission.transferPayout).toFixed(2)}`;
    document.getElementById('hra-push').textContent = `Push: $${((dailyAverages.billableHRA * getWorkingDaysLeft()) * commission.hraPayout).toFixed(2)}`;
    document.getElementById('spm-push').textContent = `Push: $${((dailyAverages.selectPatientManagement * getWorkingDaysLeft()) * commission.spmPayout).toFixed(2)}`;

    // Display current total
    document.getElementById('total-value').textContent = `$${currentCommissionTotal.toFixed(2)}`;

    // Display last month's total
    const lastMonthElement = document.getElementById('last-month-value');
    if (prevTotal === 'N/A') {
        lastMonthElement.textContent = 'N/A';
    } else {
        lastMonthElement.textContent = `$${prevTotal.toFixed(2)}`;
        lastMonthElement.style.color = prevTotal > currentCommissionTotal ? 'red' : 'green';
    }

    // Display average
    const averageElement = document.getElementById('average-value');
    averageElement.textContent = `$${average.toFixed(2)}`;
    averageElement.style.color = average > currentCommissionTotal ? 'red' : 'green';
}


function calculateCommission(salesTotals, level) {
    let srxPayout;
    let transferPayout;
    let hraPayout;
    let spmPayout = 11;  // Example value, adjust accordingly

    if (level === 3) {
        srxPayout = getPayout(salesTotals.selectRX, [
            { min: 75, max: Infinity, payout: 17.00 },
            { min: 65, max: 74, payout: 16.50 },
            { min: 30, max: 64, payout: 16.00 },
            { min: 15, max: 29, payout: 15.50 },
            { min: 0, max: 14, payout: 15.00 }
        ]);
        transferPayout = getPayout(salesTotals.transfer, [
            { min: 50, max: Infinity, payout: 11.00 },
            { min: 35, max: 49, payout: 10.00 },
            { min: 20, max: 34, payout: 9.00 },
            { min: 10, max: 19, payout: 8.00 },
            { min: 0, max: 9, payout: 7.00 }
        ]);
        hraPayout = getPayout(salesTotals.billableHRA, [
            { min: 50, max: Infinity, payout: 6.00 },
            { min: 35, max: 49, payout: 5.00 },
            { min: 20, max: 34, payout: 4.00 },
            { min: 10, max: 19, payout: 3.00 },
            { min: 0, max: 9, payout: 2.00 }
        ]);
    } else if (level === 2) {
        srxPayout = getPayout(salesTotals.selectRX, [
            { min: 75, max: Infinity, payout: 18.00 },
            { min: 65, max: 74, payout: 17.50 },
            { min: 30, max: 64, payout: 17.00 },
            { min: 15, max: 29, payout: 16.50 },
            { min: 0, max: 14, payout: 16.00 }
        ]);
        transferPayout = getPayout(salesTotals.transfer, [
            { min: 40, max: Infinity, payout: 10.00 },
            { min: 30, max: 39, payout: 9.25 },
            { min: 15, max: 29, payout: 8.50 },
            { min: 10, max: 14, payout: 7.75 },
            { min: 0, max: 9, payout: 7.00 }
        ]);
        hraPayout = getPayout(salesTotals.billableHRA, [
            { min: 45, max: Infinity, payout: 5.00 },
            { min: 30, max: 44, payout: 4.25 },
            { min: 20, max: 29, payout: 3.50 },
            { min: 10, max: 19, payout: 2.75 },
            { min: 0, max: 9, payout: 2.00 }
        ]);
    } else if (level === 1) {
        srxPayout = getPayout(salesTotals.selectRX, [
            { min: 75, max: Infinity, payout: 19.00 },
            { min: 65, max: 74, payout: 18.50 },
            { min: 30, max: 64, payout: 18.00 },
            { min: 15, max: 29, payout: 17.50 },
            { min: 0, max: 14, payout: 17.00 }
        ]);
        transferPayout = getPayout(salesTotals.transfer, [
            { min: 25, max: Infinity, payout: 8.00 },
            { min: 20, max: 24, payout: 7.50 },
            { min: 10, max: 19, payout: 7.00 },
            { min: 5, max: 9, payout: 6.50 },
            { min: 0, max: 4, payout: 6.00 }
        ]);
        hraPayout = getPayout(salesTotals.billableHRA, [
            { min: 40, max: Infinity, payout: 4.00 },
            { min: 30, max: 39, payout: 3.50 },
            { min: 15, max: 29, payout: 3.00 },
            { min: 5, max: 14, payout: 2.50 },
            { min: 0, max: 4, payout: 2.00 }
        ]);
    }

    return { srxPayout, transferPayout, hraPayout, spmPayout };
}

function getPayout(count, tiers) {
    for (const tier of tiers) {
        if (count >= tier.min && count <= tier.max) {
            return tier.payout;
        }
    }
    return 0;
}

function calculateTotal(salesData, level) {
    const commission = calculateCommission(salesData, level);
    const total = (salesData.selectRX * commission.srxPayout) + (salesData.transfer * commission.transferPayout) + (salesData.billableHRA * commission.hraPayout) + (salesData.selectPatientManagement * commission.spmPayout);
    return total;
}

function calculateAverage(allSalesData, level) {
    if (!allSalesData) return 0;

    let totalSum = 0;
    let monthCount = 0;

    Object.keys(allSalesData).forEach(monthKey => {
        if (monthKey !== getCurrentMonthKey()) {
            const monthData = allSalesData[monthKey];
            totalSum += calculateTotal(monthData, level);
            monthCount++;
        }
    });

    if (monthCount === 0) return 0;
    return totalSum / monthCount;
}

function getPreviousMonthKey() {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Helper functions
function formatDate(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleDateString();
}

function formatTime(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleTimeString();
}

function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

function getSaleType(action, notes) {
    const normalizedAction = action.toLowerCase();

    if (normalizedAction.includes('srx: enrolled - rx history received') || normalizedAction.includes('srx: enrolled - rx history not available')) {
        return 'Select RX';
    } else if (normalizedAction.includes('hra') && /bill|billable/i.test(notes)) {
        return 'Billable HRA';
    } else if (normalizedAction.includes('notes') && /(vbc|transfer|ndr|fe|final expense|national|national debt|national debt relief|value based care|oak street|osh)/i.test(notes)) {
        return 'Transfer';
    } else if (normalizedAction.includes('select patient management')) {
        return 'Select Patient Management';
    }
    return action;
}

function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}


function getWorkingDaysLeft() {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    let count = 0;

    for (let day = now.getDate(); day <= end.getDate(); day++) {
        const date = new Date(now.getFullYear(), now.getMonth(), day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) count++; // Exclude weekends
    }
    return count;
}

function calculateDailyAverage(total, daysPassed) {
    return total / daysPassed;
}

function calculateTrend(total, daysPassed) {
    const dailyAverage = calculateDailyAverage(total, daysPassed);
    const workingDaysLeft = getWorkingDaysLeft();
    return dailyAverage * workingDaysLeft;
}
