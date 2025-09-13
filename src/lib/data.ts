export interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  venueIcon: string; // Icon for the venue (emoji or icon class)
  price: number;
  image: string;
  isActive: boolean;
  passes: PassType[];
}

export interface PassType {
  id: string;
  name: string;
  price: number;
  available: number;
}

// Default events data
const defaultEvents: EventData[] = [
  {
    id: '1',
    title: 'The Great Indian Navratri',
    description: 'Join us for an unforgettable night of music. A night full of joy and entertainment with celebrity performance.',
    date: '2025-09-27',
    time: '17:00',
    venue: 'Moze college, Balewadi, Pune',
    venueIcon: '🏫',
    price: 150,
    image: '/Assets/Passes_outlet design.jpg',
    isActive: true,
    passes: [
      { id: '1', name: 'General Admission', price: 150, available: 100 },
      { id: '2', name: 'VIP Package', price: 350, available: 50 }
    ]
  }
];

// Storage key for events
const EVENTS_STORAGE_KEY = 'events_797';

// Get events from localStorage or default
function getStoredEvents(): EventData[] {
  if (typeof window === 'undefined') return defaultEvents;

  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (stored) {
      const parsedEvents = JSON.parse(stored);
      console.log('getStoredEvents: Found stored events:', parsedEvents.length);
      return parsedEvents;
    }
  } catch (error) {
    console.error('Error reading events from localStorage:', error);
  }

  // Initialize with default events if none exist
  console.log('getStoredEvents: No stored events found, initializing with defaults:', defaultEvents.length);
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(defaultEvents));
  return defaultEvents;
}

// Save events to localStorage
function saveEvents(events: EventData[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    // Trigger storage event for other tabs
    window.dispatchEvent(new Event('events-updated'));
  } catch (error) {
    console.error('Error saving events to localStorage:', error);
  }
}

// Get current events
let events: EventData[] = getStoredEvents();

export function getEvents(): EventData[] {
  console.log('getEvents: Starting, getting active events from storage');
  
  events = getStoredEvents(); // Refresh from storage
  const activeEvents = events.filter(event => event.isActive);
  console.log('getEvents: Active events from storage:', activeEvents.length);
  console.log('getEvents: Active event details:', activeEvents.map(e => ({ id: e.id, title: e.title, isActive: e.isActive })));
  return activeEvents;
}

export function getAllEvents(): EventData[] {
  events = getStoredEvents(); // Refresh from storage
  return events;
}

export function getEventById(id: string): EventData | undefined {
  return events.find(event => event.id === id);
}

export function addEvent(event: Omit<EventData, 'id'>): EventData {
  events = getStoredEvents(); // Refresh from storage
  const newEvent = {
    ...event,
    id: Date.now().toString()
  };
  events.push(newEvent);
  saveEvents(events); // Save to storage
  console.log('Data: Event added successfully. Total events:', events.length);
  console.log('Data: Events after add:', events.map(e => ({ id: e.id, title: e.title })));
  return newEvent;
}

export function updateEvent(id: string, updates: Partial<EventData>): EventData | null {
  events = getStoredEvents(); // Refresh from storage
  const index = events.findIndex(event => event.id === id);
  if (index === -1) return null;
  
  events[index] = { ...events[index], ...updates };
  saveEvents(events); // Save to storage
  return events[index];
}

export function deleteEvent(id: string): boolean {
  console.log('Deleting event with ID:', id);
  events = getStoredEvents(); // Refresh from storage
  console.log('Events before deletion:', events.length);
  const index = events.findIndex(event => event.id === id);
  if (index === -1) {
    console.log('Event not found!');
    return false;
  }
  
  events.splice(index, 1);
  saveEvents(events); // Save to storage
  console.log('Events after deletion:', events.length);
  return true;
}

export function cloneEvent(id: string): EventData | null {
  const originalEvent = events.find(event => event.id === id);
  if (!originalEvent) {
    console.log('Event not found for cloning:', id);
    return null;
  }

  // Create a clone with new ID and updated title
  const clonedEvent: EventData = {
    ...originalEvent,
    id: Date.now().toString(),
    title: `${originalEvent.title} (Copy)`,
    passes: originalEvent.passes.map(pass => ({
      ...pass,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }))
  };

  events.push(clonedEvent);
  console.log('Event cloned successfully:', clonedEvent.id);
  return clonedEvent;
}

// Debug function to reset events to defaults
export function resetEventsToDefault(): void {
  if (typeof window === 'undefined') return;

  console.log('Resetting events to default...');
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(defaultEvents));
  events = [...defaultEvents];
  window.dispatchEvent(new Event('events-updated'));
  console.log('Events reset to default. Total events:', events.length);
}

// Debug function to add test events for carousel testing
export function addTestEvents(count: number): void {
  if (typeof window === 'undefined') return;

  console.log(`Adding ${count} test events...`);
  events = getStoredEvents(); // Refresh from storage

  for (let i = 1; i <= count; i++) {
    const testEvent: EventData = {
      id: `test-${Date.now()}-${i}`,
      title: `Test Event ${i}`,
      description: `This is test event number ${i} for carousel testing. Lorem ipsum dolor sit amet.`,
      date: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // i weeks from now
      time: '19:00',
      venue: `Test Venue ${i}`,
      venueIcon: '🎪',
      price: 100 + i * 50,
      image: '/Assets/Passes_outlet design.jpg', // Use existing image
      isActive: true,
      passes: [
        { id: `test-pass-${i}-1`, name: 'Regular', price: 100 + i * 50, available: 100 },
        { id: `test-pass-${i}-2`, name: 'VIP', price: 200 + i * 100, available: 50 }
      ]
    };
    events.push(testEvent);
  }

  saveEvents(events);
  console.log(`Added ${count} test events. Total events now:`, events.length);
}