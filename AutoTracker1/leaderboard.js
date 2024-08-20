document.addEventListener('DOMContentLoaded', () => {
    const periodPicker = document.getElementById('periodPicker');
    const saleTypePicker = document.getElementById('saleTypePicker');
    const leaderboardTitle = document.getElementById('leaderboard-title');

    periodPicker.addEventListener('change', () => {
        loadLeaderboard(periodPicker.value, saleTypePicker.value);
        leaderboardTitle.textContent = `Leaderboard: ${getReadableTitle(saleTypePicker.value)}`;
    });

    saleTypePicker.addEventListener('change', () => {
        loadLeaderboard(periodPicker.value, saleTypePicker.value);
        leaderboardTitle.textContent = `Leaderboard: ${getReadableTitle(saleTypePicker.value)}`;
    });

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log(`User signed in: ${user.uid}`);
            checkAndSetUserName(user.uid);
            loadLeaderboard(periodPicker.value, saleTypePicker.value);
            loadLiveActivities();
        } else {
            console.log('No user signed in.');
        }
    });
});


function checkAndSetUserName(userId) {
    const usersRef = firebase.database().ref('users/' + userId);

    usersRef.once('value', snapshot => {
        if (!snapshot.exists() || !snapshot.val().name) {
            const name = prompt("Please enter your name:");
            if (name) {
                usersRef.set({ name: name });
            } else {
                alert("Name is required to proceed.");
                firebase.auth().signOut();
            }
        }
    });
}


async function loadLeaderboard(period = 'day', saleType = 'selectRX') {
    const database = firebase.database();
    const salesCountsRef = database.ref('salesCounts');
    const usersRef = database.ref('users');

    const leaderboardSection = document.getElementById('leaderboard-section');
    if (!leaderboardSection) {
        console.error('Leaderboard section element not found');
        return;
    }

    salesCountsRef.off('value');

    salesCountsRef.on('value', salesSnapshot => {
        const salesData = salesSnapshot.val();
        if (!salesData) {
            console.error('No sales data found');
            return;
        }

        const users = [];

        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                usersRef.once('value', usersSnapshot => {
                    const usersData = usersSnapshot.val();
                    const currentUserId = user.uid;

                    for (const userId in salesData) {
                        const userData = salesData[userId];
                        let count = 0;

                        if (period === 'day') {
                            if (userData.day && userData.day[saleType] !== undefined) {
                                count = userData.day[saleType]; // Access the count directly
                            }
                        } else if (period === 'week') {
                            count = userData.week && userData.week[saleType] ? userData.week[saleType] : 0;
                        } else if (period === 'month') {
                            count = userData.month && userData.month[saleType] ? userData.month[saleType] : 0;
                        }

                        // Only include users with sales
                        if (count > 0) {
                            let name = usersData && usersData[userId] && usersData[userId].name ? usersData[userId].name : 'Unknown User';
                            users.push({ userId, name, count });
                        }
                    }

                    users.sort((a, b) => b.count - a.count);

                    leaderboardSection.innerHTML = ''; // Clear the section before adding new items

                    users.forEach((user, index) => {
                        // Create the leaderboard item container
                        const leaderboardItem = document.createElement('div');
                        leaderboardItem.classList.add('leaderboard-item');

                        // Add the appropriate class based on rank
                        if (index === 0) {
                            leaderboardItem.classList.add('first-place');
                        } else if (index === 1) {
                            leaderboardItem.classList.add('second-place');
                        } else if (index === 2) {
                            leaderboardItem.classList.add('third-place');
                        }

                        // Create the position container
                        const positionContainer = document.createElement('div');
                        positionContainer.classList.add('leaderboard-position');
                        positionContainer.innerHTML = `<span class="position-number">${index + 1}</span>`;

                        // Create the name container
                        const nameContainer = document.createElement('div');
                        nameContainer.classList.add('leaderboard-name');
                        nameContainer.textContent = user.name;

                        // Create the score container
                        const scoreContainer = document.createElement('div');
                        scoreContainer.classList.add('leaderboard-score');
                        scoreContainer.innerHTML = `<span class="score-number">${user.count}</span>`;

                        // Append the containers to the leaderboard item
                        leaderboardItem.appendChild(positionContainer);
                        leaderboardItem.appendChild(nameContainer);
                        leaderboardItem.appendChild(scoreContainer);

                        // Append the leaderboard item to the section
                        leaderboardSection.appendChild(leaderboardItem);
                    });
                });
            } else {
                console.error('No user is signed in.');
            }
        });
    }, error => {
        console.error('Error fetching sales data:', error);
    });
}








let currentSales = [];
let batchSize = 10; // Number of sales to load at a time
let lastRenderedIndex = 0;

const sellableTypes = ['Select RX', 'SPM Scheduled Call', 'Transfer', 'Billable HRA']; // Use readable titles
let hideNonSellable = false; // Track the toggle state for non-sellable
let hideSelfSales = false; // Track the toggle state for self-sales

