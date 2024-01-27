// netlify/functions/getSales.js

exports.handler = async function (event, context) {
    try {
      // Return the sales data stored in your data store
      return {
        statusCode: 200,
        body: JSON.stringify(salesHistory),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error fetching sales' }),
      };
    }
  };
  