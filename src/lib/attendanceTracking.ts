import { supabase } from './supabase';

export interface AttendanceRecord {
  id: string;
  bookingId: string;
  eventId: string;
  customerName: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'checked-in' | 'checked-out' | 'no-show';
  guardId: string;
  notes?: string;
}

export interface TicketValidationResult {
  isValid: boolean;
  booking?: {
    id: string;
    eventId: string;
    customerName: string;
    passType: string;
    quantity: number;
    isUsed: boolean;
  };
  message: string;
}

export async function validateTicket(ticketId: string): Promise<TicketValidationResult> {
  try {
    // Get booking by ticket/booking ID
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        event_id,
        customer_name,
        quantity,
        booking_status,
        ticket_generated,
        passes(name)
      `)
      .eq('id', ticketId)
      .eq('booking_status', 'confirmed')
      .single();

    if (error || !booking) {
      return {
        isValid: false,
        message: 'Invalid ticket ID or booking not found'
      };
    }

    // Check if already checked in
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('booking_id', booking.id)
      .eq('status', 'checked-in')
      .single();

    if (attendance) {
      return {
        isValid: false,
        booking: {
          id: booking.id,
          eventId: booking.event_id,
          customerName: booking.customer_name,
          passType: 'Standard',
          quantity: booking.quantity,
          isUsed: true
        },
        message: 'Ticket already used for check-in'
      };
    }

    return {
      isValid: true,
      booking: {
        id: booking.id,
        eventId: booking.event_id,
        customerName: booking.customer_name,
        passType: 'Standard',
        quantity: booking.quantity,
        isUsed: false
      },
      message: 'Valid ticket'
    };
  } catch (error) {
    console.error('Error validating ticket:', error);
    return {
      isValid: false,
      message: 'Error validating ticket'
    };
  }
}

export async function recordCheckIn(
  bookingId: string,
  eventId: string,
  customerName: string,
  guardId: string,
  notes?: string
): Promise<AttendanceRecord | null> {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .insert([{
        booking_id: bookingId,
        event_id: eventId,
        customer_name: customerName,
        check_in_time: new Date().toISOString(),
        status: 'checked-in',
        guard_id: guardId,
        notes
      }])
      .select()
      .single();

    if (error) {
      console.error('Error recording check-in:', error);
      return null;
    }

    return {
      id: data.id,
      bookingId: data.booking_id,
      eventId: data.event_id,
      customerName: data.customer_name,
      checkInTime: data.check_in_time,
      checkOutTime: data.check_out_time,
      status: data.status,
      guardId: data.guard_id,
      notes: data.notes
    };
  } catch (error) {
    console.error('Error in recordCheckIn:', error);
    return null;
  }
}

export async function recordCheckOut(attendanceId: string, guardId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('attendance')
      .update({
        check_out_time: new Date().toISOString(),
        status: 'checked-out'
      })
      .eq('id', attendanceId)
      .eq('guard_id', guardId);

    if (error) {
      console.error('Error recording check-out:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in recordCheckOut:', error);
    return false;
  }
}

export async function getEventAttendance(eventId: string): Promise<AttendanceRecord[]> {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('event_id', eventId)
      .order('check_in_time', { ascending: false });

    if (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }

    return data.map(record => ({
      id: record.id,
      bookingId: record.booking_id,
      eventId: record.event_id,
      customerName: record.customer_name,
      checkInTime: record.check_in_time,
      checkOutTime: record.check_out_time,
      status: record.status,
      guardId: record.guard_id,
      notes: record.notes
    }));
  } catch (error) {
    console.error('Error in getEventAttendance:', error);
    return [];
  }
}

export async function getAttendanceStats(eventId: string): Promise<{
  totalBookings: number;
  checkedIn: number;
  checkedOut: number;
  noShows: number;
}> {
  try {
    // Get total confirmed bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('quantity')
      .eq('event_id', eventId)
      .eq('booking_status', 'confirmed');

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return { totalBookings: 0, checkedIn: 0, checkedOut: 0, noShows: 0 };
    }

    const totalBookings = bookings.reduce((sum, booking) => sum + booking.quantity, 0);

    // Get attendance records
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('status')
      .eq('event_id', eventId);

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return { totalBookings, checkedIn: 0, checkedOut: 0, noShows: 0 };
    }

    const checkedIn = attendance.filter(a => a.status === 'checked-in').length;
    const checkedOut = attendance.filter(a => a.status === 'checked-out').length;
    const noShows = totalBookings - checkedIn - checkedOut;

    return { totalBookings, checkedIn, checkedOut, noShows };
  } catch (error) {
    console.error('Error in getAttendanceStats:', error);
    return { totalBookings: 0, checkedIn: 0, checkedOut: 0, noShows: 0 };
  }
}

// Attendance tracker object for consistency with imports
export const attendanceTracker = {
  validateTicket,
  recordCheckIn,
  recordCheckOut,
  getEventAttendance,
  getAttendanceStats
};