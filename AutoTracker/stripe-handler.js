// Initialize Stripe with your public key
const stripe = Stripe('pk_live_YOUR_PUBLIC_KEY'); // Replace with your actual Stripe public key

// Function to handle the checkout process
async function handleCheckout(items) {
    try {
        // Send a request to the server to create a checkout session
        const response = await fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items }) // Send the items data to the server
        });

        const session = await response.json();

        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({ sessionId: session.id });

        if (result.error) {
            // Display an error message if there's an issue with the checkout process
            alert(result.error.message);
        }
    } catch (error) {
        console.error('Error during checkout:', error);
    }
}

// Attach an event listener to the checkout button
document.getElementById('checkoutButton').addEventListener('click', function() {
    // Define the items to purchase
    const items = [
        {
            name: 'Health Product',   // Replace with your product name
            price: 5000,              // Price in cents (e.g., $50.00)
            quantity: 1               // Quantity of the product
        }
    ];

    // Call the checkout handler function
    handleCheckout(items);
});
