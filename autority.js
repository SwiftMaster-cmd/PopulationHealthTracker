// authority.js

import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

const auth = getAuth();
const database = getDatabase();

// Function to set authority level for a user
async function setAuthorityLevel(userId, level) {
    const userRef = ref(database, `users/${userId}/authorityLevel`);
    await set(userRef, level);
}

// Function to get authority level for a user
async function getAuthorityLevel(userId) {
    const userRef = ref(database, `users/${userId}/authorityLevel`);
    const snapshot = await get(userRef);
    return snapshot.val();
}

// Function to check and set default authority level if not set
async function checkAndSetAuthorityLevel(userId) {
    const currentLevel = await getAuthorityLevel(userId);
    if (currentLevel === null) {
        await setAuthorityLevel(userId, 1); // Set default level to 1 (employee)
        return 1;
    }
    return currentLevel;
}

// Listen for authentication state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const authorityLevel = await checkAndSetAuthorityLevel(user.uid);
        console.log(`User ${user.uid} has authority level: ${authorityLevel}`);
        
        // Redirect users based on their authority level
        switch(authorityLevel) {
            case 1:
                // Redirect to employee dashboard
                window.location.href = 'AutoTracker/Dash2.html';
                break;
            case 2:
                // Redirect to manager dashboard
                window.location.href = 'manager.html';
                break;
            case 3:
                // Redirect to owner dashboard
                window.location.href = 'owner.html';
                break;
            default:
                console.error('Unknown authority level');
                // You might want to redirect to a default page or show an error message
        }
    } else {
        console.log('No user is signed in.');
        // Optionally, redirect to login page if not already there
        // if (!window.location.href.includes('index.html')) {
        //     window.location.href = 'index.html';
        // }
    }
});

// Export functions if needed in other parts of your application
export { setAuthorityLevel, getAuthorityLevel, checkAndSetAuthorityLevel };