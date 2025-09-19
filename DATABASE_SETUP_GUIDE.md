# 🐘 797EVENTS DATABASE SETUP GUIDE

## 🎯 QUICK SETUP STEPS

### STEP 1: Add Neon to Vercel (Recommended)

1. **Go to Vercel Dashboard**
   - Visit your project at vercel.com/atharva/797events
   - Click "Storage" or "Integrations" tab

2. **Install Neon Integration**
   - Find "Neon - Serverless Postgres" in marketplace
   - Click "Add Integration" 
   - Select your 797events project
   - Configure:
     - Database Name: `797events-production`
     - Region: Choose closest to your users

3. **Copy Connection String**
   - After setup, copy the `DATABASE_URL` provided by Neon
   - Format: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/797events?sslmode=require`

### STEP 2: Update Environment Variables

1. **Update your `.env.local`**:
   ```env
   DATABASE_URL="postgresql://your_actual_connection_string_from_neon"
   ```

2. **Also add to Vercel Environment Variables**:
   - In Vercel project dashboard → Settings → Environment Variables
   - Add: `DATABASE_URL` with your Neon connection string

### STEP 3: Initialize Database Tables

Once DATABASE_URL is configured, initialize your database:

**Option A: API Call (Recommended)**
```bash
curl -X POST http://localhost:3002/api/init-database \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "init-797events-db"}'
```

**Option B: First API Request**
- Just visit http://localhost:3002/api/events
- Tables will auto-create on first database connection

### STEP 4: Test Database Connection

Test these endpoints to verify everything works:

```bash
# Check events API
curl http://localhost:3002/api/events

# Check admin dashboard data
curl http://localhost:3002/api/admin/dashboard
```

## 🚀 WHAT GETS CREATED

### Database Tables:
1. **`events`** - Your event data (title, description, date, venue, etc.)
2. **`pass_types`** - Ticket types for each event (Regular, VIP, etc.)
3. **`bookings`** - Customer bookings and payment info
4. **`attendance`** - QR scan attendance tracking

### Ready-to-Use Features:
- ✅ Event management (CRUD operations)
- ✅ Multi-pass ticket system
- ✅ Razorpay payment integration
- ✅ PDF ticket generation with QR codes
- ✅ Email ticket delivery
- ✅ QR scanner for event entry
- ✅ Admin dashboard with real analytics

## 🔧 TROUBLESHOOTING

### Database Connection Issues:
1. Verify `DATABASE_URL` is correct in `.env.local`
2. Check Neon database is running (check Neon dashboard)
3. Ensure your IP is allowed (Neon allows all by default)
4. Test connection with: `curl http://localhost:3002/api/init-database`

### Common Errors:
- **"no pg_hba.conf entry"**: Database auth issue - check credentials
- **"connection timeout"**: Network/firewall issue - check connection string
- **"database does not exist"**: Database not created - check Neon setup
- **"permission denied"**: User permissions - check database user has CREATE privileges

### Environment Variables Priority:
1. `DATABASE_URL` (Neon format) - Used first
2. `POSTGRES_URL` (Vercel format) - Fallback

## 📞 READY TO TEST

Once setup is complete, your 797events platform will have:
- Real PostgreSQL database instead of localStorage
- Working payment system with ticket generation
- QR scanner for event entry
- Admin dashboard with real analytics
- Automated email ticket delivery

Visit these pages to test:
- http://localhost:3002 (homepage with real events)
- http://localhost:3002/admin (admin dashboard)  
- http://localhost:3002/scanner (QR scanner)

## 🎉 DEPLOYMENT READY

After local testing works:
1. Deploy to Vercel (auto-uses same DATABASE_URL)
2. Set up Razorpay production credentials
3. Configure Gmail for email delivery
4. Your full booking system is live!