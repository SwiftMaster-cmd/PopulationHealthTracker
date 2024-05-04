// ui.js

// Helper functions for UI interactions
function getSelectedESIContent() {
    const selectedButton = document.querySelector('.esi-btn.selected');
    return selectedButton ? selectedButton.getAttribute('data-value') : null;
}

function getSaleTypes() {
    const saleTypes = {};
    document.querySelectorAll('.sale-type-btn.selected').forEach(btn => {
        const value = btn.getAttribute('data-value');
        saleTypes[value] = true; // Mark the sale type as present
    });
    return saleTypes;
}

// Event listeners for UI elements
document.querySelectorAll('.esi-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.esi-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});

document.querySelectorAll('.sale-type-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('selected'));
});

document.getElementById('lead_id').addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    const numbers = text.match(/\d+/g);
    if (numbers) e.target.value = numbers.join('');
});

document.getElementById('lead_id').addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
});

document.getElementById('addSalesForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!userId) {
        alert('Please log in to add sales.');
        return;
    }

    const leadId = document.getElementById('lead_id').value.trim();
    if (!leadId || !getSelectedESIContent() || !Object.keys(getSaleTypesWithCommissionPoints()).length) {
        alert('Please fill in all required fields and select at least one sale type.');
        return;
    }

    const esiContent = getSelectedESIContent();
    const saleTypes = getSaleTypesWithCommissionPoints();
    const notes = document.getElementById('notes').value.trim();

    // Validate lead ID is not already used
    const existingSalesRef = ref(database, `sales/${userId}`);
    get(existingSalesRef).then((snapshot) => {
        let isDuplicate = false;
        snapshot.forEach((childSnapshot) => {
            if (childSnapshot.val().lead_id === leadId) {
                isDuplicate = true;
            }
        });

        if (isDuplicate) {
            alert('This lead ID has already been submitted.');
            return;
        } else {
            const saleData = {
                lead_id: leadId,
                esi_content: esiContent,
                sale_types: saleTypes,
                notes: notes,
                timestamp: new Date().toISOString()
            };

            // Pushing the new sale to Firebase
            push(ref(database, `sales/${userId}`), saleData)
                .then(() => {
                    document.getElementById('confirmationMessage').textContent = "Sale added successfully.";
                    document.getElementById('addSalesForm').reset(); // Reset form after successful submission
                    // Clear selected buttons
                    document.querySelectorAll('.esi-btn.selected').forEach(btn => btn.classList.remove('selected'));
                    document.querySelectorAll('.sale-type-btn.selected').forEach(btn => btn.classList.remove('selected'));
                })
                .catch(error => {
                    console.error('Error adding sale:', error);
                    alert('Failed to add sale.');
                });
        }
    }).catch(error => {
        console.error('Error fetching existing sales:', error);
    });
});

function getSaleTypesWithCommissionPoints() {
    const saleTypes = {};
    document.querySelectorAll('.sale-type-btn.selected').forEach(btn => {
        const value = btn.getAttribute('data-value');
        saleTypes[value] = 1; // Assign 1 commission point for each selected sale type
    });
    return saleTypes;
}
