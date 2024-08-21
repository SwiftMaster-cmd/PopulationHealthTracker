async function loadLiveActivities() {
    try {
        const database = firebase.database();
        const salesTimeFramesRef = database.ref('salesTimeFrames');
        const usersRef = database.ref('users');
        const likesRef = database.ref('likes');
        const liveActivitiesSection = document.getElementById('live-activities-section');

        if (!liveActivitiesSection) {
            throw new Error('Live activities section element not found');
        }

        // Clear previous listeners
        salesTimeFramesRef.off();

        // Real-time listener for new sales
        salesTimeFramesRef.on('child_added', async (snapshot) => {
            const saleData = snapshot.val();
            console.log("New sale added:", saleData);

            if (isToday(saleData.saleTime)) {
                console.log("Sale is today:", saleData);
                await addUserNames([saleData], usersRef); // Add the user name for the new sale
                renderFilteredSale(saleData, liveActivitiesSection, likesRef, usersRef); // Render the new sale with filtering
            }
        });

        // Real-time listener for updated sales
        salesTimeFramesRef.on('child_changed', async (snapshot) => {
            const saleData = snapshot.val();
            console.log("Sale data changed:", saleData);

            if (isToday(saleData.saleTime)) {
                console.log("Updated sale is today:", saleData);
                const existingSaleIndex = currentSales.findIndex(sale => sale.saleId === saleData.saleId);
                if (existingSaleIndex !== -1) {
                    currentSales[existingSaleIndex] = saleData; // Update the sale data
                } else {
                    currentSales.push(saleData); // Add if it doesn't exist yet
                }
                await addUserNames([saleData], usersRef);
                renderFilteredSale(saleData, liveActivitiesSection, likesRef, usersRef); // Render the updated sale with filtering
            }
        });

        // Initially load today's sales
        const salesSnapshot = await salesTimeFramesRef.once('value');
        if (salesSnapshot.exists()) {
            const salesData = salesSnapshot.val();
            console.log("Initial sales data:", salesData);

            currentSales = await processSalesData(salesData);
            currentSales = currentSales.filter(sale => isToday(sale.saleTime)); // Filter to only today's sales
            console.log("Filtered today's sales:", currentSales);

            await addUserNames(currentSales, usersRef);
            currentSales.forEach(sale => renderFilteredSale(sale, liveActivitiesSection, likesRef, usersRef)); // Render all filtered sales
        } else {
            liveActivitiesSection.innerHTML = '<p>No sales data found for today.</p>';
        }

    } catch (error) {
        console.error('Error loading live activities:', error);
    }
}

function renderFilteredSale(sale, container, likesRef, usersRef) {
    const currentUser = firebase.auth().currentUser;

    // Debugging: Log the current filter settings
    console.log("Rendering sale with filters:", { hideNonSellable, hideSelfSales, sellableTypes });

    // Debugging: Log the sale details
    console.log("Sale details:", sale);

    if (!sale) {
        console.log("Sale is undefined or null, skipping render.");
        return;
    }

    // Check if the sale should be filtered out based on the current settings
    if (hideNonSellable && !sellableTypes.includes(sale.saleType)) {
        console.log(`Sale type "${sale.saleType}" is non-sellable and filtering is enabled, skipping render.`);
        return;
    }

    if (hideSelfSales && sale.userId === currentUser.uid) {
        console.log("Sale belongs to the current user and self-sales filtering is enabled, skipping render.");
        return;
    }

    // If the sale passes all filters, render it
    const saleDate = new Date(sale.saleTime);
    const today = new Date();
    const isToday = saleDate.getDate() === today.getDate() &&
                    saleDate.getMonth() === today.getMonth() &&
                    saleDate.getFullYear() === today.getFullYear();

    const formattedTime = saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = `${saleDate.getMonth() + 1}/${saleDate.getDate()}`;
    const displayTime = isToday ? formattedTime : `on ${formattedDate} - ${formattedTime}`;

    const saleElement = document.createElement('div');
    saleElement.classList.add('activity-item');

    const likePath = `${sale.userId}_${sale.leadId}_${sale.saleType}_${sale.saleTime.replace(/[.\#$$begin:math:display$$end:math:display$]/g, '_')}`;

    saleElement.innerHTML = `
        <button class="like-button" data-like-path="${likePath}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
        </button>
        <strong>${sale.userName}</strong> sold <strong>${sale.saleType}</strong> at ${displayTime}
        <div class="like-info" id="like-info-${likePath}"></div>
    `;
    container.appendChild(saleElement);

    const likeButton = saleElement.querySelector('.like-button');
    const likeInfoDiv = saleElement.querySelector('.like-info');

    initializeLikeCount(likesRef, likePath, likeButton, likeInfoDiv, usersRef);

    likeButton.addEventListener('click', () => handleLikeClick(likesRef, likePath, likeButton, likeInfoDiv, usersRef));

    likesRef.child(likePath).on('value', snapshot => {
        updateLikeCount(snapshot, likeButton, likeInfoDiv, usersRef);
    });

    console.log("Sale rendered successfully:", sale);
}

function isToday(saleTime) {
    const saleDate = new Date(saleTime);
    const today = new Date();
    return saleDate.getDate() === today.getDate() &&
           saleDate.getMonth() === today.getMonth() &&
           saleDate.getFullYear() === today.getFullYear();
}

async function addUserNames(sales, usersRef) {
    const namePromises = sales.map(async sale => {
        try {
            const snapshot = await usersRef.child(sale.userId).once('value');
            if (snapshot.exists()) {
                const userData = snapshot.val();
                sale.userName = userData.name || 'Unknown User';
            } else {
                sale.userName = 'Unknown User';
            }
        } catch (error) {
            console.error(`Error fetching user data for userId ${sale.userId}:`, error);
            sale.userName = 'Unknown User';
        }
    });

    await Promise.all(namePromises);
}

async function processSalesData(salesData) {
    const sales = [];

    for (const userId in salesData) {
        const userSales = salesData[userId];
        for (const leadId in userSales) {
            const leadSales = userSales[leadId];
            for (const saleType in leadSales) {
                const saleTimes = leadSales[saleType];
                for (const timeIndex in saleTimes) {
                    const saleTime = saleTimes[timeIndex];

                    // Create a unique identifier for each sale
                    const saleId = `${userId}_${leadId}_${saleType}_${saleTime}`;
                    sales.push({ saleId, userId, leadId, saleType, saleTime });
                }
            }
        }
    }

    // Sort the sales by saleTime in descending order
    sales.sort((a, b) => new Date(b.saleTime) - new Date(a.saleTime));

    // Remove duplicate sales by saleId
    const uniqueSales = [];
    const saleIds = new Set();
    for (const sale of sales) {
        if (!saleIds.has(sale.saleId)) {
            saleIds.add(sale.saleId);
            uniqueSales.push(sale);
        }
    }

    return uniqueSales;
}
