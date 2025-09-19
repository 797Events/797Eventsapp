import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🎫 Ticket verification request:', body);

    const {
      ticketId,
      bookingId,
      eventId,
      timestamp,
      signature,
      scanTime,
      scannedBy,
      guardName,
      scanLocation
    } = body;

    // Validate required fields
    if (!ticketId && !bookingId) {
      return NextResponse.json(
        { error: 'Missing ticket or booking ID' },
        { status: 400 }
      );
    }

    // Import database functions
    const { unifiedDb } = await import('@/lib/unifiedDatabase');

    // Find the booking by booking ID or ticket ID
    const booking = await unifiedDb.getBookingById(bookingId || ticketId);

    if (!booking) {
      console.log('❌ Booking not found:', bookingId || ticketId);
      return NextResponse.json(
        { error: 'Ticket not found in system' },
        { status: 404 }
      );
    }

    // Verify booking status
    if (booking.booking_status !== 'confirmed') {
      console.log('❌ Booking not confirmed:', booking.booking_status);
      return NextResponse.json(
        { error: 'Ticket not confirmed or cancelled' },
        { status: 400 }
      );
    }

    // Get event details to verify event ID (if provided)
    let event = null;
    if (eventId) {
      event = await unifiedDb.getEventById(eventId);
      if (!event) {
        console.log('❌ Event not found:', eventId);
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }

      // Verify booking belongs to this event
      if (booking.event_id !== eventId) {
        console.log('❌ Booking/Event mismatch:', booking.event_id, '!=', eventId);
        return NextResponse.json(
          { error: 'Ticket not valid for this event' },
          { status: 400 }
        );
      }
    } else {
      // If no event ID provided, get the event from booking
      event = await unifiedDb.getEventById(booking.event_id);
    }

    // Verify signature if provided (basic security check)
    if (signature) {
      const expectedSignature = generateSecurityHash(
        booking.id,
        booking.event_id,
        booking.customer_email
      );
      if (signature !== expectedSignature) {
        console.log('❌ Invalid signature:', signature, '!=', expectedSignature);
        return NextResponse.json(
          { error: 'Invalid ticket signature' },
          { status: 400 }
        );
      }
    }

    // Check if ticket has already been used for attendance
    try {
      const { supabase } = await import('@/lib/supabase');

      const { data: existingAttendance, error: attendanceError } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('booking_id', booking.id)
        .single();

      if (attendanceError && attendanceError.code !== 'PGRST116') {
        console.error('Error checking attendance:', attendanceError);
      }

      if (existingAttendance) {
        console.log('⚠️ Already attended:', existingAttendance.scan_time);
        return NextResponse.json({
          success: false,
          alreadyAttended: true,
          attendanceTime: existingAttendance.scan_time,
          message: 'Ticket already used for entry',
          booking: {
            id: booking.id,
            name: booking.customer_name,
            email: booking.customer_email,
            phone: booking.customer_phone,
            quantity: booking.quantity,
            total_amount: booking.total_amount,
            event_title: event?.title || 'Unknown Event'
          }
        });
      }

      // Create attendance record
      const { error: insertError } = await supabase
        .from('attendance_logs')
        .insert([{
          booking_id: booking.id,
          event_id: booking.event_id,
          customer_name: booking.customer_name,
          customer_email: booking.customer_email,
          quantity_attended: booking.quantity,
          scan_time: scanTime || new Date().toISOString(),
          scanned_by: scannedBy || 'scanner',
          guard_name: guardName || 'Security Guard',
          scan_location: scanLocation || 'Main Gate',
          notes: `Scanned via QR code${signature ? ' (verified)' : ''}`
        }]);

      if (insertError) {
        console.error('❌ Error creating attendance record:', insertError);
        // Continue anyway - don't fail verification for logging issues
      } else {
        console.log('✅ Attendance recorded for booking:', booking.id);
      }

    } catch (attendanceError) {
      console.error('❌ Attendance tracking error:', attendanceError);
      // Continue anyway - don't fail verification for attendance tracking issues
    }

    // Success response
    console.log('✅ Ticket verified successfully:', booking.id);
    return NextResponse.json({
      success: true,
      message: 'Ticket verified successfully',
      booking: {
        id: booking.id,
        name: booking.customer_name,
        email: booking.customer_email,
        phone: booking.customer_phone,
        quantity: booking.quantity,
        total_amount: booking.total_amount,
        event_title: event?.title || 'Unknown Event',
        pass_type: booking.pass_id,
        booking_date: booking.created_at
      },
      event: event ? {
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue
      } : null,
      scanInfo: {
        scanTime: scanTime || new Date().toISOString(),
        scannedBy: guardName || 'Security Guard',
        location: scanLocation || 'Main Gate'
      }
    });
  } catch (error) {
    console.error('❌ Ticket verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error during ticket verification' },
      { status: 500 }
    );
  }
}

// Simple security hash function for ticket verification (must match ticketGenerator.ts)
function generateSecurityHash(bookingId: string, eventId: string = '', email: string = ''): string {
  const data = `${bookingId}-${eventId}-${email}-797events`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}