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

let accessToken = null;
let MERCHANT_ID = null;
let currentOrder = {}; // store order and amount in memory

const CLOVER_API_BASE = () => `https://sandbox.dev.clover.com/v3/merchants/${MERCHANT_ID}`;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'views')));

app.get('/oauth/authorize', async (req, res) => {
  const authUrl = `https://sandbox.dev.clover.com/oauth/authorize?client_id=${process.env.CLOVER_CLIENT_ID}&response_type=code&redirect_uri=${process.env.CLOVER_REDIRECT_URI}`;
  res.redirect(authUrl);
});

app.get('/oauth/callback', async (req, res) => {
  const code = req.query.code;
  const merchantId = req.query.merchant_id;

  if (!code || !merchantId) {
    return res.status(400).send('Missing code or merchant_id');
  }

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
    MERCHANT_ID = merchantId;
    console.log('Access token received:', accessToken);
    console.log('Merchant ID:', MERCHANT_ID);
    res.send('✅ OAuth success! Access token received.');
  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err);
    res.status(500).send('OAuth token exchange failed.');
  }
});

app.post('/api/payment', async (req, res) => {
  if (!accessToken) return res.status(401).json({ status: 'error', message: 'Not authenticated. Go to /oauth/authorize' });

  const { amount, description } = req.body;
  if (!amount || !description) {
    return res.status(400).json({ status: 'error', message: 'Missing fields' });
  }

  try {
    const orderRes = await axios.post(
      `${CLOVER_API_BASE()}/orders`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    const orderId = orderRes.data.id;

    await axios.post(
      `${CLOVER_API_BASE()}/orders/${orderId}/line_items`,
      {
        name: description,
        price: parseInt(amount * 100),
        quantity: 1
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    currentOrder = { orderId, amount };
    res.json({ status: 'success', orderId });
  } catch (err) {
    console.error('Clover API error:', err.response?.data || err);
    res.status(500).json({ status: 'error', message: 'Clover payment workflow failed.' });
  }
});

app.post('/api/charge', async (req, res) => {
  if (!accessToken) return res.status(401).json({ status: 'error', message: 'Not authenticated' });

  const { cardNumber, expMonth, expYear, cvv } = req.body;
  const { orderId, amount } = currentOrder;

  console.log('Incoming charge request body:', req.body);

  if (!orderId || !amount || !cardNumber || !expMonth || !expYear || !cvv) {
    return res.status(400).json({ status: 'error', message: 'Missing payment fields' });
  }

  try {
    const paymentRes = await axios.post(
      `${CLOVER_API_BASE()}/payments`,
      {
        amount: parseInt(amount * 100),
        currency: 'usd',
        order: { id: orderId },
        tender: { labelKey: 'com.clover.tender.credit_card' },
        source: {
          type: 'card',
          card: {
            number: cardNumber,
            exp_month: parseInt(expMonth),
            exp_year: parseInt(expYear),
            cvv: cvv
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const logPath = path.join(__dirname, 'transactions.json');
    let logs = [];
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath));
    }
    logs.push({
      paymentId: paymentRes.data.id,
      orderId,
      amount,
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

    res.json({ status: 'success', paymentId: paymentRes.data.id });
  } catch (err) {
    console.error('Payment error:', err.response?.data || err);
    res.status(500).json({ status: 'error', message: 'Payment failed.' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
