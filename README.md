# Chipzo

Hyperlocal delivery platform. Place orders online from local stores and get them delivered via courier.

---

## Architecture

```
chipzo-2/
├── server/                          # Node.js + Express REST API
│   ├── server.js                    # Entry point
│   ├── .env                         # Environment variables
│   └── src/
│       ├── config/                  # env, db, cloudflare, razorpay
│       ├── models/                  # User, Product, Cart, Order, Address
│       ├── controllers/             # auth, product, cart, order, payment, delivery, webhook, address
│       ├── routes/                  # index.js + sub-routers
│       ├── services/                # Business logic per domain
│       ├── middleware/              # auth, validate, error, notFound, rateLimiter
│       ├── validators/              # Joi schemas
│       ├── constants/               # delivery.constants.js
│       └── utils/                   # ApiError, ApiResponse, asyncHandler, logger
│
├── Chipzo-Web-main/                 # React + Vite frontend
│   └── Chipzo-Web-main/
│       └── src/                     # React components, pages, utils
│
├── chipzo.products.json             # Product seed data
├── chipzo_clean_products.json       # Cleaned product data
└── logo.png
```

---

## Quick Start

### Backend

```bash
cd server
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, RAZORPAY_*, SHIPROCKET_*, CLOUDFLARE_*
npm install
npm run dev
```

### Frontend

```bash
cd Chipzo-Web-main/Chipzo-Web-main
npm install
npm run dev
```

---

## API Overview

Base URL: `http://localhost:5000/api`

All responses follow a standard envelope:

```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Paginated
{ "success": true, "data": [...], "pagination": { "currentPage": 1, "totalPages": 5, ... } }

// Error
{ "success": false, "message": "...", "errors": [...] }
```

### Routes

| Endpoint | Description |
|---|---|
| `POST /api/auth/signup` | User registration |
| `POST /api/auth/login` | Login (returns JWT) |
| `GET /api/products` | Browse products (search, filter, paginate) |
| `POST /api/cart/items` | Add item to cart |
| `GET /api/orders` | List user orders |
| `POST /api/orders` | Create Razorpay order |
| `POST /api/payment/verify` | Verify payment signature |
| `GET /api/delivery/track/:orderId` | Track delivery |
| `POST /api/webhook/shiprocket` | Shiprocket delivery webhook |

---

## Delivery System

Currently integrated with **Shiprocket** for logistics. The Borzo Business API is documented as a reference for future migration or dual-provider setup.

### Delivery Lifecycle

```
Payment verified
      ↓
assignDelivery()          → Shiprocket: create shipment → get shipment_id
      ↓
ensurePickupLocation()    → Register pickup address if new
      ↓
createShiprocketOrder()   → POST /orders/create/adhoc
      ↓
bookCourier()             → POST /courier/assign/awb → gets AWB + courier name
      ↓
[ Ongoing tracking ]       → GET /courier/track?shipment_id=xxx
```

### Delivery Statuses

| Status | Label | Description |
|---|---|---|
| `not_assigned` | Not Assigned | Initial state before Shiprocket assignment |
| `order_confirmed` | Order Confirmed | Shipment created in Shiprocket |
| `bike_booked` | Bike Booked | Courier assigned, AWB generated |
| `pickup_started` | Pickup Started | Courier en route to pickup |
| `in_transit` | In Transit | Parcel in transit |
| `out_for_delivery` | Out for Delivery | Last-mile delivery |
| `delivered` | Delivered | Successfully delivered |
| `cancelled` | Cancelled | Order cancelled |
| `failed_delivery` | Failed Delivery | RTO or undelivered |

### Shiprocket Status Mapping

| Shiprocket Status | Chipzo Status |
|---|---|
| `NEW` | `order_confirmed` |
| `PICKUP` | `pickup_started` |
| `IN_TRANSIT` | `in_transit` |
| `OUT_FOR_DELIVERY` | `out_for_delivery` |
| `DELIVERED` | `delivered` |
| `CANCELLED` | `cancelled` |
| `RTO` / `UNDELIVERED` | `failed_delivery` |

### Delivery History

Each status transition is recorded in `deliveryHistory[]` on the Order document with `{ status, location, description, updatedAt }`.

### Key Delivery Files

| File | Purpose |
|---|---|
| `src/services/delivery.service.js` | All Shiprocket API calls + retry logic |
| `src/controllers/delivery.controller.js` | Track delivery endpoint |
| `src/routes/delivery.routes.js` | Delivery route definitions |
| `src/constants/delivery.constants.js` | Status maps, labels, pickup location |
| `src/models/Order.js` | Order schema with delivery fields |

### Delivery Model Fields (Order)

```javascript
{
  deliveryStatus:        String,   // enum of statuses above
  deliveryTrackingId:    String,   // AWB number
  shipmentId:            String,   // Shiprocket shipment ID
  courierDetails:        { name, phone, vehicleType },
  estimatedDelivery:     Date,
  deliveryHistory:       [{ status, location, description, updatedAt }],
  cancelledAt:           Date,
  cancelReason:          String,
  refundId:              String,
  refundError:           String,
  deliveryError:         String,
}
```

### Create Pickup Location

Before creating shipments, the system auto-registers a pickup location via:

```
POST /settings/company/add/pickup
```

