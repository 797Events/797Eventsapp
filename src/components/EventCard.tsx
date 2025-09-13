import React from 'react';
import { EventData } from '@/lib/data';
import Button from './Button';

interface EventCardProps {
  event: EventData;
  onBookNow: (event: EventData) => void;
}

// Helper function to format 24-hour time to 12-hour format
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default React.memo(function EventCard({ event, onBookNow }: EventCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden hover:border-yellow-500 transition-all duration-300 hover:scale-105
                    w-full max-w-[850px] h-auto min-h-[600px] md:h-[600px] mx-auto flex-shrink-0 flex flex-col">
      {/* Banner Image - Takes Upper Half */}
      <div className="relative h-[250px] sm:h-[300px] md:h-[350px] overflow-hidden flex-shrink-0">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover object-center"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Event Info - Takes Lower Half */}
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 font-montserrat">
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-white/80 text-sm mb-4 line-clamp-2 flex-shrink-0">
          {event.description}
        </p>

        {/* Date & Time */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-white/80">
              {new Date(event.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-white/80">{formatTime12Hour(event.time)}</span>
          </div>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <span className="text-lg">{event.venueIcon || '📍'}</span>
          <span className="text-white/80 line-clamp-1">{event.venue}</span>
        </div>

        {/* Price & Booking Button - Pushed to bottom */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
          <div>
            <span className="text-white/60 text-xs">Starting from</span>
            <div className="text-white text-xl font-bold font-montserrat">₹{event.price}</div>
          </div>

          <Button
            onClick={() => onBookNow(event)}
            className="px-6 py-2 text-base"
          >
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
});