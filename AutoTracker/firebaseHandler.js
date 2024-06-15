// Functions to handle Firebase interactions
function updateSalesCounts(user, salesCounts) {
    const database = firebase.database();
    const salesCountsRef = database.ref('salesCounts/' + user.uid);
    salesCountsRef.update(salesCounts, (error) => {
        if (error) {
            console.error('Failed to update sales counts:', error);
        } else {
            console.log('Sales counts updated successfully:', salesCounts);
        }
    });
}

function setSalesTimeFrames(user, salesTimeFrames) {
    const database = firebase.database();
    const salesTimeFramesRef = database.ref('salesTimeFrames/' + user.uid);
    salesTimeFramesRef.set(salesTimeFrames, (error) => {
        if (error) {
            console.error('Failed to update sales timeframes:', error);
        } else {
            console.log('Sales timeframes updated successfully:', salesTimeFrames);
        }
    });
}
