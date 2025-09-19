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

    // Get attendance records
    const { data: attendanceData, error: attendanceError } = await supabase
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
    const totalAttendees = attendanceData.length;
    const uniqueAttendees = new Set(attendanceData.map(a => a.user_id)).size;
    const averageAttendancePerEvent = eventsData.length > 0 ? totalAttendees / eventsData.length : 0;

    // Attendance by event
    const attendanceByEvent = eventsData.map(event => {
      const eventAttendance = attendanceData.filter(a => a.event_id === event.id);
      return {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.event_date,
        attendeeCount: eventAttendance.length,
        uniqueAttendees: new Set(eventAttendance.map(a => a.user_id)).size
      };
    });

    // Attendance trends (by day)
    const attendanceByDay: { [date: string]: number } = {};
    attendanceData.forEach(record => {
      const date = new Date(record.check_in_time).toISOString().split('T')[0];
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
      count: attendanceData.filter(record => {
        const checkInHour = new Date(record.check_in_time).getHours();
        return checkInHour === hour;
      }).length
    }));

    // Top attendees
    const attendeeFrequency: { [userId: string]: { count: number; user: any } } = {};
    attendanceData.forEach(record => {
      if (!attendeeFrequency[record.user_id]) {
        attendeeFrequency[record.user_id] = {
          count: 0,
          user: record.users
        };
      }
      attendeeFrequency[record.user_id].count++;
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
      recentAttendance: attendanceData.slice(0, 20).map(record => ({
        id: record.id,
        eventTitle: (record.events as any)?.title || 'Unknown Event',
        attendeeName: (record.users as any)?.full_name || 'Unknown',
        attendeeEmail: (record.users as any)?.email || '',
        checkInTime: record.check_in_time,
        checkOutTime: record.check_out_time,
        status: record.attendance_status
      })),
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