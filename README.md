# Mock Clover Payment App 💳

This is a full-stack web application that simulates a Clover-integrated payment flow using OAuth2 and Clover's Orders and Payments APIs.

## 🔧 Features

- OAuth2 login flow with Clover Developer credentials
- Create new orders and add line items via Clover API
- Collect and validate card information
- Process test card payments in sandbox mode
- Fully responsive two-step UI
- Local transaction logging to `transactions.json`

---

## 🚀 Tech Stack

- Node.js + Express
- HTML + CSS + Vanilla JS (no frontend framework)
- Clover Developer Sandbox APIs

---

## 📦 Setup Instructions

1. **Clone the repository**

   ```bash
   git clone [<your-repo-url>](https://github.com/ShubhangKalkar/Basic-Payment-Workflow-Using-Clover-Payment-Gateway.git)
   cd <project-folder>
````

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create `.env` file**

   Create a `.env` file in the root with the following:

   ```env
   CLOVER_CLIENT_ID=your_app_id
   CLOVER_CLIENT_SECRET=your_app_secret
   CLOVER_REDIRECT_URI=http://localhost:3000/oauth/callback
   ```

4. **Start the server**

   ```bash
   node server.cjs
   ```

5. **Go to browser**

   * Open `http://localhost:3000/oauth/authorize` and authorize the app with your test merchant.
   * Then visit `http://localhost:3000` to use the payment form.

---

## 💡 Test Card Details

Use the following sandbox credentials:

* **Card Number:** `4111111111111111`
* **Expiration:** `MM/YY` (future only)
* **CVV:** `123`

---

## ✅ Input Validation (Frontend)

* Amount: required, numeric only, decimal supported
* Card Number: 12–16 digits only
* Expiration: must be 2-digit `MM/YY`, not expired
* CVV: exactly 3 digits
* Double-submit prevention, inline messaging

---

## 📄 Output

* All successful transactions are saved to `transactions.json` with:

  * `orderId`
  * `paymentId`
  * `amount`
  * timestamp

---

## 📚 Notes

* Uses Clover's sandbox: [https://sandbox.dev.clover.com](https://sandbox.dev.clover.com)
* Your app must be installed in a test merchant for token access to succeed.
* Clover permissions required:

  * `Read & Write: Merchant, Orders, Payments`

---

## 🧪 Testing Edge Cases

* Invalid amount or characters in amount
* Invalid card number length
* Expired cards
* Missing fields
* Server/API failures

All handled gracefully in the UI with helpful messages.
