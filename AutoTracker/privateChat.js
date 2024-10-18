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

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            initializeUserName(user);
            loadUsers(); // Load user names
            initializeChatList(); // Load existing chats
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
            startNewChat();
        });
    }

    function renderChatList(chats) {
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';

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

    function startNewChat() {
        const recipientName = prompt('Enter the name of the user you want to chat with:');
        if (recipientName) {
            // Find the user with the given name
            const recipientId = findUserIdByName(recipientName);
            if (recipientId) {
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
                });
            } else {
                alert('User not found.');
            }
        }
    }

    function findUserIdByName(name) {
        for (const userId in usersData) {
            if (usersData[userId].name === name && userId !== currentUserId) {
                return userId;
            }
        }
        return null;
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

        // Remove previous chat listener
        if (chatListener) {
            chatListener.off();
        }

        // Remove previous sendMessageHandler
        if (sendMessageHandler) {
            messageForm.removeEventListener('submit', sendMessageHandler);
        }

        // Clear chat container
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.innerHTML = '';

        // Listen for new messages
        const messagesRef = database.ref(`privateMessages/${chatId}`);
        chatListener = messagesRef;
        messagesRef.on('child_added', snapshot => {
            const message = snapshot.val();
            displayMessage(message);
        });

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
        const gifSearchInput = document.getElementById('gifSearchInput');
        const gifResults = document.getElementById('gifResults');

        // Debounce function to limit API calls
        let debounceTimeout = null;
        gifSearchInput.addEventListener('input', () => {
            const query = gifSearchInput.value.trim();
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
                sendMessage(gifUrl, 'gif');
                gifResults.innerHTML = ''; // Clear GIF results after selection
                gifSearchInput.value = ''; // Clear search input
            }
        });
    }

    function sendMessage(content, type) {
        const messageData = {
            senderId: currentUserId,
            senderName: currentUserName || 'Anonymous',
            content: content,
            type: type, // 'text' or 'gif'
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        const messagesRef = database.ref(`privateMessages/${selectedChatId}`);
        messagesRef.push(messageData).catch(error => {
            console.error('Error sending message:', error);
        });
    }

    function displayMessage(message) {
        const chatContainer = document.getElementById('chatContainer');

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message');

        const time = new Date(message.timestamp).toLocaleTimeString();
        const senderName = message.senderId === currentUserId ? 'You' : message.senderName;

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

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to the bottom
    }

    function searchGifs(query) {
        const apiKey = 'WXv8lPQ9faO55i3Kd0jPTdbRm0XvuQUH'; // Replace with your Giphy API key
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
