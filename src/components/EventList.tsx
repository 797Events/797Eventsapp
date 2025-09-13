'use client';

import { EventData } from '@/lib/data';
import EventCard from './EventCard';

interface EventListProps {
  events: EventData[];
  onBookNow: (event: EventData) => void;
}

export default function EventList({ events, onBookNow }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center text-white/60 py-16">
        <h3 className="text-xl font-semibold mb-2">No Events Available</h3>
        <p>Check back soon for upcoming events!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {events.map((event, index) => (
        <div key={event.id} className="relative">
          {/* Event number badge */}
          <div className="absolute -left-4 top-4 z-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full w-8 h-8 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">{index + 1}</span>
          </div>
          <EventCard event={event} onBookNow={onBookNow} />
        </div>
      ))}

      {/* Total count */}
      <div className="text-center pt-4">
        <p className="text-white/60 text-sm">
          Total: {events.length} event{events.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}