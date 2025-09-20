export interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  venueIcon: string; // Icon for the venue (emoji or icon class)
  price: number;
  image: string;
  isActive: boolean;
  passes: PassType[];
  isMultiDay?: boolean; // New field for multi-day events
  eventDays?: EventDay[]; // New field for multi-day event details
}

export interface PassType {
  id: string;
  name: string;
  price: number;
  available: number;
  dayId?: string; // Optional: which day this pass is for (for multi-day events)
}

export interface EventDay {
  id: string;
  dayNumber: number; // Day 1, Day 2, etc.
  title: string; // e.g., "Opening Ceremony", "Main Event"
  date: string;
  time: string;
  venue?: string; // Can be different venue for each day
  venueIcon?: string;
  description?: string;
  passes: PassType[]; // Passes specific to this day
}

// API base URL - use relative URLs in browser, absolute in server
const API_BASE = typeof window !== 'undefined'
  ? '' // Use relative URLs in browser
  : 'http://localhost:3003';

// API helper functions
async function apiRequest(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Storage keys for localStorage
const STORAGE_KEYS = {
  EVENTS: 'events_store_797',
  PROMO_CODES: 'promo_codes_store_797',
  BOOKINGS: 'bookings_store_797',
  SALES_ANALYTICS: 'sales_analytics_store_797'
};

// Helper functions for localStorage persistence
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Error loading from localStorage key ${key}:`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage key ${key}:`, error);
  }
}

// Default events data - empty for production deployment
// Events will be created through the admin panel
const defaultEvents: EventData[] = [];

// Load events from localStorage or use default
let eventsStore: EventData[] = loadFromStorage(STORAGE_KEYS.EVENTS, defaultEvents);

// Frontend function that fetches from API
export async function getEvents(): Promise<EventData[]> {
  console.log('getEvents: Fetching active events from API');
  try {
    const response = await fetch('/api/admin/events');
    if (!response.ok) {
      throw new Error('Failed to fetch events from API');
    }
    const data = await response.json();
    const events = data.events || [];

    // Transform API response to match frontend interface
    const transformedEvents: EventData[] = events.map((event: any) => ({
      id: event.id.toString(),
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      venue: event.venue,
      venueIcon: event.venueIcon || '📍',
      price: event.price,
      image: event.image,
      isActive: event.isActive,
      passes: event.passes || [],
      isMultiDay: event.isMultiDay || false,
      eventDays: event.eventDays || []
    }));

    console.log('getEvents: Active events found from API:', transformedEvents.length);
    return transformedEvents;
  } catch (error) {
    console.error('getEvents: Error fetching from API, falling back to localStorage:', error);
    // Fallback to localStorage for error handling
    const activeEvents = eventsStore.filter(event => event.isActive);
    console.log('getEvents: Fallback active events found:', activeEvents.length);
    return activeEvents;
  }
}

export async function getAllEvents(): Promise<EventData[]> {
  console.log('getAllEvents: Fetching all events from API');
  try {
    const response = await fetch('/api/admin/events');
    if (!response.ok) {
      throw new Error('Failed to fetch events from API');
    }
    const data = await response.json();
    const events = data.events || [];

    // Transform API response to match frontend interface
    const transformedEvents: EventData[] = events.map((event: any) => ({
      id: event.id.toString(),
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      venue: event.venue,
      venueIcon: event.venueIcon || '📍',
      price: event.price,
      image: event.image,
      isActive: event.isActive,
      passes: event.passes || [],
      isMultiDay: event.isMultiDay || false,
      eventDays: event.eventDays || []
    }));

    console.log('getAllEvents: Total events found from API:', transformedEvents.length);
    return transformedEvents;
  } catch (error) {
    console.error('getAllEvents: Error fetching from API, falling back to localStorage:', error);
    // Fallback to localStorage for error handling
    console.log('getAllEvents: Fallback total events found:', eventsStore.length);
    return [...eventsStore];
  }
}

export async function getEventById(id: string): Promise<EventData | undefined> {
  console.log('getEventById: Finding event in memory store:', id);
  return Promise.resolve(eventsStore.find(event => event.id === id));
}

export async function addEvent(event: Omit<EventData, 'id'>): Promise<EventData> {
  console.log('addEvent: Creating new event in memory store');
  const newEvent: EventData = {
    ...event,
    id: Date.now().toString(), // Simple ID generation
  };

  eventsStore.push(newEvent);
  saveToStorage(STORAGE_KEYS.EVENTS, eventsStore); // Persist to localStorage
  console.log('addEvent: Event created successfully:', newEvent.id);

  // Trigger events-updated event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('events-updated'));
  }

  return Promise.resolve(newEvent);
}

