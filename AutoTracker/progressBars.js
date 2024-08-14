document.addEventListener('DOMContentLoaded', function() {
    const database = firebase.database();

    async function createProgressBars(user) {
        const salesCountsRef = database.ref('salesCounts/' + user.uid);
        const outcomesRef = database.ref('salesOutcomes/' + user.uid);

        try {
            const salesCountsSnapshot = await salesCountsRef.once('value');
            const dailyAverages = salesCountsSnapshot.val()?.dailyAverages;
            if (!dailyAverages) {
                console.error('Daily averages not found in salesCounts.');
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0); // Set time to start of day
            const now = new Date();

            const todaySales = {
                selectRX: 0,
                selectPatientManagement: 0,
                billableHRA: 0,
                transfer: 0
            };

            const outcomesSnapshot = await outcomesRef.once('value');
            const outcomes = outcomesSnapshot.val();

            if (outcomes) {
                for (const key in outcomes) {
                    const outcome = outcomes[key];
                    const saleType = getSaleType(outcome.assignAction, outcome.notesValue);
                    const outcomeTime = new Date(outcome.outcomeTime);

                    if (outcomeTime >= today && outcomeTime <= now) {
                        if (saleType === 'Select RX') {
                            todaySales.selectRX++;
                        } else if (saleType === 'Select Patient Management') {
                            todaySales.selectPatientManagement++;
                        } else if (saleType === 'Billable HRA') {
                            todaySales.billableHRA++;
                        } else if (saleType === 'Transfer') {
                            todaySales.transfer++;
                        }
                    }
                }
            }

            // Round the totals and daily averages
            for (let key in dailyAverages) {
                dailyAverages[key] = Math.round(dailyAverages[key]);
                todaySales[key] = Math.round(todaySales[key]);
            }

            updateProgressBars(todaySales, dailyAverages);
        } catch (error) {
            console.error('Error fetching sales data or daily averages:', error);
        }
    }

    function updateProgressBars(todaySales, dailyAverages) {
        const progressBarConfigs = [
            { id: 'selectRX', label: 'Select RX', total: dailyAverages.selectRX, current: todaySales.selectRX },
            { id: 'selectPatientManagement', label: 'Select Patient Management', total: dailyAverages.selectPatientManagement, current: todaySales.selectPatientManagement },
            { id: 'billableHRA', label: 'Billable HRA', total: dailyAverages.billableHRA, current: todaySales.billableHRA },
            { id: 'transfer', label: 'Transfer', total: dailyAverages.transfer, current: todaySales.transfer }
        ];
    
        progressBarConfigs.forEach(config => {
            if (config.total > 0) { // Only show progress bars with a positive daily average
                const progressBar = document.getElementById(config.id + '-progress');
                const progressCurrent = document.getElementById(config.id + '-current');
                const progressGoal = document.getElementById(config.id + '-goal');
    
                if (progressBar && progressCurrent && progressGoal) {
                    const percentage = Math.min((config.current / config.total) * 100, 100);
                    progressBar.style.width = percentage + '%';
                    progressCurrent.textContent = config.current;
                    progressGoal.textContent = config.total;
                    progressBar.parentElement.parentElement.style.display = 'block'; // Ensure it's visible
                }
            } else {
                // Hide the progress bar if the daily average rounds to 0
                const progressBarWrapper = document.getElementById(config.id + '-progress').parentElement.parentElement;
                progressBarWrapper.style.display = 'none';
            }
        });
    }
    
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            createProgressBars(user);
        } else {
            console.error('User not authenticated');
        }
    });
});
