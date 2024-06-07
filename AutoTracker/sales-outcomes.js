function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

function getSaleType(action, notes) {
    if (action === 'SRX: Enrolled - Rx History Not Available' || action === 'SRX: Enrolled - Rx History Received') {
        return 'Select RX';
    } else if (action === 'HRA' && /bill|billable/i.test(notes)) {
        return 'Billable HRA';
    } else if (action === 'Notes' && /(vbc|transfer|ndr|fe|final expense|national|national debt|national debt relief|value based care|oak street|osh)/i.test(notes)) {
        return 'Transfer';
    } else if (action === 'Select Patient Management') {
        return 'Select Patient Management';
    }
    return action;
}

function displaySalesOutcomes(user) {
    const database = firebase.database();
    const outcomesRef = database.ref('salesOutcomes/' + user.uid);
    const salesCountsRef = database.ref('salesCounts/' + user.uid);

    outcomesRef.on('value', (snapshot) => {
        const outcomes = snapshot.val();
        console.log('Sales outcomes retrieved:', outcomes);

        if (outcomes) {
            // Initialize sales counts
            const salesCounts = {
                billableHRA: 0,
                selectRX: 0,
                selectPatientManagement: 0,
                transfer: 0
            };

            // Process each outcome
            for (const key in outcomes) {
                const outcome = outcomes[key];
                const action = outcome.assignAction;
                const notes = outcome.notesValue;
                
                console.log(`Processing outcome - Action: "${action}", Notes: "${notes}"`);

                // Get the sale type
                const saleType = getSaleType(action, notes);
                console.log(`Identified Sale Type: ${saleType}`);

                // Update sales counts based on sale type
                if (saleType === 'Billable HRA') {
                    salesCounts.billableHRA++;
                } else if (saleType === 'Select RX') {
                    salesCounts.selectRX++;
                } else if (saleType === 'Select Patient Management') {
                    salesCounts.selectPatientManagement++;
                } else if (saleType === 'Transfer') {
                    salesCounts.transfer++;
                }
            }

            // Log final sales counts
            console.log('Final Sales Counts:', salesCounts);

            // Update the sales counts in Firebase
            salesCountsRef.set(salesCounts, (error) => {
                if (error) {
                    console.error('Failed to update sales counts:', error);
                } else {
                    console.log('Sales counts updated successfully:', salesCounts);
                }
            });

            // Display sales counts in the UI
            const outcomesContainer = document.getElementById('sales-outcomes-container');
            outcomesContainer.innerHTML = ''; // Clear previous outcomes

            const salesCountsContainer = document.createElement('div');
            salesCountsContainer.classList.add('sales-counts-container');
            for (const action in salesCounts) {
                const countElement = document.createElement('div');
                countElement.classList.add('sales-count-item');
                countElement.innerHTML = `<strong>${action}:</strong> ${salesCounts[action]}`;
                salesCountsContainer.appendChild(countElement);
            }
            outcomesContainer.appendChild(salesCountsContainer);
        } else {
            console.log('No sales outcomes found for user:', user.displayName);
        }
    }, (error) => {
        console.error('Error fetching sales outcomes:', error);
    });
}

// Attach the function to the window object
window.displaySalesOutcomes = displaySalesOutcomes;
