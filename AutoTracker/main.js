// main.js

const { authenticate } = require('./oauth2client');
const { listSpaces, getSpace } = require('./chatFunctions');

async function main() {
  try {
    const auth = await authenticate();

    // List spaces and get the name of a space
    const spaceName = await listSpaces(auth);

    if (spaceName) {
      // Get details of the selected space
      await getSpace(auth, spaceName);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
