const { google } = require('googleapis');

async function listSpaces(auth) {
  const chat = google.chat({ version: 'v1', auth });

  try {
    const res = await chat.spaces.list();
    const spaces = res.data.spaces;

    if (!spaces || spaces.length === 0) {
      console.log('No spaces found.');
      return;
    }

    console.log('Available Spaces:');
    spaces.forEach((space) => {
      console.log(`${space.name}: ${space.displayName}`);
    });

    // For demonstration, let's return the first space
    return spaces[0].name;
  } catch (error) {
    console.error('Error listing spaces:', error);
  }
}

async function getSpace(auth, spaceName) {
  const chat = google.chat({ version: 'v1', auth });

  try {
    const res = await chat.spaces.get({
      name: spaceName,
    });

    console.log('Space Details:');
    console.log(`Name: ${res.data.name}`);
    console.log(`Display Name: ${res.data.displayName}`);
    console.log(`Type: ${res.data.type}`);
    console.log(`Space Type: ${res.data.spaceType}`);
    // Add any additional fields you're interested in
  } catch (error) {
    console.error('Error retrieving space:', error);
  }
}

module.exports = { listSpaces, getSpace };
