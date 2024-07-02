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

function loadLiveActivities() {
    const database = firebase.database();
    const salesTimeFramesRef = database.ref('salesTimeFrames');
    const usersRef = database.ref('users');
    const likesRef = database.ref('likes');

    const liveActivitiesSection = document.getElementById('live-activities-section');
    if (!liveActivitiesSection) {
        console.error('Live activities section element not found');
        return;
    }

    salesTimeFramesRef.orderByKey().limitToLast(5).on('value', salesSnapshot => {
        const salesData = salesSnapshot.val();
        if (!salesData) {
            console.error('No sales data found');
            return;
        }

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
        const latestSales = sales.slice(0, 5);

        const namePromises = latestSales.map(sale => {
            return usersRef.child(sale.userId).once('value').then(snapshot => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    sale.userName = userData.name || 'Unknown User';
                } else {
                    sale.userName = 'Unknown User';
                }
                sale.saleType = getReadableTitle(sale.saleType); // Ensure sale type is readable
            }).catch(error => {
                console.error(`Error fetching user data for userId ${sale.userId}:`, error);
                sale.userName = 'Unknown User';
            });
        });

        Promise.all(namePromises).then(() => {
            liveActivitiesSection.innerHTML = '<h4>Live Activities</h4>';

            latestSales.forEach(sale => {
                const saleElement = document.createElement('div');
                saleElement.classList.add('activity-item');

                // Use a sanitized path for the like button
                const likePath = `${sale.userId}_${sale.leadId}_${sale.saleType}_${encodeURIComponent(sale.saleTime)}`;

                saleElement.innerHTML = `
                    <button class="like-button" data-like-path="${likePath}">❤️ Like</button>
                    <span class="like-count">0</span>
                    <strong>${sale.userName}</strong> sold <strong>${sale.saleType}</strong> at ${sale.formattedTime}
                `;
                liveActivitiesSection.appendChild(saleElement);

                const likeButton = saleElement.querySelector('.like-button');
                const likeCountSpan = saleElement.querySelector('.like-count');

                likesRef.child(likePath).once('value').then(snapshot => {
                    const likeCount = snapshot.val() || 0;
                    likeCountSpan.textContent = likeCount;
                    if (likeCount > 0) {
                        likeButton.classList.add('liked');
                    }
                });

                likeButton.addEventListener('click', () => {
                    const currentUserId = firebase.auth().currentUser.uid;
                    const userLikePath = `${likePath}/${currentUserId}`;

                    likesRef.child(userLikePath).transaction(currentValue => {
                        if (currentValue) {
                            // Unlike
                            return null;
                        } else {
                            // Like
                            return true;
                        }
                    }).then(result => {
                        if (result.committed) {
                            const newCount = result.snapshot.val() ? parseInt(likeCountSpan.textContent) + 1 : parseInt(likeCountSpan.textContent) - 1;
                            likeCountSpan.textContent = newCount;
                            likeButton.classList.toggle('liked', result.snapshot.val());
                        }
                    }).catch(error => {
                        console.error('Error updating like count:', error);
                    });
                });
            });
        }).catch(error => {
            console.error('Error fetching data:', error);
        });
    }, error => {
        console.error('Error fetching live activities:', error);
    });
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