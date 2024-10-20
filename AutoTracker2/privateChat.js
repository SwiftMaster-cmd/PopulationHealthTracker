// privateChat.js

document.addEventListener('firebaseInitialized', function () {
    const auth = firebase.auth();
    const database = firebase.database();

    let currentUserId = null;
    let currentUserName = null;
    let selectedChatId = null;
    let chatListener = null;
    let sendMessageHandler = null;

    let usersData = {}; // To store user names

    let messagesEndReached = false;
    let oldestMessageTimestamp = null;
    let isLoadingMore = false;

    const MESSAGES_PER_LOAD = 20; // Number of messages to load per batch
    const MAX_MESSAGES_DISPLAYED = 100; // Max messages to keep in DOM

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            initializeUserName(user);
            loadUsers(); // Load user names
            initializeChatList(); // Load existing chats

            // Load group chat by default
            selectGroupChat();
        } else {
            // Redirect to login page or show login prompt
            console.log('User is not authenticated');
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
        oldestMessageTimestamp = null;
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

        // Initialize GIF search
        initializeGifSearch();

        // Set up real-time listeners
        setupRealtimeListeners();
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
        oldestMessageTimestamp = null;
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

        // Initialize GIF search
        initializeGifSearch();

        // Set up real-time listeners
        setupRealtimeListeners();
    }

    function removeListeners() {
        // Remove previous chat listener
        if (chatListener) {
            chatListener.off();
            chatListener = null;
        }

        // Remove previous sendMessageHandler
        if (sendMessageHandler) {
            const messageForm = document.getElementById('messageForm');
            messageForm.removeEventListener('submit', sendMessageHandler);
            sendMessageHandler = null;
        }

        // Remove "Load More" button if it exists
        const loadMoreButton = document.getElementById('loadMoreButton');
        if (loadMoreButton) {
            loadMoreButton.removeEventListener('click', loadMoreMessages);
            loadMoreButton.remove();
        }
    }

    function loadMoreMessages() {
        if (isLoadingMore || messagesEndReached) return;

        isLoadingMore = true;

        if (selectedChatId === 'groupChat') {
            const feedRef = database.ref('groupChatFeed');

            let feedQuery;

            if (oldestMessageTimestamp) {
                feedQuery = feedRef.orderByChild('timestamp').endAt(oldestMessageTimestamp - 1).limitToLast(MESSAGES_PER_LOAD);
            } else {
                feedQuery = feedRef.orderByChild('timestamp').limitToLast(MESSAGES_PER_LOAD);
            }

            feedQuery.once('value').then(snapshot => {
                let messages = [];

                snapshot.forEach(childSnapshot => {
                    const message = childSnapshot.val();
                    message.key = childSnapshot.key;
                    messages.push(message);
                });

                messagesEndReached = messages.length < MESSAGES_PER_LOAD;

                if (messages.length === 0) {
                    isLoadingMore = false;
                    return;
                }

                // Update oldestMessageTimestamp
                oldestMessageTimestamp = messages[0].timestamp;

                // Sort messages by timestamp descending (newest first)
                messages.sort((a, b) => b.timestamp - a.timestamp);

                // Render messages
                messages.forEach(message => {
                    appendMessage(message);
                });

                isLoadingMore = false;

                if (!document.getElementById('loadMoreButton') && !messagesEndReached) {
                    addLoadMoreButton();
                }

                trimMessages();
            }).catch(error => {
                console.error('Error loading messages:', error);
                isLoadingMore = false;
            });
        } else {
            // Load private chat messages
            const messagesRef = database.ref(`privateMessages/${selectedChatId}`);

            let messagesQuery;

            if (oldestMessageTimestamp) {
                messagesQuery = messagesRef.orderByChild('timestamp').endAt(oldestMessageTimestamp - 1).limitToLast(MESSAGES_PER_LOAD);
            } else {
                messagesQuery = messagesRef.orderByChild('timestamp').limitToLast(MESSAGES_PER_LOAD);
            }

            messagesQuery.once('value').then(snapshot => {
                let messages = [];

                snapshot.forEach(childSnapshot => {
                    const message = childSnapshot.val();
                    message.key = childSnapshot.key;
                    messages.push(message);
                });

                messagesEndReached = messages.length < MESSAGES_PER_LOAD;

                if (messages.length === 0) {
                    isLoadingMore = false;
                    return;
                }

                // Update oldestMessageTimestamp
                oldestMessageTimestamp = messages[0].timestamp;

                // Sort messages by timestamp descending (newest first)
                messages.sort((a, b) => b.timestamp - a.timestamp);

                // Render messages
                messages.forEach(message => {
                    appendMessage(message);
                });

                isLoadingMore = false;

                if (!document.getElementById('loadMoreButton') && !messagesEndReached) {
                    addLoadMoreButton();
                }

                trimMessages();
            }).catch(error => {
                console.error('Error loading messages:', error);
                isLoadingMore = false;
            });
        }
    }

    function addLoadMoreButton() {
        const chatContainer = document.getElementById('chatContainer');
        const loadMoreButton = document.createElement('button');
        loadMoreButton.id = 'loadMoreButton';
        loadMoreButton.textContent = 'Load More Messages';
        loadMoreButton.addEventListener('click', loadMoreMessages);

        // Insert the button at the top
        chatContainer.insertBefore(loadMoreButton, chatContainer.firstChild);
    }

    function setupRealtimeListeners() {
        if (selectedChatId === 'groupChat') {
            const feedRef = database.ref('groupChatFeed').orderByChild('timestamp').startAt(Date.now());

            // Real-time listener for new feed items
            chatListener = feedRef;
            chatListener.on('child_added', snapshot => {
                const message = snapshot.val();
                message.key = snapshot.key;
                displayMessage(message);
                trimMessages();
            });

            // Listener for updates (likes, comments)
            chatListener.on('child_changed', snapshot => {
                const message = snapshot.val();
                message.key = snapshot.key;
                updateMessage(message);
            });

            // Listener for deletions
            chatListener.on('child_removed', snapshot => {
                const messageKey = snapshot.key;
                const messageDiv = document.getElementById(`message-${messageKey}`);
                if (messageDiv) {
                    messageDiv.remove();
                }
            });
        } else {
            // Private chat listeners
            const messagesRef = database.ref(`privateMessages/${selectedChatId}`).orderByChild('timestamp').startAt(Date.now());

            chatListener = messagesRef;
            chatListener.on('child_added', snapshot => {
                const message = snapshot.val();
                message.key = snapshot.key;
                displayMessage(message);
                trimMessages();
            });

            chatListener.on('child_changed', snapshot => {
                const message = snapshot.val();
                message.key = snapshot.key;
                updateMessage(message);
            });

            chatListener.on('child_removed', snapshot => {
                const messageKey = snapshot.key;
                const messageDiv = document.getElementById(`message-${messageKey}`);
                if (messageDiv) {
                    messageDiv.remove();
                }
            });
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
            type: type, // 'text' or 'gif'
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            likes: {},
            comments: {},
            feedType: 'message'
        };

        const messagesRef = database.ref('groupChatMessages');
        const groupChatFeedRef = database.ref('groupChatFeed');

        const newMessageRef = messagesRef.push();
        const newMessageKey = newMessageRef.key;

        const updates = {};
        updates[`groupChatMessages/${newMessageKey}`] = messageData;
        updates[`groupChatFeed/${newMessageKey}`] = messageData;

        database.ref().update(updates).catch(error => {
            console.error('Error sending group message:', error);
            alert('Failed to send message: ' + error.message);
        });
    }

    function displayMessage(message) {
        const chatContainer = document.getElementById('chatContainer');

        // Check if message already exists
        if (document.getElementById(`message-${message.key}`)) {
            updateMessage(message);
            return;
        }

        const messageDiv = createMessageDiv(message);

        // Append new messages at the bottom
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function appendMessage(message) {
        const chatContainer = document.getElementById('chatContainer');

        // Check if message already exists
        if (document.getElementById(`message-${message.key}`)) {
            updateMessage(message);
            return;
        }

        const messageDiv = createMessageDiv(message);

        // Insert message after Load More button or at the top
        const loadMoreButton = document.getElementById('loadMoreButton');
        if (loadMoreButton) {
            chatContainer.insertBefore(messageDiv, loadMoreButton.nextSibling);
        } else {
            chatContainer.insertBefore(messageDiv, chatContainer.firstChild);
        }
    }

    function createMessageDiv(message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message');
        messageDiv.id = `message-${message.key}`;

        const time = new Date(message.timestamp).toLocaleString();
        let senderName = '';

        if (message.feedType === 'liveActivity' || message.type === 'liveActivity') {
            senderName = message.userName;
            const saleType = message.saleType;
            const saleTime = new Date(message.saleTime).toLocaleString();
            messageDiv.innerHTML = `
                <p><strong>${senderName}</strong> made a <strong>${saleType}</strong> sale on ${saleTime}</p>
            `;
        } else {
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
            }
        }

        // Likes and Comments Functionality
        createMessageActions(message, messageDiv);

        return messageDiv;
    }

    function createMessageActions(message, messageDiv) {
        // Create action buttons container
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('message-actions');

        // Like Button
        const likeButton = document.createElement('button');
        const likesCount = message.likes ? Object.keys(message.likes).length : 0;
        const userLiked = message.likes && message.likes[currentUserId];

        likeButton.textContent = userLiked ? `Unlike (${likesCount})` : `Like (${likesCount})`;
        likeButton.addEventListener('click', () => {
            toggleLike(message);
        });

        actionsDiv.appendChild(likeButton);

        // Comment Button
        const commentToggleButton = document.createElement('button');
        commentToggleButton.textContent = 'Reply';
        commentToggleButton.addEventListener('click', () => {
            commentForm.style.display = commentForm.style.display === 'none' ? 'block' : 'none';
        });

        actionsDiv.appendChild(commentToggleButton);

        // Delete Button
        if ((message.userId && message.userId === currentUserId) || (message.senderId && message.senderId === currentUserId)) {
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                deleteMessage(message);
            });
            actionsDiv.appendChild(deleteButton);
        }

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

                // Delete Comment Button
                if (comment.userId === currentUserId) {
                    const deleteCommentButton = document.createElement('button');
                    deleteCommentButton.textContent = 'Delete';
                    deleteCommentButton.addEventListener('click', () => {
                        deleteComment(message, commentId);
                    });
                    commentItem.appendChild(deleteCommentButton);
                }

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
                addComment(message, commentText);
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

                    // Delete Comment Button
                    if (comment.userId === currentUserId) {
                        const deleteCommentButton = document.createElement('button');
                        deleteCommentButton.textContent = 'Delete';
                        deleteCommentButton.addEventListener('click', () => {
                            deleteComment(message, commentId);
                        });
                        commentItem.appendChild(deleteCommentButton);
                    }

                    commentsList.appendChild(commentItem);
                }
            }
        }
    }

    function toggleLike(message) {
        let likeRef;

        if (selectedChatId === 'groupChat') {
            likeRef = database.ref(`groupChatFeed/${message.key}/likes/${currentUserId}`);
        } else {
            likeRef = database.ref(`privateMessages/${selectedChatId}/${message.key}/likes/${currentUserId}`);
        }

        const userLiked = message.likes && message.likes[currentUserId];

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

    function addComment(message, commentText) {
        const commentData = {
            userId: currentUserId,
            userName: currentUserName || 'Anonymous',
            commentText: commentText,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        let commentsRef;

        if (selectedChatId === 'groupChat') {
            commentsRef = database.ref(`groupChatFeed/${message.key}/comments`);
        } else {
            commentsRef = database.ref(`privateMessages/${selectedChatId}/${message.key}/comments`);
        }

        commentsRef.push(commentData).catch(error => {
            console.error('Error adding comment:', error);
        });
    }

    function deleteMessage(message) {
        if (confirm('Are you sure you want to delete this message?')) {
            if (selectedChatId === 'groupChat') {
                const updates = {};
                updates[`groupChatFeed/${message.key}`] = null;
                updates[`groupChatMessages/${message.key}`] = null;

                database.ref().update(updates).catch(error => {
                    console.error('Error deleting message:', error);
                    alert('Failed to delete message: ' + error.message);
                });
            } else {
                const messageRef = database.ref(`privateMessages/${selectedChatId}/${message.key}`);
                messageRef.remove().catch(error => {
                    console.error('Error deleting message:', error);
                    alert('Failed to delete message: ' + error.message);
                });
            }
        }
    }

    function deleteComment(message, commentId) {
        if (confirm('Are you sure you want to delete this comment?')) {
            let commentRef;

            if (selectedChatId === 'groupChat') {
                commentRef = database.ref(`groupChatFeed/${message.key}/comments/${commentId}`);
            } else {
                commentRef = database.ref(`privateMessages/${selectedChatId}/${message.key}/comments/${commentId}`);
            }

            commentRef.remove().catch(error => {
                console.error('Error deleting comment:', error);
                alert('Failed to delete comment: ' + error.message);
            });
        }
    }

    function trimMessages() {
        const chatContainer = document.getElementById('chatContainer');
        const messages = chatContainer.getElementsByClassName('chat-message');

        while (messages.length > MAX_MESSAGES_DISPLAYED) {
            // Remove the oldest message
            chatContainer.removeChild(messages[0]);
        }
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
});
