# VoltEx API — Build Walkthrough

Production-grade Node.js + Express REST API for an electrical components e-commerce platform.

---

## 📁 What Was Built

**35 files** across 8 layers inside `server/`:

```
server/
├── server.js                     # Entry point
├── .env / .env.example
├── .gitignore
├── package.json
└── src/
    ├── config/         env.js, db.js, cloudflare.js, razorpay.js
    ├── models/         User.js, Product.js, Cart.js, Order.js
    ├── controllers/    auth, product, cart, order, payment, delivery
    ├── routes/         index.js + 6 sub-routers
    ├── middleware/     auth, validate, error, notFound, rateLimiter
    ├── validators/     auth, product, cart, order (Joi schemas)
    ├── services/       auth, product, cart, order, payment, delivery, cloudflare
    └── utils/          ApiError, ApiResponse, asyncHandler, generateToken, logger
```

---

## 🚀 Quick Start

```bash
cd server
cp .env.example .env
# Fill in your MONGO_URI, JWT_SECRET, RAZORPAY_*, CLOUDFLARE_* values
npm run dev
```

> The server validates all required env vars on startup and **refuses to start** if any are missing.

---

## 🔑 Key Design Decisions

### Layer Separation (strict)
- **Controllers**: Call services → return `ApiResponse`. No business logic, no try/catch.
- **Services**: All business logic. Throw `ApiError` on failures.
- **Models**: Schema + pre-save hooks + instance methods only.
- **Middleware**: Cross-cutting concerns only (auth, validation, error handling).

### asyncHandler Pattern
Every controller is wrapped with `asyncHandler()` — a HOF that catches rejected promises and forwards them to Express's global error handler. Zero `try/catch` in controllers.

### API Response Envelope
Every response follows the same shape:
```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Paginated
{ "success": true, "data": [...], "pagination": { "currentPage": 1, "totalPages": 5, ... } }

// Error
{ "success": false, "message": "...", "errors": [...] }
```

---

## 🔐 Security Stack

| Layer | Mechanism |
|---|---|
| HTTP headers | `helmet()` |
| CORS | Whitelist `CLIENT_URL` only |
| Body size | `express.json({ limit: '10kb' })` |
| NoSQL injection | `express-mongo-sanitize()` |
| HTTP param pollution | `hpp()` |
| Brute force (auth) | `express-rate-limit` — 10 req/15min |
| General rate limit | 100 req/15min per IP |
| Password storage | `bcrypt` (12 rounds), `select: false` |
| Payment integrity | HMAC SHA256 with `crypto.timingSafeEqual` |
| Stock race condition | MongoDB `bulkWrite` with `$gte` guard |
| JWT | 7-day expiry, verified on every protected request |

---

## 💳 Payment Flow (Two-Phase)

```
POST /api/orders           → Validate cart → Create Razorpay order
                             Returns: { razorpayOrderId, amount, key_id }

[Frontend does payment]

POST /api/payment/verify   → Verify HMAC signature
                           → Deduct stock (atomic bulkWrite)
                           → Create Order document (paymentStatus: 'paid')
                           → Clear cart
                           → Assign delivery (async, non-blocking)
```

> The DB Order is **only created after signature verification** — never on frontend trust.

---

## 📦 Product Upload Flow

```
POST /api/products (multipart/form-data)
  multer (memoryStorage) → file.buffer
  cloudflare.service.js  → PutObjectCommand → R2
  Returns: { imageUrl, imageKey }
  Product saved with imageUrl + imageKey (key used for future deletion)
```

---

## 🚚 Delivery

- If `RAPIDO_API_KEY` is set: makes real HTTP call to Rapido API
- Otherwise: **mock mode** — cycles through `assigned → in_transit → delivered` based on time elapsed since order
- Mock tracking IDs: `VOLTEX-XXXXXXXX`

---

## 📋 Manual Test Sequence

```bash
# 1. Signup
POST /api/auth/signup  { name, email, password }

# 2. Login → get token
POST /api/auth/login   { email, password }

# 3. Create a product (use token)
POST /api/products     multipart/form-data { image, name, price, description, stock, category }

# 4. Browse products
GET /api/products?search=resistor&category=resistors&page=1&limit=12

# 5. Add to cart
POST /api/cart/items   { productId, quantity }

# 6. View cart
GET /api/cart

# 7. Initiate order (creates Razorpay order)
POST /api/orders       { address: { fullName, phone, street, city, state, pincode } }

# 8. Verify payment (after Razorpay checkout)
POST /api/payment/verify  { razorpayOrderId, razorpayPaymentId, razorpaySignature, address, cartSnapshot }

# 9. Track delivery
GET /api/delivery/track/:orderId

# 10. Health check
GET /api/health
```

---

## 🌱 Environment Variables

All required — server will not start without them:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars recommended) |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `RAZORPAY_KEY_ID` | Razorpay dashboard key |
| `RAZORPAY_KEY_SECRET` | Razorpay dashboard secret |
| `CLOUDFLARE_ACCOUNT_ID` | Your CF account ID |
| `CLOUDFLARE_API_TOKEN` | R2 API token |
| `CLOUDFLARE_BUCKET_NAME` | R2 bucket name |
| `CLOUDFLARE_PUBLIC_URL` | Public URL of bucket (e.g. `https://pub-xxx.r2.dev`) |
| `CLIENT_URL` | Allowed CORS origin |
| `RAPIDO_API_KEY` | *(optional)* — leave empty to use mock delivery |

---

## ✅ Validation Results

- **Node.js `--check` syntax validation**: All 35 files passed ✅
- **All dependencies installed** with 0 vulnerabilities ✅
