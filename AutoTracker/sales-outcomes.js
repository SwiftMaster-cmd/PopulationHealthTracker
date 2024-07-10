document.addEventListener('DOMContentLoaded', function() {
    // Helper functions
    function formatDate(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleDateString();
    }

    function formatTime(dateTime) {
        const date = new Date(dateTime);
        return date.toLocaleTimeString();
    }

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

    function getCurrentDayKey() {
        const now = new Date();
        return now.toISOString().split('T')[0];
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
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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




document.addEventListener('DOMContentLoaded', () => {
    // Existing code...

    // Add event listener for the cheat sheet button
    const cheatSheetButton = document.getElementById('cheatSheetButton');
    if (cheatSheetButton) {
        cheatSheetButton.addEventListener('click', () => {
            window.location.href = 'cheatSheet.html';
        });
    }
    function captureOutcomeData(user) {
        const applyActionButton = Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === 'Apply Action');
        if (applyActionButton) {
            applyActionButton.addEventListener('click', function handler() {
                console.log('Apply Action button clicked:', this);
    
                let outcomeTime = new Date().toISOString();
                console.log('Outcome Time:', outcomeTime);
    
                let assignActionElem = document.querySelector('[role="combobox"] input');
                let assignAction = assignActionElem ? assignActionElem.value : "unknown";
                console.log('Assign Action:', assignAction);
    
                let notesValueElem = document.querySelector('[name="note"]');
                let notesValue = notesValueElem ? notesValueElem.value : "unknown";
                console.log('Notes Value:', notesValue);
    
                let accountNumberElem = document.querySelectorAll('.MuiTypography-root.leadInfoCard__content--truncate.MuiTypography-body2')[1];
                let accountNumber = accountNumberElem ? accountNumberElem.textContent : "unknown";
                console.log('Account Number:', accountNumber);
    
                let firstNameElem = document.querySelector('#indv-first-name');
                console.log('First Name Element:', firstNameElem);
                let firstName = firstNameElem ? firstNameElem.value : "unknown";
                console.log('First Name:', firstName);
    
                let lastNameElem = document.querySelector('#indv-last-name');
                console.log('Last Name Element:', lastNameElem);
                let lastName = lastNameElem ? lastNameElem.value : "unknown";
                console.log('Last Name:', lastName);
    
                let genderElem = document.querySelector('#indv-gender');
                console.log('Gender Element:', genderElem);
                let gender = genderElem ? genderElem.value : "unknown";
                console.log('Gender:', gender);
    
                let birthdateElem = document.querySelector('#indv-birthday');
                console.log('Birthdate Element:', birthdateElem);
                let birthdate = birthdateElem ? birthdateElem.value : "unknown";
                console.log('Birthdate:', birthdate);
    
                let emailElem = document.querySelector('#indv-email');
                console.log('Email Element:', emailElem);
                let email = emailElem ? emailElem.value : "unknown";
                console.log('Email:', email);
    
                let phoneElem = document.querySelector('#indv-day-phone');
                console.log('Day Phone Element:', phoneElem);
                let phone = phoneElem ? phoneElem.value : "unknown";
                console.log('Day Phone:', phone);
    
                let zipcodeElem = document.querySelector('#indv-zipcode');
                console.log('Zipcode Element:', zipcodeElem);
                let zipcode = zipcodeElem ? zipcodeElem.value : "unknown";
                console.log('Zipcode:', zipcode);
    
                let stateIdElem = document.querySelector('#indv-state-id');
                console.log('State ID Element:', stateIdElem);
                let stateId = stateIdElem ? stateIdElem.value : "unknown";
                console.log('State ID:', stateId);
    
                const data = {
                    userId: user.uid,
                    outcomeTime: outcomeTime,
                    assignAction: assignAction,
                    notesValue: notesValue,
                    accountNumber: accountNumber,
                    customerInfo: {
                        firstName: firstName,
                        lastName: lastName,
                        gender: gender,
                        birthdate: birthdate,
                        email: email,
                        phone: phone,
                        zipcode: zipcode,
                        stateId: stateId
                    }
                };
    
                console.log('Data to be recorded:', data);
    
                // Check if the sale for the current customer is already added
                const outcomesRef = firebase.database().ref('salesOutcomes/' + user.uid);
                outcomesRef.orderByChild('accountNumber').equalTo(accountNumber).once('value', snapshot => {
                    let duplicate = false;
                    if (snapshot.exists()) {
                        snapshot.forEach(childSnapshot => {
                            const existingData = childSnapshot.val();
                            if (existingData.customerInfo.firstName === firstName &&
                                existingData.customerInfo.lastName === lastName &&
                                existingData.assignAction === assignAction) {
                                duplicate = true;
                            }
                        });
                    }
                    if (duplicate) {
                        console.log('Sale already recorded for account number:', accountNumber, 'customer:', firstName, lastName, 'and action:', assignAction);
                    } else {
                        outcomesRef.push().set(data).then(() => {
                            console.log('Outcome recorded for user:', user.displayName);
                            showNotification();
                        }).catch((error) => {
                            console.error('Error recording outcome:', error);
                        });
                    }
                });
            });
            console.log("Event listener added to Apply Action button");
        } else {
            console.error("Apply Action button not found");
        }
    }
    // Existing code...
});

// Existing code continues...