// Functions to create and manage DOM elements
function displayCustomerInfo(customerInfo) {
    // Example implementation for displaying customer information
    return `<div>Customer Name: ${customerInfo.name || 'N/A'}</div>
            <div>Customer ID: ${customerInfo.id || 'N/A'}</div>`;
}

function createOutcomeItem(outcome) {
    const outcomeElement = document.createElement('div');
    outcomeElement.classList.add('outcome-item');
    outcomeElement.innerHTML = `
        <div class="top-section">
            <div class="action" style="float:left;">${outcome.assignAction}</div>
            <div class="date-top" style="float:right;">${formatDate(outcome.outcomeTime)}</div>
        </div>
        <div class="bottom-section">
            <div class="notes" style="float:left;">${outcome.notesValue || 'No notes'}</div>
            <div class="time-bottom" style="float:right;">${formatTime(outcome.outcomeTime)}</div>
        </div>
    `;
    return outcomeElement;
}

function updateSalesOutcomesContainer(outcomesContainer, groupedOutcomes) {
    outcomesContainer.innerHTML = '';  // Clear previous outcomes
    const sortedAccounts = Object.keys(groupedOutcomes).sort((a, b) => {
        const latestA = Object.values(groupedOutcomes[a].actions).reduce((latest, current) => new Date(current.outcomeTime) > new Date(latest.outcomeTime) ? current : latest);
        const latestB = Object.values(groupedOutcomes[b].actions).reduce((latest, current) => new Date(current.outcomeTime) > new Date(latest.outcomeTime) ? current : latest);
        return new Date(latestB.outcomeTime) - new Date(latestA.outcomeTime);
    });

    for (const accountNumber of sortedAccounts) {
        const accountContainer = document.createElement('div');
        accountContainer.classList.add('account-container');
        const accountTitle = document.createElement('div');
        accountTitle.classList.add('account-title');
        accountTitle.textContent = `Account Number: ${accountNumber}`;
        accountContainer.appendChild(accountTitle);

        const accountContent = document.createElement('div');
        accountContent.classList.add('account-content');
        accountContainer.appendChild(accountContent);

        const customerInfoContainer = document.createElement('div');
        customerInfoContainer.classList.add('customer-info-container');
        const customerInfoHtml = displayCustomerInfo(groupedOutcomes[accountNumber].customerInfo);
        customerInfoContainer.innerHTML = customerInfoHtml;
        accountContent.appendChild(customerInfoContainer);

        const salesInfoContainer = document.createElement('div');
        salesInfoContainer.classList.add('sales-info');
        accountContent.appendChild(salesInfoContainer);

        const accountOutcomes = Object.values(groupedOutcomes[accountNumber].actions);
        accountOutcomes.sort((a, b) => new Date(b.outcomeTime) - new Date(a.outcomeTime));

        for (const outcome of accountOutcomes) {
            const outcomeElement = createOutcomeItem(outcome);
            salesInfoContainer.appendChild(outcomeElement);
        }

        outcomesContainer.appendChild(accountContainer);
    }
}
