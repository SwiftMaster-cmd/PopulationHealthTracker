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

function loadLeaderboard(period = 'day', saleType = 'selectRX') {
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
                            count = userData.day && userData.day[saleType] ? userData.day[saleType] : 0;
                        } else if (period === 'week') {
                            count = userData.week && userData.week[saleType] ? userData.week[saleType] : 0;
                        } else if (period === 'month') {
                            count = userData.month && userData.month[saleType] ? userData.month[saleType] : 0;
                        }

                        let name = usersData && usersData[userId] && usersData[userId].name ? usersData[userId].name : 'Unknown User';
                        if (name.length > 10) {
                            name = name.substring(0, 8); // Truncate name to 8 characters
                        }
                        users.push({ userId, name, count });
                    }

                    users.sort((a, b) => b.count - a.count);

                    // Save points for all users
                    users.forEach((user, index) => {
                        let points = 0;
                        if (index < 5) {
                            points = 5 - index;
                        }
                        
                        // Save points to user's profile
                        const userRef = usersRef.child(user.userId);
                        userRef.child('points').transaction(currentPoints => {
                            return (currentPoints || 0) + points;
                        });
                    });

                    const currentUserIndex = users.findIndex(u => u.userId === currentUserId);
                    let start = 0, end = 5;

                    if (currentUserIndex === 0) {
                        // If current user is in the first place
                        start = 0;
                        end = Math.min(5, users.length);
                    } else if (currentUserIndex === users.length - 1) {
                        // If current user is in the last place
                        start = Math.max(users.length - 5, 0);
                        end = users.length;
                    } else {
                        // If current user is in the middle
                        start = Math.max(0, currentUserIndex - 2);
                        end = Math.min(users.length, currentUserIndex + 3);
                        if (end - start < 5) {
                            start = Math.max(0, end - 5);
                        }
                    }

                    leaderboardSection.innerHTML = '';

                    for (let i = start; i < end; i++) {
                        const user = users[i];
                        const userElement = document.createElement('div');
                        userElement.classList.add('leaderboard-item');
                        if (user.userId === currentUserId) {
                            userElement.style.color = 'var(--color-quinary)'; // Highlight current user
                        }
                        
                        // Calculate points
                        let points = 0;
                        if (i < 5) {
                            points = 5 - i;
                        }
                        
                        userElement.innerHTML = `<strong>${i + 1}. ${user.name}: ${user.count}</strong>`;
                        userElement.setAttribute('data-points', `${points} pts`);
                        leaderboardSection.appendChild(userElement);
                    }

                    // Update total points in header
                    updateTotalPointsInHeader();
                });
            } else {
                console.error('No user is signed in.');
            }
        });
    }, error => {
        console.error('Error fetching sales data:', error);
    });
}

function updateTotalPointsInHeader() {
    const database = firebase.database();
    const currentUser = firebase.auth().currentUser;

    if (currentUser) {
        const userRef = database.ref('users/' + currentUser.uid);
        userRef.child('points').on('value', snapshot => {
            const totalPoints = snapshot.val() || 0;
            const pointsElement = document.getElementById('totalPoints');
            if (pointsElement) {
                pointsElement.textContent = `Total Points: ${totalPoints}`;
            }
        });
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // ... (existing code)
    updateTotalPointsInHeader();
});

document.addEventListener('DOMContentLoaded', loadLiveActivities);

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

        salesTimeFramesRef.orderByKey().limitToLast(5).on('value', async salesSnapshot => {
            const salesData = salesSnapshot.val();
            if (!salesData) {
                throw new Error('No sales data found');
            }

            console.log('Sales data:', salesData);
            const sales = await processSalesData(salesData);
            const latestSales = sales.slice(0, 5);

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

                    sales.push({ userId, leadId, saleType, saleTime, formattedTime });
                }
            }
        }
    }

    sales.sort((a, b) => new Date(b.saleTime) - new Date(a.saleTime));
    return sales;
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
            <strong>${sale.userName}</strong> sold <strong>${sale.saleType}</strong> at ${sale.formattedTime}
            <div class="like-info" id="like-info-${likePath}"></div>
        `;
        container.appendChild(saleElement);

        const likeButton = saleElement.querySelector('.like-button');
        const likeInfoDiv = saleElement.querySelector('.like-info');

        initializeLikeCount(likesRef, likePath, likeButton, likeInfoDiv, usersRef);

        likeButton.addEventListener('click', () => handleLikeClick(likesRef, likePath, likeButton, likeInfoDiv, usersRef));

        // Listen for changes to likes in real-time
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