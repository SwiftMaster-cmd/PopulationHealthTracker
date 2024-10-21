const { google } = require('googleapis');
const open = require('open');
const http = require('http');
const url = require('url');

// Replace with your client ID and client secret
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

// Scopes required for Google Chat API
const SCOPES = ['https://www.googleapis.com/auth/chat.bot'];

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

function authenticate() {
  return new Promise((resolve, reject) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('Opening the following URL in your browser:');
    console.log(authUrl);

    // Open the URL in the default browser
    open(authUrl);

    // Start a simple HTTP server to listen for the OAuth callback
    const server = http
      .createServer((req, res) => {
        if (req.url.indexOf('/oauth2callback') > -1) {
          const qs = new url.URL(req.url, 'http://localhost:3000')
            .searchParams;
          const code = qs.get('code');
          res.end('Authentication successful! Please return to the console.');
          server.close();

          // Exchange code for tokens
          oauth2Client.getToken(code, (err, tokens) => {
            if (err) {
              reject(err);
            } else {
              oauth2Client.setCredentials(tokens);
              resolve(oauth2Client);
            }
          });
        }
      })
      .listen(3000, () => {
        console.log('Server is listening on port 3000');
      });
  });
}

module.exports = { authenticate };
