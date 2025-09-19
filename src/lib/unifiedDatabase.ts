import { supabase } from './supabase';
import { EventData } from './data';

export interface BookingData {
  id?: string;
  eventId: string;
  passId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  totalAmount: number;
  paymentId: string;
  bookingStatus: 'pending' | 'confirmed' | 'cancelled';
  studentDiscount?: number;
  influencerCode?: string;
  referralCode?: string;
  discountAmount?: number;
  originalAmount?: number;
  created_at?: string;
}

export async function saveBooking(bookingData: BookingData): Promise<string | null> {
  try {
    console.time('saveBooking'); // Performance timing

    // Save booking WITHOUT creating user accounts for guest bookings
    // Use null for user_id and store all customer details in user_details JSON field
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        user_id: null, // No user account needed for guest bookings
        event_id: bookingData.eventId,
        pass_id: bookingData.passId,
        quantity: bookingData.quantity,
        total_amount: bookingData.totalAmount,
        status: bookingData.bookingStatus,
        user_details: {
          // Essential customer information
          name: bookingData.customerName,
          email: bookingData.customerEmail,
          phone: bookingData.customerPhone,

          // Booking metadata
          referralCode: bookingData.referralCode,
          influencerCode: bookingData.influencerCode,
          discountAmount: bookingData.discountAmount,
          originalAmount: bookingData.originalAmount,
          studentDiscount: bookingData.studentDiscount,

          // Booking tracking
          bookingType: 'guest', // Mark as guest booking
          bookingSource: 'website',
          bookingTimestamp: new Date().toISOString(),

          // Customer preferences (for future use)
          communicationPreferences: {
            email: true,
            sms: false,
            whatsapp: false
          }
        },
        payment_id: bookingData.paymentId
      }])
      .select('id')
      .single();

    if (error) {
      console.error('Error saving booking:', error);
      return null;
    }

    console.timeEnd('saveBooking'); // End performance timing
    console.log('✅ Booking saved successfully with ID:', data.id);
    return data.id;
  } catch (error) {
    console.timeEnd('saveBooking'); // End performance timing even on error
    console.error('Error in saveBooking:', error);
    return null;
  }
}

export async function getBookingByPaymentId(paymentId: string): Promise<BookingData | null> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      return null;
    }

    const userDetails = data.user_details || {};

    return {
      id: data.id,
      eventId: data.event_id,
      passId: data.pass_id,
      customerName: userDetails.name || 'Unknown',
      customerEmail: userDetails.email || 'unknown@email.com',
      customerPhone: userDetails.phone || 'N/A',
      quantity: data.quantity,
      totalAmount: data.total_amount,
      paymentId: data.payment_id,
      bookingStatus: data.status,
      referralCode: userDetails.referralCode,
      discountAmount: userDetails.discountAmount,
      originalAmount: userDetails.originalAmount
    };
  } catch (error) {
    console.error('Error in getBookingByPaymentId:', error);
    return null;
  }
}

export async function getBookingById(bookingId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching booking by ID:', error);
      return null;
    }

    const userDetails = data.user_details || {};

    return {
      id: data.id,
      event_id: data.event_id,
      pass_id: data.pass_id,
      customer_name: userDetails.name || 'Unknown',
      customer_email: userDetails.email || 'unknown@email.com',
      customer_phone: userDetails.phone || 'N/A',
      quantity: data.quantity,
      total_amount: data.total_amount,
      payment_id: data.payment_id,
      booking_status: data.status,
      referral_code: userDetails.referralCode,
      discount_amount: userDetails.discountAmount,
      original_amount: userDetails.originalAmount,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error in getBookingById:', error);
    return null;
  }
}

export async function updateBookingStatus(paymentId: string, status: 'confirmed' | 'cancelled'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: status })
      .eq('payment_id', paymentId);

    if (error) {
      console.error('Error updating booking status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateBookingStatus:', error);
    return false;
  }
}

export async function getEventById(eventId: string): Promise<EventData | null> {
  try {
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Error fetching event:', eventError);
      return null;
    }

    // Get passes for this event
    const { data: passesData, error: passesError } = await supabase
      .from('passes')
      .select('*')
      .eq('event_id', eventId);

    if (passesError) {
      console.error('Error fetching passes:', passesError);
      return null;
    }

    return {
      id: eventData.id,
      title: eventData.title,
      description: eventData.description,
      date: eventData.date,
      time: eventData.time,
      venue: eventData.venue,
      venueIcon: eventData.venue_icon,
      price: eventData.price,
      image: eventData.image,
      isActive: eventData.is_active,
      passes: passesData.map(pass => ({
        id: pass.id,
        name: pass.name,
        price: pass.price,
        available: pass.available
      }))
    };
  } catch (error) {
    console.error('Error in getEventById:', error);
    return null;
  }
}

// Unified database object for consistency with imports
export const unifiedDb = {
  saveBooking,
  getBookingById,
  getBookingByPaymentId,
  updateBookingStatus,
  getEventById,
  createBooking: saveBooking // Alias
};