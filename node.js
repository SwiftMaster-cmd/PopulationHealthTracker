const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Mock database storage (replace with your actual database connection)
let monthlyGoals = '';

// Route to handle saving goals
app.post('/save-goals', (req, res) => {
    const { goals } = req.body;

    // Save goals to the database (in this case, mock storage)
    monthlyGoals = goals;

    // Send response
    res.sendStatus(200);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
