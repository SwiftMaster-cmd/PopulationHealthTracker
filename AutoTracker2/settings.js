// settings.js

document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const database = firebase.database();

    // Elements for user name
    const userNameInput = document.getElementById('userNameInput');
    const saveNameButton = document.getElementById('saveNameButton');

    // Elements for agent level selection
    const agentLevelSelect = document.getElementById('agentLevelSelect');
    const saveLevelButton = document.getElementById('saveLevelButton');

    auth.onAuthStateChanged(user => {
        if (user) {
            loadUserSettings(user);
        } else {
            console.error('User not authenticated.');
        }
    });

    function loadUserSettings(user) {
        const userRef = database.ref('Users/' + user.uid);

        userRef.once('value').then(snapshot => {
            const userData = snapshot.val();
            if (userData) {
                // Load user name
                if (userData.name) {
                    userNameInput.value = userData.name;
                } else {
                    userNameInput.value = '';
                }
                // Load agent level, default to Level2 if not set
                if (userData.agentLevel) {
                    agentLevelSelect.value = userData.agentLevel;
                } else {
                    agentLevelSelect.value = 'Level2'; // Default to Level2
                }
            }
        }).catch(error => {
            console.error('Error loading user settings:', error);
        });
    }

    // Save user name
    saveNameButton.addEventListener('click', () => {
        const user = auth.currentUser;
        if (user) {
            const userName = userNameInput.value.trim() || 'No name';
            const userRef = database.ref('Users/' + user.uid);
            userRef.update({ name: userName }).then(() => {
                alert('Name updated successfully!');
            }).catch(error => {
                console.error('Error updating user name:', error);
            });
        } else {
            alert('User not authenticated.');
        }
    });

    // Save agent level
    saveLevelButton.addEventListener('click', () => {
        const user = auth.currentUser;
        if (user) {
            const agentLevel = agentLevelSelect.value;
            if (['Level1', 'Level2', 'Level3'].includes(agentLevel)) {
                const userRef = database.ref('Users/' + user.uid);
                userRef.update({ agentLevel: agentLevel }).then(() => {
                    alert('Agent Level updated successfully!');
                }).catch(error => {
                    console.error('Error updating agent level:', error);
                });
            } else {
                alert('Invalid agent level selected.');
            }
        } else {
            alert('User not authenticated.');
        }
    });
});
