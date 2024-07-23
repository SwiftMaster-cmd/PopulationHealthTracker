document.addEventListener('DOMContentLoaded', function() {
    // Helper functions
    function formatDate(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleDateString();
    }
    

    



      


        document.getElementById('exportSalesData').addEventListener('click', async function() {
            const database = firebase.database();
            const salesOutcomesRef = database.ref('salesOutcomes');
            
            try {
                const snapshot = await salesOutcomesRef.once('value');
                const data = snapshot.val();
                if (data) {
                    const jsonData = JSON.stringify(data);
                    const blob = new Blob([jsonData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'salesData.json';
                    a.click();
                    URL.revokeObjectURL(url);
                    console.log('Sales data exported successfully');
                } else {
                    console.log('No sales data found');
                }
            } catch (error) {
                console.error('Error exporting sales data:', error);
            }
      
    
        // Function to handle file selection for import
        async function handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) {
                return;
            }
    
            const reader = new FileReader();
            reader.onload = async function(e) {
                const contents = e.target.result;
                try {
                    const data = JSON.parse(contents);
                    console.log('Data to import:', data);
                    await importSalesData(data);
                } catch (error) {
                    console.error('Error reading or importing sales data:', error);
                }
            };
            reader.readAsText(file);
        }
    
        // Attach the file select handler
        document.getElementById('importSalesData').addEventListener('change', handleFileSelect, false);
        document.getElementById('importSalesDataButton').addEventListener('click', function() {
            document.getElementById('importSalesData').click();
        });
    
        // Function to import sales data into Firebase
        async function importSalesData(newData) {
            const database = firebase.database();
            const salesOutcomesRef = database.ref('salesOutcomes');
    
            try {
                // Fetch all existing sales outcomes
                const existingSnapshot = await salesOutcomesRef.once('value');
                const existingData = existingSnapshot.val() || {};
                const seenOutcomes = {};
    
                // Index existing data
                console.log("Indexing existing data...");
                for (const userId in existingData) {
                    for (const outcomeId in existingData[userId]) {
                        const outcome = existingData[userId][outcomeId];
                        const key = generateUniqueKey(outcome);
                        seenOutcomes[key] = { userId, outcomeId, outcomeTime: outcome.outcomeTime };
                    }
                }
                console.log("Existing data indexed:", seenOutcomes);
    
                // Process each user in the new data
                for (const userId in newData) {
                    const userSalesRef = salesOutcomesRef.child(userId);
    
                    // Iterate over each sale and add it to Firebase if not a duplicate
                    for (const outcomeId in newData[userId]) {
                        const newSale = newData[userId][outcomeId];
                        const key = generateUniqueKey(newSale);
    
                        if (seenOutcomes[key]) {
                            const existingTime = new Date(seenOutcomes[key].outcomeTime);
                            const newTime = new Date(newSale.outcomeTime);
    
                            if (newTime > existingTime) {
                                // If the new sale is newer, update the existing record
                                console.log(`Updating sale for user ${userId}:`, newSale);
                                await userSalesRef.child(seenOutcomes[key].outcomeId).set(newSale);
                                seenOutcomes[key] = { userId, outcomeId, outcomeTime: newSale.outcomeTime };
                            } else {
                                console.log(`Skipping older sale for user ${userId}:`, newSale);
                            }
                        } else {
                            // If not a duplicate, add the new sale
                            console.log(`Adding new sale for user ${userId}:`, newSale);
                            const newOutcomeRef = await userSalesRef.push(newSale);
                            seenOutcomes[key] = { userId, outcomeId: newOutcomeRef.key, outcomeTime: newSale.outcomeTime };
                        }
                    }
                }
                console.log('Sales data imported successfully');
            } catch (error) {
                console.error('Error importing sales data:', error);
            }
        }
    
        // Function to generate a unique key for each sale outcome
        function generateUniqueKey(outcome) {
            const action = outcome.assignAction;
            const accountNumber = outcome.accountNumber;
            const firstName = outcome.customerInfo.firstName;
            const lastName = outcome.customerInfo.lastName;
            return `${accountNumber}-${firstName}-${lastName}-${action}`;
        }
    });



    function formatTime(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleTimeString();
    }



    
    function getSaleType(action, notes) {
        const normalizedAction = action.toLowerCase();

        if (normalizedAction.includes('srx: enrolled - rx history received') || normalizedAction.includes('srx: enrolled - rx history not available')) {
            return 'Select RX';
        } else if (normalizedAction.includes('hra') && /bill|billable/i.test(notes)) {
            return 'Billable HRA';
        } else if (normalizedAction.includes('notes') && /(vbc|transfer|ndr|fe|final expense|national|national debt|national debt relief|value based care|oak street|osh)/i.test(notes)) {
            return 'Transfer';
        } else if (normalizedAction.includes('notes') && /(spm|select patient management)/i.test(notes)) {
            return 'Select Patient Management';
        }
        return action;
    }


    Date.prototype.getWeekNumber = function() {
        const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };



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

    let currentSaleIndex = 0;
    let salesData = [];
    let filteredSalesData = [];

    function updateSalesDisplay() {
        const salesToDisplay = filteredSalesData.length ? filteredSalesData : salesData;
        if (salesToDisplay.length === 0) return;
    
        const sale = salesToDisplay[currentSaleIndex];
        const leadIdContainer = document.getElementById('lead-id-container');
        const salesOutcomesContainer = document.getElementById('sales-outcomes-container');
        const customerInfoContainer = document.getElementById('customer-info-container');
        const counter = document.getElementById('counter');
    
        if (leadIdContainer) {
            leadIdContainer.textContent = `Lead ID: ${sale.accountNumber || 'N/A'}`;
        }
    
        if (salesOutcomesContainer) {
            salesOutcomesContainer.innerHTML = `
                <div class="sales-history-item">
                    <div class="details">
                        <p>Sale: ${getSaleType(sale.assignAction, sale.notesValue)}</p>
                        <p>Notes: ${sale.notesValue || 'No notes'}</p>
                    </div>
                    <div class="date-time">
                        <span>${formatDate(sale.outcomeTime)}</span>
                        <span>${formatTime(sale.outcomeTime)}</span>
                    </div>
                </div>
            `;
        }
    
        if (customerInfoContainer) {
            const customerInfoHtml = displayCustomerInfo(sale.customerInfo);
            customerInfoContainer.innerHTML = customerInfoHtml;
        }
    
        if (counter) {
            counter.textContent = `${currentSaleIndex + 1} of ${salesToDisplay.length}`;
        }
    }

    function displaySalesOutcomes(user) {
        const database = firebase.database();
        const outcomesRef = database.ref('salesOutcomes/' + user.uid);
        const salesCountsRef = database.ref('salesCounts/' + user.uid);
        const salesTimeFramesRef = database.ref('salesTimeFrames/' + user.uid);

        const now = new Date();

        outcomesRef.on('value', (snapshot) => {
            const outcomes = snapshot.val();
            console.log('Sales outcomes retrieved:', outcomes);

            if (outcomes) {
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

                for (const key in outcomes) {
                    const outcome = outcomes[key];
                    const action = outcome.assignAction;
                    const notes = outcome.notesValue;
                    const outcomeTime = new Date(outcome.outcomeTime);

                    console.log(`Processing outcome - Key: ${key}, Action: "${action}", Notes: "${notes}"`);

                    const saleType = getSaleType(action, notes);
                    console.log(`Identified Sale Type: ${saleType}`);

                    if (!salesTimeFrames[outcome.accountNumber]) {
                        salesTimeFrames[outcome.accountNumber] = {};
                    }

                    if (!salesTimeFrames[outcome.accountNumber][saleType]) {
                        salesTimeFrames[outcome.accountNumber][saleType] = [];
                    }

                    salesTimeFrames[outcome.accountNumber][saleType].push(outcomeTime.toISOString());

                    if (isSameDay(outcomeTime, now)) {
                        if (saleType === 'Billable HRA') {
                            salesCounts.day.billableHRA++;
                        } else if (saleType === 'Select RX') {
                            salesCounts.day.selectRX++;
                        } else if (saleType === 'Select Patient Management') {
                            salesCounts.day.selectPatientManagement++;
                        } else if (saleType === 'Transfer') {
                            salesCounts.day.transfer++;
                        }
                    }

                    if (isSameWeek(outcomeTime, now)) {
                        if (saleType === 'Billable HRA') {
                            salesCounts.week.billableHRA++;
                        } else if (saleType === 'Select RX') {
                            salesCounts.week.selectRX++;
                        } else if (saleType === 'Select Patient Management') {
                            salesCounts.week.selectPatientManagement++;
                        } else if (saleType === 'Transfer') {
                            salesCounts.week.transfer++;
                        }
                    }

                    if (isSameMonth(outcomeTime, now)) {
                        if (saleType === 'Billable HRA') {
                            salesCounts.month.billableHRA++;
                        } else if (saleType === 'Select RX') {
                            salesCounts.month.selectRX++;
                        } else if (saleType === 'Select Patient Management') {
                            salesCounts.month.selectPatientManagement++;
                        } else if (saleType === 'Transfer') {
                            salesCounts.month.transfer++;
                        }
                    }

                    console.log('Updated salesCounts:', salesCounts);
                }

                console.log('Final Sales Counts:', salesCounts);

                salesCountsRef.update(salesCounts, (error) => {
                    if (error) {
                        console.error('Failed to update sales counts:', error);
                    } else {
                        console.log('Sales counts updated successfully:', salesCounts);
                    }
                });

                salesTimeFramesRef.set(salesTimeFrames, (error) => {
                    if (error) {
                        console.error('Failed to update sales timeframes:', error);
                    } else {
                        console.log('Sales timeframes updated successfully:', salesTimeFrames);
                    }
                });

                salesData = Object.values(outcomes).filter(outcome => outcome.assignAction.trim() !== "--");
                salesData.sort((a, b) => new Date(b.outcomeTime) - new Date(a.outcomeTime));
                filteredSalesData = [];
                currentSaleIndex = 0;  // Reset to the latest sale
                updateSalesDisplay();
            } else {
                console.log('No sales outcomes found for user:', user.displayName);
            }
        }, (error) => {
            console.error('Error fetching sales outcomes:', error);
        });
    }

    // Attach the function to the window object
    window.displaySalesOutcomes = displaySalesOutcomes;

    function displayCustomerInfo(customerInfo) {
        if (!customerInfo) {
            return '<p>No customer information available.</p>';
        }
        const name = `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim() || 'N/A';
        return `
            <div class="customer-info">
                <p>Name: ${name}</p>
                <p>Email: ${customerInfo.email || 'N/A'}</p>
                <p>Phone: ${customerInfo.phone || 'N/A'}</p>
                <!-- Add more fields as needed -->
            </div>
        `;
    }

    // Event listeners for prev and next buttons
    document.getElementById('prev').addEventListener('click', function() {
        const salesToDisplay = filteredSalesData.length ? filteredSalesData : salesData;
        if (currentSaleIndex > 0) {
            currentSaleIndex--;
            updateSalesDisplay();
        }
    });

    document.getElementById('next').addEventListener('click', function() {
        const salesToDisplay = filteredSalesData.length ? filteredSalesData : salesData;
        if (currentSaleIndex < salesToDisplay.length - 1) {
            currentSaleIndex++;
            updateSalesDisplay();
        }
    });

    // Search functionality
    const searchInput = document.getElementById('searchById');
    const clearSearchButton = document.getElementById('clearSearch');

    searchInput.addEventListener('input', function() {
        const query = searchInput.value.trim().toLowerCase();
        if (query) {
            clearSearchButton.style.display = 'inline';
            filteredSalesData = salesData.filter(sale => sale.accountNumber.toLowerCase().includes(query));
        } else {
            clearSearchButton.style.display = 'none';
            filteredSalesData = [];
        }
        currentSaleIndex = 0;
        updateSalesDisplay();
    });

    clearSearchButton.addEventListener('click', function() {
        searchInput.value = '';
        clearSearchButton.style.display = 'none';
        filteredSalesData = [];
        currentSaleIndex = 0;
        updateSalesDisplay();
    });
});


document.addEventListener('DOMContentLoaded', function() {
    // Helper functions

    // Function to remove duplicates
    function removeDuplicates(user) {
        const database = firebase.database();
        const outcomesRef = database.ref('salesOutcomes/' + user.uid);

        outcomesRef.once('value', (snapshot) => {
            const outcomes = snapshot.val();
            const seenOutcomes = {};

            snapshot.forEach(childSnapshot => {
                const outcome = childSnapshot.val();
                const action = outcome.assignAction;
                const accountNumber = outcome.accountNumber;
                const firstName = outcome.customerInfo.firstName;
                const lastName = outcome.customerInfo.lastName;
                const key = `${accountNumber}-${firstName}-${lastName}-${action}`;

                if (seenOutcomes[key]) {
                    // If we have already seen this combination, compare the timestamps
                    const existingTime = new Date(seenOutcomes[key].outcomeTime);
                    const currentTime = new Date(outcome.outcomeTime);

                    if (currentTime > existingTime) {
                        // Remove the older record
                        outcomesRef.child(seenOutcomes[key].key).remove();
                        // Update the seenOutcomes with the latest record
                        seenOutcomes[key] = { key: childSnapshot.key, outcomeTime: outcome.outcomeTime };
                    } else {
                        // Remove the current record as it is older
                        outcomesRef.child(childSnapshot.key).remove();
                    }
                } else {
                    // Add the record to seenOutcomes
                    seenOutcomes[key] = { key: childSnapshot.key, outcomeTime: outcome.outcomeTime };
                }
            });
        }, (error) => {
            console.error('Error fetching sales outcomes:', error);
        });
    }

    // Authenticate and call removeDuplicates
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log('Authenticated user:', user.displayName);
            removeDuplicates(user);
        } else {
            console.error('User not authenticated');
        }
    });
});