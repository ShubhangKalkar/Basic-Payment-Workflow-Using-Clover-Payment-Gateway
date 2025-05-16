// server.cjs
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const qs = require('qs');
const app = express();
const PORT = 3000;

let accessToken = null; // Temporary token storage
const MERCHANT_ID = '34AKAZ56HH7Y1'; // Replace with your actual Clover test merchant ID
const CLOVER_API_BASE = `https://sandbox.dev.clover.com/v3/merchants/${MERCHANT_ID}`;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'views')));

// Step 1: Redirect to Clover OAuth2 login
app.get('/oauth/authorize', async (req, res) => {
  const authUrl = `https://sandbox.dev.clover.com/oauth/authorize?client_id=${process.env.CLOVER_CLIENT_ID}&response_type=code&redirect_uri=${process.env.CLOVER_REDIRECT_URI}`;
  res.redirect(authUrl);
});

// Step 2: Handle OAuth2 callback and exchange code for token
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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    accessToken = tokenRes.data.access_token;
    res.send('✅ OAuth success! Access token received.');
  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err);
    res.status(500).send('OAuth token exchange failed.');
  }
});

// Step 3: Payment API - Create Order and Add Line Item
app.post('/api/payment', async (req, res) => {
  if (!accessToken) return res.status(401).send('Not authenticated. Go to /oauth/authorize');

  const { amount, description } = req.body;
  if (!amount || !description) {
    return res.status(400).json({ status: 'error', message: 'Missing fields' });
  }

  try {
    // Step 1: Create order
    const orderRes = await axios.post(
      `${CLOVER_API_BASE}/orders`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    const orderId = orderRes.data.id;

    // Step 2: Add line item to order
    const itemRes = await axios.post(
      `${CLOVER_API_BASE}/orders/${orderId}/line_items`,
      {
        name: description,
        price: parseInt(amount * 100), // Clover uses cents
        quantity: 1
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    res.json({
      status: 'success',
      orderId,
      itemId: itemRes.data.id,
      message: `Order created with item: ${description}`
    });
  } catch (err) {
    console.error('Clover API error:', err.response?.data || err);
    res.status(500).send('Clover payment workflow failed.');
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
