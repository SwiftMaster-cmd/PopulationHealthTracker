document.addEventListener('firebaseInitialized', function() {
    const database = firebase.database();

    function createProgressBar(container, label, value, max) {
        if (max === 0) return; // Don't create a progress bar if the max (daily average) is 0

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
            progressFill.style.width = `${Math.min((value / max) * 100, 100)}%`;
        }, 0);
    }

    function updateProgressBars(user) {
        const salesCountsRef = database.ref(`salesCounts/${user.uid}`);
        const outcomesRef = database.ref(`salesOutcomes/${user.uid}`);
        const now = new Date();

        // Reference to the container where progress bars will be displayed
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

            const roundedAverages = {
                selectRX: Math.round(dailyAverages.selectRX || 0),
                selectPatientManagement: Math.round(dailyAverages.selectPatientManagement || 0),
                billableHRA: Math.round(dailyAverages.billableHRA || 0),
                transfer: Math.round(dailyAverages.transfer || 0)
            };

            const currentTotals = {
                selectRX: 0,
                selectPatientManagement: 0,
                billableHRA: 0,
                transfer: 0
            };

            outcomesRef.on('value', (outcomesSnapshot) => {
                const outcomes = outcomesSnapshot.val();

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

                // Create progress bars for each sale type, but only if the average is greater than 0
                createProgressBar(progressBarsContainer, 'Select RX', currentTotals.selectRX, roundedAverages.selectRX);
                createProgressBar(progressBarsContainer, 'Select Patient Management', currentTotals.selectPatientManagement, roundedAverages.selectPatientManagement);
                createProgressBar(progressBarsContainer, 'Billable HRA', currentTotals.billableHRA, roundedAverages.billableHRA);
                createProgressBar(progressBarsContainer, 'Transfer', currentTotals.transfer, roundedAverages.transfer);
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

    // Call updateProgressBars when the user is authenticated
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            updateProgressBars(user);
        }
    });
});
