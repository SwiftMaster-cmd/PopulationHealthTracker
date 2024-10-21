// analytics-events.js

// Track button clicks
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('cheatSheetButton').addEventListener('click', function() {
        gtag('event', 'click', {
            'event_category': 'Button',
            'event_label': 'Cheat Sheet Button'
        });
    });

    document.getElementById('applyColor').addEventListener('click', function() {
        gtag('event', 'click', {
            'event_category': 'Button',
            'event_label': 'Apply Color Palette Button'
        });
    });

    document.getElementById('changeName').addEventListener('click', function() {
        gtag('event', 'click', {
            'event_category': 'Button',
            'event_label': 'Change Name Button'
        });
    });

    document.getElementById('signOut').addEventListener('click', function() {
        gtag('event', 'click', {
            'event_category': 'Button',
            'event_label': 'Sign Out Button'
        });
    });

    document.getElementById('copyBookmarkletButton').addEventListener('click', function() {
        gtag('event', 'click', {
            'event_category': 'Button',
            'event_label': 'Copy Bookmarklet Button'
        });
    });

    document.getElementById('prev').addEventListener('click', function() {
        gtag('event', 'click', {
            'event_category': 'Navigation',
            'event_label': 'Prev Button'
        });
    });

    document.getElementById('next').addEventListener('click', function() {
        gtag('event', 'click', {
            'event_category': 'Navigation',
            'event_label': 'Next Button'
        });
    });

    // Track picker selections
    document.getElementById('periodPicker').addEventListener('change', function() {
        gtag('event', 'change', {
            'event_category': 'Picker',
            'event_label': 'Period Picker',
            'value': this.value
        });
    });

    document.getElementById('saleTypePicker').addEventListener('change', function() {
        gtag('event', 'change', {
            'event_category': 'Picker',
            'event_label': 'Sale Type Picker',
            'value': this.value
        });
    });

    document.getElementById('chartPeriodPicker').addEventListener('change', function() {
        gtag('event', 'change', {
            'event_category': 'Picker',
            'event_label': 'Chart Period Picker',
            'value': this.value
        });
    });

    // Function to add event listeners to dynamically added elements
    function addDynamicEventListeners() {
        const leadIdContainer = document.getElementById('lead-id-container');
        const salesOutcomesContainer = document.getElementById('sales-outcomes-container');
        const customerInfoContainer = document.getElementById('customer-info-container');

        // Example for lead ID container
        if (leadIdContainer) {
            leadIdContainer.addEventListener('click', function(event) {
                if (event.target && event.target.matches('.lead-id-item')) {
                    gtag('event', 'click', {
                        'event_category': 'Lead ID',
                        'event_label': event.target.dataset.leadId
                    });
                }
            });
        }

        // Example for sales outcomes container
        if (salesOutcomesContainer) {
            salesOutcomesContainer.addEventListener('click', function(event) {
                if (event.target && event.target.matches('.sales-outcome-item')) {
                    gtag('event', 'click', {
                        'event_category': 'Sales Outcome',
                        'event_label': event.target.dataset.outcomeId
                    });
                }
            });
        }

        // Example for customer info container
        if (customerInfoContainer) {
            customerInfoContainer.addEventListener('click', function(event) {
                if (event.target && event.target.matches('.customer-info-item')) {
                    gtag('event', 'click', {
                        'event_category': 'Customer Info',
                        'event_label': event.target.dataset.customerId
                    });
                }
            });
        }
    }

    // Call the function to add event listeners
    addDynamicEventListeners();
});