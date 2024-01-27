// netlify/functions/saveSale.js

exports.handler = async function (event, context) {
    try {
      const { leadId, esiStatus, selectedSaleTypes } = JSON.parse(event.body);
      const timestamp = new Date().toLocaleString();
  
      // Save the sale data to your data store (e.g., database)
      // For simplicity, let's use an array as a temporary storage
      const saleData = { leadId, esiStatus, selectedSaleTypes, timestamp };
      salesHistory.push(saleData);
  
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Sale added successfully', sale: saleData }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error saving sale' }),
      };
    }
  };
  