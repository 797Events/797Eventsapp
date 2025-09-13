# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **797events**, a Next.js 14 event management platform built with TypeScript and Tailwind CSS. The project features a dark purple shader background, glassmorphism design elements, and a comprehensive admin dashboard for event management.

## Key Requirements Implemented

- **No Prisma, no external DB** - Uses in-memory data storage
- **Admin credentials**: `the797events@gmail.com` / `Pass@123`
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
- **In-memory data store** (`src/lib/data.ts`) with sample events
- **Simple authentication** (`src/lib/auth.ts`) with localStorage sessions
- **No database** - all data stored in JavaScript objects

### Authentication System
- Simple email/password authentication (no JWT libraries)
- Admin credentials: `the797events@gmail.com` / `Pass@123`
- Session stored in localStorage as base64 encoded JSON
- Session validation with expiry (24 hours)

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
- **Admin Dashboard**: Full CRUD operations for events and pass types
- **Event Management**: Add/edit/delete events with multiple pass types
- **Pass Management**: Different ticket types (Regular, VIP, etc.) with pricing and availability

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
1. Login as admin (`the797events@gmail.com` / `Pass@123`)
2. Access admin dashboard at `/admin`
3. Use the event form to add new events
4. Add multiple pass types with different pricing
5. Events automatically appear on homepage carousel

### Admin Dashboard Features
- **Event Form**: Create/edit events with title, description, date, time, venue, pricing, image URL
- **Pass Management**: Add multiple pass types per event (Regular, VIP, etc.)
- **Event Status**: Toggle active/inactive status
- **Event List**: View all events with edit/delete capabilities

### Authentication Flow
1. User clicks Login in navbar
2. Redirects to `/login` page
3. Admin enters credentials (`the797events@gmail.com` / `Pass@123`)
4. Session stored in localStorage
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
- localStorage for authentication persistence
- In-memory JavaScript objects for data storage

### Event Display Logic
```javascript
// Homepage automatically handles single vs multiple events:
// - 1 event: Shows static EventCard
// - 2+ events: Shows EventCarousel with navigation
```

### Admin Access Control
- Simple session validation using `isValidSession()` function
- Admin dashboard redirects to `/login` if not authenticated
- No complex role management - binary admin/non-admin

## Routes and Navigation

- **`/`** - Homepage with hero section, event carousel, and footer
- **`/login`** - Admin login page (credentials: the797events@gmail.com / Pass@123)
- **`/admin`** - Admin dashboard (protected route)

## Testing and Development

After making changes:
1. `npm run build` - Verify build succeeds
2. `npm run dev` - Test in development
3. Test admin login with correct credentials
4. Verify event creation/editing in admin dashboard
5. Check event display logic (single vs multiple events)

## Common Issues and Solutions

### Build Errors
- Ensure all components use default exports (not named exports)
- Check import statements match export style
- Verify all required dependencies are in package.json

### Authentication Issues
- Admin credentials are case-sensitive
- Clear localStorage if having session issues
- Check browser console for authentication errors

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