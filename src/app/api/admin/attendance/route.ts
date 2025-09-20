import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get attendance records - try attendance_logs first, then fall back to attendance
    let attendanceQuery = supabase
      .from('attendance_logs')
      .select(`
        id,
        event_id,
        booking_id,
        customer_name,
        customer_email,
        scanned_at,
        scanned_by,
        guard_name,
        scan_location,
        ticket_id,
        events(title, date)
      `)
      .gte('scanned_at', startDate.toISOString())
      .lte('scanned_at', endDate.toISOString())
      .order('scanned_at', { ascending: false });

    let { data: attendanceData, error: attendanceError } = await attendanceQuery;

    // If attendance_logs doesn't exist, try the old attendance table
    if (attendanceError && (
      attendanceError.code === 'PGRST205' ||
      attendanceError.code === 'PGRST200' ||
      attendanceError.message.includes('attendance_logs') ||
      attendanceError.message.includes('attendance') ||
      attendanceError.message.includes('schema cache') ||
      attendanceError.message.includes('relationship'))) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('attendance')
        .select(`
          id,
          event_id,
          user_id,
          check_in_time,
          check_out_time,
          attendance_status,
          events(title, event_date),
          users(full_name, email)
        `)
        .gte('check_in_time', startDate.toISOString())
        .lte('check_in_time', endDate.toISOString())
        .order('check_in_time', { ascending: false });

      if (fallbackError) {
        console.error('Error fetching attendance:', fallbackError);
        // Return empty data if neither table exists
        return NextResponse.json({
          attendanceRecords: [],
          analytics: {
            totalAttendance: 0,
            totalEvents: 0,
            averageAttendancePerEvent: 0,
            topPerformingEvents: [],
            attendanceByDate: [],
            attendanceByGuard: []
          }
        });
      }

      // Transform fallback data to match expected structure
      attendanceData = fallbackData?.map((record: any) => ({
        id: record.id,
        event_id: record.event_id,
        booking_id: record.user_id, // Map user_id to booking_id
        customer_name: record.users?.[0]?.full_name || 'Unknown',
        customer_email: record.users?.[0]?.email || 'unknown@example.com',
        scanned_at: record.check_in_time,
        scanned_by: 'System',
        guard_name: 'Security Guard',
        scan_location: 'Event Entrance',
        ticket_id: `TICKET_${record.id}`,
        events: record.events?.map((event: any) => ({
          title: event.title,
          date: event.event_date
        })) || []
      })) || [];
      attendanceError = fallbackError;
    }

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return NextResponse.json({ error: 'Failed to fetch attendance data' }, { status: 500 });
    }

    // Get events for the time period
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('id, title, event_date')
      .gte('event_date', startDate.toISOString().split('T')[0])
      .lte('event_date', endDate.toISOString().split('T')[0]);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch events data' }, { status: 500 });
    }

    // Calculate analytics
    const totalAttendees = attendanceData?.length || 0;
    const uniqueAttendees = new Set(attendanceData?.map(a => a.customer_email) || []).size;
    const averageAttendancePerEvent = eventsData.length > 0 ? totalAttendees / eventsData.length : 0;

    // Attendance by event
    const attendanceByEvent = eventsData.map(event => {
      const eventAttendance = attendanceData?.filter(a => a.event_id === event.id) || [];
      return {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.event_date,
        attendeeCount: eventAttendance.length,
        uniqueAttendees: new Set(eventAttendance.map(a => a.customer_email)).size
      };
    });

    // Attendance trends (by day)
    const attendanceByDay: { [date: string]: number } = {};
    attendanceData?.forEach(record => {
      const date = new Date(record.scanned_at).toISOString().split('T')[0];
      attendanceByDay[date] = (attendanceByDay[date] || 0) + 1;
    });

    const attendanceTrends = Object.entries(attendanceByDay)
      .map(([date, count]) => ({
        date,
        attendees: count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Check-in patterns (hourly distribution)
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: attendanceData?.filter(record => {
        const checkInHour = new Date(record.scanned_at).getHours();
        return checkInHour === hour;
      })?.length || 0
    }));

    // Top attendees
    const attendeeFrequency: { [userId: string]: { count: number; user: any } } = {};
    attendanceData?.forEach(record => {
      if (!attendeeFrequency[record.customer_email]) {
        attendeeFrequency[record.customer_email] = {
          count: 0,
          user: { name: record.customer_name, email: record.customer_email }
        };
      }
      attendeeFrequency[record.customer_email].count++;
    });

    const topAttendees = Object.entries(attendeeFrequency)
      .map(([userId, data]) => ({
        userId,
        name: (data.user as any)?.full_name || 'Unknown',
        email: (data.user as any)?.email || '',
        attendanceCount: data.count
      }))
      .sort((a, b) => b.attendanceCount - a.attendanceCount)
      .slice(0, 10);

    const response = {
      summary: {
        totalAttendees,
        uniqueAttendees,
        totalEvents: eventsData.length,
        averageAttendancePerEvent: Math.round(averageAttendancePerEvent)
      },
      attendanceByEvent,
      attendanceTrends,
      hourlyDistribution,
      topAttendees,
      recentAttendance: attendanceData?.slice(0, 20)?.map(record => ({
        id: record.id,
        eventTitle: (record.events as any)?.title || 'Unknown Event',
        attendeeName: record.customer_name || 'Unknown',
        attendeeEmail: record.customer_email || '',
        checkInTime: record.scanned_at,
        guardName: record.guard_name,
        location: record.scan_location
      })) || [],
      timeRange
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Attendance analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { eventId, userId, checkInTime, status = 'present' } = await request.json();

    const { data, error } = await supabase
      .from('attendance')
      .insert([{
        event_id: eventId,
        user_id: userId,
        check_in_time: checkInTime || new Date().toISOString(),
        attendance_status: status
      }])
      .select()
      .single();

    if (error) {
      console.error('Error recording attendance:', error);
      return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Attendance recorded successfully',
      attendance: data
    });

  } catch (error) {
    console.error('Record attendance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}