'use client';

import { useState, useEffect } from 'react';
import { EventData } from '@/lib/data';
import EventCard from './EventCard';

interface EventShowcaseProps {
  events: EventData[];
  onBookNow: (event: EventData) => void;
}

export default function EventShowcase({ events, onBookNow }: EventShowcaseProps) {
  const [localEvents, setLocalEvents] = useState<EventData[]>([]);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list' | 'featured'>('grid');

  useEffect(() => {
    console.log('EventShowcase: Events changed, updating:', events.length);
    setLocalEvents([...events]);

    // Auto-select best display mode based on event count
    if (events.length === 0) return;
    if (events.length === 1) setDisplayMode('featured');
    else if (events.length <= 3) setDisplayMode('grid');
    else setDisplayMode('list');
  }, [events]);

  if (localEvents.length === 0) {
    return (
      <div className="text-center text-white/60 py-16">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
          <div className="text-4xl mb-4">🎪</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No Events Available</h3>
          <p className="text-white/70">Check back soon for upcoming events!</p>
          <p className="text-white/50 text-sm mt-2">
            Events added in admin dashboard will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  // Featured Layout - Single Event Centered
  if (displayMode === 'featured') {
    return (
      <div className="w-full max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2 font-montserrat">Featured Event</h3>
          <p className="text-white/60">Don't miss this exclusive experience</p>
        </div>
        <div className="flex justify-center">
          <EventCard event={localEvents[0]} onBookNow={onBookNow} />
        </div>
      </div>
    );
  }

  // Grid Layout - 2-3 Events Side by Side
  if (displayMode === 'grid') {
    return (
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2 font-montserrat">
            {localEvents.length} Upcoming Event{localEvents.length > 1 ? 's' : ''}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-8 place-items-center">
          {localEvents.map((event) => (
            <EventCard key={event.id} event={event} onBookNow={onBookNow} />
          ))}
        </div>
      </div>
    );
  }

  // List Layout - Vertical Stack for Many Events
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2 font-montserrat">All Events</h3>
          <p className="text-white/60">{localEvents.length} events available</p>
        </div>

        {/* Display Mode Toggle */}
        <div className="flex bg-white/10 rounded-xl p-1">
          <button
            onClick={() => setDisplayMode('grid')}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              displayMode !== 'list'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setDisplayMode('list')}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              displayMode === 'list'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            List
          </button>
        </div>
      </div>

      <div className="space-y-12 px-8">
        {localEvents.map((event, index) => (
          <div key={event.id} className="relative flex justify-center">
            {/* Event Number Badge */}
            <div className="absolute -left-4 top-4 z-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full w-8 h-8 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">{index + 1}</span>
            </div>
            <EventCard event={event} onBookNow={onBookNow} />
          </div>
        ))}
      </div>
    </div>
  );
}