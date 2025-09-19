'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  Calendar,
  MapPin,
  Ticket,
  DollarSign,
  Users,
  Clock,
  Image as ImageIcon,
  Save,
  X
} from 'lucide-react';
import { EventData, PassType, EventDay } from '@/lib/data';
import { uploadImage, uploadImageFallback, compressImage } from '@/lib/imageUpload';

interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  venueIcon: string;
  price: number;
  image: string;
  isActive: boolean;
  passes: PassType[];
  isMultiDay?: boolean;
  eventDays?: EventDay[];
}

export default function EventManagementTab() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshKey, setRefreshKey] = useState(0);

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    venueIcon: '📍',
    price: 0,
    image: '',
    isActive: true,
    passes: [
      {
        id: Date.now().toString(),
        name: 'General Admission',
        price: 0,
        available: 100
      }
    ]
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/admin/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data.events || []);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      venue: '',
      venueIcon: '📍',
      price: 0,
      image: '',
      isActive: true,
      passes: [
        {
          id: Date.now().toString(),
          name: 'General Admission',
          price: 0,
          available: 100
        }
      ],
      isMultiDay: false,
      eventDays: []
    });
    setEditingEvent(null);
    setImageFile(null);
    setImagePreview('');
    setShowForm(false);
  };

  const handleEdit = (event: EventData) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      venue: event.venue,
      venueIcon: event.venueIcon || '📍',
      price: event.price,
      image: event.image,
      isActive: event.isActive,
      passes: [...event.passes],
      isMultiDay: event.isMultiDay || false,
      eventDays: event.eventDays ? [...event.eventDays] : []
    });
    setImagePreview(event.image);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await fetch(`/api/admin/events?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete event');
        }

        loadEvents();
        // Trigger real-time update to homepage
        window.dispatchEvent(new Event('events-updated'));
        alert('Event deleted successfully!');
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  const handleClone = async (event: EventData) => {
    try {
      const clonedEvent = {
        ...event,
        title: `${event.title} (Copy)`,
        passes: event.passes.map(pass => ({
          ...pass,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        }))
      };
      delete (clonedEvent as any).id;

      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clonedEvent),
      });

      if (!response.ok) {
        throw new Error('Failed to clone event');
      }
      loadEvents();
      // Trigger real-time update to homepage
      window.dispatchEvent(new Event('events-updated'));
    } catch (error) {
      console.error('Error cloning event:', error);
      alert('Failed to clone event. Please try again.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 32 * 1024 * 1024) {
      alert('File size must be less than 32MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setImageFile(file);
    setIsUploadingImage(true);
    
    try {
      let fileToUpload = file;
      if (file.size > 2 * 1024 * 1024) {
        fileToUpload = await compressImage(file, 1920, 0.8);
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(fileToUpload);

      let uploadResult = await uploadImage(fileToUpload);
      
      if (!uploadResult.success) {
        uploadResult = await uploadImageFallback(fileToUpload);
      }

      if (uploadResult.success && uploadResult.url) {
        setFormData(prev => ({ ...prev, image: uploadResult.url! }));
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Image upload failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
      setImagePreview('');
      setImageFile(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for multi-day events
    if (formData.isMultiDay) {
      if (!formData.eventDays || formData.eventDays.length === 0) {
        alert('Please add at least one day for this multi-day event.');
        return;
      }

      // Validate each day
      for (let dayIndex = 0; dayIndex < formData.eventDays.length; dayIndex++) {
        const day = formData.eventDays[dayIndex];

        if (!day.title || !day.title.trim()) {
          alert(`Day ${day.dayNumber}: Please enter a day title.`);
          return;
        }

        if (!day.date) {
          alert(`Day ${day.dayNumber}: Please select a date.`);
          return;
        }

        if (!day.time) {
          alert(`Day ${day.dayNumber}: Please select a time.`);
          return;
        }

        if (day.passes.length === 0) {
          alert(`Day ${day.dayNumber}: Please add at least one pass type.`);
          return;
        }

        // Validate passes for this day
        for (let passIndex = 0; passIndex < day.passes.length; passIndex++) {
          const pass = day.passes[passIndex];

          if (!pass.name || !pass.name.trim()) {
            alert(`Day ${day.dayNumber}, Pass #${passIndex + 1}: Please enter a valid pass name.`);
            return;
          }

          if (pass.price === undefined || pass.price === null || isNaN(pass.price) || pass.price < 0) {
            alert(`Day ${day.dayNumber}, Pass "${pass.name}": Please enter a valid price (0 or greater).`);
            return;
          }

          if (pass.available === undefined || pass.available === null || isNaN(pass.available) || pass.available < 1) {
            alert(`Day ${day.dayNumber}, Pass "${pass.name}": Please enter a valid availability (1 or greater).`);
            return;
          }
        }
      }
    } else {
      // Validation for single-day events
      if (formData.passes.length === 0) {
        alert('Please add at least one pass type for this event.');
        return;
      }

      // Validate passes with more specific error messages
      for (let i = 0; i < formData.passes.length; i++) {
        const pass = formData.passes[i];

        if (!pass.name || !pass.name.trim()) {
          alert(`Pass #${i + 1}: Please enter a valid pass name.`);
          return;
        }

        if (pass.price === undefined || pass.price === null || isNaN(pass.price) || pass.price < 0) {
          alert(`Pass "${pass.name}": Please enter a valid price (0 or greater).`);
          return;
        }

        if (pass.available === undefined || pass.available === null || isNaN(pass.available) || pass.available < 1) {
          alert(`Pass "${pass.name}": Please enter a valid availability (1 or greater).`);
          return;
        }
      }
    }

    const eventData = { ...formData };
    if (!eventData.image || eventData.image.trim() === '') {
      eventData.image = '/Assets/Passes_outlet design.jpg';
    }

    try {
      if (editingEvent) {
        // Update existing event
        const response = await fetch(`/api/admin/events?id=${editingEvent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.details || `Failed to update event (${response.status})`);
        }

        alert('Event updated successfully!');
      } else {
        // Create new event
        const response = await fetch('/api/admin/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.details || `Failed to create event (${response.status})`);
        }

        alert('Event added successfully!');
      }

      loadEvents();
      resetForm();
      // Trigger real-time update to homepage
      window.dispatchEvent(new Event('events-updated'));
      setShowForm(false);

    } catch (error) {
      console.error('Error saving event:', error);

      // Try to get more specific error information
      let errorMessage = 'Error saving event. Please try again.';

      if (error instanceof Error) {
        errorMessage = `Error saving event: ${error.message}`;
      }

      // If it's a network error, provide more context
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      alert(errorMessage);
    }
  };

  const addPass = () => {
    setFormData({
      ...formData,
      passes: [
        ...formData.passes,
        {
          id: Date.now().toString(),
          name: '',
          price: 0,
          available: 0
        }
      ]
    });
  };

  const updatePass = (index: number, field: keyof PassType, value: string | number) => {
    const updatedPasses = [...formData.passes];
    updatedPasses[index] = { ...updatedPasses[index], [field]: value };
    setFormData({ ...formData, passes: updatedPasses });
  };

  const removePass = (index: number) => {
    const updatedPasses = formData.passes.filter((_, i) => i !== index);
    setFormData({ ...formData, passes: updatedPasses });
  };

  const formatTime12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Event Management</h1>
          <p className="text-white/60 text-sm sm:text-base">Create, edit, and manage your event cards with advanced carousel settings</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* View Toggle */}
          <div className="flex bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none ${
                viewMode === 'grid'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="hidden sm:inline">Grid</span>
              <span className="sm:hidden">⊞</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none ${
                viewMode === 'list'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="hidden sm:inline">List</span>
              <span className="sm:hidden">☰</span>
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors text-sm sm:text-base justify-center"
          >
            <Plus size={16} />
            <span className="font-medium hidden sm:inline">Add Event</span>
            <span className="font-medium sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Carousel Rules Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
        <h3 className="text-blue-400 font-medium mb-2">📋 Carousel Display Rules</h3>
        <div className="text-blue-300/80 text-sm space-y-1">
          <p>• <strong>1 Event:</strong> Displays as a single featured card (no carousel)</p>
          <p>• <strong>2+ Events:</strong> Displays in carousel with navigation arrows</p>
          <p>• Only <strong>active events</strong> appear on the website homepage</p>
        </div>
      </div>

      {/* Event Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <Calendar className="text-purple-400" size={16} />
            <Calendar className="text-purple-400 hidden sm:block" size={20} />
            <h3 className="text-white/80 font-medium text-xs sm:text-base">Total Events</h3>
          </div>
          <p className="text-white text-xl sm:text-3xl font-bold">{events.length}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <Eye className="text-green-400 sm:hidden" size={16} />
            <Eye className="text-green-400 hidden sm:block" size={20} />
            <h3 className="text-white/80 font-medium text-xs sm:text-base">Active Events</h3>
          </div>
          <p className="text-white text-xl sm:text-3xl font-bold">{events.filter(e => e.isActive).length}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <Ticket className="text-blue-400 sm:hidden" size={16} />
            <Ticket className="text-blue-400 hidden sm:block" size={20} />
            <h3 className="text-white/80 font-medium text-xs sm:text-base">Total Passes</h3>
          </div>
          <p className="text-white text-xl sm:text-3xl font-bold">
            {events.reduce((total, event) => {
              if (event.isMultiDay && event.eventDays) {
                return total + event.eventDays.reduce((dayTotal, day) => dayTotal + (day.passes?.length || 0), 0);
              }
              return total + (event.passes?.length || 0);
            }, 0)}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <DollarSign className="text-yellow-400 sm:hidden" size={16} />
            <DollarSign className="text-yellow-400 hidden sm:block" size={20} />
            <h3 className="text-white/80 font-medium text-xs sm:text-base">Avg. Price</h3>
          </div>
          <p className="text-white text-xl sm:text-3xl font-bold">
            ₹{events.length ? Math.round(events.reduce((sum, e) => sum + e.price, 0) / events.length) : 0}
          </p>
        </div>
      </div>

      {/* Events Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {events.map((event) => (
            <div key={`${event.id}-${refreshKey}`} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-300">
              {/* Event Image */}
              <div className="h-32 sm:h-48 overflow-hidden relative bg-black/10">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                  <span className={`px-1 sm:px-2 py-1 rounded-full text-xs font-medium ${
                    event.isActive
                      ? 'bg-green-500/80 text-white'
                      : 'bg-gray-500/80 text-white'
                  }`}>
                    {event.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-3 sm:p-6">
                <h3 className="text-white text-lg sm:text-xl font-bold mb-2 line-clamp-2">{event.title}</h3>
                <p className="text-white/70 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{event.description}</p>
                
                <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                  <div className="flex items-center gap-1 sm:gap-2 text-white/60 text-xs sm:text-sm">
                    <Calendar size={12} className="sm:hidden" />
                    <Calendar size={14} className="hidden sm:block" />
                    <span className="truncate">{new Date(event.date).toLocaleDateString()} at {formatTime12Hour(event.time)}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-white/60 text-xs sm:text-sm">
                    <MapPin size={12} className="sm:hidden" />
                    <MapPin size={14} className="hidden sm:block" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-white/60 text-xs sm:text-sm">
                    <Ticket size={12} className="sm:hidden" />
                    <Ticket size={14} className="hidden sm:block" />
                    <span>
                      {event.isMultiDay && event.eventDays
                        ? `${event.eventDays.reduce((total, day) => total + (day.passes?.length || 0), 0)} pass types (${event.eventDays.length} days)`
                        : `${event.passes?.length || 0} pass types`
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-white/60 text-xs sm:text-sm">
                    <DollarSign size={12} className="sm:hidden" />
                    <DollarSign size={14} className="hidden sm:block" />
                    <span>From ₹{event.price}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={() => handleEdit(event)}
                    className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm"
                  >
                    <Edit2 size={12} className="sm:hidden" />
                    <Edit2 size={14} className="hidden sm:block" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => handleClone(event)}
                    className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm"
                  >
                    <Copy size={12} className="sm:hidden" />
                    <Copy size={14} className="hidden sm:block" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm"
                  >
                    <Trash2 size={12} className="sm:hidden" />
                    <Trash2 size={14} className="hidden sm:block" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/80 font-medium py-3 sm:py-4 px-3 sm:px-6 text-sm sm:text-base">Event</th>
                  <th className="text-left text-white/80 font-medium py-3 sm:py-4 px-3 sm:px-6 text-sm sm:text-base">Date & Time</th>
                  <th className="text-left text-white/80 font-medium py-3 sm:py-4 px-3 sm:px-6 text-sm sm:text-base">Venue</th>
                  <th className="text-center text-white/80 font-medium py-3 sm:py-4 px-3 sm:px-6 text-sm sm:text-base">Passes</th>
                  <th className="text-center text-white/80 font-medium py-3 sm:py-4 px-3 sm:px-6 text-sm sm:text-base">Status</th>
                  <th className="text-center text-white/80 font-medium py-3 sm:py-4 px-3 sm:px-6 text-sm sm:text-base">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={`${event.id}-${refreshKey}`} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg bg-black/10 overflow-hidden">
                          <Image
                            src={event.image}
                            alt={event.title}
                            fill
                            className="object-contain"
                            sizes="48px"
                          />
                        </div>
                        <div>
                          <p className="text-white font-medium line-clamp-1">{event.title}</p>
                          <p className="text-white/60 text-sm line-clamp-1">{event.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <p className="text-white">{new Date(event.date).toLocaleDateString()}</p>
                        <p className="text-white/60">{formatTime12Hour(event.time)}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-white/80 text-sm line-clamp-1">{event.venue}</p>
                    </td>
                    <td className="text-center py-4 px-6">
                      <span className="text-white">
                        {event.isMultiDay && event.eventDays
                          ? event.eventDays.reduce((total, day) => total + (day.passes?.length || 0), 0)
                          : event.passes?.length || 0
                        }
                      </span>
                    </td>
                    <td className="text-center py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.isActive 
                          ? 'bg-green-500/80 text-white' 
                          : 'bg-gray-500/80 text-white'
                      }`}>
                        {event.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-center py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-2 hover:bg-blue-500/20 rounded text-blue-400 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleClone(event)}
                          className="p-2 hover:bg-green-500/20 rounded text-green-400 transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-2 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 p-6 flex items-center justify-between">
              <h3 className="text-white text-2xl font-bold">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Event Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Base Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 h-24 resize-none"
                  placeholder="Enter event description"
                  required
                />
              </div>

              {/* Date, Time, Venue */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-white/90 text-sm font-medium mb-2">Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    placeholder="Enter venue location"
                    required
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Event Image</label>
                
                {imagePreview && (
                  <div className="relative mb-4 h-48 rounded-xl border border-white/20 bg-black/10 overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Event preview"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                        setFormData({ ...formData, image: '' });
                      }}
                      className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-2 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-white/20 border-dashed rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                          <p className="text-sm text-white/80">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={32} className="text-white/60 mb-4" aria-label="Upload image" />
                          <p className="text-sm text-white/80 font-semibold">Click to upload</p>
                          <p className="text-xs text-white/60">PNG, JPG (MAX. 32MB)</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>
              </div>

              {/* Multi-Day Event Toggle */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="isMultiDay"
                    checked={formData.isMultiDay || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      isMultiDay: e.target.checked,
                      eventDays: e.target.checked ? (formData.eventDays || []) : []
                    })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/30 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="isMultiDay" className="text-white/90 text-sm font-medium">
                    Multi-Day Event
                  </label>
                  {formData.isMultiDay && (
                    <span className="text-purple-400 text-xs">
                      ({formData.eventDays?.length || 0} day(s) configured)
                    </span>
                  )}
                </div>

                {formData.isMultiDay && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-white/90 font-medium">Event Days</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newDay: EventDay = {
                            id: `day_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            dayNumber: (formData.eventDays?.length || 0) + 1,
                            title: `Day ${(formData.eventDays?.length || 0) + 1}`,
                            date: formData.date,
                            time: formData.time,
                            venue: formData.venue,
                            venueIcon: formData.venueIcon,
                            description: '',
                            passes: []
                          };
                          setFormData({
                            ...formData,
                            eventDays: [...(formData.eventDays || []), newDay]
                          });
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors text-sm"
                      >
                        <Plus size={14} />
                        Add Day
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.eventDays?.map((day, dayIndex) => (
                        <div key={day.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="text-white/90 font-medium">Day {day.dayNumber}</h5>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedDays = formData.eventDays?.filter((_, i) => i !== dayIndex) || [];
                                setFormData({
                                  ...formData,
                                  eventDays: updatedDays
                                });
                              }}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <input
                              type="text"
                              placeholder="Day title (e.g., Opening Ceremony)"
                              value={day.title}
                              onChange={(e) => {
                                const updatedDays = [...(formData.eventDays || [])];
                                updatedDays[dayIndex] = { ...day, title: e.target.value };
                                setFormData({ ...formData, eventDays: updatedDays });
                              }}
                              className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                            />
                            <input
                              type="date"
                              value={day.date}
                              onChange={(e) => {
                                const updatedDays = [...(formData.eventDays || [])];
                                updatedDays[dayIndex] = { ...day, date: e.target.value };
                                setFormData({ ...formData, eventDays: updatedDays });
                              }}
                              className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <input
                              type="time"
                              value={day.time}
                              onChange={(e) => {
                                const updatedDays = [...(formData.eventDays || [])];
                                updatedDays[dayIndex] = { ...day, time: e.target.value };
                                setFormData({ ...formData, eventDays: updatedDays });
                              }}
                              className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Venue (if different)"
                              value={day.venue || ''}
                              onChange={(e) => {
                                const updatedDays = [...(formData.eventDays || [])];
                                updatedDays[dayIndex] = { ...day, venue: e.target.value };
                                setFormData({ ...formData, eventDays: updatedDays });
                              }}
                              className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                            />
                          </div>

                          <textarea
                            placeholder="Day description (optional)"
                            value={day.description || ''}
                            onChange={(e) => {
                              const updatedDays = [...(formData.eventDays || [])];
                              updatedDays[dayIndex] = { ...day, description: e.target.value };
                              setFormData({ ...formData, eventDays: updatedDays });
                            }}
                            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm h-16 resize-none mb-3"
                          />

                          {/* Day-specific passes */}
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-white/80 text-sm font-medium">
                                Day {day.dayNumber} Passes ({day.passes.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newPass: PassType = {
                                    id: `pass_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                    name: '',
                                    price: 0,
                                    available: 0,
                                    dayId: day.id
                                  };
                                  const updatedDays = [...(formData.eventDays || [])];
                                  updatedDays[dayIndex] = {
                                    ...day,
                                    passes: [...day.passes, newPass]
                                  };
                                  setFormData({ ...formData, eventDays: updatedDays });
                                }}
                                className="flex items-center gap-1 px-2 py-1 bg-purple-600/50 hover:bg-purple-600 text-white rounded-lg transition-colors text-xs"
                              >
                                <Plus size={12} />
                                Add Pass
                              </button>
                            </div>

                            <div className="space-y-2">
                              {day.passes.map((pass, passIndex) => (
                                <div key={pass.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                                  <input
                                    type="text"
                                    placeholder="Pass name"
                                    value={pass.name}
                                    onChange={(e) => {
                                      const updatedDays = [...(formData.eventDays || [])];
                                      updatedDays[dayIndex].passes[passIndex] = { ...pass, name: e.target.value };
                                      setFormData({ ...formData, eventDays: updatedDays });
                                    }}
                                    className="px-2 py-1 bg-white/5 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-xs"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Price"
                                    value={pass.price}
                                    onChange={(e) => {
                                      const updatedDays = [...(formData.eventDays || [])];
                                      updatedDays[dayIndex].passes[passIndex] = { ...pass, price: e.target.value === '' ? 0 : Number(e.target.value) };
                                      setFormData({ ...formData, eventDays: updatedDays });
                                    }}
                                    className="px-2 py-1 bg-white/5 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-xs"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Available"
                                    value={pass.available}
                                    onChange={(e) => {
                                      const updatedDays = [...(formData.eventDays || [])];
                                      updatedDays[dayIndex].passes[passIndex] = { ...pass, available: e.target.value === '' ? 1 : Number(e.target.value) };
                                      setFormData({ ...formData, eventDays: updatedDays });
                                    }}
                                    className="px-2 py-1 bg-white/5 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedDays = [...(formData.eventDays || [])];
                                      updatedDays[dayIndex].passes = day.passes.filter((_, i) => i !== passIndex);
                                      setFormData({ ...formData, eventDays: updatedDays });
                                    }}
                                    className="text-red-400 hover:text-red-300 transition-colors text-xs"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pass Types (for single-day events) */}
              {!formData.isMultiDay && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <label className="block text-white/90 text-sm font-medium">Pass Types</label>
                    <p className="text-white/60 text-xs mt-1">
                      {formData.passes.length === 0 ? 'Add at least one pass type' : `${formData.passes.length} pass type(s) configured`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addPass}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors text-sm"
                  >
                    <Plus size={14} />
                    Add Pass
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.passes.map((pass, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <input
                          type="text"
                          placeholder="Pass name (e.g., VIP, General)"
                          value={pass.name}
                          onChange={(e) => updatePass(index, 'name', e.target.value)}
                          className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Price (₹)"
                          value={pass.price}
                          onChange={(e) => updatePass(index, 'price', e.target.value === '' ? 0 : Number(e.target.value))}
                          className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Available tickets"
                          value={pass.available}
                          onChange={(e) => updatePass(index, 'available', e.target.value === '' ? 1 : Number(e.target.value))}
                          className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePass(index)}
                        className="flex items-center gap-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
                      >
                        <Trash2 size={14} />
                        Remove Pass
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 text-white/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <span className="font-medium">Make this event active (visible on website)</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-white/20">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium"
                >
                  <Save size={16} />
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto">
            <Calendar size={64} className="text-white/40 mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-4 text-white">No Events Yet</h3>
            <p className="text-white/70 mb-6">
              Create your first event to start managing your event portfolio.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium mx-auto"
            >
              <Plus size={16} />
              Create First Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}