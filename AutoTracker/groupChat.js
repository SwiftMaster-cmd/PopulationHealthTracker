// groupChat.js

document.addEventListener('firebaseInitialized', function() {
    const auth = firebase.auth();
    const database = firebase.database();

    let currentUserId = null;
    let currentUserName = null;
    let usersData = {};

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
        const messagesRef = database.ref('groupChatMessages');
    
        // Load existing messages and listen for new ones
        messagesRef.once('value', snapshot => {
            const messages = snapshot.val();
            const messageList = [];
    
            // Add all existing messages to the list (text, GIFs, etc.)
            for (const messageId in messages) {
                const message = messages[messageId];
                messageList.push({ messageId, ...message });
            }
    
            // Load all past live activities and add them to the list
            loadPastLiveActivities(messageList);
        });
    
        // Listen for new messages or live activities
        messagesRef.limitToLast(50).on('child_added', snapshot => {
            const message = snapshot.val();
            const messageId = snapshot.key;
            displayMessage(message, messageId);
        });
    
        // Listen for message updates (likes/comments)
        messagesRef.limitToLast(50).on('child_changed', snapshot => {
            const message = snapshot.val();
            const messageId = snapshot.key;
            const messageDiv = document.getElementById(`message-${messageId}`);
            if (messageDiv) {
                messageDiv.parentNode.removeChild(messageDiv);
                displayMessage(message, messageId);
            }
        });
    
        // Load Users data
        const usersRef = database.ref('Users');
        usersRef.on('value', usersSnapshot => {
            usersData = usersSnapshot.val() || {};
        });
    }
    
    function loadPastLiveActivities(messageList) {
        const salesOutcomesRef = database.ref('salesOutcomes');
    
        salesOutcomesRef.once('value', snapshot => {
            const salesData = snapshot.val();
            for (const userId in salesData) {
                const userSalesData = salesData[userId];
                const userName = (usersData[userId] && usersData[userId].name) || 'No name';
    
                for (const saleId in userSalesData) {
                    const sale = userSalesData[saleId];
                    const saleType = getSaleType(sale.assignAction || '', sale.notesValue || '');
                    const saleTime = new Date(sale.outcomeTime).getTime();
    
                    if (saleType) {
                        // Add the live activity to the message list with its timestamp
                        messageList.push({
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
    
            // Sort messages and live activities by timestamp
            messageList.sort((a, b) => a.timestamp - b.timestamp);
    
            // Display all messages in order
            messageList.forEach(message => displayMessage(message, message.messageId || message.content.saleId));
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

        const messagesRef = database.ref('groupChatMessages');
        messagesRef.push(messageData).catch(error => {
            console.error('Error sending message:', error);
        });
    }

    function displayMessage(message, messageId) {
        const chatContainer = document.getElementById('chatContainer');

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

        likeButton.textContent = userLiked ? 'Unlike' : 'Like';
        likeButton.addEventListener('click', () => {
            toggleLike(messageId, userLiked);
        });

        const likesInfo = document.createElement('span');
        likesInfo.textContent = ` ${likesCount} Like${likesCount !== 1 ? 's' : ''}`;

        // Add comment button
        const commentButton = document.createElement('button');
        commentButton.textContent = 'Comment';
        commentButton.addEventListener('click', () => {
            commentForm.style.display = commentForm.style.display === 'none' ? 'block' : 'none';
        });

        // Append buttons and info
        const actionsDiv = document.createElement('div');
        actionsDiv.appendChild(likeButton);
        actionsDiv.appendChild(likesInfo);
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
        const likeRef = database.ref(`groupChatMessages/${messageId}/likes/${currentUserId}`);
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
        const commentId = database.ref().child('groupChatMessages').child(messageId).child('comments').push().key;
        const commentData = {
            userId: currentUserId,
            userName: currentUserName || 'Anonymous',
            commentText: commentText,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        const commentRef = database.ref(`groupChatMessages/${messageId}/comments/${commentId}`);
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

    // Existing functions for GIF search and other features...
});
