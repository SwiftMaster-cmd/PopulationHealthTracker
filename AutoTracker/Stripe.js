// Initialize Stripe with your public key
const stripe = Stripe('pk_live_51PmuU8P3su2SGtHchQUHuHUL4sWmpJ9xbftuUzK4C47XWrYRmK1Jsar7P3ZmLSUHJfSk4mpFD5k3I7kVW2OnZmyH0099DXJbQZ');

// Function to create a checkout session and redirect to Stripe Checkout
function createCheckoutSession() {
    fetch('/create-checkout-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            items: [
                { id: 'product_id_1', quantity: 1 }  // Replace with your product ID and quantity
            ]
        })
    })
    .then(response => response.json())
    .then(session => {
        return stripe.redirectToCheckout({ sessionId: session.id });
    })
    .then(result => {
        if (result.error) {
            alert(result.error.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Attach event listener to your button
document.getElementById('checkoutButton').addEventListener('click', createCheckoutSession);
