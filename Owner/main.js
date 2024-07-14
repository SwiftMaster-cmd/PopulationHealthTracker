import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { ref, get, onValue } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { auth, database } from './firebaseConfig.js';
import { fetchUserProfiles, fetchAccountNumbersAndTimes, displayData, fetchCommissionStructure, updateCommissionStructure } from './firebaseFunctions.js';

document.addEventListener('DOMContentLoaded', () => {
    createLevelPicker();
    loadMonthlyTotals();
    loadCommissionStructure();
});

async function loadCommissionStructure() {
    try {
        const commissionStructure = await fetchCommissionStructure();
        console.log('Commission Structure:', commissionStructure);
        // Populate the UI with commission structure data
    } catch (error) {
        console.error('Failed to load commission structure:', error);
    }
}

async function saveCommissionStructure(newStructure) {
    try {
        await updateCommissionStructure(newStructure);
        console.log('Commission structure updated successfully');
    } catch (error) {
        console.error('Failed to update commission structure:', error);
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User is authenticated", user);
        const userAuthorityRef = ref(database, 'users/' + user.uid + '/authorityLevel');
        const userAuthoritySnapshot = await get(userAuthorityRef);
        const authorityLevel = userAuthoritySnapshot.val();
        console.log("User authority level:", authorityLevel);

        if (authorityLevel >= 2) {
            const profiles = await fetchUserProfiles();
            console.log("Fetched user profiles:", profiles);

            onValue(ref(database), async (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    console.log("Fetched data:", data);
                    const { accountNumbers, outcomeTimes } = await fetchAccountNumbersAndTimes(data);
                    console.log("Account numbers:", accountNumbers);
                    console.log("Outcome times:", outcomeTimes);
                    displayData(data, profiles, accountNumbers, outcomeTimes);
                } else {
                    console.log("No data available");
                }
            });
        } else {
            alert("You do not have permission to view this page.");
            window.location.href = 'index.html';
        }
    } else {
        window.location.href = 'index.html';
    }
});