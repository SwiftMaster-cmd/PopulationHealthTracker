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

    exports.loadLeaderboard = functions.https.onCall(async (data, context) => {
        const period = data.period || 'day';
        const saleType = data.saleType || 'selectRX';
        const database = admin.database();
        const salesCountsRef = database.ref('salesCounts');
        const usersRef = database.ref('users');
    
        const salesCountsSnapshot = await salesCountsRef.once('value');
        const salesData = salesCountsSnapshot.val();
        if (!salesData) {
            throw new functions.https.HttpsError('not-found', 'No sales data found');
        }
    
        const usersSnapshot = await usersRef.once('value');
        const usersData = usersSnapshot.val();
    
        const users = [];
        for (const userId in salesData) {
            const userData = salesData[userId];
            let count = 0;
            if (period === 'day') {
                count = userData.day && userData.day[saleType] ? userData.day[saleType] : 0;
            } else if (period === 'week') {
                count = userData.week && userData.week[saleType] ? userData.week[saleType] : 0;
            } else if (period === 'month') {
                count = userData.month && userData.month[saleType] ? userData.month[saleType] : 0;
            }
            let name = usersData && usersData[userId] && usersData[userId].name ? usersData[userId].name : 'Unknown User';
            if (name.length > 10) {
                name = name.substring(0, 8); // Truncate name to 8 characters
            }
            users.push({ userId, name, count });
        }
    
        users.sort((a, b) => b.count - a.count);
        return users;
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


const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.checkAndSetDailySales = functions.pubsub.schedule('every day 00:00').timeZone('America/New_York').onRun(async (context) => {
    const database = admin.database();
    const salesCountsRef = database.ref('salesCounts');
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    try {
        const salesCountsSnapshot = await salesCountsRef.once('value');
        const salesCountsData = salesCountsSnapshot.val();

        if (!salesCountsData) {
            console.log('No sales data found.');
            return null;
        }

        for (const userId in salesCountsData) {
            const userSalesData = salesCountsData[userId];

            // Check if each sale type has an entry for today
            const saleTypes = ['billableHRA', 'selectPatientManagement', 'selectRX', 'transfer'];

            saleTypes.forEach(saleType => {
                if (!userSalesData.day || userSalesData.day[saleType] === undefined) {
                    // Set the sales count to 0 if there's no entry for today
                    salesCountsRef.child(`${userId}/day/${saleType}`).set(0);
                    console.log(`Set ${saleType} sales for ${userId} to 0 for today.`);
                }
            });
        }

        console.log('Daily sales check completed.');
        return null;
    } catch (error) {
        console.error('Error checking and setting daily sales:', error);
        return null;
    }
});
