// privateChat.js

document.addEventListener('firebaseInitialized', function () {
    const auth = firebase.auth();
    const database = firebase.database();

    let currentUserId = null;
    let currentUserName = null;
    let selectedChatId = null;
    let chatListener = null;
    let salesListener = null;
    let sendMessageHandler = null;

    let usersData = {}; // To store user names

    let messagesEndReached = false;
    let lastMessageTimestamp = null;
    let isLoadingMore = false;

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            initializeUserName(user);
            loadUsers(); // Load user names
            initializeChatList(); // Load existing chats

            // Load group chat by default
            selectGroupChat();
        }
    });

    function initializeUserName(user) {
        const userRef = database.ref('Users/' + user.uid);
        userRef.once('value').then(snapshot => {
            const userData = snapshot.val();
            if (userData && userData.name) {
                currentUserName = userData.name;
            } else {
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

        const userRef = database.ref('Users/' + user.uid);
        userRef.update({ name: userName }).then(() => {
            console.log('User name saved successfully.');
            currentUserName = userName;
        }).catch(error => {
            console.error('Error saving user name:', error);
        });
    }

    function loadUsers() {
        const usersRef = database.ref('Users');
        usersRef.on('value', snapshot => {
            usersData = snapshot.val() || {};
        });
    }

    function initializeChatList() {
        const userChatsRef = database.ref(`userChats/${currentUserId}`);
        userChatsRef.on('value', snapshot => {
            const chats = snapshot.val() || {};
            renderChatList(chats);
        });

        const newChatButton = document.getElementById('newChatButton');
        newChatButton.addEventListener('click', () => {
            displayUserList();
        });
    }

    function renderChatList(chats) {
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';

        // Include Group Chat in the chat list
        const groupChatListItem = document.createElement('li');
        groupChatListItem.textContent = 'Group Chat';
        groupChatListItem.addEventListener('click', () => {
            selectGroupChat();
        });
        chatList.appendChild(groupChatListItem);

        for (const chatId in chats) {
            const chat = chats[chatId];
            const participants = Object.keys(chat.participants);
            const otherUserId = participants.find(id => id !== currentUserId);
            const otherUserName = usersData[otherUserId] ? usersData[otherUserId].name : 'Unknown User';

            const chatListItem = document.createElement('li');
            chatListItem.textContent = otherUserName;
            chatListItem.addEventListener('click', () => {
                selectChat(chatId, otherUserId, otherUserName);
            });

            chatList.appendChild(chatListItem);
        }
    }

    function displayUserList() {
        const userListContainer = document.getElementById('userListContainer');
        userListContainer.style.display = 'block';
        const userList = document.getElementById('userList');
        userList.innerHTML = '';

        for (const userId in usersData) {
            if (userId !== currentUserId) {
                const userName = usersData[userId].name;
                const userListItem = document.createElement('li');
                userListItem.textContent = userName;
                userListItem.addEventListener('click', () => {
                    createOrSelectChatWithUser(userId, userName);
                    userListContainer.style.display = 'none';
                });
                userList.appendChild(userListItem);
            }
        }

        // Handle search input
        const userSearchInput = document.getElementById('userSearchInput');
        userSearchInput.value = ''; // Clear previous input
        userSearchInput.addEventListener('input', () => {
            const query = userSearchInput.value.toLowerCase();
            for (const listItem of userList.children) {
                const name = listItem.textContent.toLowerCase();
                listItem.style.display = name.includes(query) ? '' : 'none';
            }
        });
    }

    function createOrSelectChatWithUser(recipientId, recipientName) {
        // Check if chat already exists
        const userChatsRef = database.ref(`userChats/${currentUserId}`);
        userChatsRef.once('value').then(snapshot => {
            const chats = snapshot.val() || {};
            for (const chatId in chats) {
                const chat = chats[chatId];
                if (chat.participants && chat.participants[recipientId]) {
                    // Chat already exists
                    selectChat(chatId, recipientId, recipientName);
                    return;
                }
            }
            // Create new chat
            createNewChat(recipientId, recipientName);
        }).catch(error => {
            console.error('Error accessing user chats:', error);
        });
    }

    function createNewChat(recipientId, recipientName) {
        const chatId = database.ref().child('privateChats').push().key;
        const chatData = {
            participants: {
                [currentUserId]: true,
                [recipientId]: true
            },
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        const updates = {};
        updates[`privateChats/${chatId}`] = chatData;
        updates[`userChats/${currentUserId}/${chatId}`] = chatData;
        updates[`userChats/${recipientId}/${chatId}`] = chatData;

        database.ref().update(updates).then(() => {
            selectChat(chatId, recipientId, recipientName);
        }).catch(error => {
            console.error('Error creating chat:', error);
            alert('Failed to create chat: ' + error.message);
        });
    }

    function selectChat(chatId, otherUserId, otherUserName) {
        selectedChatId = chatId;

        // Update chat header
        const chatHeader = document.getElementById('chatHeader');
        chatHeader.textContent = `Chat with ${otherUserName}`;

        // Show message form and GIF search
        const messageForm = document.getElementById('messageForm');
        messageForm.style.display = 'flex';
        const gifSearchContainer = document.getElementById('gifSearchContainer');
        gifSearchContainer.style.display = 'block';

        // Remove previous listeners
        removeListeners();

        // Clear chat container
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.innerHTML = '';

        // Reset pagination variables
        messagesEndReached = false;
        lastMessageTimestamp = null;
        isLoadingMore = false;

        // Load initial messages
        loadMoreMessages();

        // Handle message form submission
        const messageInput = document.getElementById('messageInput');

        sendMessageHandler = function (e) {
            e.preventDefault();
            const text = messageInput.value.trim();
            if (text) {
                sendMessage(text, 'text');
                messageInput.value = '';
            }
        };

        messageForm.addEventListener('submit', sendMessageHandler);

        // Handle GIF search
        initializeGifSearch();

        // Handle scrolling for loading more messages
        chatContainer.addEventListener('scroll', handleScroll);
    }

    function selectGroupChat() {
        selectedChatId = 'groupChat';

        // Update chat header
        const chatHeader = document.getElementById('chatHeader');
        chatHeader.textContent = 'Group Chat';

        // Show message form and GIF search
        const messageForm = document.getElementById('messageForm');
        messageForm.style.display = 'flex';
        const gifSearchContainer = document.getElementById('gifSearchContainer');
        gifSearchContainer.style.display = 'block';

        // Remove previous listeners
        removeListeners();

        // Clear chat container
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.innerHTML = '';

        // Reset pagination variables
        messagesEndReached = false;
        lastMessageTimestamp = null;
        isLoadingMore = false;

        // Load initial messages
        loadMoreMessages();

        // Handle message form submission
        const messageInput = document.getElementById('messageInput');

        sendMessageHandler = function (e) {
            e.preventDefault();
            const text = messageInput.value.trim();
            if (text) {
                sendGroupMessage(text, 'text');
                messageInput.value = '';
            }
        };

        messageForm.addEventListener('submit', sendMessageHandler);

        // Handle GIF search
        initializeGifSearch();

        // Handle scrolling for loading more messages
        chatContainer.addEventListener('scroll', handleScroll);
    }

    function removeListeners() {
        const chatContainer = document.getElementById('chatContainer');

        // Remove previous chat listener
        if (chatListener) {
            chatListener.off();
            chatListener = null;
        }

        // Remove previous sales listener
        if (salesListener) {
            salesListener.off();
            salesListener = null;
        }

        // Remove previous sendMessageHandler
        if (sendMessageHandler) {
            const messageForm = document.getElementById('messageForm');
            messageForm.removeEventListener('submit', sendMessageHandler);
            sendMessageHandler = null;
        }

        // Remove scroll event listener
        chatContainer.removeEventListener('scroll', handleScroll);
    }

    function handleScroll() {
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer.scrollTop === 0 && !isLoadingMore && !messagesEndReached) {
            isLoadingMore = true;
            loadMoreMessages();
        }
    }

    function loadMoreMessages() {
        const chatContainer = document.getElementById('chatContainer');
        const messagesRef = selectedChatId === 'groupChat'
            ? database.ref('groupChatMessages')
            : database.ref(`privateMessages/${selectedChatId}`);

        let query = messagesRef.orderByChild('timestamp').limitToLast(20);

        if (lastMessageTimestamp) {
            query = messagesRef.orderByChild('timestamp').endAt(lastMessageTimestamp - 1).limitToLast(20);
        }

        query.once('value', snapshot => {
            const messages = [];
            snapshot.forEach(childSnapshot => {
                const message = childSnapshot.val();
                message.key = childSnapshot.key;
                messages.push(message);
            });

            if (messages.length === 0) {
                messagesEndReached = true;
                return;
            }

            lastMessageTimestamp = messages[0].timestamp;

            messages.reverse(); // Oldest to newest

            messages.forEach(message => {
                displayMessage(message);
            });

            isLoadingMore = false;

            if (!chatContainer.dataset.initialScroll) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
                chatContainer.dataset.initialScroll = 'true';
            } else {
                // Maintain scroll position when loading older messages
                const firstNewMessage = chatContainer.children[messages.length];
                if (firstNewMessage) {
                    firstNewMessage.scrollIntoView();
                }
            }
        }).catch(error => {
            console.error('Error loading messages:', error);
            isLoadingMore = false;
        });

        // Set up real-time listeners
        if (!chatListener) {
            chatListener = messagesRef.orderByChild('timestamp').startAt(Date.now());
            chatListener.on('child_added', snapshot => {
                const message = snapshot.val();
                message.key = snapshot.key;
                displayMessage(message);
            });

            chatListener.on('child_changed', snapshot => {
                const message = snapshot.val();
                message.key = snapshot.key;
                updateMessage(message);
            });
        }

        if (selectedChatId === 'groupChat' && !salesListener) {
            // Set up listener for salesOutcomes
            salesListener = database.ref('salesOutcomes');
            salesListener.on('child_added', handleSalesData);
            salesListener.on('child_changed', handleSalesData);
        }
    }

    function handleSalesData(snapshot) {
        const userId = snapshot.key;
        const userSalesData = snapshot.val();
        const userName = usersData[userId] ? usersData[userId].name : 'No name';

        for (const saleId in userSalesData) {
            const sale = userSalesData[saleId];
            const saleType = getSaleType(sale.assignAction || '', sale.notesValue || '');
            const saleTime = new Date(sale.outcomeTime).getTime();

            if (saleType) {
                const liveActivityMessage = {
                    userId: userId,
                    userName: userName,
                    saleType: saleType,
                    saleTime: sale.outcomeTime,
                    saleId: saleId,
                    type: 'liveActivity',
                    timestamp: saleTime,
                    likes: {},
                    comments: {},
                    key: `sale-${saleId}`
                };

                // Display live activity message
                displayMessage(liveActivityMessage);
            }
        }
    }

    function sendMessage(content, type) {
        const messageData = {
            senderId: currentUserId,
            senderName: currentUserName || 'Anonymous',
            content: content,
            type: type, // 'text' or 'gif'
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            likes: {},
            comments: {}
        };

        const messagesRef = database.ref(`privateMessages/${selectedChatId}`);
        messagesRef.push(messageData).catch(error => {
            console.error('Error sending message:', error);
            alert('Failed to send message: ' + error.message);
        });
    }

    function sendGroupMessage(content, type) {
        const messageData = {
            userId: currentUserId,
            userName: currentUserName || 'Anonymous',
            content: content,
            type: type, // 'text', 'gif', or 'liveActivity'
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            likes: {},
            comments: {}
        };

        const messagesRef = database.ref('groupChatMessages');
        messagesRef.push(messageData).catch(error => {
            console.error('Error sending group message:', error);
            alert('Failed to send message: ' + error.message);
        });
    }

    function displayMessage(message) {
        const chatContainer = document.getElementById('chatContainer');

        // Check if message already exists
        if (document.getElementById(`message-${message.key}`)) {
            return;
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message');
        messageDiv.id = `message-${message.key}`;

        const time = new Date(message.timestamp).toLocaleString();
        let senderName = '';

        if (selectedChatId === 'groupChat') {
            senderName = message.userId === currentUserId ? 'You' : message.userName;
        } else {
            senderName = message.senderId === currentUserId ? 'You' : message.senderName;
        }

        if (message.type === 'text') {
            messageDiv.innerHTML = `
                <p><strong>${senderName}</strong> <span class="chat-time">${time}</span></p>
                <p>${message.content}</p>
            `;
        } else if (message.type === 'gif') {
            messageDiv.innerHTML = `
                <p><strong>${senderName}</strong> <span class="chat-time">${time}</span></p>
                <img src="${message.content}" alt="GIF" class="chat-gif">
            `;
        } else if (message.type === 'liveActivity') {
            const saleType = message.saleType;
            const saleTime = new Date(message.saleTime).toLocaleString();
            messageDiv.innerHTML = `
                <p><strong>${message.userName}</strong> made a <strong>${saleType}</strong> sale on ${saleTime}</p>
            `;
        }

        // Likes and Comments Functionality
        // Create action buttons container
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('message-actions');

        // Like Button
        const likeButton = document.createElement('button');
        const likesCount = message.likes ? Object.keys(message.likes).length : 0;
        const userLiked = message.likes && message.likes[currentUserId];

        likeButton.textContent = userLiked ? `Unlike (${likesCount})` : `Like (${likesCount})`;
        likeButton.addEventListener('click', () => {
            toggleLike(message.key, userLiked);
        });

        actionsDiv.appendChild(likeButton);

        // Comment Button
        const commentToggleButton = document.createElement('button');
        commentToggleButton.textContent = 'Reply';
        commentToggleButton.addEventListener('click', () => {
            commentForm.style.display = commentForm.style.display === 'none' ? 'block' : 'none';
        });

        actionsDiv.appendChild(commentToggleButton);

        messageDiv.appendChild(actionsDiv);

        // Comments Section
        const commentsSection = document.createElement('div');
        commentsSection.classList.add('comments-section');

        // Display existing comments
        const commentsList = document.createElement('ul');
        commentsList.classList.add('comments-list');

        const comments = message.comments || {};
        const commentsCount = Object.keys(comments).length;

        if (commentsCount > 0) {
            for (const commentId in comments) {
                const comment = comments[commentId];
                const commentItem = document.createElement('li');
                const commentTime = new Date(comment.timestamp).toLocaleString();
                commentItem.innerHTML = `<strong>${comment.userName}</strong> (${commentTime}): ${comment.commentText}`;
                commentsList.appendChild(commentItem);
            }
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
                addComment(message.key, commentText);
                commentInput.value = '';
            }
        });

        const commentInput = document.createElement('input');
        commentInput.type = 'text';
        commentInput.placeholder = 'Add a reply...';
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

    function updateMessage(message) {
        const messageDiv = document.getElementById(`message-${message.key}`);
        if (messageDiv) {
            // Update likes count and button text
            const likeButton = messageDiv.querySelector('.message-actions button');
            const likesCount = message.likes ? Object.keys(message.likes).length : 0;
            const userLiked = message.likes && message.likes[currentUserId];

            likeButton.textContent = userLiked ? `Unlike (${likesCount})` : `Like (${likesCount})`;

            // Update comments
            const commentsSection = messageDiv.querySelector('.comments-section');
            const commentsList = commentsSection.querySelector('.comments-list');
            commentsList.innerHTML = '';

            const comments = message.comments || {};
            const commentsCount = Object.keys(comments).length;

            if (commentsCount > 0) {
                for (const commentId in comments) {
                    const comment = comments[commentId];
                    const commentItem = document.createElement('li');
                    const commentTime = new Date(comment.timestamp).toLocaleString();
                    commentItem.innerHTML = `<strong>${comment.userName}</strong> (${commentTime}): ${comment.commentText}`;
                    commentsList.appendChild(commentItem);
                }
            }
        }
    }

    function toggleLike(messageId, userLiked) {
        const messageRef = selectedChatId === 'groupChat'
            ? database.ref(`groupChatMessages/${messageId}`)
            : database.ref(`privateMessages/${selectedChatId}/${messageId}`);

        const likeRef = messageRef.child(`likes/${currentUserId}`);

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
        const commentData = {
            userId: currentUserId,
            userName: currentUserName || 'Anonymous',
            commentText: commentText,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        const commentsRef = selectedChatId === 'groupChat'
            ? database.ref(`groupChatMessages/${messageId}/comments`)
            : database.ref(`privateMessages/${selectedChatId}/${messageId}/comments`);

        commentsRef.push(commentData).catch(error => {
            console.error('Error adding comment:', error);
        });
    }

    function initializeGifSearch() {
        const gifSearchInput = document.getElementById('gifSearchInput');
        const gifResults = document.getElementById('gifResults');

        // Clear previous event listeners
        const newGifSearchInput = gifSearchInput.cloneNode(true);
        gifSearchInput.parentNode.replaceChild(newGifSearchInput, gifSearchInput);

        // Debounce function to limit API calls
        let debounceTimeout = null;
        newGifSearchInput.addEventListener('input', () => {
            const query = newGifSearchInput.value.trim();
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }
            debounceTimeout = setTimeout(() => {
                if (query) {
                    searchGifs(query);
                } else {
                    gifResults.innerHTML = ''; // Clear results if query is empty
                }
            }, 500); // Delay of 500ms
        });

        // Handle GIF selection
        gifResults.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') {
                const gifUrl = e.target.src;
                if (selectedChatId === 'groupChat') {
                    sendGroupMessage(gifUrl, 'gif');
                } else {
                    sendMessage(gifUrl, 'gif');
                }
                gifResults.innerHTML = ''; // Clear GIF results after selection
                newGifSearchInput.value = ''; // Clear search input
            }
        });
    }

    function searchGifs(query) {
        const apiKey = 'YOUR_GIPHY_API_KEY'; // Replace with your Giphy API key
        const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=10&rating=PG`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                displayGifResults(data.data);
            })
            .catch(error => {
                console.error('Error fetching GIFs:', error);
            });
    }

    function displayGifResults(gifs) {
        const gifResults = document.getElementById('gifResults');
        gifResults.innerHTML = ''; // Clear previous results

        if (gifs.length === 0) {
            gifResults.innerHTML = '<p>No GIFs found.</p>';
            return;
        }

        gifs.forEach(gif => {
            const img = document.createElement('img');
            img.src = gif.images.fixed_height.url;
            img.alt = gif.title || 'GIF';
            img.classList.add('gif-result');

            gifResults.appendChild(img);
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
});
