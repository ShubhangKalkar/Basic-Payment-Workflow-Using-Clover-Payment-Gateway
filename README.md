
---

### `README.md`

````markdown
# Mock Clover Payment App 💳

A full-stack Node.js web application that simulates a Clover-integrated checkout flow. Built for demoing OAuth2 authentication, real-time order creation, and test card payment using the Clover Developer Sandbox.

---

## Features

- OAuth2 login flow with Clover
- Create Clover orders and add items
- Collect and validate credit card data
- Submit a payment using test card credentials
- Two-step user interface (order → payment)
- Transaction logging to `transactions.json`

---

## Setup Instructions

1. **Clone the project**

   ```bash
   git clone <your-repo-url>
   cd <project-folder>
````

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env` file:

   ```env
   CLOVER_CLIENT_ID=your_app_id
   CLOVER_CLIENT_SECRET=your_app_secret
   CLOVER_REDIRECT_URI=http://localhost:3000/oauth/callback
   ```

4. **Start the server**

   ```bash
   node server.cjs
   ```

5. **Run the app**

   * Visit `http://localhost:3000/oauth/authorize` and approve the app
   * Then go to `http://localhost:3000` to start the payment flow

---

## How OAuth2 Works

1. **User visits** `/oauth/authorize`
   → Redirected to Clover login

2. **User approves access** to your app for their merchant account

3. **Clover redirects back** to `/oauth/callback?code=...&merchant_id=...`

4. **Server exchanges** the `code` for an `access_token` using:

   ```
   POST https://sandbox.dev.clover.com/oauth/token
   ```

5. Server stores:

   * Access token
   * Merchant ID

This token is used in all authorized Clover API requests below.

---

## Clover API Calls Used

### Create Order

```
POST /v3/merchants/{merchant_id}/orders
Headers: Authorization: Bearer <access_token>
```

Creates a new order and returns `orderId`.

---

### Add Line Item

```
POST /v3/merchants/{merchant_id}/orders/{orderId}/line_items
Body: { name, price, quantity }
```
Adds product details to the order.

---

### Process Payment

```
POST /v3/merchants/{merchant_id}/payments
Headers: Authorization: Bearer <access_token>
Body:
{
  amount,
  order: { id },
  tender: { labelKey: "com.clover.tender.credit_card" },
  source: {
    type: "card",
    card: { number, exp_month, exp_year, cvv }
  }
}
```

Uses test card data to simulate a payment and return a `paymentId`.

---

## Test Card to Use

| Field       | Value                                   |
| ----------- | ------------------                      |
| Card Number | `4111111111111111` or any other number  |
| Expiry      | Any future MM/YY                        |
| CVV         | `123` / any 3 digit number              |

---

## Validations (Frontend)

* Amount: required, numeric, supports decimals
* Card Number: 12–16 digits
* Expiration: MM/YY format, future date only
* CVV: 3 digits
* Graceful API error handling

---

## Logs

All successful payments are logged to `transactions.json`:

```json
[
  {
    "paymentId": "ABC123",
    "orderId": "XYZ789",
    "amount": "25",
    "timestamp": "2024-05-17T12:00:00Z"
  }
]
```
