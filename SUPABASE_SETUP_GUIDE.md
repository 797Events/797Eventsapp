# 🟢 797EVENTS SUPABASE SETUP GUIDE

## 🎯 SUPABASE ADVANTAGES FOR 797EVENTS

- ✅ **PostgreSQL backend** with real-time capabilities
- ✅ **Built-in authentication** (future expansion)
- ✅ **File storage** for event images
- ✅ **Database dashboard** for easy management
- ✅ **Generous free tier** (500MB DB, 1GB bandwidth)
- ✅ **Auto-scaling** and backups

## 📋 SETUP STEPS

### STEP 1: Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)**
2. **Sign up/Login** with your account
3. **Create New Project**:
   - Project name: `797events-production`
   - Database password: Generate strong password (save it!)
   - Region: Choose closest to your users
   - Plan: Start with Free tier

### STEP 2: Get Connection Details

After project creation, go to **Settings → Database**:

**Connection String (for DATABASE_URL):**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**API Settings (Settings → API):**
- **Project URL**: `https://[PROJECT-REF].supabase.co`
- **Anon key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (public)
- **Service role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (secret!)

### STEP 3: Update Environment Variables

Update your `.env.local` file:

```env
# Database Configuration - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your_actual_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_actual_service_role_key"
```

**Replace placeholders with your actual values from Supabase dashboard!**

### STEP 4: Initialize Database Tables

Once environment variables are set:

**Option A: API Call**
```bash
curl -X POST http://localhost:3002/api/init-database \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "init-797events-db"}'
```

**Option B: Automatic (Recommended)**
- Just visit: `http://localhost:3002/api/events`
- Tables will auto-create on first database connection

### STEP 5: Verify Setup

Test these endpoints:
```bash
# Check database connection
curl http://localhost:3002/api/events

# Test admin dashboard
curl http://localhost:3002/api/admin/dashboard

# Initialize if needed
curl -X POST http://localhost:3002/api/init-database \
  -H "Content-Type: application/json" \
  -d '{"adminKey": "init-797events-db"}'
```

## 🗄️ DATABASE STRUCTURE

### Tables Created:
1. **`events`** - Event management
   - id, event_id, title, description, date, time, venue, price, image, is_active
2. **`pass_types`** - Ticket types per event
   - id, pass_id, event_id, name, price, available
3. **`bookings`** - Customer bookings
   - id, booking_id, event_id, pass_id, name, email, phone, quantity, total_amount, payment_status, qr_code, attendance_status
4. **`attendance`** - Entry tracking
   - id, booking_id, scanned_at, scanned_by

### Indexes & Relationships:
- Foreign keys between tables
- Indexes on frequently queried fields
- Proper data types for optimal performance

## 🚀 FEATURES ENABLED

With Supabase connected, your 797events platform gets:

### ✅ **Core Features:**
- **Real PostgreSQL database** instead of localStorage
- **Event management** with full CRUD operations
- **Multi-pass ticket system** per event
- **Booking and payment tracking**
- **QR code generation** and scanning
- **Admin dashboard** with real analytics

### ✅ **Bonus Features:**
- **Database dashboard** at supabase.com/dashboard
- **Real-time updates** (future enhancement)
- **File storage** for event images (future)
- **Built-in auth system** (if needed later)

## 🔧 SUPABASE DASHBOARD FEATURES

### Database Tab:
- **Table Editor** - View/edit data directly
- **SQL Editor** - Run custom queries
- **Database** - Schema and relationships

### Storage Tab:
- **File uploads** for event images
- **CDN delivery** for fast image loading

### Auth Tab:
- **User management** (if you add user accounts later)
- **Social logins** (Google, GitHub, etc.)

## 🧪 TESTING CHECKLIST

### Local Testing:
- [ ] Environment variables set correctly
- [ ] Database connection successful (`/api/events`)
- [ ] Tables created (`/api/init-database`)
- [ ] Events API working (`GET /api/events`)
- [ ] Admin dashboard loading (`/api/admin/dashboard`)

### Supabase Dashboard:
- [ ] Tables visible in Database tab
- [ ] Data shows up when events are created
- [ ] No connection errors in logs

### Production Ready:
- [ ] Environment variables added to Vercel
- [ ] Database accessible from deployed app
- [ ] All API endpoints working on live site

## 🔒 SECURITY BEST PRACTICES

### Environment Variables:
- **Never commit** `.env.local` to git
- **Use Service Role Key** for server-side operations
- **Use Anon Key** only for client-side (if needed)

### Database Security:
- **Row Level Security** (RLS) available in Supabase
- **API rate limiting** built-in
- **SSL connections** enforced

## 🚀 DEPLOYMENT

### For Vercel Deployment:
1. **Add Environment Variables** in Vercel dashboard:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Deploy normally** - Supabase works seamlessly with Vercel

3. **Test production** - All endpoints should work the same

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues:
- **Connection timeout**: Check DATABASE_URL format
- **Authentication failed**: Verify password in connection string
- **Tables not found**: Run `/api/init-database` first
- **Environment variables**: Ensure no extra spaces/quotes

### Supabase Support:
- **Documentation**: supabase.com/docs
- **Discord**: supabase.com/discord
- **Dashboard**: Monitor logs and usage

Your 797events platform is now ready for production with enterprise-grade PostgreSQL backend! 🎉