export async function updateEvent(id: string, updates: Partial<EventData>): Promise<EventData | null> {
  console.log('updateEvent: Updating event in memory store:', id);
  const eventIndex = eventsStore.findIndex(event => event.id === id);

  if (eventIndex === -1) {
    console.log('updateEvent: Event not found:', id);
    return Promise.resolve(null);
  }

  // Update the event
  eventsStore[eventIndex] = { ...eventsStore[eventIndex], ...updates };
  saveToStorage(STORAGE_KEYS.EVENTS, eventsStore); // Persist to localStorage
  console.log('updateEvent: Event updated successfully:', id);

  // Trigger events-updated event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('events-updated'));
  }

  return Promise.resolve(eventsStore[eventIndex]);
}

export async function deleteEvent(id: string): Promise<boolean> {
  console.log('deleteEvent: Deleting event from memory store:', id);
  const eventIndex = eventsStore.findIndex(event => event.id === id);

  if (eventIndex === -1) {
    console.log('deleteEvent: Event not found:', id);
    return Promise.resolve(false);
  }

  eventsStore.splice(eventIndex, 1);
  saveToStorage(STORAGE_KEYS.EVENTS, eventsStore); // Persist to localStorage
  console.log('deleteEvent: Event deleted successfully:', id);

  // Trigger events-updated event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('events-updated'));
  }

  return Promise.resolve(true);
}

