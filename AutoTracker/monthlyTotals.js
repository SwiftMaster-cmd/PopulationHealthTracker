document.addEventListener('DOMContentLoaded', () => {
    loadMonthlyTotals();
});

function loadMonthlyTotals() {
    const database = firebase.database();
    const salesCountsRef = database.ref('salesCounts');

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const currentUserId = user.uid;
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1; // Months are 0-based in JavaScript
            const currentYear = currentDate.getFullYear();
            const monthlyTotalsRef = salesCountsRef.child(currentUserId).child(`${currentYear}-${currentMonth}`);

            monthlyTotalsRef.once('value', salesSnapshot => {
                const salesData = salesSnapshot.val();
                if (!salesData) {
                    console.log("No sales data for the current month.");
                    document.getElementById('monthlySalesTotals').innerHTML = "No sales data available for this month.";
                    return;
                }

                const salesTotals = {
                    billableHRA: 0,
                    selectRX: 0,
                    selectPatientManagement: 0,
                    transfer: 0
                };

                for (const day in salesData) {
                    const dayData = salesData[day];
                    salesTotals.billableHRA += dayData.billableHRA || 0;
                    salesTotals.selectRX += dayData.selectRX || 0;
                    salesTotals.selectPatientManagement += dayData.selectPatientManagement || 0;
                    salesTotals.transfer += dayData.transfer || 0;
                }

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