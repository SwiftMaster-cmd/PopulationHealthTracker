import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

const auth = getAuth();
const OWNER_UID = 'wNpqlW2HCWR1awF1x95hUUp3ryw1'; // Replace with the actual owner's UID

onAuthStateChanged(auth, (user) => {
    if (user && user.uid === OWNER_UID) {
        // If the user is logged in and is the owner, show the button
        document.getElementById('ownerPortalButton').style.display = 'block';
        document.getElementById('ownerPortalButton').onclick = function() {
            window.location.href = 'owner-portal.html'; // Redirect to the owner portal
        };
    }
});
