// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const qs = require('qs');
const app = express();
const PORT = 3000;
const MERCHANT_ID = '34AKAZ56HH7Y1';

let accessToken = null; // Temporary token storage

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'views')));

// Step 1: Redirect to Clover OAuth2 login
app.get('/oauth/authorize', async (req, res) => {
  const authUrl = `https://sandbox.dev.clover.com/oauth/authorize?client_id=${process.env.CLOVER_CLIENT_ID}&response_type=code&redirect_uri=${process.env.CLOVER_REDIRECT_URI}`;
  res.redirect(authUrl);
});

app.get('/oauth/callback', async (req, res) => {
  if (accessToken) {
    return res.send('✅ You are already authenticated.');
  }

  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');

  try {
    const tokenRes = await axios.post(
      'https://sandbox.dev.clover.com/oauth/token',
      qs.stringify({
        client_id: process.env.CLOVER_CLIENT_ID,
        client_secret: process.env.CLOVER_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    accessToken = tokenRes.data.access_token;
    res.send('✅ OAuth success! Access token received.');
  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err);
    res.status(500).send('OAuth token exchange failed.');
  }
});

// Test Payment Endpoint (mock for now)
app.post('/api/payment', (req, res) => {
  if (!accessToken) return res.status(401).send('Not authenticated. Go to /oauth/authorize');

  const { amount, description } = req.body;
  if (!amount || !description) {
    return res.status(400).json({ status: 'error', message: 'Missing fields' });
  }

  const transaction = {
    id: Date.now(),
    amount,
    description,
    status: 'success',
    timestamp: new Date().toISOString()
  };

  const logPath = path.join(__dirname, 'transactions.json');
  let logs = [];
  if (fs.existsSync(logPath)) {
    logs = JSON.parse(fs.readFileSync(logPath));
  }
  logs.push(transaction);
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

  res.json({ status: 'success', transaction });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
