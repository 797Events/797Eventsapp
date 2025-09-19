import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const eventId = searchParams.get('eventId'); // Optional filter by event

    // Get bookings data first - check if table exists
    let bookings = [];
    let error = null;

    try {
      let bookingsQuery = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by event if specified
      if (eventId) {
        bookingsQuery = bookingsQuery.eq('event_id', eventId);
      }

      const result = await bookingsQuery;
      bookings = result.data || [];
      error = result.error;
    } catch (e) {
      console.log('Bookings table may not exist or has different schema:', e);
      error = e;
    }

    // If there's an error (table doesn't exist, wrong schema, etc), return empty CSV
    if (error) {
      console.log('Database not set up or no bookings data available:', (error as any)?.message || error);
      bookings = []; // Set to empty array to generate CSV with headers
    }

    console.log('Export: Found', bookings?.length || 0, 'bookings');

    // Handle case when no bookings exist or table doesn't exist
    if (!bookings || bookings.length === 0) {
      if (format === 'json') {
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
          message: 'No bookings found',
          exported_at: new Date().toISOString()
        });
      }

      // Return CSV with headers only
      const headers = [
        'Booking ID', 'Booking Date', 'Booking Time', 'Status', 'Payment ID',
        'Customer Name', 'Customer Email', 'Customer Phone', 'Customer Role',
        'Event ID', 'Event Title', 'Event Date', 'Event Time', 'Event Venue',
        'Pass ID', 'Pass Type', 'Pass Price', 'Quantity', 'Total Amount',
        'Referral Code', 'Discount Amount', 'Original Amount',
        'Created At', 'Updated At'
      ];

      // Add a sample row to show the structure when no data exists
      const sampleRow = [
        'No data available', '', '', '', '',
        '', '', '', '',
        '', '', '', '', '',
        '', '', '', '', '',
        '', '', '',
        '', ''
      ];

      const csvContent = [
        headers.join(','),
        sampleRow.join(',')
      ].join('\n');

      const filename = eventId
        ? `bookings-event-${eventId}-${new Date().toISOString().split('T')[0]}.csv`
        : `all-bookings-${new Date().toISOString().split('T')[0]}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': csvContent.length.toString()
        }
      });
    }

    // Get related events data
    const eventIds = Array.from(new Set(bookings.map(b => b.event_id)));
    const { data: events } = await supabase
      .from('events')
      .select('id, title, date, time, venue')
      .in('id', eventIds);

    // Get related passes data
    const passIds = Array.from(new Set(bookings.map(b => b.pass_id)));
    const { data: passes } = await supabase
      .from('passes')
      .select('id, name, price')
      .in('id', passIds);

    // Get related users data
    const userIds = Array.from(new Set(bookings.map(b => b.user_id)));
    const { data: users } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role')
      .in('id', userIds);

    // Create lookup maps
    const eventsMap = new Map(events?.map(e => [e.id, e]) || []);
    const passesMap = new Map(passes?.map(p => [p.id, p]) || []);
    const usersMap = new Map(users?.map(u => [u.id, u]) || []);

    // Transform data for export
    const exportData = bookings.map((booking: any) => {
      const userDetails = booking.user_details || {};
      const event = eventsMap.get(booking.event_id);
      const pass = passesMap.get(booking.pass_id);
      const user = usersMap.get(booking.user_id);

      return {
        // Booking Information
        'Booking ID': booking.id,
        'Booking Date': new Date(booking.created_at).toLocaleDateString(),
        'Booking Time': new Date(booking.created_at).toLocaleTimeString(),
        'Status': booking.status,
        'Payment ID': booking.payment_id || 'N/A',

        // Customer Information
        'Customer Name': userDetails.name || user?.full_name || 'Unknown',
        'Customer Email': userDetails.email || user?.email || 'Unknown',
        'Customer Phone': userDetails.phone || user?.phone || 'N/A',
        'Customer Role': user?.role || 'user',

        // Event Information
        'Event ID': booking.event_id,
        'Event Title': event?.title || 'Unknown Event',
        'Event Date': event?.date || 'TBD',
        'Event Time': event?.time || 'TBD',
        'Event Venue': event?.venue || 'TBD',

        // Pass Information
        'Pass ID': booking.pass_id,
        'Pass Type': pass?.name || 'Unknown Pass',
        'Pass Price': pass?.price || 0,
        'Quantity': booking.quantity,
        'Total Amount': booking.total_amount,

        // Discount & Referral Information
        'Referral Code': userDetails.referralCode || 'None',
        'Discount Amount': userDetails.discountAmount || 0,
        'Original Amount': userDetails.originalAmount || booking.total_amount,

        // Timestamps
        'Created At': booking.created_at,
        'Updated At': booking.updated_at
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

    // Generate CSV
    if (exportData.length === 0) {
      return NextResponse.json({ error: 'No bookings found for export' }, { status: 404 });
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
      ? `bookings-event-${eventId}-${new Date().toISOString().split('T')[0]}.csv`
      : `all-bookings-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': csvContent.length.toString()
      }
    });

  } catch (error) {
    console.error('Export bookings API error:', error);
    return NextResponse.json(
      { error: 'Export failed', details: error },
      { status: 500 }
    );
  }
}