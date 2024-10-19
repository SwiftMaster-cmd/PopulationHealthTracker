// groupChat.js

document.addEventListener('firebaseInitialized', function() {
    const auth = firebase.auth();
    const database = firebase.database();

    let currentUserId = null;
    let currentUserName = null;
    let usersData = {};

    let currentChatId = 'groupChat'; // Default to group chat
    let currentChatName = 'Group Chat';

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            initializeUserName(user);
            initializeChat();
        }
    });

    function initializeUserName(user) {
        const userRef = database.ref('Users/' + user.uid);
        userRef.once('value').then(snapshot => {
            const userData = snapshot.val();
            if (userData && userData.name) {
                currentUserName = userData.name;
            } else {
                // Prompt for user name if not set
                promptForUserName(user);
            }
        }).catch(error => {
            console.error('Error fetching user data:', error);
        });
    }

    function promptForUserName(user) {
        let userName = prompt('Please enter your name:');
        if (userName === null || userName.trim() === '') {
            userName = 'No name';
        }

        // Save the name in the database
        const userRef = database.ref('Users/' + user.uid);
        userRef.update({ name: userName }).then(() => {
            console.log('User name saved successfully.');
            currentUserName = userName;
        }).catch(error => {
            console.error('Error saving user name:', error);
        });
    }

    function initializeChat() {
        // Load Users data
        const usersRef = database.ref('Users');
        usersRef.on('value', usersSnapshot => {
            usersData = usersSnapshot.val() || {};
        });

        // Initialize chat list
        loadChatList();

        // Set up event listeners
        setupEventListeners();

        // Load the current chat (default is group chat)
        loadChat(currentChatId);
    }

    function loadChat(chatId) {
        currentChatId = chatId;
        currentChatName = chatId === 'groupChat' ? 'Group Chat' : usersData[chatId]?.name || 'Chat';

        const chatHeader = document.getElementById('chatHeader');
        chatHeader.textContent = currentChatName;

        const chatContainer = document.getElementById('chatContainer');
        chatContainer.innerHTML = ''; // Clear previous messages

        const messagesRef = database.ref(`chats/${currentChatId}/messages`);

        // Remove previous listeners
        messagesRef.off();

        // Load existing messages and listen for new ones
        messagesRef.on('child_added', snapshot => {
            const message = snapshot.val();
            const messageId = snapshot.key;
            displayMessage(message, messageId);
        });

        // Listen for message updates (likes/comments)
        messagesRef.on('child_changed', snapshot => {
            const message = snapshot.val();
            const messageId = snapshot.key;
            const messageDiv = document.getElementById(`message-${messageId}`);
            if (messageDiv) {
                messageDiv.parentNode.removeChild(messageDiv);
                displayMessage(message, messageId);
            }
        });

        // Load past live activities and add them to the chat if it's group chat
        if (currentChatId === 'groupChat') {
            loadPastLiveActivities();
        }

        // Show message form
        const messageForm = document.getElementById('messageForm');
        messageForm.style.display = 'flex';
    }

    function loadPastLiveActivities() {
        const salesOutcomesRef = database.ref('salesOutcomes');

        salesOutcomesRef.once('value').then(snapshot => {
            const salesData = snapshot.val();
            const salesList = [];

            for (const userId in salesData) {
                const userSalesData = salesData[userId];
                const userName = (usersData[userId] && usersData[userId].name) || 'No name';

                for (const saleId in userSalesData) {
                    const sale = userSalesData[saleId];
                    const saleType = getSaleType(sale.assignAction || '', sale.notesValue || '');
                    const saleTime = new Date(sale.outcomeTime).getTime();

                    if (saleType) {
                        salesList.push({
                            userId: userId,
                            userName: userName,
                            content: {
                                saleId: saleId,
                                saleType: saleType,
                                saleTime: saleTime,
                                saleData: sale
                            },
                            type: 'liveActivity',
                            timestamp: saleTime,
                            likes: {},
                            comments: {}
                        });
                    }
                }
            }

            // Sort sales by timestamp
            salesList.sort((a, b) => a.timestamp - b.timestamp);

            // Display all past sales as messages in the chat
            salesList.forEach(sale => {
                const messageId = `sale-${sale.content.saleId}`;
                displayMessage(sale, messageId);
            });
        }).catch(error => {
            console.error('Error loading past live activities:', error);
        });

        // Listen for new sales (live activities)
        const salesOutcomesRefLive = database.ref('salesOutcomes');
        salesOutcomesRefLive.on('child_added', snapshot => {
            const userId = snapshot.key;
            const userSalesData = snapshot.val();
            const userName = (usersData[userId] && usersData[userId].name) || 'No name';

            for (const saleId in userSalesData) {
                const sale = userSalesData[saleId];
                const saleType = getSaleType(sale.assignAction || '', sale.notesValue || '');
                const saleTime = new Date(sale.outcomeTime).getTime();

                if (saleType) {
                    const saleMessage = {
                        userId: userId,
                        userName: userName,
                        content: {
                            saleId: saleId,
                            saleType: saleType,
                            saleTime: saleTime,
                            saleData: sale
                        },
                        type: 'liveActivity',
                        timestamp: saleTime,
                        likes: {},
                        comments: {}
                    };

                    const messageId = `sale-${saleId}`;
                    displayMessage(saleMessage, messageId);
                }
            }
        });

        // Listen for updates to sales
        salesOutcomesRefLive.on('child_changed', snapshot => {
            const userId = snapshot.key;
            const userSalesData = snapshot.val();
            const userName = (usersData[userId] && usersData[userId].name) || 'No name';

            for (const saleId in userSalesData) {
                const sale = userSalesData[saleId];
                const saleType = getSaleType(sale.assignAction || '', sale.notesValue || '');
                const saleTime = new Date(sale.outcomeTime).getTime();

                if (saleType) {
                    const saleMessage = {
                        userId: userId,
                        userName: userName,
                        content: {
                            saleId: saleId,
                            saleType: saleType,
                            saleTime: saleTime,
                            saleData: sale
                        },
                        type: 'liveActivity',
                        timestamp: saleTime,
                        likes: {},
                        comments: {}
                    };

                    const messageId = `sale-${saleId}`;
                    displayMessage(saleMessage, messageId);
                }
            }
        });
    }

    function sendMessage(content, type) {
        const messageData = {
            userId: currentUserId,
            userName: currentUserName || 'Anonymous',
            content: content,
            type: type, // 'text', 'gif', or 'liveActivity'
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            likes: {},
            comments: {}
        };

        const messagesRef = database.ref(`chats/${currentChatId}/messages`);
        messagesRef.push(messageData).catch(error => {
            console.error('Error sending message:', error);
        });
    }

    function displayMessage(message, messageId) {
        const chatContainer = document.getElementById('chatContainer');

        // Check if message already exists
        if (document.getElementById(`message-${messageId}`)) {
            return;
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message');
        messageDiv.id = `message-${messageId}`;

        const time = new Date(message.timestamp).toLocaleTimeString();

        if (message.type === 'text') {
            messageDiv.innerHTML = `
                <p><strong>${message.userName}</strong> <span class="chat-time">${time}</span></p>
                <p>${message.content}</p>
            `;
        } else if (message.type === 'gif') {
            messageDiv.innerHTML = `
                <p><strong>${message.userName}</strong> <span class="chat-time">${time}</span></p>
                <img src="${message.content}" alt="GIF" class="chat-gif">
            `;
        } else if (message.type === 'liveActivity') {
            const saleType = message.content.saleType;
            const saleTime = new Date(message.content.saleTime).toLocaleString();
            messageDiv.innerHTML = `
                <p><strong>${message.userName}</strong> made a <strong>${saleType}</strong> sale on ${saleTime}</p>
            `;
        }

        // Add like button and likes count
        const likeButton = document.createElement('button');
        const likesCount = message.likes ? Object.keys(message.likes).length : 0;
        const userLiked = message.likes && message.likes[currentUserId];

        likeButton.textContent = userLiked ? `Unlike (${likesCount})` : `Like (${likesCount})`;
        likeButton.addEventListener('click', () => {
            toggleLike(messageId, userLiked);
        });

        // Add comment button
        const commentButton = document.createElement('button');
        commentButton.textContent = 'Comment';
        commentButton.addEventListener('click', () => {
            commentForm.style.display = commentForm.style.display === 'none' ? 'block' : 'none';
        });

        // Append buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('message-actions');
        actionsDiv.appendChild(likeButton);
        actionsDiv.appendChild(commentButton);

        messageDiv.appendChild(actionsDiv);

        // Display comments
        const commentsSection = document.createElement('div');
        commentsSection.classList.add('comments-section');

        const comments = message.comments || {};
        const commentsCount = Object.keys(comments).length;

        // Create "Show Replies" button
        if (commentsCount > 0) {
            const showRepliesButton = document.createElement('button');
            showRepliesButton.textContent = `Show Replies (${commentsCount})`;
            let repliesVisible = false;

            showRepliesButton.addEventListener('click', () => {
                repliesVisible = !repliesVisible;
                commentsList.style.display = repliesVisible ? 'block' : 'none';
                showRepliesButton.textContent = repliesVisible ? `Hide Replies (${commentsCount})` : `Show Replies (${commentsCount})`;
            });

            commentsSection.appendChild(showRepliesButton);
        }

        // Create comments list
        const commentsList = document.createElement('ul');
        commentsList.classList.add('comments-list');
        commentsList.style.display = 'none'; // Hidden initially

        for (const commentId in comments) {
            const comment = comments[commentId];
            const commentItem = document.createElement('li');
            const commentTime = new Date(comment.timestamp).toLocaleString();
            commentItem.innerHTML = `<strong>${comment.userName}</strong> (${commentTime}): ${comment.commentText}`;
            commentsList.appendChild(commentItem);
        }

        commentsSection.appendChild(commentsList);

        // Add comment form
        const commentForm = document.createElement('form');
        commentForm.classList.add('comment-form');
        commentForm.style.display = 'none'; // Hide comment form initially

        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const commentText = commentInput.value.trim();
            if (commentText) {
                addComment(messageId, commentText);
                commentInput.value = '';
            }
        });

        const commentInput = document.createElement('input');
        commentInput.type = 'text';
        commentInput.placeholder = 'Add a comment...';
        commentInput.required = true;

        const commentSubmit = document.createElement('button');
        commentSubmit.type = 'submit';
        commentSubmit.textContent = 'Post';

        commentForm.appendChild(commentInput);
        commentForm.appendChild(commentSubmit);

        commentsSection.appendChild(commentForm);

        messageDiv.appendChild(commentsSection);

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to the bottom
    }

    function toggleLike(messageId, userLiked) {
        const likeRef = database.ref(`chats/${currentChatId}/messages/${messageId}/likes/${currentUserId}`);
        if (userLiked) {
            // User wants to unlike
            likeRef.remove().catch(error => {
                console.error('Error removing like:', error);
            });
        } else {
            // User wants to like
            likeRef.set(true).catch(error => {
                console.error('Error adding like:', error);
            });
        }
    }

    function addComment(messageId, commentText) {
        const commentId = database.ref().child('chats').child(currentChatId).child('messages').child(messageId).child('comments').push().key;
        const commentData = {
            userId: currentUserId,
            userName: currentUserName || 'Anonymous',
            commentText: commentText,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        const commentRef = database.ref(`chats/${currentChatId}/messages/${messageId}/comments/${commentId}`);
        commentRef.set(commentData).catch(error => {
            console.error('Error adding comment:', error);
        });
    }

    function getSaleType(action, notes) {
        const normalizedAction = action.toLowerCase();
        const normalizedNotes = notes.toLowerCase();

        if (/hra/i.test(normalizedAction) || /hra/i.test(normalizedNotes)) {
            return 'HRA';
        } else if (
            /(vbc|transfer|ndr|dental|fe|final expense|national|national debt|national debt relief|value based care|oak street|osh)/i.test(normalizedNotes)
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
        } else {
            // Exclude other options
            return null;
        }
    }

    // Event listeners for sending messages
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const messageText = messageInput.value.trim();
        if (messageText) {
            sendMessage(messageText, 'text');
            messageInput.value = '';
        }
    });

    // Setup event listeners
    function setupEventListeners() {
        // GIF Search Input
        const gifSearchInput = document.getElementById('gifSearchInput');
        const gifResults = document.getElementById('gifResults');

        gifSearchInput.addEventListener('input', () => {
            const query = gifSearchInput.value.trim();
            if (query.length > 2) {
                searchGIFs(query);
            } else {
                gifResults.innerHTML = '';
            }
        });

        // Show GIF Search Container
        const showGIFButton = document.getElementById('showGIFButton');
        const gifSearchContainer = document.getElementById('gifSearchContainer');

        showGIFButton.addEventListener('click', () => {
            gifSearchContainer.style.display = gifSearchContainer.style.display === 'none' ? 'block' : 'none';
        });

        // New Chat Button
        const newChatButton = document.getElementById('newChatButton');
        const userListContainer = document.getElementById('userListContainer');
        const userSearchInput = document.getElementById('userSearchInput');
        const userList = document.getElementById('userList');

        newChatButton.addEventListener('click', () => {
            userListContainer.style.display = 'block';
            loadUserList();
        });

        userSearchInput.addEventListener('input', () => {
            const query = userSearchInput.value.trim().toLowerCase();
            loadUserList(query);
        });

        // Toggle Chat List Button
        const toggleChatListButton = document.getElementById('toggleChatListButton');
        const chatSidebar = document.querySelector('.chat-sidebar');
        const chatMain = document.querySelector('.chat-main');

        toggleChatListButton.addEventListener('click', () => {
            chatSidebar.classList.toggle('hidden');
            chatMain.classList.toggle('full-width');
            toggleChatListButton.textContent = chatSidebar.classList.contains('hidden') ? 'Show Chats' : 'Hide Chats';
        });
    }

    // Function to search GIFs using Giphy API
    function searchGIFs(query) {
        const apiKey = 'WXv8lPQ9faO55i3Kd0jPTdbRm0XvuQUH'; // Replace with your Giphy API key
        const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=10&rating=pg`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const gifResults = document.getElementById('gifResults');
                gifResults.innerHTML = '';

                data.data.forEach(gif => {
                    const img = document.createElement('img');
                    img.src = gif.images.fixed_width.url;
                    img.classList.add('gif-result');
                    img.addEventListener('click', () => {
                        sendMessage(gif.images.fixed_width.url, 'gif');
                        gifResults.innerHTML = '';
                        document.getElementById('gifSearchInput').value = '';
                    });
                    gifResults.appendChild(img);
                });
            })
            .catch(error => {
                console.error('Error fetching GIFs:', error);
            });
    }

    // Function to load chat list
    function loadChatList() {
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';

        // Load existing chats
        const userChatsRef = database.ref(`Users/${currentUserId}/chats`);
        userChatsRef.on('value', snapshot => {
            const chats = snapshot.val() || {};

            // Always include the group chat
            const groupChatItem = document.createElement('li');
            groupChatItem.textContent = 'Group Chat';
            groupChatItem.addEventListener('click', () => {
                loadChat('groupChat');
            });
            chatList.appendChild(groupChatItem);

            for (const chatId in chats) {
                const chatItem = document.createElement('li');
                const chatName = usersData[chatId]?.name || 'Chat';
                chatItem.textContent = chatName;
                chatItem.addEventListener('click', () => {
                    loadChat(chatId);
                });
                chatList.appendChild(chatItem);
            }
        });
    }

    // Function to load user list for new chat
    function loadUserList(query = '') {
        const userList = document.getElementById('userList');
        userList.innerHTML = '';

        for (const userId in usersData) {
            if (userId !== currentUserId) {
                const userName = usersData[userId].name || 'No name';
                if (userName.toLowerCase().includes(query)) {
                    const userItem = document.createElement('li');
                    userItem.textContent = userName;
                    userItem.addEventListener('click', () => {
                        startNewChat(userId);
                    });
                    userList.appendChild(userItem);
                }
            }
        }
    }

    // Function to start a new chat
    function startNewChat(userId) {
        const userListContainer = document.getElementById('userListContainer');
        userListContainer.style.display = 'none';

        // Add chat reference to both users
        const userChatsRef = database.ref(`Users/${currentUserId}/chats/${userId}`);
        userChatsRef.set(true);

        const otherUserChatsRef = database.ref(`Users/${userId}/chats/${currentUserId}`);
        otherUserChatsRef.set(true);

        // Load the chat
        loadChat(userId);
    }

    // Close user list when clicking outside
    window.addEventListener('click', (e) => {
        const userListContainer = document.getElementById('userListContainer');
        if (e.target === userListContainer) {
            userListContainer.style.display = 'none';
        }
    });
});