document.addEventListener('DOMContentLoaded', () => {
    const toggleSellableButton = document.getElementById('toggleSellableButton');
    const toggleSelfSalesButton = document.getElementById('toggleSelfSalesButton');
    const currentUser = firebase.auth().currentUser; // Get the current user ID

    toggleSellableButton.addEventListener('click', () => {
        hideNonSellable = !hideNonSellable; // Toggle the state
        toggleSellableButton.classList.toggle('clicked', hideNonSellable);
        toggleSellableButton.textContent = hideNonSellable ? 'Show Non-sellable' : 'Hide Non-sellable';

        lastRenderedIndex = 0; // Reset the index to start rendering from the top
        document.getElementById('live-activities-section').innerHTML = ''; // Clear current content
        renderMoreSales(document.getElementById('live-activities-section'), firebase.database().ref('likes'), firebase.database().ref('users'));
    });

    toggleSelfSalesButton.addEventListener('click', () => {
        hideSelfSales = !hideSelfSales; // Toggle the state
        toggleSelfSalesButton.classList.toggle('clicked', hideSelfSales);
        toggleSelfSalesButton.textContent = hideSelfSales ? 'Show Self Sales' : 'Hide Self Sales';

        lastRenderedIndex = 0; // Reset the index to start rendering from the top
        document.getElementById('live-activities-section').innerHTML = ''; // Clear current content
        renderMoreSales(document.getElementById('live-activities-section'), firebase.database().ref('likes'), firebase.database().ref('users'));
    });

    loadLiveActivities();
});

async function loadLiveActivities() {
    try {
        const database = firebase.database();
        const salesTimeFramesRef = database.ref('salesTimeFrames');
        const usersRef = database.ref('users');
        const likesRef = database.ref('likes');
        const currentUser = firebase.auth().currentUser; // Get the current user ID

        const liveActivitiesSection = document.getElementById('live-activities-section');
        if (!liveActivitiesSection) {
            throw new Error('Live activities section element not found');
        }

        salesTimeFramesRef.off('value'); // Clear previous listeners
        salesTimeFramesRef.on('value', async salesSnapshot => {
            const salesData = salesSnapshot.val();
            if (!salesData) {
                console.error('No sales data found');
                liveActivitiesSection.innerHTML = '<p>No sales data found.</p>';
                return;
            }

            currentSales = await processSalesData(salesData);
            await addUserNames(currentSales, usersRef);
            renderMoreSales(liveActivitiesSection, likesRef, usersRef);
        });

        liveActivitiesSection.addEventListener('scroll', () => {
            if (liveActivitiesSection.scrollTop + liveActivitiesSection.clientHeight >= liveActivitiesSection.scrollHeight) {
                renderMoreSales(liveActivitiesSection, likesRef, usersRef);
            }
        });

    } catch (error) {
        console.error('Error loading live activities:', error);
    }
}

function renderMoreSales(container, likesRef, usersRef) {
    const currentUser = firebase.auth().currentUser; // Get the current user ID
    
    if (lastRenderedIndex >= currentSales.length) {
        console.log("All sales have been loaded");
        return; // Exit if all sales have been rendered
    }

    const salesToRender = currentSales.slice(lastRenderedIndex, lastRenderedIndex + batchSize)
        .filter(sale => (!hideNonSellable || sellableTypes.includes(sale.saleType)) &&
                        (!hideSelfSales || sale.userId !== currentUser.uid)); // Filter based on both toggle states

    lastRenderedIndex += salesToRender.length;

    salesToRender.forEach((sale) => {
        if (container.childElementCount >= 10) {
            container.removeChild(container.firstChild); // Remove the oldest activity if there are already 10
        }

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
    });

    // Automatically load more sales if the last rendered sale is visible and there are more to load
    const lastSaleElement = container.lastElementChild;
    if (lastSaleElement && lastRenderedIndex < currentSales.length) {
        renderMoreSales(container, likesRef, usersRef);
    }
}









function isToday(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
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
    const userPromises = sales.map(async sale => {
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

    // Wait for all user names to be fetched before proceeding
    await Promise.all(userPromises);
}


function renderSales(sales, container, likesRef, usersRef) {
    container.innerHTML = ''; // Clear the container but don't add the title

    sales.forEach(sale => {
        const saleElement = document.createElement('div');
        saleElement.classList.add('activity-item');

        const likePath = `${sale.userId}_${sale.leadId}_${sale.saleType}_${sale.saleTime.replace(/[.\#$$begin:math:display$$end:math:display$]/g, '_')}`;

        saleElement.innerHTML = `
            <button class="like-button" data-like-path="${likePath}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </button>
            <strong>${sale.userName}</strong> sold <strong>${sale.saleType}</strong> at ${sale.formattedTime}
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