Configured in `.env` via `SHIPROCKET_PICKUP_*` variables.

### Webhook

Shiprocket sends delivery status updates to:

```
POST /api/webhook/shiprocket
```

Payload is matched by `shipment_id` or `awb` and updates the Order document accordingly.

---

## Borzo Business API (Reference)

The Borzo API (v1.8) is documented for reference when adding Borzo as a delivery provider. Key concepts:

### Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/calculate-order` | Price calculation before order creation |
| `POST` | `/create-order` | Place a new delivery order |
| `POST` | `/edit-order` | Edit an existing order (status: new/available/active/delayed) |
| `GET` | `/orders` | List orders (paginated, filterable by status) |
| `GET` | `/courier` | Get courier info + real-time location |
| `GET` | `/client` | Client profile + allowed payment methods |
| `GET` | `/bank-cards` | Available bank cards |
| `GET` | `/labels` | Labels in ZPL/PDF format |

### Order Types

| Type | Description |
|---|---|
| `standard` | Courier visits addresses at your convenience. Max 99 points. |
| `endofday` | Delivery within the day. Exactly 2 points. |
| `vip_delivery` | VIP. `required_start_datetime` / `required_finish_datetime` prohibited. |

### Delivery Statuses (Borzo)

| Status | Description |
|---|---|
| `planned` | No courier assigned |
| `active` | Courier on the way |
| `finished` | Parcel delivered |
| `delayed` | Execution delayed |
| `courier_assigned` | Courier assigned, not departed |
| `courier_departed` | Departed to pickup |
| `courier_at_pickup` | At pickup point |
| `parcel_picked_up` | Parcel collected |
| `courier_arrived` | Arrived at drop-off |
| `return_*` | Return delivery statuses |
| `reattempt_*` | Reattempt delivery statuses |

### Notifications (Callbacks)

Configure a Callback URL in the Borzo dashboard to receive:
- **Order changes**: `order_created`, `order_changed` → full order object
- **Delivery changes**: `delivery_created`, `delivery_changed` → full delivery object

Signature verification uses HMAC-SHA256 with the Callback Secret Key.

### COD (Cash on Delivery)

For COD orders, set per-point:
- `is_cod_cash_voucher_required: true`
- `taking_amount`: cash amount to collect

### Error Handling

All Borzo API errors return `is_successful: false` with:
- `errors[]` — list of error codes
- `parameter_errors` — detailed field-level errors when `invalid_parameters`

---

## Payment System

Two-phase payment flow via Razorpay:

```
POST /api/orders           → Create Razorpay order → return razorpayOrderId
[Frontend: Razorpay Checkout]
POST /api/payment/verify   → HMAC SHA256 signature verification
                           → Deduct stock (atomic bulkWrite with $gte guard)
                           → Create Order document (paymentStatus: 'paid')
                           → Clear user cart
                           → Assign delivery (async)
```

### Payment Statuses

`pending` → `paid` → `refunded` | `failed`

---

## Security

| Layer | Mechanism |
|---|---|
| HTTP headers | `helmet()` |
| CORS | Whitelist `CLIENT_URL` only |
| Body size | `express.json({ limit: '10kb' })` |
| NoSQL injection | `express-mongo-sanitize()` |
| HTTP param pollution | `hpp()` |
| Auth rate limit | 10 req/15min |
| General rate limit | 100 req/15min per IP |
| Passwords | `bcrypt` (12 rounds), `select: false` |
| Payment integrity | HMAC SHA256 with `crypto.timingSafeEqual` |
| Stock race conditions | MongoDB `bulkWrite` with `$gte` guard |
| JWT | Configurable expiry (default 7d) |

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | Yes | e.g. `7d` |
| `RAZORPAY_KEY_ID` | Yes | Razorpay dashboard key |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay dashboard secret |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `CLOUDFLARE_BUCKET_NAME` | Yes | R2 bucket name |
| `CLOUDFLARE_PUBLIC_URL` | Yes | R2 public URL |
| `CLIENT_URL` | Yes | Allowed CORS origin |
| `SHIPROCKET_EMAIL` | For live | Shiprocket login email |
| `SHIPROCKET_PASSWORD` | For live | Shiprocket login password |
| `SHIPROCKET_API_KEY` | Alt | Shiprocket API token |
| `SHIPROCKET_BASE_URL` | No | Default: `https://apiv2.shiprocket.in/v1/external` |
| `SHIPROCKET_PICKUP_*` | For live | Pickup location details |
| `RESEND_API_KEY` | No | Transactional emails |
| `WHATSAPP_PROVIDER` | No | `mock` or `meta` |
| `META_WHATSAPP_*` | For Meta | WhatsApp Cloud API credentials |

---

## Frontend Notes

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion, GSAP, Lenis
- **Routing**: react-router-dom v7
- **Icons**: lucide-react
- **Bangalore-only delivery** enforced via dual validation (city/locality name + pincode whitelist) at `src/utils/orderValidation.js`

---

## Seed Data

```bash
cd server
node seed.js
```

Loads products from `chipzo.products.json` / `chipzo_clean_products.json`.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start backend with nodemon |
| `npm start` | Production start |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run build` | Frontend production build |
| `npm run preview` | Preview frontend build |
