// liveActivities.js

let currentSales = []; // Array to hold sales data

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
            if (isToday(saleData.saleTime)) {
                await addUserNames([saleData], usersRef);
                currentSales.push(saleData); // Add new sale data
                renderMoreSales(liveActivitiesSection, likesRef, usersRef); // Re-render with updated sales
            }
        });

        // Real-time listener for updated sales
        salesTimeFramesRef.on('child_changed', async (snapshot) => {
            const saleData = snapshot.val();
            if (isToday(saleData.saleTime)) {
                const existingSaleIndex = currentSales.findIndex(sale => sale.saleId === saleData.saleId);
                if (existingSaleIndex !== -1) {
                    currentSales[existingSaleIndex] = saleData; // Update the sale data
                } else {
                    currentSales.push(saleData); // Add if it doesn't exist yet
                }
                await addUserNames([saleData], usersRef);
                renderMoreSales(liveActivitiesSection, likesRef, usersRef); // Re-render with updated sales
            }
        });

        // Initially load today's sales
        const salesSnapshot = await salesTimeFramesRef.once('value');
        if (salesSnapshot.exists()) {
            const salesData = salesSnapshot.val();
            currentSales = await processSalesData(salesData);
            currentSales = currentSales.filter(sale => isToday(sale.saleTime)); // Filter to only today's sales
            await addUserNames(currentSales, usersRef);
            renderMoreSales(liveActivitiesSection, likesRef, usersRef); // Render all filtered sales
        } else {
            liveActivitiesSection.innerHTML = '<p>No sales data found for today.</p>';
        }

    } catch (error) {
        console.error('Error loading live activities:', error);
    }
}

// Function to render sales with filtering and batch loading
function renderMoreSales(container, likesRef, usersRef) {
    const currentUser = firebase.auth().currentUser;

    container.innerHTML = ''; // Clear the container before rendering

    const salesToRender = currentSales
        .filter(sale => (!hideNonSellable || sellableTypes.includes(sale.saleType)) &&
                        (!hideSelfSales || sale.userId !== currentUser.uid)); // Filter based on the current settings

    salesToRender.forEach(sale => {
        const saleDate = new Date(sale.saleTime);
        const formattedTime = saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedDate = `${saleDate.getMonth() + 1}/${saleDate.getDate()}`;
        const displayTime = isToday(sale.saleTime) ? formattedTime : `on ${formattedDate} - ${formattedTime}`;

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
    });

    console.log("Sales rendered successfully:", salesToRender);
}

// Utility function to check if the sale happened today
function isToday(saleTime) {
    const saleDate = new Date(saleTime);
    const today = new Date();
    return saleDate.getDate() === today.getDate() &&
           saleDate.getMonth() === today.getMonth() &&
           saleDate.getFullYear() === today.getFullYear();
}

// Function to add user names to sales
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

// Function to process sales data
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

// Assuming Firebase has already been initialized elsewhere in your code
document.addEventListener('DOMContentLoaded', () => {
    loadLiveActivities();
});
