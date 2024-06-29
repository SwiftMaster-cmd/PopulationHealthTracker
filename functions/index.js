const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const database = admin.database();

// Helper functions
// ... (Previous helper functions remain unchanged)

// Cloud Function to update sales counts and timeframes
exports.updateSalesData = functions.database.ref('/salesOutcomes/{userId}/{saleId}')
    .onWrite((change, context) => {
        const userId = context.params.userId;
        const saleId = context.params.saleId;

        const newValue = change.after.val();
        const previousValue = change.before.val();

        if (!newValue || newValue.assignAction.trim() === "--") {
            console.log(`No valid sales outcome data found for ${saleId}`);
            return null;
        }

        console.log(`Processing sale outcome ${saleId} for user ${userId}`);

        const action = newValue.assignAction;
        const notes = newValue.notesValue;
        const outcomeTime = new Date(newValue.outcomeTime);

        const saleType = getSaleType(action, notes);

        const updates = {};

        // Update sales counts based on timeframe
        const dayKey = getCurrentDayKey();
        const weekKey = getCurrentWeekKey();
        const monthKey = getCurrentMonthKey();

        const salesCountsPath = `/salesCounts/${userId}`;
        const salesTimeFramesPath = `/salesTimeFrames/${userId}/${saleId}`;

        const salesCountsRef = database.ref(salesCountsPath);
        const salesTimeFramesRef = database.ref(salesTimeFramesPath);

        updates[salesTimeFramesPath] = {
            action,
            outcomeTime: outcomeTime.toISOString(),
            saleType
        };

        if (isSameDay(outcomeTime, new Date())) {
            updates[`${salesCountsPath}/day/${saleType}`] = admin.database.ServerValue.increment(1);
        }

        if (isSameWeek(outcomeTime, new Date())) {
            updates[`${salesCountsPath}/week/${saleType}`] = admin.database.ServerValue.increment(1);
        }

        if (isSameMonth(outcomeTime, new Date())) {
            updates[`${salesCountsPath}/month/${saleType}`] = admin.database.ServerValue.increment(1);
        }

        return database.ref().update(updates)
            .then(() => {
                console.log('Sales data updated successfully:', updates);
                return null;
            })
            .catch((error) => {
                console.error('Error updating sales data:', error);
                return null;
            });
    });

// Scheduled Function to reset daily, weekly, and monthly sales counts
exports.resetSalesCounts = functions.pubsub.schedule('0 0 * * *').timeZone('America/New_York').onRun((context) => {
    console.log('Daily reset triggered at midnight');

    const database = admin.database();
    const salesCountsRef = database.ref('salesCounts');

    // Update sales counts to zero for new day, week, and month
    const updates = {};
    updates['day'] = {};
    updates['week'] = {};
    updates['month'] = {};

    return salesCountsRef.once('value', snapshot => {
        const salesCountsData = snapshot.val();
        for (const userId in salesCountsData) {
            updates['day'][userId] = {};
            updates['week'][userId] = {};
            updates['month'][userId] = {};

            // Reset day count to zero
            updates['day'][userId] = Object.keys(salesCountsData[userId].day || {}).reduce((acc, saleType) => {
                acc[saleType] = 0;
                return acc;
            }, {});

            // Reset week count to zero if it's a new week
            if (!isSameWeek(new Date(), new Date())) {
                updates['week'][userId] = Object.keys(salesCountsData[userId].week || {}).reduce((acc, saleType) => {
                    acc[saleType] = 0;
                    return acc;
                }, {});
            }

            // Reset month count to zero if it's a new month
            if (!isSameMonth(new Date(), new Date())) {
                updates['month'][userId] = Object.keys(salesCountsData[userId].month || {}).reduce((acc, saleType) => {
                    acc[saleType] = 0;
                    return acc;
                }, {});
            }
        }

        return salesCountsRef.update(updates)
            .then(() => {
                console.log('Sales counts reset successfully for day, week, and month.');
                return null;
            })
            .catch((error) => {
                console.error('Error resetting sales counts:', error);
                return null;
            });
    });
});