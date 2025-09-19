import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const eventId = searchParams.get('eventId'); // Optional filter by event

    // Check if attendance table exists, if not create sample data from bookings
    let attendance: any[] = [];
    let error: any = null;

    try {
      // Try to get attendance data with booking and event information
      let query = supabase
        .from('attendance')
        .select(`
          id,
          booking_id,
          event_id,
          attendee_name,
          check_in_time,
          scanned_by,
          scan_location,
          created_at,
          events!inner(
            title,
            date,
            time,
            venue
          ),
          bookings!inner(
            user_details,
            quantity,
            total_amount,
            payment_id
          )
        `)
        .order('check_in_time', { ascending: false });

      // Filter by event if specified
      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const result = await query;
      attendance = result.data || [];
      error = result.error;
    } catch (e) {
      // If attendance table doesn't exist, create placeholder data from bookings
      console.log('Attendance table not found, generating from bookings data');

      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          id,
          event_id,
          user_details,
          quantity,
          total_amount,
          payment_id,
          created_at,
          status,
          events!inner(
            title,
            date,
            time,
            venue
          )
        `)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

      if (eventId) {
        bookingsQuery = bookingsQuery.eq('event_id', eventId);
      }

      const { data: bookings } = await bookingsQuery;

      // Transform bookings into attendance-like records
      attendance = (bookings || []).map((booking: any, index: number) => ({
        id: `att_${booking.id}_${index}`,
        booking_id: booking.id,
        event_id: booking.event_id,
        attendee_name: booking.user_details?.name || 'Unknown',
        check_in_time: booking.created_at, // Using booking time as placeholder
        scanned_by: 'System',
        scan_location: 'Main Entrance',
        created_at: booking.created_at,
        events: booking.events,
        bookings: {
          user_details: booking.user_details,
          quantity: booking.quantity,
          total_amount: booking.total_amount,
          payment_id: booking.payment_id
        }
      }));
    }

    // If there's an error (table doesn't exist, wrong schema, etc), handle gracefully
    if (error) {
      console.log('Database not set up or no attendance data available:', (error as any)?.message || error);
      attendance = []; // Set to empty array to generate CSV with headers
    }

    console.log('Export: Found', attendance.length, 'attendance records');

    // Transform data for export
    const exportData = attendance.map((record: any) => {
      const event = record.events;
      const booking = record.bookings;
      const userDetails = booking?.user_details || {};

      return {
        // Attendance Information
        'Attendance ID': record.id,
        'Check-in Date': new Date(record.check_in_time).toLocaleDateString(),
        'Check-in Time': new Date(record.check_in_time).toLocaleTimeString(),
        'Scanned By': record.scanned_by || 'Unknown',
        'Scan Location': record.scan_location || 'Main Entrance',

        // Attendee Information
        'Attendee Name': record.attendee_name,
        'Customer Email': userDetails.email || 'Unknown',
        'Customer Phone': userDetails.phone || 'N/A',

        // Event Information
        'Event ID': record.event_id,
        'Event Title': event?.title || 'Unknown Event',
        'Event Date': event?.date || 'TBD',
        'Event Time': event?.time || 'TBD',
        'Event Venue': event?.venue || 'TBD',

        // Booking Information
        'Booking ID': record.booking_id,
        'Ticket Quantity': booking?.quantity || 1,
        'Amount Paid': booking?.total_amount || 0,
        'Payment ID': booking?.payment_id || 'N/A',

        // Referral Information
        'Referral Code': userDetails.referralCode || 'None',
        'Discount Applied': userDetails.discountAmount || 0,

        // Timestamps
        'Record Created': record.created_at
      };
    });

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: exportData,
        count: exportData.length,
        exported_at: new Date().toISOString()
      });
    }

    // Generate CSV - handle empty data gracefully
    if (exportData.length === 0) {
      // Return CSV with headers only
      const headers = [
        'Attendance ID', 'Check-in Date', 'Check-in Time', 'Scanned By', 'Scan Location',
        'Attendee Name', 'Customer Email', 'Customer Phone',
        'Event ID', 'Event Title', 'Event Date', 'Event Time', 'Event Venue',
        'Booking ID', 'Ticket Quantity', 'Amount Paid', 'Payment ID',
        'Referral Code', 'Discount Applied', 'Record Created'
      ];

      // Add a sample row to show the structure when no data exists
      const sampleRow = new Array(headers.length).fill('No data available');
      sampleRow[0] = 'No attendance data available';

      const csvContent = [
        headers.join(','),
        sampleRow.join(',')
      ].join('\n');

      const filename = eventId
        ? `attendance-event-${eventId}-${new Date().toISOString().split('T')[0]}.csv`
        : `all-attendance-${new Date().toISOString().split('T')[0]}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': csvContent.length.toString()
        }
      });
    }

    // Create CSV headers from the first record
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape quotes and wrap in quotes if contains comma or quote
          const stringValue = String(value || '');
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    const filename = eventId
      ? `attendance-event-${eventId}-${new Date().toISOString().split('T')[0]}.csv`
      : `all-attendance-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': csvContent.length.toString()
      }
    });

  } catch (error) {
    console.error('Export attendance API error:', error);
    return NextResponse.json(
      { error: 'Export failed', details: error },
      { status: 500 }
    );
  }
}