
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

        salesTimeFramesRef.on('value', async salesSnapshot => {
            const salesData = salesSnapshot.val();
            if (!salesData) {
                console.error('No sales data found');
                liveActivitiesSection.innerHTML = '<p>No sales data found.</p>';
                return;
            }

            console.log('Sales data:', salesData);
            const sales = await processSalesData(salesData);
            const latestSales = sales.slice(0, 5); // Get the latest 5 sales

            console.log('Processed sales data:', latestSales);
            await addUserNames(latestSales, usersRef);
            renderSales(latestSales, liveActivitiesSection, likesRef, usersRef);
        });
    } catch (error) {
        console.error('Error loading live activities:', error);
    }
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
                    const formattedTime = new Date(saleTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    // Create a unique identifier for each sale to avoid duplicates
                    const saleId = `${userId}_${leadId}_${saleType}_${saleTime}`;
                    sales.push({ saleId, userId, leadId, saleType, saleTime, formattedTime });
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
            sale.saleType = getReadableTitle(sale.saleType); // Ensure sale type is readable
        } catch (error) {
            console.error(`Error fetching user data for userId ${sale.userId}:`, error);
            sale.userName = 'Unknown User';
        }
    });

    await Promise.all(namePromises);
}

function renderSales(sales, container, likesRef, usersRef) {
    container.innerHTML = '<h4>Live Activities</h4>';

    sales.forEach(sale => {
        const saleElement = document.createElement('div');
        saleElement.classList.add('activity-item');

        // Use a sanitized path for the like button
        const likePath = `${sale.userId}_${sale.leadId}_${sale.saleType}_${sale.saleTime.replace(/[.\#$$begin:math:display$$end:math:display$]/g, '_')}`;

        saleElement.innerHTML = `
            <button class="like-button" data-like-path="${likePath}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </button>
            <strong>${sale.userName}</strong> sold <strong>${sale.saleType}</strong> (<strong>${sale.leadId}</strong>) at ${sale.formattedTime}
            <button class="copy-button">
                <i class="fas fa-copy"></i>
            </button>
            <div class="like-info" id="like-info-${likePath}"></div>
        `;
        container.appendChild(saleElement);

        const likeButton = saleElement.querySelector('.like-button');
        const likeInfoDiv = saleElement.querySelector('.like-info');
        const copyButton = saleElement.querySelector('.copy-button');

        initializeLikeCount(likesRef, likePath, likeButton, likeInfoDiv, usersRef);

        likeButton.addEventListener('click', () => handleLikeClick(likesRef, likePath, likeButton, likeInfoDiv, usersRef));

        // Listen for changes to likes in real-time
        likesRef.child(likePath).on('value', snapshot => {
            updateLikeCount(snapshot, likeButton, likeInfoDiv, usersRef);
        });

        copyButton.addEventListener('click', () => handleCopyClick(sale));
    });
}

function handleCopyClick(sale) {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = `<strong>${sale.userName}</strong> sold <strong>${sale.saleType}</strong> (<strong>${sale.leadId}</strong>) at ${sale.formattedTime}`;
    document.body.appendChild(tempElement);

    const range = document.createRange();
    range.selectNode(tempElement);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);

    try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'successful' : 'unsuccessful';
        console.log(`Copy command was ${msg}`);
    } catch (err) {
        console.error('Oops, unable to copy', err);
    }

    window.getSelection().removeAllRanges();
    document.body.removeChild(tempElement);
}

function updateLikeCount(snapshot, likeButton, likeInfoDiv, usersRef) {
    const likes = snapshot.val() || {};
    const likeCount = Object.values(likes).reduce((total, value) => total + value, 0);
    const lastLikerId = Object.keys(likes).sort((a, b) => likes[b] - likes[a])[0];
    let lastLikerName = 'Someone';

    if (likeCount > 0 && lastLikerId) {
        usersRef.child(lastLikerId).once('value').then(userSnapshot => {
            if (userSnapshot.exists()) {
                lastLikerName = userSnapshot.val().name || 'Someone';
            }
            likeInfoDiv.textContent = likeCount > 1
                ? `Liked by ${lastLikerName} and ${likeCount - 1} others`
                : `Liked by ${lastLikerName}`;
        });
    } else {
        likeInfoDiv.textContent = ''; // Clear the like-info text if there are no likes
    }

    if (likes[firebase.auth().currentUser.uid]) {
        likeButton.classList.add('liked');
    } else {
        likeButton.classList.remove('liked');
    }
}

async function initializeLikeCount(likesRef, likePath, likeButton, likeInfoDiv, usersRef) {
    try {
        const snapshot = await likesRef.child(likePath).once('value');
        updateLikeCount(snapshot, likeButton, likeInfoDiv, usersRef);
    } catch (error) {
        console.error('Error initializing like count:', error);
    }
}

async function handleLikeClick(likesRef, likePath, likeButton, likeInfoDiv, usersRef) {
    try {
        const currentUserId = firebase.auth().currentUser.uid;
        const userLikePath = `${likePath}/${currentUserId}`;

        const result = await likesRef.child(userLikePath).transaction(currentValue => {
            return currentValue ? 0 : 1;
        });

        if (result.committed) {
            const likesSnapshot = await likesRef.child(likePath).once('value');
            updateLikeCount(likesSnapshot, likeButton, likeInfoDiv, usersRef);
        }
    } catch (error) {
        console.error('Error updating like count:', error);
    }
}

function getReadableTitle(saleType) {
    switch (saleType) {
        case 'Notes':
            return 'Notes';
        case 'HRA Completed':
            return 'HRA Completed';
        case 'Select RX':
            return 'Select RX';
        case 'selectPatientManagement':
            return 'Select Patient Management';
        default:
            return saleType;
    }
}