'use client';

import { EventData } from '@/lib/data';
import EventCard from './EventCard';

interface EventGridProps {
  events: EventData[];
  onBookNow: (event: EventData) => void;
}

export default function EventGrid({ events, onBookNow }: EventGridProps) {
  if (events.length === 0) {
    return (
      <div className="text-center text-white/60 py-16">
        <h3 className="text-xl font-semibold mb-2">No Events Available</h3>
        <p>Check back soon for upcoming events!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Single event - center it */}
      {events.length === 1 && (
        <div className="flex justify-center">
          <EventCard event={events[0]} onBookNow={onBookNow} />
        </div>
      )}

      {/* Multiple events - responsive grid */}
      {events.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 place-items-center">
          {events.map((event) => (
            <EventCard key={event.id} event={event} onBookNow={onBookNow} />
          ))}
        </div>
      )}

      {/* Event count indicator */}
      <div className="text-center mt-8">
        <p className="text-white/60 text-sm">
          Showing {events.length} event{events.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}