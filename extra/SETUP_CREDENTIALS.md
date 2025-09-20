# 🔑 Live Credentials Setup

## Step 1: Update .env.local with Real Credentials

```bash
# Replace these with your actual credentials:

# Razorpay (Get from: https://dashboard.razorpay.com/app/keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_your_actual_key_here"
RAZORPAY_KEY_SECRET="your_actual_secret_here"

# Gmail App Password (Get from: https://myaccount.google.com/apppasswords)
SMTP_PASS="xxxx xxxx xxxx xxxx"  # 16-character app password

# Keep these as-is (already working):
DATABASE_URL="postgresql://postgres:rriwCzn9ZxVfTDFG@db.cyodwzpxakgispxayinf.supabase.co:5432/postgres"
SUPABASE_URL="https://cyodwzpxakgispxayinf.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5b2R3enB4YWtnaXNweGF5aW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MDAxNTcsImV4cCI6MjA3MzM3NjE1N30.NnTqIWE60ab3uCIVD4HDvW_AjnlqpALtnhio-7yp5gg"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_8aWGIO0RFzo8nm1vZo8svw_ARcXn5IM"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="the797events@gmail.com"
QR_SECRET_KEY="797events-ultra-secure-key-2025"
ADMIN_PASSWORD="Pass@123"
NEXTAUTH_SECRET="your_nextauth_secret"
```

## Step 2: Test Everything Works

```bash
# Start the app
npm run dev

# Test email service
curl -X POST http://localhost:3000/api/test/ticket-system \
  -H "Content-Type: application/json" \
  -d '{"testEmail": "your-email@gmail.com", "testType": "complete"}'

# Test payment creation
curl -X POST http://localhost:3000/api/razorpay \
  -H "Content-Type: application/json" \
  -d '{"amount": 1500, "receipt": "test123"}'
```

## Step 3: Deploy to Production

```bash
# Build for production
npm run build

# Deploy to Vercel
npx vercel --prod

# Add environment variables in Vercel dashboard
```

## ⚠️ Security Notes:
- Never commit .env.local to git
- Use different keys for test/production
- Keep app passwords secure
- Regenerate keys if compromised

## 🎯 Expected Results:
- ✅ Real payments processed via Razorpay
- ✅ PDF tickets emailed automatically
- ✅ QR codes work with scanner
- ✅ Admin dashboard shows live data