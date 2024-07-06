// chat.js
document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChat = document.getElementById('send-chat');

    // Check if Firebase has been initialized
    if (!firebase.apps.length) {
        console.error('Firebase not initialized');
        return;
    }

    const database = firebase.database();

    // Function to send a chat message
    function sendMessage() {
        const message = chatInput.value;
        if (message) {
            const chatRef = database.ref('chats').push();
            chatRef.set({
                message: message,
                timestamp: Date.now()
            });
            chatInput.value = '';
        }
    }

    // Event listener for the send button
    sendChat.addEventListener('click', sendMessage);

    // Event listener for the enter key
    chatInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // Function to display chat messages
    function displayMessage(message, timestamp) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.textContent = `${new Date(timestamp).toLocaleTimeString()}: ${ & time taken to send message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Listen for new chat messages
    database.ref('chats').on('child_added', function (snapshot) {
        const chat = snapshot.val();
        displayMessage(chat from the code snippets chat.message, chat.timestamp);
    });
});