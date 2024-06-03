// customer-info.js
function displayCustomerInfo(customerInfo) {
    if (!customerInfo) {
        return '<div class="customer-info"><h4>No Customer Information Available</h4></div>';
    }

    return `
        <div class="customer-info">
            <div class="customer-row">
                <div class="customer-field"><strong>First:</strong> ${customerInfo.firstName || 'N/A'}</div>
                <div class="customer-field"><strong>Last:</strong> ${customerInfo.lastName || 'N/A'}</div>
                <div class="customer-field"><strong>Phone:</strong> ${customerInfo.phone || 'N/A'}</div>
                <button class="more-info-btn">+ More</button>
            </div>
            <div class="more-info-popup" style="display:none;">
                <div class="customer-row">
                    <div class="customer-field"><strong>Gender:</strong> ${customerInfo.gender || 'N/A'}</div>
                    <div class="customer-field"><strong>Birth:</strong> ${customerInfo.birthdate || 'N/A'}</div>
                </div>
                <div class="customer-row">
                    <div class="customer-field"><strong>Email:</strong> ${customerInfo.email || 'N/A'}</div>
                </div>
                <div class="customer-row">
                    <div class="customer-field"><strong>Zip:</strong> ${customerInfo.zipcode || 'N/A'}</div>
                    <div class="customer-field"><strong>State:</strong> ${customerInfo.stateId || 'N/A'}</div>
                </div>
            </div>
        </div>
    `;
}