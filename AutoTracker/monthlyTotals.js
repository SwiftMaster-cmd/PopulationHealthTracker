document.addEventListener('DOMContentLoaded', () => {
    loadMonthlyTotals();
});

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
                    document.getElementById('monthlySalesTotals').innerHTML = "No sales data available for this month.";
                    return;
                }

                const salesTotals = {
                    billableHRA: salesData.billableHRA || 0,
                    selectRX: salesData.selectRX || 0,
                    selectPatientManagement: salesData.selectPatientManagement || 0,
                    transfer: salesData.transfer || 0
                };

                const monthlySalesTotalsDiv = document.getElementById('monthlySalesTotals');
                monthlySalesTotalsDiv.innerHTML = `
                    <p>HRA: ${salesTotals.billableHRA}</p>
                    <p>SRX: ${salesTotals.selectRX}</p>
                    <p>SPM: ${salesTotals.selectPatientManagement}</p>
                    <p>Transfer: ${salesTotals.transfer}</p>
                `;

                // Placeholder for commission details
                // Once you provide the commission details, we can update this section to calculate and display the commission
                // monthlySalesTotalsDiv.innerHTML += `<p>Commission: $0.00</p>`;
            }).catch(error => {
                console.error('Error fetching sales data:', error);
            });
        } else {
            console.error('No user is signed in.');
        }
    });
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