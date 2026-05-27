# Bangalore Order Validation

Orders are restricted to Bangalore city only. Validation uses a **dual-check approach** — city/locality name + pincode — at `src/utils/orderValidation.js:60-72`.

## How It Works

### 1. City / Locality Name Check
The user-entered city is compared against a whitelist of Bangalore variants **plus 60+ major locality names**:

```
bangalore, bengaluru, bengalooru,
bbmp, bda,
koramangala, whitefield, indiranagar, jayanagar,
malleswaram, rajajinagar, basavanagudi, sadashivanagar,
vijayanagar, yelahanka, hebbal, banashankari,
marathahalli, electronic city, jalahalli,
peenya, kengeri, kr puram, yeshwanthpur,
dasarahalli, nagarbhavi, rr nagar, jp nagar,
btm layout, hsr layout, sarjapur,
bellandur, anekal, devanahalli,
attibele, jigani, bommanahalli, madivala,
mathikere, vidyaranyapura, sahakarangar,
nandini layout, kumaraswamy layout, nagasandra,
chickpet, gandhinagar, shivajinagar,
fraser town, austin town, richmond town,
hal, vimanasura, domlur, ulsoor,
cmh road, mg road, brigade road, commercial street
```

Matching is **case-insensitive and partial** (uses `city.includes(keyword)`). So "Koramangala 1st Block", "Electronic City Phase 2", "HSR Layout Sector 3" all pass.

### 2. Pincode Check
The delivery pincode must match one of **110+ pincodes** covering all of Bangalore Urban + Rural (560001–560110, plus 562106/562107/562110 for Anekal, Attibele, Devanahalli).

### 3. Validation Gate
An address passes **only if both** checks pass. If either fails, the order is blocked:

> "Currently, we accept orders only within Bangalore city."

The popup shows a location icon and orange-themed modal.

### Where Validation Runs
Three gates in the checkout flow:

| Stage | Location |
|-------|----------|
| **Review → Payment** | `Checkout.jsx` — when user clicks "PROCEED TO PAYMENT" |
| **Before Order** | `Checkout.jsx:handlePlaceOrder` — before Razorpay modal or COD submission |
| **Defense-in-depth** | Backend receives the address in the payload for future server-side validation |

### Priority
Validations run in order: **Sunday → Time → Bangalore**. Bangalore is last since it needs address input.
