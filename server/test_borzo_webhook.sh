#!/bin/bash
# ──────────────────────────────────────────────────────────────────
# Borzo Webhook Test Script for Chipzo
# Run from: /home/vinith/Desktop/chipzo-2/server
# Usage:    bash test_borzo_webhook.sh [ORDER_ID]
# ──────────────────────────────────────────────────────────────────

BASE_URL="http://localhost:5000"
BORZO_ORDER_ID="99991235"   # Fake Borzo order ID

# Allow passing real Mongo order ID as argument
CHIPZO_ORDER_ID="${1:-6a3682564636f3647c7a51db}"

echo ""
echo "============================================================"
echo "  Borzo Webhook Test — Chipzo Order: $CHIPZO_ORDER_ID"
echo "============================================================"

# ── STEP 0: Patch the order in MongoDB to set a fake shipmentId ──
# This simulates what happens when Borzo creates an order successfully
echo ""
echo "[ STEP 0 ] Patching order in MongoDB with fake Borzo shipmentId..."
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('./src/config/env');
mongoose.connect(env.MONGO_URI).then(async () => {
  const Order = require('./src/models/Order');
  const result = await Order.findByIdAndUpdate(
    '$CHIPZO_ORDER_ID',
    {
      shipmentId: '$BORZO_ORDER_ID',
      deliveryProvider: 'borzo',
      deliveryStatus: 'order_confirmed'
    },
    { new: true }
  );
  if (result) {
    console.log('✅ Order patched. Status:', result.deliveryStatus, '| shipmentId:', result.shipmentId);
  } else {
    console.log('❌ Order not found. Check the ID: $CHIPZO_ORDER_ID');
  }
  await mongoose.disconnect();
}).catch(e => { console.error('❌ DB Error:', e.message); process.exit(1); });
"
echo ""
sleep 1

# ── Helper function to fire webhooks ─────────────────────────────
fire_webhook() {
  local label="$1"
  local payload="$2"
  echo "[ $label ]"
  echo "  Payload: $(echo $payload | python3 -m json.tool --no-sort-keys 2>/dev/null | head -6 | tr -d '\n' | sed 's/  */ /g')..."
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/webhook/borzo" \
    -H "Content-Type: application/json" \
    -d "$payload")
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -1)
  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ $HTTP_CODE — $(echo $BODY | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('message','ok'))" 2>/dev/null)"
  else
    echo "  ❌ $HTTP_CODE — $BODY"
  fi
  echo ""
  sleep 1
}

# ── STEP 1: Courier Assigned ──────────────────────────────────────
fire_webhook "STEP 1 — Courier Assigned" '{
  "event_type": "order_changed",
  "order": {
    "order_id": '"$BORZO_ORDER_ID"',
    "status": "courier_assigned",
    "courier": {
      "name": "Ravi Kumar",
      "phone": "9845012345"
    },
    "points": [
      { "address": "KR Road, VV Puram, Bangalore, India" },
      { "address": "Koramangala 5th Block, Bengaluru 560095" }
    ],
    "delivery_time_from": '"$(date -d '+1 hour' +%s)"',
    "delivery_time_to": '"$(date -d '+2 hours' +%s)"'
  }
}'

# ── STEP 2: Courier Departed to Pickup ───────────────────────────
fire_webhook "STEP 2 — Courier Departed to Pickup" '{
  "event_type": "order_changed",
  "order": {
    "order_id": '"$BORZO_ORDER_ID"',
    "status": "courier_departed",
    "courier": {
      "name": "Ravi Kumar",
      "phone": "9845012345"
    },
    "points": [
      { "address": "KR Road, VV Puram, Bangalore, India" },
      { "address": "Koramangala 5th Block, Bengaluru 560095" }
    ],
    "delivery_time_to": '"$(date -d '+90 minutes' +%s)"'
  }
}'

# ── STEP 3: Parcel Picked Up (In Transit) ────────────────────────
fire_webhook "STEP 3 — Parcel Picked Up" '{
  "event_type": "order_changed",
  "order": {
    "order_id": '"$BORZO_ORDER_ID"',
    "status": "parcel_picked_up",
    "courier": {
      "name": "Ravi Kumar",
      "phone": "9845012345"
    },
    "points": [
      { "address": "KR Road, VV Puram, Bangalore, India" },
      { "address": "Koramangala 5th Block, Bengaluru 560095" }
    ],
    "delivery_time_to": '"$(date -d '+45 minutes' +%s)"'
  }
}'

# ── STEP 4: Courier Arrived at Drop-off ──────────────────────────
fire_webhook "STEP 4 — Courier Arrived at Drop-off" '{
  "event_type": "order_changed",
  "order": {
    "order_id": '"$BORZO_ORDER_ID"',
    "status": "courier_arrived",
    "courier": {
      "name": "Ravi Kumar",
      "phone": "9845012345"
    },
    "points": [
      { "address": "KR Road, VV Puram, Bangalore, India" },
      { "address": "Koramangala 5th Block, Bengaluru 560095" }
    ],
    "delivery_time_to": '"$(date -d '+5 minutes' +%s)"'
  }
}'

# ── STEP 5: Delivered ─────────────────────────────────────────────
fire_webhook "STEP 5 — Order Delivered ✅" '{
  "event_type": "order_changed",
  "order": {
    "order_id": '"$BORZO_ORDER_ID"',
    "status": "finished",
    "courier": {
      "name": "Ravi Kumar",
      "phone": "9845012345"
    },
    "points": [
      { "address": "KR Road, VV Puram, Bangalore, India" },
      { "address": "Koramangala 5th Block, Bengaluru 560095" }
    ]
  }
}'

# ── STEP 6: Verify final state via tracking API ───────────────────
echo "[ FINAL ] Checking order tracking state..."
TOKEN="${BEARER_TOKEN:-}"
if [ -n "$TOKEN" ]; then
  curl -s "$BASE_URL/api/delivery/track/$CHIPZO_ORDER_ID" \
    -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
else
  echo "  ℹ️  Set BEARER_TOKEN env var to check tracking: BEARER_TOKEN=your_jwt bash test_borzo_webhook.sh"
fi

echo ""
echo "============================================================"
echo "  Test complete! Check your server logs for delivery events."
echo "============================================================"
echo ""
