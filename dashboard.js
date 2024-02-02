import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, child, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";

const auth = getAuth();
const database = getDatabase();
onAuthStateChanged(auth, (user) => {
    if (user) {
        const dbRef = ref(getDatabase());
        get(child(dbRef, `users/${user.uid}/role`)).then((snapshot) => {
            if (snapshot.exists()) {
                const role = snapshot.val();
                if (role === "manager") {
                    // Load manager-specific content
                    document.getElementById('dashboardContent').innerHTML = '<button id="managerAccessButton">Manager Portal</button>';
                    // Include logic to dynamically load manager.js or similar
                } else {
                    // Load general user content
                    document.getElementById('dashboardContent').innerHTML = '<a href="add-sales.html">Add Sales</a> | <a href="history.html">View Sales History</a>';
                    // Include logic to dynamically load scripts for add-sales and history if needed
                }
            } else {
                console.log("No role found.");
            }
        }).catch((error) => {
            console.error(error);
        });
    } else {
        // User is signed out
        // Redirect to login or show appropriate content
    }
});
