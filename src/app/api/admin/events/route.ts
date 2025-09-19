import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // First, fetch all active events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        date,
        time,
        venue,
        venue_icon,
        price,
        image,
        is_active,
        is_multi_day,
        event_days,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    console.log('Events API: Found', events.length, 'active events');

    // Fetch passes for all events
    const eventIds = events.map(event => event.id);
    let allPasses: any[] = [];

    if (eventIds.length > 0) {
      const { data: passes, error: passesError } = await supabase
        .from('passes')
        .select('id, event_id, name, price, available, sold, day_info')
        .in('event_id', eventIds);

      if (passesError) {
        console.error('Error fetching passes:', passesError);
        // Continue without passes rather than failing
      } else {
        allPasses = passes || [];
      }
    }

    console.log('Events API: Found', allPasses.length, 'passes total');

    // Transform to match frontend interface
    const transformedEvents = events.map((event: any) => {
      const eventPasses = allPasses.filter(pass => pass.event_id === event.id);

      let eventDays = null;
      if (event.event_days && typeof event.event_days === 'string') {
        try {
          eventDays = JSON.parse(event.event_days);
        } catch (e) {
          console.error('Error parsing event_days:', e);
        }
      }

      // If it's a multi-day event, reconstruct the passes within each day
      if (event.is_multi_day && eventDays) {
        eventDays = eventDays.map((day: any) => {
          // Find passes for this specific day
          const dayPasses = eventPasses.filter((pass: any) => {
            if (!pass.day_info) return false;

            let dayInfo;
            try {
              dayInfo = JSON.parse(pass.day_info);
            } catch (e) {
              return false;
            }

            return dayInfo.dayId === day.id;
          });

          return {
            ...day,
            passes: dayPasses.map((pass: any) => ({
              id: pass.id,
              name: pass.name,
              price: pass.price,
              available: pass.available - (pass.sold || 0)
            }))
          };
        });
      }

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        venue: event.venue,
        venueIcon: event.venue_icon || '📍',
        price: event.price,
        image: event.image,
        isActive: event.is_active,
        isMultiDay: event.is_multi_day || false,
        eventDays: eventDays,
        passes: event.is_multi_day ? [] : eventPasses.map((pass: any) => ({
          id: pass.id,
          name: pass.name,
          price: pass.price,
          available: pass.available - (pass.sold || 0)
        }))
      };
    });

    console.log('Events API: Returning', transformedEvents.length, 'transformed events with passes');
    return NextResponse.json({ events: transformedEvents });

  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();

    console.log('🆕 Creating new event:', { title: eventData.title, venue: eventData.venue });

    // Insert event (let UUID auto-generate)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert([{
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        time: eventData.time,
        venue: eventData.venue,
        venue_icon: eventData.venueIcon || '📍',
        price: eventData.price,
        image: eventData.image || '/Assets/Passes_outlet design.jpg',
        is_active: eventData.isActive ?? true,
        is_multi_day: eventData.isMultiDay || false,
        event_days: eventData.eventDays ? JSON.stringify(eventData.eventDays) : null
      }])
      .select()
      .single();

    if (eventError) {
      console.error('❌ Error creating event:', eventError);
      return NextResponse.json({
        error: 'Failed to create event',
        details: eventError.message
      }, { status: 500 });
    }

    console.log('✅ Event created successfully:', event.id);

    // Insert passes - handle both regular and multi-day events
    let allPasses: any[] = [];

    if (eventData.isMultiDay && eventData.eventDays) {
      // For multi-day events, collect passes from all days
      eventData.eventDays.forEach((day: any) => {
        if (day.passes && day.passes.length > 0) {
          day.passes.forEach((pass: any) => {
            allPasses.push({
              event_id: event.id,
              name: pass.name,
              price: pass.price,
              available: pass.available,
              day_info: JSON.stringify({
                dayId: day.id,
                dayNumber: day.dayNumber,
                dayTitle: day.title,
                date: day.date,
                time: day.time,
                venue: day.venue
              })
            });
          });
        }
      });
    } else if (eventData.passes && eventData.passes.length > 0) {
      // For regular single-day events
      allPasses = eventData.passes.map((pass: any) => ({
        event_id: event.id,
        name: pass.name,
        price: pass.price,
        available: pass.available
      }));
    }

    if (allPasses.length > 0) {
      console.log('🎫 Creating', allPasses.length, 'passes for event');

      const { error: passError } = await supabase
        .from('passes')
        .insert(allPasses);

      if (passError) {
        console.error('❌ Error creating passes:', passError);
        // Still return success for event, but log pass error
      } else {
        console.log('✅ Passes created successfully');
      }
    }

    return NextResponse.json({
      message: 'Event created successfully',
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        venue: event.venue,
        venueIcon: event.venue_icon,
        price: event.price,
        image: event.image,
        isActive: event.is_active
      }
    });

  } catch (error) {
    console.error('Create event API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const eventData = await request.json();

    console.log('📝 Updating event:', eventId, { title: eventData.title });

    // Update event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .update({
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        time: eventData.time,
        venue: eventData.venue,
        venue_icon: eventData.venueIcon || '📍',
        price: eventData.price,
        image: eventData.image,
        is_active: eventData.isActive,
        is_multi_day: eventData.isMultiDay || false,
        event_days: eventData.eventDays ? JSON.stringify(eventData.eventDays) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single();

    if (eventError) {
      console.error('❌ Error updating event:', eventError);
      return NextResponse.json({
        error: 'Failed to update event',
        details: eventError.message
      }, { status: 500 });
    }

    console.log('✅ Event updated successfully:', eventId);

    // Delete existing passes and recreate them (simpler than trying to update)
    await supabase
      .from('passes')
      .delete()
      .eq('event_id', eventId);

    // Insert new passes - handle both regular and multi-day events
    let allPasses: any[] = [];

    if (eventData.isMultiDay && eventData.eventDays) {
      // For multi-day events, collect passes from all days
      eventData.eventDays.forEach((day: any) => {
        if (day.passes && day.passes.length > 0) {
          day.passes.forEach((pass: any) => {
            allPasses.push({
              event_id: eventId,
              name: pass.name,
              price: pass.price,
              available: pass.available,
              day_info: JSON.stringify({
                dayId: day.id,
                dayNumber: day.dayNumber,
                dayTitle: day.title,
                date: day.date,
                time: day.time,
                venue: day.venue
              })
            });
          });
        }
      });
    } else if (eventData.passes && eventData.passes.length > 0) {
      // For regular single-day events
      allPasses = eventData.passes.map((pass: any) => ({
        event_id: eventId,
        name: pass.name,
        price: pass.price,
        available: pass.available
      }));
    }

    if (allPasses.length > 0) {
      console.log('🎫 Updating', allPasses.length, 'passes for event');

      const { error: passError } = await supabase
        .from('passes')
        .insert(allPasses);

      if (passError) {
        console.error('❌ Error updating passes:', passError);
        // Continue anyway, don't fail the whole update for pass errors
      } else {
        console.log('✅ Passes updated successfully');
      }
    }

    return NextResponse.json({
      message: 'Event updated successfully',
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        venue: event.venue,
        venueIcon: event.venue_icon,
        price: event.price,
        image: event.image,
        isActive: event.is_active
      }
    });

  } catch (error) {
    console.error('Update event API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Delete passes first (foreign key constraint)
    await supabase
      .from('passes')
      .delete()
      .eq('event_id', eventId);

    // Delete event
    const { error: eventError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (eventError) {
      console.error('Error deleting event:', eventError);
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Event deleted successfully' });

  } catch (error) {
    console.error('Delete event API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}