const express = require('express');
const stripe = require('stripe')(process.env.pk_live_51PmuU8P3su2SGtHchQUHuHUL4sWmpJ9xbftuUzK4C47XWrYRmK1Jsar7P3ZmLSUHJfSk4mpFD5k3I7kVW2OnZmyH0099DXJbQZ); // Use the environment variable for the secret key
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4242;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Create a checkout session
app.post('/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: req.body.items.map(item => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: item.price, // Price in cents
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: `${req.headers.origin}/success.html`,
            cancel_url: `${req.headers.origin}/cancel.html`,
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'An error occurred, please try again later.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
