# Razorpay Live Payment Troubleshooting Guide

## Current Status
✅ **Referral System**: Fixed and working with pass-based commissions
❌ **Live Payments**: Failing (working in test mode)

## Referral Code System (FIXED)

### How It Works Now:
1. **Influencers get unique referral codes** stored in `influencers.code` field
2. **Customers enter referral codes** during booking (no discount to customer)
3. **Influencers earn pass-based commission** according to commission.jpeg structure
4. **Commission tracked automatically** in `booking_analytics` table

### Commission Structure Applied:
- Kids (3-8 Years): ₹9 per ticket
- General Single: ₹39 per ticket
- Premium Single: ₹59-69 per ticket
- Fanpit Single: ₹99 per ticket
- Couple Passes: ₹59-99 per ticket
- Group Passes: ₹149-499 per ticket

## Razorpay Live Payment Issues

### Current Configuration:
```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_RJmQXsCWy7gYek"
RAZORPAY_KEY_SECRET="R2QXLpRKVMDDLXLMQyEjjfjA"
```

### Common Live Payment Failure Causes:

#### 1. **Account Activation Issues**
- ✅ **Check**: Razorpay account is activated and KYC completed
- ✅ **Check**: Live API keys are activated (not just generated)
- ✅ **Check**: Account has no pending compliance issues

#### 2. **API Integration Issues**
- ✅ **Check**: Live key format is correct (`rzp_live_` prefix)
- ✅ **Check**: Secret key matches the live key ID
- ⚠️ **Check**: Webhook URL is configured for live mode
- ⚠️ **Check**: IP whitelisting (if enabled) includes your server

#### 3. **Security & CORS Issues**
- ⚠️ **Check**: Domain is whitelisted in Razorpay dashboard
- ⚠️ **Check**: HTTPS is enforced on live site
- ⚠️ **Check**: CSP headers allow Razorpay scripts

#### 4. **Payment Flow Issues**
- ⚠️ **Check**: Order creation succeeds but payment fails
- ⚠️ **Check**: Payment verification logic handles live payments
- ⚠️ **Check**: Amount formatting (paise vs rupees)

## Debugging Steps

### Step 1: Test Order Creation
```bash
# Test API directly
curl -X POST https://yourdomain.com/api/razorpay \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "INR"}'
```

### Step 2: Check Razorpay Dashboard
1. Login to Razorpay Dashboard
2. Go to **Settings > API Keys**
3. Verify live keys are active
4. Check **Settings > Account & Settings** for KYC status

### Step 3: Check Webhook Configuration
1. Go to **Settings > Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/razorpay/webhook`
3. Enable events: `payment.captured`, `payment.failed`

### Step 4: Verify Domain Settings
1. Go to **Settings > Configuration**
2. Add your domain to whitelist
3. Enable CORS for your domain

### Step 5: Check Payment Logs
```javascript
// Add to payment verification route
console.log('Payment attempt:', {
  payment_id: razorpay_payment_id,
  order_id: razorpay_order_id,
  amount: payment.amount,
  status: payment.status,
  method: payment.method,
  error_code: payment.error_code,
  error_description: payment.error_description
});
```

## Quick Fixes

### Fix 1: Add Error Handling to Payment Creation
```typescript
// In CleanBookingModal.tsx payment handler
try {
  const orderResponse = await fetch('/api/razorpay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: finalAmount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    })
  });

  if (!orderResponse.ok) {
    const errorData = await orderResponse.json();
    console.error('Order creation failed:', errorData);
    throw new Error(`Payment setup failed: ${errorData.error}`);
  }

  const orderData = await orderResponse.json();
  // Continue with Razorpay payment...
} catch (error) {
  console.error('Payment error:', error);
  alert(`Payment failed: ${error.message}`);
}
```

### Fix 2: Add Payment Method Validation
```typescript
// In razorpay/route.ts
const order = await razorpay.orders.create({
  amount: Math.round(body.amount * 100),
  currency: body.currency || 'INR',
  receipt: body.receipt || `receipt_${Date.now()}`,
  payment_capture: 1, // Auto capture
  notes: {
    event_id: body.eventId || 'unknown',
    customer_email: body.customerEmail || 'unknown'
  }
});
```

### Fix 3: Enhanced Payment Verification
```typescript
// In razorpay/verify/route.ts - add after payment fetch
if (payment.status === 'failed') {
  console.error('Payment failed:', {
    payment_id: razorpay_payment_id,
    error_code: payment.error_code,
    error_description: payment.error_description,
    failure_reason: payment.failure_reason
  });

  return NextResponse.json({
    success: false,
    error: `Payment failed: ${payment.error_description || 'Unknown error'}`,
    payment_status: payment.status
  }, { status: 400 });
}
```

## Environment Variables Check

Ensure these are set correctly in production:

```bash
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_RJmQXsCWy7gYek"
RAZORPAY_KEY_SECRET="R2QXLpRKVMDDLXLMQyEjjfjA"

# Supabase Configuration (for commission tracking)
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

## Testing Checklist

- [ ] Test referral code validation
- [ ] Test commission calculation with different pass types
- [ ] Test order creation API endpoint
- [ ] Test payment verification flow
- [ ] Check Razorpay dashboard for failed payments
- [ ] Verify webhook URL is accessible
- [ ] Test on live domain (not localhost)

## Next Steps

1. **Check Razorpay Account Status** - Verify KYC and activation
2. **Test API Endpoints** - Use browser dev tools to check network requests
3. **Configure Webhooks** - Add proper webhook URL for live payments
4. **Add Enhanced Logging** - Track payment failures with detailed logs

## Support

If payments still fail after these steps:
1. Check Razorpay dashboard error logs
2. Contact Razorpay support with specific error codes
3. Verify account limits and restrictions