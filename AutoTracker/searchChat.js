document.addEventListener('DOMContentLoaded', function() {
    // Assuming Firebase has already been initialized elsewhere in your code

    // Check Google link status
    firebase.auth().onAuthStateChanged(async user => {
        if (user) {
            const userRef = firebase.database().ref('users/' + user.uid);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val();

            if (userData && userData.googleLinked) {
                console.log('Google account is already linked.');
            } else {
                console.log('Google account is not linked.');
            }
        } else {
            console.error('No user is signed in.');
        }
    });

    // Dispatch custom event to notify other scripts
    document.dispatchEvent(new Event('firebaseInitialized'));

    // Name change functionality
    const changeNameButton = document.getElementById('changeName');
    const nameInput = document.getElementById('nameInput');

    changeNameButton.addEventListener('click', () => {
        const newName = nameInput.value.trim();
        if (newName) {
            const user = firebase.auth().currentUser;
            if (user) {
                const usersRef = firebase.database().ref('users/' + user.uid);
                usersRef.update({ name: newName }).then(() => {
                    alert('Name updated successfully');
                    nameInput.value = '';
                }).catch((error) => {
                    console.error('Error updating name:', error);
                });
            }
        } else {
            alert('Please enter a valid name');
        }
    });

    // Live search functionality
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    searchInput.addEventListener('input', () => {
        const searchName = searchInput.value.trim().toLowerCase();
        if (searchName) {
            const usersRef = firebase.database().ref('users');
            usersRef.orderByChild('name').startAt(searchName).endAt(searchName + "\uf8ff").once('value').then(snapshot => {
                const users = snapshot.val();
                const results = [];
                for (const uid in users) {
                    if (users[uid].name && users[uid].name.toLowerCase().includes(searchName)) {
                        results.push(users[uid]);
                    }
                }
                displaySearchResults(results);
            }).catch(error => {
                console.error('Error searching users:', error);
            });
        } else {
            searchResults.innerHTML = ''; // Clear results if search input is empty
        }
    });

    function displaySearchResults(results) {
        searchResults.innerHTML = '';
        if (results.length > 0) {
            results.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.textContent = user.name;
                searchResults.appendChild(userDiv);
            });
        } else {
            searchResults.textContent = 'No users found';
        }
    }

    // Chat container functionality
    const chatSearchInput = document.getElementById('chatSearchInput');
    const chatSearchResults = document.getElementById('chatSearchResults');
    const startChatButton = document.getElementById('startChatButton');

    chatSearchInput.addEventListener('input', () => {
        const searchName = chatSearchInput.value.trim().toLowerCase();
        if (searchName) {
            const usersRef = firebase.database().ref('users');
            usersRef.orderByChild('name').startAt(searchName).endAt(searchName + "\uf8ff").once('value').then(snapshot => {
                const users = snapshot.val();
                const results = [];
                for (const uid in users) {
                    if (users[uid].name && users[uid].name.toLowerCase().includes(searchName)) {
                        results.push({ uid, name: users[uid].name });
                    }
                }
                displayChatSearchResults(results);
            }).catch(error => {
                console.error('Error searching users:', error);
            });
        } else {
            chatSearchResults.innerHTML = ''; // Clear results if search input is empty
        }
    });

    function displayChatSearchResults(results) {
        chatSearchResults.innerHTML = '';
        if (results.length > 0) {
            results.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.textContent = user.name;
                userDiv.dataset.uid = user.uid;
                userDiv.classList.add('chat-user');
                chatSearchResults.appendChild(userDiv);
            });
        } else {
            chatSearchResults.textContent = 'No users found';
        }
    }

    startChatButton.addEventListener('click', () => {
        const selectedUser = document.querySelector('.chat-user-selected');
        if (selectedUser) {
            const recipientUid = selectedUser.dataset.uid;
            alert(`Starting a chat with ${selectedUser.textContent}`);
            // Implement the actual chat start logic here
        } else {
            alert('Please select a user to start a chat');
        }
    });

    chatSearchResults.addEventListener('click', (event) => {
        if (event.target.classList.contains('chat-user')) {
            document.querySelectorAll('.chat-user').forEach(user => user.classList.remove('chat-user-selected'));
            event.target.classList.add('chat-user-selected');
        }
    });
});