// groupChat.js

document.addEventListener('firebaseInitialized', function() {
    const auth = firebase.auth();
    const database = firebase.database();

    let currentUserId = null;
    let currentUserName = null;

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
        messagesRef.limitToLast(50).on('child_added', snapshot => {
            const message = snapshot.val();
            displayMessage(message);
        });

        // Handle message form submission
        const messageForm = document.getElementById('messageForm');
        const messageInput = document.getElementById('messageInput');

        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = messageInput.value.trim();
            if (text) {
                sendMessage(text, 'text');
                messageInput.value = '';
            }
        });

        // Handle GIF search
        const gifSearchInput = document.getElementById('gifSearchInput');
        const gifSearchButton = document.getElementById('gifSearchButton');
        const gifResults = document.getElementById('gifResults');

        gifSearchButton.addEventListener('click', () => {
            const query = gifSearchInput.value.trim();
            if (query) {
                searchGifs(query);
            }
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
            userId: currentUserId,
            userName: currentUserName || 'Anonymous',
            content: content,
            type: type, // 'text' or 'gif'
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        const messagesRef = database.ref('groupChatMessages');
        messagesRef.push(messageData).catch(error => {
            console.error('Error sending message:', error);
        });
    }

    function displayMessage(message) {
        const chatContainer = document.getElementById('chatContainer');

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message');

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
        }

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to the bottom
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

        gifs.forEach(gif => {
            const img = document.createElement('img');
            img.src = gif.images.fixed_height.url;
            img.alt = gif.title;
            img.classList.add('gif-result');

            gifResults.appendChild(img);
        });
    }
});
