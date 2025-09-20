# 🚀 PRODUCTION DEPLOYMENT GUIDE
## 797Events - Complete Setup Instructions

### 1. SUPABASE CONFIGURATION

#### Step 1: Apply RLS Policies
1. Go to your Supabase Dashboard → SQL Editor
2. Copy and run the entire `supabase-rls-policies.sql` script
3. Verify no errors in execution
4. Test admin operations work properly

#### Step 2: Environment Variables Required
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database URL (for additional operations)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# JWT Configuration
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=https://your-domain.com

# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_live_secret_key

# Application Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. RAZORPAY LIVE CONFIGURATION

#### Step 1: Get Live Keys
1. Login to Razorpay Dashboard
2. Go to Settings → API Keys
3. Generate Live Keys (requires business verification)
4. Replace test keys with live keys

#### Step 2: Webhook Configuration
```bash
# Add to Razorpay Dashboard
Webhook URL: https://your-domain.com/api/razorpay/verify
Events: payment.captured, payment.failed
```

### 3. VERCEL DEPLOYMENT

#### Step 1: Environment Variables in Vercel
```bash
# In Vercel Dashboard → Settings → Environment Variables
# Add all variables from above
# Set Environment: Production
# Apply to: Production deployments
```

#### Step 2: Build Configuration
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 4. DOMAIN CONFIGURATION

#### Step 1: Custom Domain
1. Vercel Dashboard → Settings → Domains
2. Add your domain: `yourdomain.com`
3. Configure DNS records as instructed
4. Enable SSL (automatic)

#### Step 2: Update URLs
Update all hardcoded URLs to your production domain:
- NEXTAUTH_URL
- NEXT_PUBLIC_APP_URL
- Razorpay webhook URLs

### 5. SECURITY CHECKLIST

#### ✅ API Security
- [ ] All API routes have proper error handling
- [ ] Sensitive data not logged in production
- [ ] Rate limiting configured (if needed)
- [ ] CORS properly configured

#### ✅ Database Security
- [ ] RLS policies applied and tested
- [ ] Service role key secured
- [ ] No direct database access from frontend
- [ ] Backup strategy in place

#### ✅ Payment Security
- [ ] Live Razorpay keys configured
- [ ] Webhook signatures verified
- [ ] Payment flows tested thoroughly
- [ ] Error scenarios handled

### 6. TESTING CHECKLIST

#### ✅ Core Features
- [ ] Homepage loads with events
- [ ] Booking modal works end-to-end
- [ ] Payment processing completes
- [ ] Tickets generate properly
- [ ] Admin panel fully functional

#### ✅ User Flows
- [ ] Guest booking (no account)
- [ ] Admin login and management
- [ ] Event creation/editing/deletion
- [ ] User management
- [ ] QR code scanning (guard dashboard)

#### ✅ Edge Cases
- [ ] Network failures handled gracefully
- [ ] Invalid payment scenarios
- [ ] Large file uploads (student IDs)
- [ ] High traffic scenarios

### 7. DEPLOYMENT STEPS

#### Step 1: Pre-deployment
```bash
# 1. Build locally to verify
npm run build

# 2. Test critical paths
npm run dev
# Test admin panel, booking flow, payments

# 3. Run lint check
npm run lint
```

#### Step 2: Deploy to Vercel
```bash
# Method 1: Via GitHub
1. Push to main branch
2. Vercel auto-deploys

# Method 2: Direct deploy
npx vercel --prod
```

#### Step 3: Post-deployment Verification
1. Test live URL loads properly
2. Verify all environment variables work
3. Test payment with small amount
4. Check admin functionality
5. Monitor error logs

### 8. MONITORING & MAINTENANCE

#### Performance Monitoring
- Vercel Analytics dashboard
- Core Web Vitals tracking
- API response times

#### Error Monitoring
- Vercel Function logs
- Supabase logs
- Razorpay dashboard

#### Regular Maintenance
- Database cleanup (old bookings)
- Log rotation
- Security updates

### 9. ROLLBACK PLAN

#### If Issues Occur:
1. **Immediate**: Revert to previous Vercel deployment
2. **Database**: Disable RLS if needed (emergency only)
3. **Payments**: Switch back to test mode temporarily
4. **Domain**: Redirect to maintenance page

### 10. SUPPORT CONTACTS

#### Services
- **Vercel**: support@vercel.com
- **Supabase**: support@supabase.com
- **Razorpay**: support@razorpay.com

#### Emergency Procedures
1. Check Vercel deployment logs
2. Check Supabase database logs
3. Check Razorpay transaction logs
4. Rollback if critical functionality broken

---

**⚠️ CRITICAL: Test everything in a staging environment first!**

**🎯 GOAL: Zero downtime, all features working perfectly**