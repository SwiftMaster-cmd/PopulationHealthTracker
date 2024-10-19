// settings.js

document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const database = firebase.database();

    const userNameInput = document.getElementById('userNameInput');
    const saveSettingsButton = document.getElementById('saveSettingsButton');
    const levelSelect = document.getElementById('levelSelect');

    auth.onAuthStateChanged(user => {
        if (user) {
            loadUserSettings(user);
        }
    });

    function loadUserSettings(user) {
        const userRef = database.ref('Users/' + user.uid);

        userRef.once('value').then(snapshot => {
            const userData = snapshot.val();
            if (userData) {
                if (userData.name) {
                    userNameInput.value = userData.name;
                } else {
                    userNameInput.value = '';
                }
                if (userData.level) {
                    levelSelect.value = userData.level;
                } else {
                    levelSelect.value = 'Level 1'; // Default
                }
            }
        }).catch(error => {
            console.error('Error loading user data:', error);
        });
    }

    saveSettingsButton.addEventListener('click', () => {
        const user = auth.currentUser;
        if (user) {
            const userName = userNameInput.value.trim() || 'No name';
            const selectedLevel = levelSelect.value;
            const userRef = database.ref('Users/' + user.uid);
            userRef.update({ name: userName, level: selectedLevel }).then(() => {
                alert('Settings updated successfully!');
            }).catch(error => {
                console.error('Error updating settings:', error);
            });
        } else {
            alert('User not authenticated.');
        }
    });
});
