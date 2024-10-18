// header.js

document.addEventListener('DOMContentLoaded', function () {
    const toggleChatInterfaceButton = document.getElementById('toggleChatInterfaceButton');
    const chatInterface = document.getElementById('chatInterface');

    toggleChatInterfaceButton.addEventListener('click', () => {
        if (chatInterface.style.display === 'none' || chatInterface.style.display === '') {
            // Show the chat interface
            chatInterface.style.display = 'flex';
            toggleChatInterfaceButton.textContent = 'Hide Chats';

            // Scroll to the chat interface
            chatInterface.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Hide the chat interface
            chatInterface.style.display = 'none';
            toggleChatInterfaceButton.textContent = 'Show Chats';
        }
    });
});
