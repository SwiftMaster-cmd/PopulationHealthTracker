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

    function removeDuplicatesFromFirebase(user) {
        const database = firebase.database();
        const outcomesRef = database.ref('salesOutcomes/' + user.uid);

        outcomesRef.once('value', (snapshot) => {
            const outcomes = snapshot.val();
            if (!outcomes) return;

            const seen = new Set();
            const duplicates = [];

            Object.keys(outcomes).forEach(key => {
                const outcome = outcomes[key];
                const customerName = `${outcome.customerInfo.firstName} ${outcome.customerInfo.lastName}`;
                const saleType = getSaleType(outcome.assignAction, outcome.notesValue);
                const uniqueKey = `${customerName}_${saleType}`;

                if (seen.has(uniqueKey)) {
                    duplicates.push({ key, outcome });
                } else {
                    seen.add(uniqueKey);
                }
            });

            duplicates.sort((a, b) => new Date(b.outcome.outcomeTime) - new Date(a.outcome.outcomeTime));

            duplicates.forEach((duplicate, index) => {
                if (index > 0) { // Keep the oldest entry and remove the newer ones
                    outcomesRef.child(duplicate.key).remove().then(() => {
                        console.log(`Removed duplicate sale: ${duplicate.key}`);
                    }).catch((error) => {
                        console.error(`Failed to remove duplicate sale: ${duplicate.key}`, error);
                    });
                }
            });
        });
    }

    let currentSaleIndex = 0;
    let salesData = [];
    let filteredSalesData = [];

    function updateSalesDisplay() {
        if (salesData.length === 0) return;

        const sale = salesData[currentSaleIndex];
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
            counter.textContent = `${currentSaleIndex + 1} of ${salesData.length}`;
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

                const uniqueOutcomes = Object.values(outcomes).reduce((acc, outcome) => {
                    const customerName = `${outcome.customerInfo.firstName} ${outcome.customerInfo.lastName}`;
                    const saleType = getSaleType(outcome.assignAction, outcome.notesValue);
                    const uniqueKey = `${customerName}_${saleType}`;

                    if (!acc[uniqueKey]) {
                        acc[uniqueKey] = [outcome];
                    } else {
                        acc[uniqueKey].push(outcome);
                    }

                    return acc;
                }, {});

                for (const key in uniqueOutcomes) {
                    if (uniqueOutcomes[key].length > 1) {
                        uniqueOutcomes[key].sort((a, b) => new Date(a.outcomeTime) - new Date(b.outcomeTime)).slice(1).forEach(duplicate => {
                            outcomesRef.child(duplicate.key).remove().then(() => {
                                console.log(`Removed duplicate sale: ${duplicate.key}`);
                            }).catch((error) => {
                                console.error(`Failed to remove duplicate sale: ${duplicate.key}`, error);
                            });
                        });
                    }
                }

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

    // Initialize Firebase and attach event listeners
    function initializeFirebase() {
        loadScript('https://www.gstatic.com/firebasejs/8.6.8/firebase-app.js', function() {
            loadScript('https://www.gstatic.com/firebasejs/8.6.8/firebase-auth.js', function() {
                loadScript('https://www.gstatic.com/firebasejs/8.6.8/firebase-database.js', function() {
                    const firebaseConfig = {
                        apiKey: "AIzaSyBhSqBwrg8GYyaqpYHOZS8HtFlcXZ09OJA",
                        authDomain: "track-dac15.firebaseapp.com",
                        databaseURL: "https://track-dac15-default-rtdb.firebaseio.com",
                        projectId: "track-dac15",
                        storageBucket: "track-dac15.appspot.com",
                        messagingSenderId: "495156821305",
                        appId: "1:495156821305:web:7cbb86d257ddf9f0c3bce8",
                        measurementId: "G-RVBYB0RR06"
                    };
                    firebase.initializeApp(firebaseConfig);

                    firebase.auth().onAuthStateChanged(user => {
                        if (user) {
                            console.log('Authenticated user:', user.displayName);
                            removeDuplicatesFromFirebase(user);
                            displaySalesOutcomes(user);
                            showActiveIndicator();
                        } else {
                            console.log("Prompting user to sign in");
                            const provider = new firebase.auth.GoogleAuthProvider();
                            firebase.auth().signInWithPopup(provider).then((result) => {
                                const user = result.user;
                                console.log('Authenticated user:', user.displayName);
                                removeDuplicatesFromFirebase(user);
                                displaySalesOutcomes(user);
                                showActiveIndicator();
                            }).catch((error) => {
                                console.error('Authentication error:', error);
                            });
                        }
                    });
                });
            });
        });
    }

    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        script.onerror = function() {
            console.error('Failed to load script:', src);
        };
        document.head.appendChild(script);
    }

    function showActiveIndicator() {
        const existingIndicator = document.getElementById('tracker-active-indicator');
        if (existingIndicator) {
            existingIndicator.style.display = 'block';
        } else {
            const style = document.createElement('style');
            style.innerHTML = `
                #tracker-active-indicator {
                    padding: 8px 20px;
                    color: #000;
                    font-size: 18px;
                    font-family: 'Georgia', serif;
                    border-radius: 8px;
                    margin: 0 auto;
                    display: block;
                    width: 90%;
                    text-align: center;
                    position: relative;
                    transition: all 0.5s ease;
                    font-weight: bold;
                }
                #tracker-active-indicator:hover {
                    color: #28a745;
                }
                #tracker-active-indicator .icon {
                    display: inline-block;
                    margin-right: 10px;
                    transition: color 0.5s ease;
                    color: #28a745;
                    font-size: 22px;
                }
                #tracker-active-indicator .version {
                    font-size: 14px;
                    color: #666;
                    margin-left: 10px;
                }
                #sale-notification {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: #28a745;
                    color: #fff;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 16px;
                    display: none;
                    z-index: 1000;
                }
            `;
            document.head.appendChild(style);
            const indicator = document.createElement('div');
            indicator.id = 'tracker-active-indicator';
            indicator.innerHTML = '<span class="icon">✔</span> Tracker Active<span class="version">V-2.1</span>';
            const actionsHeader = document.evaluate("//h3[text()='Actions']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (actionsHeader) {
                actionsHeader.parentElement.appendChild(indicator);
            } else {
                console.error('Actions header element not found');
            }
            const notification = document.createElement('div');
            notification.id = 'sale-notification';
            notification.textContent = 'Sale added successfully!';
            document.body.appendChild(notification);
        }
    }

    function showNotification() {
        const notification = document.getElementById('sale-notification');
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3600);
    }

    initializeFirebase();
});