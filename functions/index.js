const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.updateSalesOutcomes = functions.database.ref('/salesOutcomes/{userId}/{outcomeId}')
    .onWrite(async (change, context) => {
        const userId = context.params.userId;
        const outcome = change.after.val();
        const database = admin.database();
        const salesCountsRef = database.ref('salesCounts/' + userId);
        const salesTimeFramesRef = database.ref('salesTimeFrames/' + userId);

        const now = new Date();

        if (!outcome) {
            console.log('No sales outcomes found for user:', userId);
            return null;
        }

        const salesCounts = {
            day: {
                billableHRA: 0,
                selectRX: 0,
                selectPatientManagement: 0,
                transfer: 0
            },
            week: {
                billableHRA: 0,
                selectRX: 0,
                selectPatientManagement: 0,
                transfer: 0
            },
            month: {
                billableHRA: 0,
                selectRX: 0,
                selectPatientManagement: 0,
                transfer: 0
            }
        };

        const salesTimeFrames = {};

        const outcomeTime = new Date(outcome.outcomeTime);
        const saleType = getSaleType(outcome.assignAction, outcome.notesValue);

        if (!salesTimeFrames[outcome.accountNumber]) {
            salesTimeFrames[outcome.accountNumber] = {};
        }

        if (!salesTimeFrames[outcome.accountNumber][saleType]) {
            salesTimeFrames[outcome.accountNumber][saleType] = [];
        }

        salesTimeFrames[outcome.accountNumber][saleType].push(outcomeTime.toISOString());

        if (isSameDay(outcomeTime, now)) {
            salesCounts.day[saleType.toLowerCase()]++;
        }

        if (isSameWeek(outcomeTime, now)) {
            salesCounts.week[saleType.toLowerCase()]++;
        }

        if (isSameMonth(outcomeTime, now)) {
            salesCounts.month[saleType.toLowerCase()]++;
        }

        try {
            await salesCountsRef.update(salesCounts);
            console.log('Sales counts updated successfully:', salesCounts);

            await salesTimeFramesRef.set(salesTimeFrames);
            console.log('Sales timeframes updated successfully:', salesTimeFrames);
        } catch (error) {
            console.error('Failed to update sales data:', error);
        }

        return null;
    });

function getSaleType(action, notes) {
    if (action.includes('Billable HRA')) {
        return 'Billable HRA';
    } else if (action.includes('Select RX')) {
        return 'Select RX';
    } else if (action.includes('Select Patient Management')) {
        return 'Select Patient Management';
    } else if (action.includes('Transfer')) {
        return 'Transfer';
    } else {
        return 'Unknown';
    }
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function isSameWeek(date1, date2) {
    const startOfWeek = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(date.setDate(diff));
    };
    return startOfWeek(date1).getTime() === startOfWeek(date2).getTime();
}

function isSameMonth(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth();
}