// Main entry point for the application
document.addEventListener('DOMContentLoaded', function() {
    const user = firebase.auth().currentUser;
    if (user) {
        const outcomesContainer = document.getElementById('sales-outcomes-container');
        displaySalesOutcomes(user, outcomesContainer);
    } else {
        console.error("User not authenticated");
    }
});
