# Razorpay Payment Failure Analysis & Fixes

## Issues Found ❌

After analyzing the booking modal and Razorpay configuration, I found several potential causes for payment failures:

### 1. **Phone Number Format Issues**
- **Current validation**: `/^[+]?[\d\s\-\(\)]{10,}$/` (too lenient)
- **Razorpay requirement**: Expects specific Indian phone format
- **Problem**: International formats, spaces, dashes may cause failures

### 2. **Missing Razorpay Key Configuration**
- **Current**: `key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID`
- **Problem**: Direct env variable access in client-side code
- **Risk**: Key might not be properly loaded

### 3. **Incomplete Customer Data**
- **Missing**: Customer address (required for some payment methods)
- **Missing**: Proper phone format validation for Indian numbers
- **Missing**: Error handling for invalid customer data

### 4. **Payment Amount Issues**
- **Risk**: Amount precision (paise vs rupees confusion)
- **Missing**: Proper amount validation before payment

### 5. **Order Creation Missing Details**
- **Missing**: Customer info in order creation
- **Missing**: Notes with booking details
- **Missing**: Proper receipt ID format

## Solutions Implemented ✅

### **1. Enhanced Phone Number Validation**

```typescript
// Updated validation for Indian phone numbers
export function validateIndianPhone(phone: string): ValidationResult {
  // Remove all non-digits
  const digitsOnly = phone.replace(/\D/g, '');

  // Check for valid Indian mobile formats
  const isValid =
    // 10 digit number starting with 6,7,8,9
    (/^[6-9]\d{9}$/.test(digitsOnly)) ||
    // 10 digit with +91 prefix
    (/^91[6-9]\d{9}$/.test(digitsOnly)) ||
    // 11 digit starting with 0
    (/^0[6-9]\d{9}$/.test(digitsOnly));

  return {
    isValid,
    errors: isValid ? [] : ['Please enter a valid Indian mobile number (10 digits)']
  };
}

// Format phone for Razorpay
export function formatPhoneForRazorpay(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
    return digitsOnly.substring(2); // Remove +91
  }
  if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
    return digitsOnly.substring(1); // Remove leading 0
  }
  return digitsOnly.slice(-10); // Take last 10 digits
}
```

### **2. Enhanced Razorpay Configuration**

```typescript
// Improved order creation with customer data
const orderResponse = await fetch('/api/razorpay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: totalAmount,
    currency: 'INR',
    receipt: `797_${event.id}_${Date.now()}`,
    notes: {
      event_id: event.id,
      event_title: event.title,
      customer_name: bookingForm.name,
      customer_email: bookingForm.email,
      customer_phone: formatPhoneForRazorpay(bookingForm.phone),
      pass_type: selectedPass.name,
      quantity: bookingForm.quantity
    }
  }),
});

// Enhanced Razorpay options
const options = {
  key: orderData.key, // Use key from server response
  amount: orderData.amount,
  currency: orderData.currency,
  name: '797 Events',
  description: `${event.title} - ${selectedPass.name} (${bookingForm.quantity} ${bookingForm.quantity === 1 ? 'ticket' : 'tickets'})`,
  order_id: orderData.order_id,
  prefill: {
    name: bookingForm.name.trim(),
    email: bookingForm.email.trim().toLowerCase(),
    contact: formatPhoneForRazorpay(bookingForm.phone),
  },
  theme: {
    color: '#8b5cf6',
    backdrop_color: 'rgba(0, 0, 0, 0.8)'
  },
  modal: {
    backdropclose: false,
    escape: false,
    handleback: false,
    confirm_close: true,
    ondismiss: function() {
      setIsSubmitting(false);
      console.log('Payment cancelled by user');
    }
  },
  retry: {
    enabled: true,
    max_count: 3
  }
};
```

### **3. Server-Side Order Creation Enhancement**

```typescript
// In /api/razorpay/route.ts
const order = await razorpay.orders.create({
  amount: Math.round(body.amount * 100), // Ensure proper conversion
  currency: body.currency || 'INR',
  receipt: body.receipt || `797_${Date.now()}`,
  notes: body.notes || {},
  payment_capture: 1 // Auto capture payments
});

// Return enhanced response
return NextResponse.json({
  success: true,
  order_id: order.id,
  amount: order.amount,
  currency: order.currency,
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID // Send key to client
});
```

### **4. Payment Failure Handling**

```typescript
// Enhanced error handling in payment options
const options = {
  // ... other options
  handler: async function (response) {
    // Existing success handler
  },
  modal: {
    ondismiss: function() {
      setIsSubmitting(false);
      console.log('Payment cancelled or failed');
    }
  }
};

// Add global error handler
window.addEventListener('razorpay_payment_failed', function(e) {
  console.error('Razorpay payment failed:', e.detail);
  setIsSubmitting(false);
  alert('Payment failed. Please try again or contact support.');
});
```

## Common Failure Scenarios & Solutions

### **1. Phone Number Issues**
- ❌ **Problem**: User enters phone with spaces/dashes
- ✅ **Solution**: Auto-format and validate Indian mobile numbers

### **2. Amount Precision Issues**
- ❌ **Problem**: Decimal amounts causing precision errors
- ✅ **Solution**: Proper rounding before converting to paise

### **3. Key Configuration Issues**
- ❌ **Problem**: Environment variables not loaded properly
- ✅ **Solution**: Send key from server response

### **4. Network/Timeout Issues**
- ❌ **Problem**: Slow network causing payment timeouts
- ✅ **Solution**: Retry mechanism and better error handling

### **5. Customer Data Validation**
- ❌ **Problem**: Invalid email/phone causing payment rejection
- ✅ **Solution**: Strict validation before payment initiation

## Testing Checklist

### Before Going Live:
- [ ] Test with valid Indian mobile numbers (10 digits)
- [ ] Test with different phone formats (+91, 0, spaces)
- [ ] Test payment with various amounts (check decimal precision)
- [ ] Test payment cancellation flow
- [ ] Test network timeout scenarios
- [ ] Verify all customer data is properly formatted

### Live Payment Debug Steps:
1. **Check Browser Console** for JavaScript errors
2. **Check Network Tab** for API call failures
3. **Check Razorpay Dashboard** for order creation success
4. **Verify Customer Data** format in Razorpay dashboard
5. **Test Phone Number Format** with Indian mobile numbers

## Quick Diagnostic Commands

```javascript
// In browser console during payment
console.log('Order Data:', orderData);
console.log('Customer Phone:', formatPhoneForRazorpay(bookingForm.phone));
console.log('Razorpay Key:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
```

## Recommendation

**Most Likely Cause**: Phone number format issues with Razorpay's validation.

**Immediate Fix**: Implement the enhanced phone validation and formatting as shown above. This should resolve most live payment failures while maintaining the exact same user experience.