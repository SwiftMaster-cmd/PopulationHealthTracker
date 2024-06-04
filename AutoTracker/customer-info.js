function displayCustomerInfo(customerInfo) {
    const customerInfoHtml = !customerInfo 
        ? '<div class="customer-info"><h4>No Customer Information Available</h4></div>'
        : `
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
    console.log("Generated Customer Info HTML: ", customerInfoHtml); // Debug statement
    return customerInfoHtml;
}

// Example of inserting the HTML into the DOM
document.addEventListener('DOMContentLoaded', function() {
    const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '123-456-7890',
        gender: 'Male',
        birthdate: '01/01/1980',
        email: 'john.doe@example.com',
        zipcode: '12345',
        stateId: 'CA'
    };

    const customerInfoContainer = document.getElementById('customer-info-container');
    customerInfoContainer.innerHTML = displayCustomerInfo(customerData);

    document.body.addEventListener('click', function(event) {
        const target = event.target;
        console.log("Clicked element:", target); // Add logging to see the clicked element
        if (target.classList.contains('more-info-btn')) {
            const container = target.closest('.customer-field-container');
            if (container) {
                const popup = container.nextElementSibling;
                if (popup && popup.classList.contains('more-info-popup')) {
                    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
                } else {
                    console.log("Popup not found or does not have the correct class");
                }
            } else {
                console.log("Container not found");
            }
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