# 797EVENTS VERCEL DATABASE SETUP

## 🎯 CURRENT STATUS
✅ Backend code ready
✅ API endpoints created  
✅ Database schema prepared
⏳ Need to set up Vercel PostgreSQL database

## 📋 SETUP STEPS

### 1. GO TO VERCEL DASHBOARD
- Visit: https://vercel.com
- Login to your account
- **IMPORTANT**: Switch to "797events" organization (top-left dropdown)

### 2. CREATE/IMPORT PROJECT
- Click "New Project" 
- Import from Git or upload project folder
- **Verify**: Project owner shows as "797events"

### 3. ADD POSTGRESQL DATABASE
- In project dashboard → "Storage" tab
- Click "Create Database" → Select "Postgres"
- Database name: `797events-production`
- Region: Choose closest to your users
- Plan: Hobby (Free)

### 4. COPY DATABASE CREDENTIALS
After database creation, copy these environment variables:

```env
POSTGRES_URL="postgres://default:XXXXX@ep-XXX.us-east-1.aws.neon.tech:5432/verceldb"
POSTGRES_PRISMA_URL="postgres://default:XXXXX@ep-XXX.us-east-1.aws.neon.tech:5432/verceldb?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgres://default:XXXXX@ep-XXX.us-east-1.aws.neon.tech:5432/verceldb"
```

### 5. UPDATE .env.local
Replace the placeholder values in your `.env.local` file with the real credentials from step 4.

### 6. TEST DATABASE CONNECTION
Once credentials are updated, your app will automatically connect to PostgreSQL and create tables on first API call.

## 🚀 WHAT HAPPENS NEXT

1. **Database auto-initializes** when first API endpoint is called
2. **Tables created automatically** (events, bookings, attendance, pass_types)
3. **Your existing frontend** will seamlessly use real database instead of localStorage
4. **Admin dashboard** gets real analytics data
5. **Booking system** starts working with real payments

## 🔧 TESTING

After setup, test these URLs:
- http://localhost:3002/api/events (should show database connection)
- http://localhost:3002/scanner (QR scanner page)
- http://localhost:3002/admin (admin dashboard with real data)

## 📞 SUPPORT

If you encounter issues:
1. Check environment variables are correctly copied
2. Verify 797events organization is selected in Vercel
3. Ensure database is created in correct region
4. Check console for any connection errors