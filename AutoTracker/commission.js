// commission.js

document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const database = firebase.database();

    // Elements to display commission data
    const partnerTransferCommissionEl = document.getElementById('partnerTransferCommission');
    const selectRxCommissionEl = document.getElementById('selectRxCommission');
    const intraCompanyCommissionEl = document.getElementById('intraCompanyCommission');
    const spmCommissionEl = document.getElementById('spmCommission');
    const totalCommissionEl = document.getElementById('totalCommission');

    const partnerTransferSalesCountEl = document.getElementById('partnerTransferSalesCount');
    const selectRxSalesCountEl = document.getElementById('selectRxSalesCount');
    const intraCompanySalesCountEl = document.getElementById('intraCompanySalesCount');
    const spmSalesCountEl = document.getElementById('spmSalesCount');

    auth.onAuthStateChanged(user => {
        if (user) {
            loadAgentLevel(user).then(agentLevel => {
                // Fetch sales data
                fetchSalesData(user, 'myData', salesData => {
                    // Calculate commissions
                    const commissionData = calculateCommission(salesData, agentLevel);
                    // Display commissions
                    displayCommission(commissionData);
                });
            }).catch(error => {
                console.error('Error loading agent level:', error);
            });
        } else {
            console.error('User not authenticated.');
        }
    });

    function loadAgentLevel(user) {
        return new Promise((resolve, reject) => {
            const userRef = database.ref('Users/' + user.uid);

            userRef.once('value').then(snapshot => {
                const userData = snapshot.val();
                if (userData && userData.agentLevel) {
                    resolve(userData.agentLevel);
                } else {
                    resolve('Level1'); // Default to Level1 if not set
                }
            }).catch(error => {
                reject(error);
            });
        });
    }

    function calculateCommission(salesData, agentLevel) {
        // Commission structures
        const commissionStructures = {
            Level1: {
                partnerTransfer: [
                    { min: 0, max: 4, payout: 9 },
                    { min: 5, max: 9, payout: 10 },
                    { min: 10, max: 14, payout: 11 },
                    { min: 15, max: 19, payout: 12 },
                    { min: 20, max: Infinity, payout: 13 }
                ],
                selectRx: [
                    { min: 0, max: 39, payout: 21 },
                    { min: 40, max: 59, payout: 22 },
                    { min: 60, max: 109, payout: 23 },
                    { min: 110, max: 129, payout: 24 },
                    { min: 130, max: Infinity, payout: 25 }
                ],
                intraCompany: [
                    { min: 0, max: 19, payout: 5 },
                    { min: 20, max: 49, payout: 6 },
                    { min: 50, max: 79, payout: 7 },
                    { min: 80, max: 99, payout: 8 },
                    { min: 100, max: Infinity, payout: 9 }
                ],
                spm: [
                    { min: 0, max: 4, payout: 16 },
                    { min: 5, max: 9, payout: 17 },
                    { min: 10, max: 14, payout: 18 },
                    { min: 15, max: 19, payout: 19 },
                    { min: 20, max: Infinity, payout: 20 }
                ]
            },
            Level2: {
                partnerTransfer: [
                    { min: 0, max: 2, payout: 9 },
                    { min: 3, max: 4, payout: 9.75 },
                    { min: 5, max: 9, payout: 10.5 },
                    { min: 10, max: 14, payout: 11.25 },
                    { min: 15, max: Infinity, payout: 12 }
                ],
                selectRx: [
                    { min: 0, max: 19, payout: 20 },
                    { min: 20, max: 29, payout: 20.75 },
                    { min: 30, max: 54, payout: 21.5 },
                    { min: 55, max: 84, payout: 22.25 },
                    { min: 85, max: Infinity, payout: 23 }
                ],
                intraCompany: [
                    { min: 0, max: 9, payout: 5 },
                    { min: 10, max: 29, payout: 5.75 },
                    { min: 30, max: 49, payout: 6.5 },
                    { min: 50, max: 64, payout: 7.25 },
                    { min: 65, max: Infinity, payout: 8 }
                ],
                spm: [
                    { min: 0, max: 2, payout: 15 },
                    { min: 3, max: 4, payout: 15.75 },
                    { min: 5, max: 7, payout: 16.5 },
                    { min: 8, max: 11, payout: 17.25 },
                    { min: 12, max: Infinity, payout: 18 }
                ]
            },
            Level3: {
                partnerTransfer: [
                    { min: 0, max: 1, payout: 9 },
                    { min: 2, max: 2, payout: 9.5 },
                    { min: 3, max: 6, payout: 10 },
                    { min: 7, max: 12, payout: 10.5 },
                    { min: 13, max: Infinity, payout: 11 }
                ],
                selectRx: [
                    { min: 0, max: 4, payout: 19 },
                    { min: 5, max: 9, payout: 19.5 },
                    { min: 10, max: 19, payout: 20 },
                    { min: 20, max: 29, payout: 20.5 },
                    { min: 30, max: Infinity, payout: 21 }
                ],
                intraCompany: [
                    { min: 0, max: 1, payout: 5 },
                    { min: 5, max: 14, payout: 5.5 },
                    { min: 15, max: 29, payout: 6 },
                    { min: 30, max: 44, payout: 6.5 },
                    { min: 45, max: Infinity, payout: 7 }
                ],
                spm: [
                    { min: 0, max: 1, payout: 14 },
                    { min: 2, max: 3, payout: 14.5 },
                    { min: 4, max: 5, payout: 15 },
                    { min: 6, max: 8, payout: 15.5 },
                    { min: 9, max: Infinity, payout: 16 }
                ]
            }
        };

        // Initialize commission data
        const commissionData = {
            partnerTransfer: 0,
            selectRx: 0,
            intraCompany: 0,
            spm: 0
        };

        // Get the commission structure for the agent's level
        const commissionStructure = commissionStructures[agentLevel];

        // Count sales per type
        const salesCounts = {
            partnerTransfer: 0,
            selectRx: 0,
            intraCompany: 0,
            spm: 0
        };

        salesData.forEach(sale => {
            const saleType = getSaleType(sale.assignAction || '', sale.notesValue || '');
            if (saleType) {
                switch(saleType) {
                    case 'HRA':
                    case 'Transfer':
                        salesCounts.partnerTransfer += 1; // Assuming each sale counts as 1 point
                        break;
                    case 'Select RX':
                        salesCounts.selectRx += 1;
                        break;
                    case 'Select Patient Management':
                        salesCounts.spm += 1;
                        break;
                    default:
                        // Handle IntraCompany sales
                        if (/dental|fe|final expense/i.test(sale.assignAction) || /dental|fe|final expense/i.test(sale.notesValue)) {
                            salesCounts.intraCompany += 1;
                        }
                        break;
                }
            }

            // Check for IntraCompany sales if not already counted
            if (saleType !== 'IntraCompany' && (/dental|fe|final expense/i.test(sale.assignAction) || /dental|fe|final expense/i.test(sale.notesValue))) {
                salesCounts.intraCompany += 1;
            }
        });

        // Calculate commissions per type
        // For partnerTransfer
        commissionData.partnerTransfer = calculatePayout(salesCounts.partnerTransfer, commissionStructure.partnerTransfer);

        // For selectRx
        commissionData.selectRx = calculatePayout(salesCounts.selectRx, commissionStructure.selectRx);

        // For intraCompany
        commissionData.intraCompany = calculatePayout(salesCounts.intraCompany, commissionStructure.intraCompany);

        // For spm
        commissionData.spm = calculatePayout(salesCounts.spm, commissionStructure.spm);

        commissionData.totalCommission = commissionData.partnerTransfer + commissionData.selectRx + commissionData.intraCompany + commissionData.spm;

        commissionData.salesCounts = salesCounts;

        return commissionData;
    }

    function calculatePayout(salesCount, payoutStructure) {
        for (let i = 0; i < payoutStructure.length; i++) {
            const tier = payoutStructure[i];
            if (salesCount >= tier.min && salesCount <= tier.max) {
                return salesCount * tier.payout;
            }
        }
        // If no tier matched, return 0
        return 0;
    }

    function getSaleType(action, notes) {
        const normalizedAction = action.toLowerCase();
        const normalizedNotes = notes.toLowerCase();

        if (/hra/i.test(normalizedAction) || /hra/i.test(normalizedNotes)) {
            return 'HRA';
        } else if (
            /(vbc|transfer|ndr|national debt relief|value based care|oak street|osh)/i.test(normalizedNotes)
        ) {
            return 'Transfer';
        } else if (/spm|select patient management/i.test(normalizedAction) || /spm|select patient management/i.test(normalizedNotes)) {
            return 'Select Patient Management';
        } else if (
            normalizedAction.includes('srx: enrolled - rx history received') ||
            normalizedAction.includes('srx: enrolled - rx history not available') ||
            /select rx/i.test(normalizedAction) ||
            /select rx/i.test(normalizedNotes)
        ) {
            return 'Select RX';
        } else if (/dental|fe|final expense/i.test(normalizedAction) || /dental|fe|final expense/i.test(normalizedNotes)) {
            return 'IntraCompany';
        } else {
            // Exclude other options
            return null;
        }
    }

    function displayCommission(commissionData) {
        // Display the commission data on the page
        partnerTransferCommissionEl.textContent = `Partner Transfer Commission: $${commissionData.partnerTransfer.toFixed(2)}`;
        selectRxCommissionEl.textContent = `SelectRx Commission: $${commissionData.selectRx.toFixed(2)}`;
        intraCompanyCommissionEl.textContent = `IntraCompany Commission: $${commissionData.intraCompany.toFixed(2)}`;
        spmCommissionEl.textContent = `SPM Commission: $${commissionData.spm.toFixed(2)}`;
        totalCommissionEl.textContent = `Total Commission: $${commissionData.totalCommission.toFixed(2)}`;

        // Also display sales counts
        partnerTransferSalesCountEl.textContent = `Partner Transfer Sales: ${commissionData.salesCounts.partnerTransfer}`;
        selectRxSalesCountEl.textContent = `SelectRx Sales: ${commissionData.salesCounts.selectRx}`;
        intraCompanySalesCountEl.textContent = `IntraCompany Sales: ${commissionData.salesCounts.intraCompany}`;
        spmSalesCountEl.textContent = `SPM Sales: ${commissionData.salesCounts.spm}`;
    }

    // Assume fetchSalesData function is defined in dashboard.js or elsewhere
    // If not, include it here or import appropriately
});
