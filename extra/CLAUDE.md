# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **797events**, a Next.js 14 event management platform built with TypeScript and Tailwind CSS. The project features a dark purple shader background, glassmorphism design elements, and a comprehensive admin dashboard for event management.

## Key Requirements Implemented

- **Supabase Database** - Uses Supabase for data storage and authentication
- **Admin credentials**: Managed through Supabase Auth
- **Event cards**: Banner on top, info below, price + booking at bottom
- **Carousel logic**: Single card static display, multiple cards in carousel
- **Glassmorphism navbar**: Rounded ends, sticky on scroll
- **Footer design**: Office details (left), social buttons (center), 797 logo (right)
- **Dark purple shader background** with grainy overlay
- **Routes**: `/` (home), `/login` (admin), `/admin` (dashboard)

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture Overview

### Next.js App Router Structure
- `src/app/` - Next.js 14 App Router pages and layouts
- `src/app/page.tsx` - Homepage with hero section, event carousel, and footer
- `src/app/login/page.tsx` - Admin login page
- `src/app/admin/page.tsx` - Admin dashboard for event management
- `src/components/` - React components (mix of custom and CodePen-derived)
- `src/lib/` - Utilities for data management and authentication

### Data Architecture
- **Supabase Database** (`src/lib/supabase.ts`) with PostgreSQL backend
- **Supabase Authentication** with role-based access control
- **Database tables**: events, passes, bookings, users

### Authentication System
- Supabase Auth with email/password authentication
- Role-based access control through database
- Secure session management via Supabase
- Admin users managed in database

### Component Architecture

#### Core Components
- **ShaderBackground** - Three.js dark purple shader background
- **GrainyOverlay** - Matte finish overlay on background
- **Navbar** - Glassmorphism navbar with Book Now (left) and Login (right)
- **EventCard** - Event display cards with banner, info, and booking button
- **EventCarousel** - Smart carousel (static for 1 event, carousel for multiple)
- **BookingModal** - Event booking form with pass selection
- **Footer** - Office details, social links, and 797 logo
- **Button** - Universal button component with hover effects

#### Key Features
- **Single/Multiple Event Logic**: Automatically shows static card for 1 event, carousel for multiple
- **Admin Dashboard**: Simplified dashboard with Overview, Events, and Users management
- **Event Management**: Add/edit/delete events with database persistence
- **User Management**: Role-based user administration

### Event Data Structure
```typescript
interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  price: number; // Base price
  image: string;
  isActive: boolean;
  passes: PassType[]; // Multiple pass types per event
}

interface PassType {
  id: string;
  name: string;
  price: number;
  available: number;
}
```

## Development Workflow

### Adding New Events
1. Login as admin via Supabase Auth
2. Access admin dashboard at `/admin`
3. Use the event management tab to add new events
4. Events are stored in Supabase database
5. Events automatically appear on homepage when active

### Admin Dashboard Features
- **Overview Tab**: System analytics and overview
- **Event Management**: Create/edit/delete events with database persistence
- **User Management**: Manage user accounts and roles

### Authentication Flow
1. User clicks Login in navbar
2. Redirects to `/login` page
3. Admin enters Supabase credentials
4. Supabase manages secure session
5. Redirects to `/admin` dashboard
6. Navbar shows admin user info and sign out option

## Important Implementation Details

### Component Styling
- All components use default exports (not named exports)
- Tailwind CSS for styling with custom glassmorphism effects
- Dark purple theme: text is white (#FFFFFF) on dark backgrounds
- Consistent rounded corners and hover glow effects

### State Management
- No external state management library
- React useState and useEffect for local state
- Supabase for authentication persistence
- Database for data storage

### Event Display Logic
```javascript
// Homepage automatically handles single vs multiple events:
// - 1 event: Shows static EventCard
// - 2+ events: Shows EventCarousel with navigation
```

### Admin Access Control
- Supabase authentication with role validation
- Admin dashboard redirects to `/login` if not authenticated
- Role-based access control through database

## Routes and Navigation

- **`/`** - Homepage with hero section, event carousel, and footer
- **`/login`** - Admin login page (Supabase authentication)
- **`/admin`** - Admin dashboard (protected route)

## Testing and Development

After making changes:
1. `npm run build` - Verify build succeeds
2. `npm run dev` - Test in development
3. Test admin login with Supabase authentication
4. Verify event creation/editing in admin dashboard
5. Check event display logic (single vs multiple events)

## Common Issues and Solutions

### Build Errors
- Ensure all components use default exports (not named exports)
- Check import statements match export style
- Verify all required dependencies are in package.json

### Authentication Issues
- Ensure Supabase environment variables are set
- Check Supabase project configuration
- Verify user exists in Supabase auth and has admin role in database

### Event Display Issues
- Events must have `isActive: true` to display on homepage
- Verify events have proper pass types configured
- Check event image URLs are valid

## Design Guidelines

- **Background**: Dark purple shader with grainy overlay throughout
- **Text**: All text should be white (#FFFFFF) 
- **Buttons**: Glassmorphism effect with hover glow
- **Cards**: Glassmorphism with backdrop blur
- **Navbar**: Full-width glassmorphism, sticky on scroll
- **Footer**: Three-column layout as specified in requirements