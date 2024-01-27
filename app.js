function submitForm() {
    // Capture and save the information
    var leadId = document.getElementById("leadId").value;
    var esiConsent = document.getElementById("esiConsent").value;
    var saleType = document.getElementById("saleType").value;

    // Create an object to represent the submission
    var submission = {
        leadId: leadId,
        esiConsent: esiConsent,
        saleType: saleType
    };

    // Retrieve existing history from local storage or initialize an empty array
    var history = JSON.parse(localStorage.getItem('history')) || [];

    // Add the new submission to the history array
    history.push(submission);

    // Save the updated history array back to local storage
    localStorage.setItem('history', JSON.stringify(history));

    // Log for verification (you can remove this line in production)
    console.log("Data submitted and saved:", submission);
}

function showHistory() {
    window.location.href = "history.html";
}

function goToIndex() {
    window.location.href = "index.html";
}
