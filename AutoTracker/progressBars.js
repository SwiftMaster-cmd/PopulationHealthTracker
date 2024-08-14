document.addEventListener('firebaseInitialized', function() {
    const database = firebase.database();

    function createProgressBar(container, label, value, max) {
        console.log(`Creating progress bar for ${label}: ${value}/${max}`); // Debugging log

        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';

        const progressLabel = document.createElement('span');
        progressLabel.className = 'progress-label';
        progressLabel.textContent = `${label}: ${value}/${max}`;

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';

        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.width = '0%'; // Start with 0% width for animation

        progressBar.appendChild(progressFill);
        progressContainer.appendChild(progressLabel);
        progressContainer.appendChild(progressBar);

        container.appendChild(progressContainer);

        // Animate the progress bar width to match the percentage
        setTimeout(() => {
            const percentage = Math.min((value / max) * 100, 100);
            console.log(`Animating progress bar for ${label} to ${percentage}%`); // Debugging log
            progressFill.style.width = `${percentage}%`;
        }, 0);
    }

    function updateProgressBars(user) {
        const salesCountsRef = database.ref(`salesCounts/${user.uid}`);
        const outcomesRef = database.ref(`salesOutcomes/${user.uid}`);
        const now = new Date();

        const progressBarsContainer = document.getElementById('progress-bars-container');
        if (!progressBarsContainer) {
            console.error('Progress bars container not found');
            return;
        }
        progressBarsContainer.innerHTML = ''; // Clear any existing progress bars

        salesCountsRef.child('dailyAverages').once('value', (snapshot) => {
            const dailyAverages = snapshot.val();
            if (!dailyAverages) {
                console.error('No daily averages found for the user');
                return;
            }

            console.log('Daily averages:', dailyAverages); // Debugging log

            const currentTotals = {
                selectRX: 0,
                selectPatientManagement: 0,
                billableHRA: 0,
                transfer: 0
            };

            outcomesRef.once('value', (outcomesSnapshot) => {
                const outcomes = outcomesSnapshot.val();

                console.log('Today\'s sales outcomes:', outcomes); // Debugging log

                for (const key in outcomes) {
                    const outcome = outcomes[key];
                    const outcomeTime = new Date(outcome.outcomeTime);

                    if (isSameDay(outcomeTime, now)) {
                        const saleType = getSaleType(outcome.assignAction, outcome.notesValue);

                        if (saleType === 'Select RX') {
                            currentTotals.selectRX++;
                        } else if (saleType === 'Select Patient Management') {
                            currentTotals.selectPatientManagement++;
                        } else if (saleType === 'Billable HRA') {
                            currentTotals.billableHRA++;
                        } else if (saleType === 'Transfer') {
                            currentTotals.transfer++;
                        }
                    }
                }

                console.log('Current totals:', currentTotals); // Debugging log

                // Create progress bars for all sales types
                createProgressBar(progressBarsContainer, 'Select RX', currentTotals.selectRX, dailyAverages.selectRX);
                createProgressBar(progressBarsContainer, 'Select Patient Management', currentTotals.selectPatientManagement, dailyAverages.selectPatientManagement);
                createProgressBar(progressBarsContainer, 'Billable HRA', currentTotals.billableHRA, dailyAverages.billableHRA);
                createProgressBar(progressBarsContainer, 'Transfer', currentTotals.transfer, dailyAverages.transfer);
            });
        });
    }

    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    function getSaleType(action, notes) {
        const normalizedAction = action.toLowerCase();

        if (normalizedAction.includes('srx: enrolled - rx history received') || normalizedAction.includes('srx: enrolled - rx history not available')) {
            return 'Select RX';
        } else if (normalizedAction.includes('hra') && /bill|billable/i.test(notes)) {
            return 'Billable HRA';
        } else if (normalizedAction.includes('notes') && /(vbc|transfer|xfer|ndr|fe|final expense|national|national debt|national debt relief|value based care|dental|oak street|osh)/i.test(notes)) {
            return 'Transfer';
        } else if (normalizedAction.includes('notes') && /(spm|select patient management)/i.test(notes)) {
            return 'Select Patient Management';
        } else if (normalizedAction.includes('spm scheduled call')) {
            return 'Select Patient Management';
        }
        return action;
    }

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log('User authenticated:', user.uid); // Debugging log
            updateProgressBars(user);
        } else {
            console.error('User not authenticated'); // Debugging log
        }
    });
});
