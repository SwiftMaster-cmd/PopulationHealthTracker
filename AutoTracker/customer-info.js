// customer-info.js
function displayCustomerInfo(customerInfo) {
    if (!customerInfo) {
        return '<div class="customer-info"><h4>No Customer Information Available</h4></div>';
    }

    return `
        <div class="customer-info">
            <div class="customer-row">
                <div class="customer-field-container">
                    <div class="customer-field"><strong>First:</strong><span> ${customerInfo.firstName || 'N/A'}</span></div>
                    <div class="customer-field"><strong>Last:</strong><span> ${customerInfo.lastName || 'N/A'}</span></div>
                    <div class="customer-field"><strong>Phone:</strong><span> ${customerInfo.phone || 'N/A'}</span></div>
                </div>
                <button class="more-info-btn">+ More</button>
            </div>
            <div class="more-info-popup">
                <div class="customer-row">
                    <div class="customer-field"><strong>Gender:</strong><span> ${customerInfo.gender || 'N/A'}</span></div>
                    <div class="customer-field"><strong>Birth:</strong><span> ${customerInfo.birthdate || 'N/A'}</span></div>
                </div>
                <div class="customer-row">
                    <div class="customer-field"><strong>Email:</strong><span> ${customerInfo.email || 'N/A'}</span></div>
                </div>
                <div class="customer-row">
                    <div class="customer-field"><strong>Zip:</strong><span> ${customerInfo.zipcode || 'N/A'}</span></div>
                    <div class="customer-field"><strong>State:</strong><span> ${customerInfo.stateId || 'N/A'}</span></div>
                </div>
            </div>
        </div>
    `;
}

// Event listener to toggle the display of the more-info-popup
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.more-info-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const popup = this.parentElement.nextElementSibling;
            popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
        });
    });
});