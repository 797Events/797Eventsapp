'use client';

import { useState, useEffect } from 'react';
import { EventData } from '@/lib/data';
import EventCard from './EventCard';

interface EventTimelineProps {
  events: EventData[];
  onBookNow: (event: EventData) => void;
}

export default function EventTimeline({ events, onBookNow }: EventTimelineProps) {
  const [localEvents, setLocalEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  useEffect(() => {
    console.log('EventTimeline: Received events update:', events.length);
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setLocalEvents(sortedEvents);

    if (sortedEvents.length > 0) {
      setSelectedEvent(sortedEvents[0]); // Select first event by default
    }
  }, [events]);

  if (localEvents.length === 0) {
    return (
      <div className="text-center text-white/60 py-16">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
          <div className="text-4xl mb-4">🎪</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No Events Available</h3>
          <p className="text-white/70">Check back soon for upcoming events!</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      day: date.getDate(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };

  const isEventSelected = (event: EventData) => selectedEvent?.id === event.id;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2 font-montserrat">
          Event Timeline
        </h3>
        <p className="text-white/60">Select any event to view details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 sticky top-6">
            <h4 className="text-lg font-semibold text-white mb-6 font-montserrat">
              Upcoming Events
            </h4>

            <div className="space-y-4">
              {localEvents.map((event, index) => {
                const dateInfo = formatDate(event.date);
                const isSelected = isEventSelected(event);

                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                      isSelected
                        ? 'bg-white/20 border border-white/30 scale-105'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Date Badge */}
                      <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center ${
                        isSelected ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70'
                      }`}>
                        <div className="text-xs font-medium">{dateInfo.month}</div>
                        <div className="text-lg font-bold">{dateInfo.day}</div>
                        <div className="text-xs">{dateInfo.weekday}</div>
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-sm line-clamp-2 ${
                          isSelected ? 'text-white' : 'text-white/80'
                        }`}>
                          {event.title}
                        </div>
                        <div className="text-xs text-white/50 mt-1">
                          {event.venueIcon} {event.venue}
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                          From ₹{event.price}
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      <div className={`flex-shrink-0 w-3 h-3 rounded-full transition-all ${
                        isSelected ? 'bg-white' : 'bg-white/20'
                      }`} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Timeline Stats */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{localEvents.length}</div>
                <div className="text-xs text-white/60">Total Events</div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Detail */}
        <div className="lg:col-span-2">
          {selectedEvent ? (
            <div className="space-y-6">
              {/* Event Header */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2 font-montserrat">
                      Now Viewing
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-white/60">
                      <span>📅 {formatDate(selectedEvent.date).month} {formatDate(selectedEvent.date).day}</span>
                      <span>⏰ {selectedEvent.time}</span>
                      <span>🎟️ {selectedEvent.passes.length} pass types</span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onBookNow(selectedEvent)}
                      className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-200 text-sm transition-all"
                    >
                      Quick Book
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Card */}
              <EventCard event={selectedEvent} onBookNow={onBookNow} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-white/5 backdrop-blur-sm rounded-2xl">
              <div className="text-center text-white/60">
                <div className="text-4xl mb-4">👆</div>
                <p>Select an event from the timeline to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}