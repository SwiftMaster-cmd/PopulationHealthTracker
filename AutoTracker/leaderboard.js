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
            checkAndSetUserName(user.uid);
            loadLeaderboard(periodPicker.value, saleTypePicker.value);
            loadLiveActivities();
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

                    const currentUserIndex = users.findIndex(u => u.userId === currentUserId);
                    const start = Math.max(0, currentUserIndex - 3);
                    const end = Math.min(users.length, start + 8);

                    leaderboardSection.innerHTML = '';

                    for (let i = start; i < end; i++) {
                        const user = users[i];
                        const userElement = document.createElement('div');
                        userElement.classList.add('leaderboard-item');
                        if (user.userId === currentUserId) {
                            userElement.style.color = 'var(--color-quinary)'; // Highlight current user
                        }
                        userElement.innerHTML = `<strong>${i + 1}. ${user.name}: ${user.count}</strong>`;
                        leaderboardSection.appendChild(userElement);
                    }
                });
            } else {
                console.error('No user is signed in.');
            }
        });
    }, error => {
        console.error('Error fetching sales data:', error);
    });
}










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

        const salesSnapshot = await salesTimeFramesRef.orderByKey().limitToLast(5).once('value');
        const salesData = salesSnapshot.val();
        if (!salesData) {
            throw new Error('No sales data found');
        }

        const sales = await processSalesData(salesData);
        const latestSales = sales.slice(0, 5);

        await addUserNames(latestSales, usersRef);
        renderSales(latestSales, liveActivitiesSection, likesRef);

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

function renderSales(sales, container, likesRef) {
    container.innerHTML = '<h4>Live Activities</h4>';

    sales.forEach(sale => {
        const saleElement = document.createElement('div');
        saleElement.classList.add('activity-item');

        // Use a sanitized path for the like button
        const likePath = `${sale.userId}_${sale.leadId}_${sale.saleType}_${sale.saleTime.replace(/[\.\#\$$begin:math:display$$end:math:display$]/g, '_')}`;

        saleElement.innerHTML = `
            <button class="like-button" data-like-path="${likePath}">❤️</button>
            <span class="like-count">0</span>
            <strong>${sale.userName}</strong> sold <strong>${sale.saleType}</strong> at ${sale.formattedTime}
        `;
        container.appendChild(saleElement);

        const likeButton = saleElement.querySelector('.like-button');
        const likeCountSpan = saleElement.querySelector('.like-count');

        initializeLikeCount(likesRef, likePath, likeCountSpan, likeButton);

        likeButton.addEventListener('click', () => handleLikeClick(likesRef, likePath, likeCountSpan, likeButton));
    });
}

async function initializeLikeCount(likesRef, likePath, likeCountSpan, likeButton) {
    try {
        const snapshot = await likesRef.child(likePath).once('value');
        const likes = snapshot.val() || {};
        const likeCount = Object.values(likes).reduce((total, value) => total + value, 0);
        likeCountSpan.textContent = likeCount;
        if (likeCount > 0) {
            likeCountSpan.style.display = 'inline';
            if (likes[firebase.auth().currentUser.uid]) {
                likeButton.classList.add('liked');
            }
        } else {
            likeCountSpan.style.display = 'none';
        }
    } catch (error) {
        console.error('Error initializing like count:', error);
    }
}

async function handleLikeClick(likesRef, likePath, likeCountSpan, likeButton) {
    try {
        const currentUserId = firebase.auth().currentUser.uid;
        const userLikePath = `${likePath}/${currentUserId}`;

        const result = await likesRef.child(userLikePath).transaction(currentValue => {
            return currentValue ? 0 : 1;
        });

        if (result.committed) {
            const likesSnapshot = await likesRef.child(likePath).once('value');
            const likes = likesSnapshot.val() || {};
            const likeCount = Object.values(likes).reduce((total, value) => total + value, 0);

            likeCountSpan.textContent = likeCount;
            if (likeCount > 0) {
                likeCountSpan.style.display = 'inline';
            } else {
                likeCountSpan.style.display = 'none';
            }
            likeButton.classList.toggle('liked', !!likes[currentUserId]);
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
        default:
            return saleType;
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
        default:
            return saleType;
    }
}