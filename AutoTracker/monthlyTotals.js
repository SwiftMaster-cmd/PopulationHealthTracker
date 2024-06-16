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

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const currentUserId = user.uid;
            const currentMonthKey = getCurrentMonthKey();
            const monthlyTotalsRef = salesCountsRef.child(currentUserId).child('month');

            monthlyTotalsRef.once('value', salesSnapshot => {
                const salesData = salesSnapshot.val();
                if (!salesData) {
                    console.log("No sales data for the current month.");
                    updateSalesDisplay({
                        billableHRA: 0,
                        selectRX: 0,
                        selectPatientManagement: 0,
                        transfer: 0
                    });
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

                updateSalesDisplay(salesTotals, commission);
            }).catch(error => {
                console.error('Error fetching sales data:', error);
            });
        } else {
            console.error('No user is signed in.');
        }
    });
}

function updateSalesDisplay(salesTotals, commission) {
    document.getElementById('srx-value').textContent = `$${(salesTotals.selectRX * commission).toFixed(2)}`;
    document.getElementById('srx-count').textContent = salesTotals.selectRX;

    document.getElementById('transfer-value').textContent = `$${salesTotals.transfer}`;
    document.getElementById('transfer-count').textContent = salesTotals.transfer;

    document.getElementById('hra-value').textContent = `$${salesTotals.billableHRA}`;
    document.getElementById('hra-count').textContent = salesTotals.billableHRA;

    document.getElementById('spm-value').textContent = `$${salesTotals.selectPatientManagement}`;
    document.getElementById('spm-count').textContent = salesTotals.selectPatientManagement;

    const totalSales = salesTotals.selectRX + salesTotals.transfer + salesTotals.billableHRA + salesTotals.selectPatientManagement;
    document.getElementById('total-value').textContent = `$${totalSales.toFixed(2)}`;

    const averageSales = totalSales / 4; // Assuming 4 types of sales
    document.getElementById('average-value').textContent = `$${averageSales.toFixed(2)}`;
}

function calculateCommission(salesTotals, level) {
    let srxPayout;

    if (level === 1) {
        srxPayout = getPayout(salesTotals.selectRX, [
            { min: 75, max: Infinity, payout: 17.00 },
            { min: 65, max: 74, payout: 16.50 },
            { min: 30, max: 64, payout: 16.00 },
            { min: 15, max: 29, payout: 15.50 },
            { min: 0, max: 14, payout: 15.00 }
        ]);
    } else if (level === 2) {
        srxPayout = getPayout(salesTotals.selectRX, [
            { min: 75, max: Infinity, payout: 18.00 },
            { min: 65, max: 74, payout: 17.50 },
            { min: 30, max: 64, payout: 17.00 },
            { min: 15, max: 29, payout: 16.50 },
            { min: 0, max: 14, payout: 16.00 }
        ]);
    } else if (level === 3) {
        srxPayout = getPayout(salesTotals.selectRX, [
            { min: 75, max: Infinity, payout: 19.00 },
            { min: 65, max: 74, payout: 18.50 },
            { min: 30, max: 64, payout: 18.00 },
            { min: 15, max: 29, payout: 17.50 },
            { min: 0, max: 14, payout: 17.00 }
        ]);
    }

    const spmPayout = salesTotals.selectPatientManagement * 11.00;
    // Add additional commission calculations for other sales types if needed

    return srxPayout + spmPayout;
}

function getPayout(count, tiers) {
    for (const tier of tiers) {
        if (count >= tier.min && count <= tier.max) {
            return count * tier.payout;
        }
    }
    return 0;
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