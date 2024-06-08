// salesCountsHandler.js

function getCurrentDayKey() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

function getCurrentWeekKey() {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
    return `${startOfWeek.getFullYear()}-W${startOfWeek.getWeekNumber()}`;
}

Date.prototype.getWeekNumber = function() {
    const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // Format as YYYY-MM
}

function updateSalesCountsInFirebase(user, salesCounts) {
    const database = firebase.database();
    const salesCountsRef = database.ref('salesCounts/' + user.uid);

    const dayKey = getCurrentDayKey();
    const weekKey = getCurrentWeekKey();
    const monthKey = getCurrentMonthKey();

    const updates = {};
    updates[`${dayKey}/day`] = salesCounts.day;
    updates[`${weekKey}/week`] = salesCounts.week;
    updates[`${monthKey}/month`] = salesCounts.month;

    salesCountsRef.update(updates, (error) => {
        if (error) {
            console.error('Failed to update sales counts:', error);
        } else {
            console.log('Sales counts updated successfully:', salesCounts);
        }
    });
}

// Export the functions
export { getCurrentDayKey, getCurrentWeekKey, getCurrentMonthKey, updateSalesCountsInFirebase };