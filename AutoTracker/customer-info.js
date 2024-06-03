function displayCustomerInfo(customerInfo) {
    if (!customerInfo) {
        return '<div class="customer-info"><h4>No Customer Information Available</h4></div>';
    }

    return `
        <div class="customer-info">
            <div class="customer-row customer-field-container">
                <div class="customer-field align-left"><strong>First:</strong><span> ${customerInfo.firstName || 'N/A'}</span></div>
                <div class="customer-field align-right"><strong>Last:</strong><span> ${customerInfo.lastName || 'N/A'}</span></div>
            </div>
            <div class="customer-row customer-field-container">
                <div class="customer-field align-left"><strong>Phone:</strong><span> ${customerInfo.phone || 'N/A'}</span></div>
                <button class="more-info-btn align-right">+ More</button>
            </div>
            <div class="more-info-popup" style="display: none;">
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

document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('click', function(event) {
        const target = event.target;
        if (target.classList.contains('more-info-btn')) {
            const popup = target.closest('.customer-field-container').nextElementSibling;
            popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
            event.stopPropagation();
        } else {
            document.querySelectorAll('.more-info-popup').forEach(popup => {
                if (!popup.contains(event.target) && !popup.previousElementSibling.contains(event.target)) {
                    popup.style.display = 'none';
                }
            });
        }
    });
});