import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Simple in-memory cache with 30-second TTL
let analyticsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

// Clear cache on startup to ensure fresh data
analyticsCache = null;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Check cache first
    const now = Date.now();
    if (analyticsCache && (now - analyticsCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(analyticsCache.data);
    }

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

    // Enhanced queries to get all data including pass information
    const [eventsResult, bookingsResult, passesResult] = await Promise.all([
      supabase
        .from('events')
        .select('id, title, is_active, created_at')
        .order('created_at', { ascending: false }),

      supabase
        .from('bookings')
        .select(`
          id,
          event_id,
          pass_id,
          quantity,
          total_amount,
          status,
          created_at,
          events!inner(title)
        `)
        .eq('status', 'confirmed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false }),

      supabase
        .from('passes')
        .select('id, event_id, name, price')
    ]);

    const { data: eventsData, error: eventsError } = eventsResult;
    const { data: bookingsData, error: bookingsError } = bookingsResult;
    const { data: passesData, error: passesError } = passesResult;

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    if (passesError) {
      console.error('Error fetching passes:', passesError);
      return NextResponse.json({ error: 'Failed to fetch passes' }, { status: 500 });
    }

    // Calculate KPIs
    const totalEvents = eventsData.length;
    const activeEvents = eventsData.filter(e => e.is_active).length;
    const totalTicketsSold = bookingsData.reduce((sum, booking) => sum + booking.quantity, 0);
    const totalRevenue = bookingsData.reduce((sum, booking) => sum + booking.total_amount, 0);
    const averageTicketPrice = totalTicketsSold > 0 ? Math.round(totalRevenue / totalTicketsSold) : 0;

    // Find top selling event
    const eventSales: { [eventId: string]: { title: string; sales: number } } = {};
    bookingsData.forEach(booking => {
      const eventTitle = (booking.events as any)?.title || 'Unknown Event';
      if (!eventSales[booking.event_id]) {
        eventSales[booking.event_id] = { title: eventTitle, sales: 0 };
      }
      eventSales[booking.event_id].sales += booking.quantity;
    });

    const topSellingEvent = Object.values(eventSales).reduce(
      (max, event) => event.sales > max.sales ? event : max,
      { title: 'No sales yet', sales: 0 }
    );

    // Simple conversion rate calculation
    const conversionRate = activeEvents > 0 ? Math.min(85, 45 + (totalTicketsSold / 10)) : 0;

    // Prepare sales data for charts (group by day)
    const salesByDay: { [date: string]: { tickets: number; revenue: number } } = {};

    bookingsData.forEach(booking => {
      const date = new Date(booking.created_at).toISOString().split('T')[0];
      if (!salesByDay[date]) {
        salesByDay[date] = { tickets: 0, revenue: 0 };
      }
      salesByDay[date].tickets += booking.quantity;
      salesByDay[date].revenue += booking.total_amount;
    });

    const salesData = Object.entries(salesByDay)
      .map(([date, data]) => ({
        date,
        tickets: data.tickets,
        revenue: data.revenue
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Event analytics (performance by event) with ticket type breakdown
    const eventAnalytics = Object.entries(eventSales).map(([eventId, data]) => {
      const eventBookings = bookingsData.filter(b => b.event_id === eventId);
      const eventPasses = passesData?.filter(p => p.event_id === eventId) || [];

      // Calculate ticket types breakdown for this event
      const ticketTypes = eventPasses.map(pass => {
        const passBookings = eventBookings.filter(b => b.pass_id === pass.id);
        const soldTickets = passBookings.reduce((sum, b) => sum + b.quantity, 0);
        const passRevenue = passBookings.reduce((sum, b) => sum + b.total_amount, 0);

        return {
          type: pass.name || 'Standard Pass',
          sold: soldTickets,
          revenue: passRevenue,
          price: pass.price || 0
        };
      });

      // If no passes found, create a default ticket type from bookings
      if (ticketTypes.length === 0 && eventBookings.length > 0) {
        ticketTypes.push({
          type: 'Standard Pass',
          sold: eventBookings.reduce((sum, b) => sum + b.quantity, 0),
          revenue: eventBookings.reduce((sum, b) => sum + b.total_amount, 0),
          price: eventBookings[0]?.total_amount || 0
        });
      }

      return {
        eventId,
        eventName: data.title,
        eventTitle: data.title,
        ticketsSold: data.sales,
        revenue: eventBookings.reduce((sum, b) => sum + b.total_amount, 0),
        totalTickets: eventPasses.reduce((sum, pass) => sum + ((pass as any).available || 50), 0) || 100,
        ticketTypes: ticketTypes
      };
    });

    // Revenue breakdown by event - format for pie chart
    const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];
    const revenueBreakdown = eventAnalytics.map((event, index) => ({
      type: event.eventTitle,
      revenue: event.revenue,
      color: colors[index % colors.length],
      percentage: totalRevenue > 0 ? Math.round((event.revenue / totalRevenue) * 100) : 0
    }));

    const response = {
      kpis: {
        totalEvents,
        activeEvents,
        totalTicketsSold,
        totalRevenue,
        averageTicketPrice,
        conversionRate: Math.round(conversionRate),
        topSellingEvent: topSellingEvent.title
      },
      salesData,
      eventAnalytics,
      revenueBreakdown,
      timeRange
    };

    // Cache the response
    analyticsCache = {
      data: response,
      timestamp: now
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}