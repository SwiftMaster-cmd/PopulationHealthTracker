// Initialize Stripe with your public key
const stripe = Stripe('pk_live_51PmuU8P3su2SGtHchQUHuHUL4sWmpJ9xbftuUzK4C47XWrYRmK1Jsar7P3ZmLSUHJfSk4mpFD5k3I7kVW2OnZmyH0099DXJbQZ');

// Function to create a checkout session
async function createCheckoutSession(items) {
    try {
        const response = await fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items })
        });

        const session = await response.json();
        return session.id;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
}

// Function to handle the checkout process
async function handleCheckout(items) {
    try {
        const sessionId = await createCheckoutSession(items);
        const result = await stripe.redirectToCheckout({ sessionId });

        if (result.error) {
            alert(result.error.message);
        }
    } catch (error) {
        console.error('Error during checkout:', error);
    }
}

// Attach event listener to your checkout button
document.getElementById('checkoutButton').addEventListener('click', function() {
    const items = [
        {
            id: 'product_id_1',  // Replace with your product ID
            quantity: 1           // Replace with desired quantity
        }
    ];

    handleCheckout(items);
});

// Example function to handle multiple products
function handleMultipleProductsCheckout() {
    const items = [
        {
            id: 'product_id_1',  // Replace with your first product ID
            quantity: 1           // Replace with desired quantity
        },
        {
            id: 'product_id_2',  // Replace with your second product ID
            quantity: 2           // Replace with desired quantity
        }
    ];

    handleCheckout(items);
}

// Attach event listener for multiple products checkout
document.getElementById('multipleProductsCheckoutButton').addEventListener('click', function() {
    handleMultipleProductsCheckout();
});