export async function cloneEvent(id: string): Promise<EventData | null> {
  console.log('cloneEvent: Cloning event:', id);
  const originalEvent = await getEventById(id);
  if (!originalEvent) {
    console.log('cloneEvent: Event not found for cloning:', id);
    return Promise.resolve(null);
  }

  // Create a clone with updated title
  const clonedEvent: Omit<EventData, 'id'> = {
    ...originalEvent,
    title: `${originalEvent.title} (Copy)`,
    passes: originalEvent.passes.map(pass => ({
      ...pass,
      id: `pass_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }))
  };

  const newEvent = await addEvent(clonedEvent);
  console.log('cloneEvent: Event cloned successfully:', newEvent.id);
  return Promise.resolve(newEvent);
}


// Analytics and Booking Interfaces
export interface BookingData {
  id: string;
  eventId: string;
  eventTitle: string;
  passId: string;
  passName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string; // ISO string

  // Referral and commission tracking
  referralCode?: string;        // Code used for discount
  influencerId?: string;        // Influencer who gets commission
  discountAmount?: number;      // Amount discounted (10% of original)
  originalAmount?: number;      // Price before discount
  commissionAmount?: number;    // Commission for influencer (10% of original)
  isInfluencerReferral?: boolean; // True if influencer code, false if admin promo
}

export interface SalesData {
  date: string;
  tickets: number;
  revenue: number;
}

export interface EventAnalytics {
  eventId: string;
  eventName: string;
  totalTickets: number;
  ticketsSold: number;
  revenue: number;
  ticketTypes: {
    type: string;
    sold: number;
    revenue: number;
  }[];
}

// Analytics functions now use Supabase APIs via admin endpoints
// Legacy localStorage storage removed for production readiness

// Legacy analytics functions removed - now using Supabase-based analytics via API endpoints

// Promo Code Management
export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // percentage (1-100) or fixed amount
  minimumAmount?: number; // minimum order amount
  maxUsage?: number; // maximum number of uses (undefined for unlimited)
  currentUsage: number; // current number of uses
  validFrom: string; // ISO date string
  validUntil: string; // ISO date string
  isActive: boolean;
  createdBy: string; // admin email
  createdAt: string; // ISO date string
  applicableEvents?: string[]; // event IDs (empty array means all events)
}

// In-memory promo codes storage with localStorage persistence
// Promo codes will be created through the admin panel
let promoCodesStore: PromoCode[] = loadFromStorage(STORAGE_KEYS.PROMO_CODES, []);

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  try {
    const response = await fetch('/api/admin/promo-codes');
    if (!response.ok) throw new Error('Failed to fetch promo codes');

    const data = await response.json();
    return data.promoCodes || [];
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return [];
  }
}

export async function getActivePromoCodes(): Promise<PromoCode[]> {
  try {
    const response = await fetch('/api/admin/promo-codes?active=true');
    if (!response.ok) throw new Error('Failed to fetch active promo codes');

    const data = await response.json();
    return data.promoCodes || [];
  } catch (error) {
    console.error('Error fetching active promo codes:', error);
    return [];
  }
}

export async function createPromoCode(promoData: Omit<PromoCode, 'id' | 'currentUsage' | 'createdAt'>): Promise<PromoCode> {
  const newPromo: PromoCode = {
    ...promoData,
    id: Date.now().toString(),
    currentUsage: 0,
    createdAt: new Date().toISOString()
  };

  promoCodesStore.push(newPromo);
  saveToStorage(STORAGE_KEYS.PROMO_CODES, promoCodesStore);

  // Trigger promo codes update event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('promo-codes-updated'));
  }

  return Promise.resolve(newPromo);
}

export async function updatePromoCode(id: string, updates: Partial<PromoCode>): Promise<PromoCode | null> {
  const promoIndex = promoCodesStore.findIndex(promo => promo.id === id);

  if (promoIndex === -1) {
    return Promise.resolve(null);
  }

  promoCodesStore[promoIndex] = { ...promoCodesStore[promoIndex], ...updates };
  saveToStorage(STORAGE_KEYS.PROMO_CODES, promoCodesStore);

  // Trigger promo codes update event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('promo-codes-updated'));
  }

  return Promise.resolve(promoCodesStore[promoIndex]);
}

export async function deletePromoCode(id: string): Promise<boolean> {
  const promoIndex = promoCodesStore.findIndex(promo => promo.id === id);

  if (promoIndex === -1) {
    return Promise.resolve(false);
  }

  promoCodesStore.splice(promoIndex, 1);
  saveToStorage(STORAGE_KEYS.PROMO_CODES, promoCodesStore);

  // Trigger promo codes update event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('promo-codes-updated'));
  }

  return Promise.resolve(true);
}

export async function validatePromoCode(code: string, eventId: string, orderAmount: number): Promise<{
  isValid: boolean;
  promo?: PromoCode;
  discountAmount?: number;
  error?: string;
}> {
  try {
    const response = await fetch('/api/validate-promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, eventId, orderAmount })
    });

    const data = await response.json();

    if (!response.ok) {
      return { isValid: false, error: data.error || 'Validation failed' };
    }

    if (data.isValid) {
      // Transform API response to match frontend interface
      const promo: PromoCode = {
        id: data.promo.id,
        code: data.promo.code,
        description: data.promo.description || 'Discount code',
        discountType: data.promo.discountType,
        discountValue: data.promo.discountValue,
        minimumAmount: data.promo.minimumAmount,
        maxUsage: data.promo.maxUsage,
        currentUsage: data.promo.currentUsage,
        validFrom: data.promo.validFrom,
        validUntil: data.promo.validUntil,
        applicableEvents: [],
        isActive: true,
        createdBy: data.promo.createdBy || 'admin',
        createdAt: data.promo.createdAt || new Date().toISOString()
      };

      return {
        isValid: true,
        promo,
        discountAmount: data.discountAmount
      };
    }

    return { isValid: false, error: data.error };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return { isValid: false, error: 'Validation failed' };
  }
}

export async function incrementPromoCodeUsage(id: string): Promise<boolean> {
  try {
    const response = await fetch('/api/validate-promo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promoCodeId: id })
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error incrementing promo code usage:', error);
    return false;
  }
}

// Combined referral validation (for both influencer codes and admin promo codes)
export async function validateReferralCode(code: string, eventId?: string, orderAmount?: number): Promise<{
  isValid: boolean;
  isInfluencerCode?: boolean;
  influencer?: any; // From userManagement
  discountPercentage?: number;
  promo?: PromoCode;
  discountAmount?: number;
  error?: string;
}> {
  // First, check if it's an admin promo code
  if (eventId && orderAmount !== undefined) {
    const promoValidation = await validatePromoCode(code, eventId, orderAmount);
    if (promoValidation.isValid) {
      return {
        isValid: true,
        isInfluencerCode: false,
        promo: promoValidation.promo,
        discountAmount: promoValidation.discountAmount
      };
    }
  }

  // Check if it's an influencer referral code
  try {
    // Import userManager dynamically to avoid circular dependencies
    const { userManager } = await import('@/lib/userManagement');
    const allUsers = await userManager.getUsers();
    const influencers = allUsers.filter(user => user.role === 'influencer' && user.is_active);

    // Look for an influencer with this promo code
    const influencer = influencers.find(inf =>
      inf.id.slice(-4) === code.toUpperCase().slice(-4) ||
      `PROMO${inf.id.slice(-4)}` === code.toUpperCase()
    );

    if (influencer) {
      // ✅ FIXED: Influencer codes should NOT give customer discounts
      // Influencers earn commission, customers pay full price
      const discountPercentage = 0; // No discount for customers
      const discountAmount = 0; // No discount for customers
      const commissionRate = 10; // 10% commission for influencer

      return {
        isValid: true,
        isInfluencerCode: true,
        influencer: {
          id: influencer.id,
          name: influencer.full_name,
          commissionRate: commissionRate
        },
        discountPercentage,
        discountAmount
      };
    }
  } catch (error) {
    console.error('Error checking influencer codes:', error);
  }

  return {
    isValid: false,
    error: 'Invalid referral code'
  };
}

// Utility functions for commission and discount calculations
export function calculateDiscount(amount: number, discountPercentage: number): { discountAmount: number; finalAmount: number } {
  const discountAmount = Math.round((amount * discountPercentage) / 100);
  const finalAmount = amount - discountAmount;
  return { discountAmount, finalAmount };
}

export function calculateCommission(originalAmount: number, commissionRate: number): number {
  return Math.round((originalAmount * commissionRate) / 100);
}

// Update influencer earnings in the userManagement system
export async function updateInfluencerEarnings(influencerId: string, commission: number, ticketsSold: number): Promise<void> {
  try {
    // Import userManager dynamically to avoid circular dependencies
    const { userManager } = await import('@/lib/userManagement');
    const user = await userManager.getUserById(influencerId);

    if (user && user.role === 'influencer') {
      const currentData = {
        commissionRate: 10,
        totalSales: 0,
        totalRevenue: 0
      };

      // Update the influencer's earnings
      const updatedInfluencerData = {
        ...currentData,
        totalSales: currentData.totalSales + ticketsSold,
        totalRevenue: currentData.totalRevenue + commission
      };

      // Update would need to be implemented with proper influencer data storage

      console.log(`Updated influencer ${influencerId} earnings: +₹${commission}, tickets: +${ticketsSold}`);
    }
  } catch (error) {
    console.error('Error updating influencer earnings:', error);
  }
}

// Enhanced referral tracking for individual influencers
export async function trackReferralUsage(data: {
  influencerId: string;
  bookingId: string;
  eventId: string;
  eventTitle: string;
  customerName: string;
  customerEmail: string;
  referralCode: string;
  ticketQuantity: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  commissionAmount: number;
  passType: string;
}): Promise<void> {
  try {
    // Import both systems
    const { userManager } = await import('@/lib/userManagement');
    const { referralTracker } = await import('@/lib/referralTracking');

    const influencer = await userManager.getUserById(data.influencerId);

    if (influencer && influencer.role === 'influencer') {
      // Record in detailed referral tracking system
      await referralTracker.trackReferral(
        data.referralCode,
        data.bookingId,
        data.discountAmount
      );
      console.log('Referral tracked:', {
        influencerId: data.influencerId,
        influencerName: influencer.full_name,
        referralCode: data.referralCode,
        bookingId: data.bookingId,
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        ticketQuantity: data.ticketQuantity,
        originalAmount: data.originalAmount,
        discountAmount: data.discountAmount,
        finalAmount: data.finalAmount,
        commissionAmount: data.commissionAmount,
        commissionRate: 10,
        passType: data.passType,
        bookingDate: new Date().toISOString().split('T')[0]
      });

      // Also update the user management system
      await updateInfluencerEarnings(data.influencerId, data.commissionAmount, data.ticketQuantity);

      console.log(`✅ Referral usage tracked for influencer ${influencer.full_name}`);
    }
  } catch (error) {
    console.error('Error tracking referral usage:', error);
  }
}

// Legacy functions removed - now using Supabase-based analytics via API endpoints
// getDashboardKPIs, getBookingsByEventArchival are now handled by /api/admin/analytics

// Calculate trend helper function - can accept array or two numbers
export function calculateTrend(data: number[] | number, previous?: number): { value: number; isPositive: boolean } {
  if (Array.isArray(data)) {
    // If array is provided, calculate trend between last two values
    if (data.length < 2) return { value: 0, isPositive: true };
    const current = data[data.length - 1];
    const prev = data[data.length - 2];
    if (prev === 0) return { value: 0, isPositive: true };
    const change = ((current - prev) / prev) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0
    };
  } else {
    // If two numbers are provided
    if (previous === undefined || previous === 0) return { value: 0, isPositive: true };
    const change = ((data - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0
    };
  }
}