const express = require('express');
const bodyParser = require('body-parser');
const path = require('path'); // Import the 'path' module
const app = express();
const port = 3000;

// Middleware to parse JSON in request body
app.use(bodyParser.json());

// Temporary storage for sales data (replace this with a database in production)
const salesData = [];

// Endpoint to get all sales
app.get('/api/sales', (req, res) => {
  res.json(salesData);
});

// Endpoint to save a sale
app.post('/api/sales', (req, res) => {
  const saleData = req.body;
  salesData.push(saleData);
  res.json({ message: 'Sale added successfully', sale: saleData });
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
