/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.processSalesOutcomes = functions.database.ref('/salesOutcomes/{userId}')
    .onWrite((change, context) => {
        const userId = context.params.userId;
        const outcomes = change.after.val();
        if (!outcomes) return null;

        const now = new Date();
        const salesCounts = {
            day: { billableHRA: 0, selectRX: 0, selectPatientManagement: 0, transfer: 0 },
            week: { billableHRA: 0, selectRX: 0, selectPatientManagement: 0, transfer: 0 },
            month: { billableHRA: 0, selectRX: 0, selectPatientManagement: 0, transfer: 0 }
        };
        const salesTimeFrames = {};

        for (const key in outcomes) {
            const outcome = outcomes[key];
            const action = outcome.assignAction;
            const notes = outcome.notesValue;
            const outcomeTime = new Date(outcome.outcomeTime);
            const saleType = getSaleType(action, notes);

            if (!salesTimeFrames[outcome.accountNumber]) {
                salesTimeFrames[outcome.accountNumber] = {};
            }
            if (!salesTimeFrames[outcome.accountNumber][saleType]) {
                salesTimeFrames[outcome.accountNumber][saleType] = [];
            }
            salesTimeFrames[outcome.accountNumber][saleType].push(outcomeTime.toISOString());

            if (isSameDay(outcomeTime, now)) {
                incrementCount(salesCounts.day, saleType);
            }
            if (isSameWeek(outcomeTime, now)) {
                incrementCount(salesCounts.week, saleType);
            }
            if (isSameMonth(outcomeTime, now)) {
                incrementCount(salesCounts.month, saleType);
            }
        }

        const salesCountsRef = admin.database().ref(`salesCounts/${userId}`);
        const salesTimeFramesRef = admin.database().ref(`salesTimeFrames/${userId}`);

        return Promise.all([
            salesCountsRef.set(salesCounts),
            salesTimeFramesRef.set(salesTimeFrames)
        ]);
    });

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

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function isSameWeek(date1, date2) {
    const week1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate() - date1.getDay() + (date1.getDay() === 0 ? -6 : 1));
    const week2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate() - date2.getDay() + (date2.getDay() === 0 ? -6 : 1));
    return week1.getTime() === week2.getTime();
}

function isSameMonth(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth();
}

function incrementCount(counts, saleType) {
    if (saleType === 'Billable HRA') {
        counts.billableHRA++;
    } else if (saleType === 'Select RX') {
        counts.selectRX++;
    } else if (saleType === 'Select Patient Management') {
        counts.selectPatientManagement++;
    } else if (saleType === 'Transfer') {
        counts.transfer++;
    }
}