'use client';

import { useState, useEffect } from 'react';
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
  Image,
  Save,
  X
} from 'lucide-react';
import { getAllEvents, addEvent, updateEvent, deleteEvent, EventData, PassType } from '@/lib/data';
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

  const loadEvents = () => {
    const allEvents = getAllEvents();
    setEvents([...allEvents]);
    setRefreshKey(prev => prev + 1);
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
      ]
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
      passes: [...event.passes]
    });
    setImagePreview(event.image);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEvent(id);
      loadEvents();
    }
  };

  const handleClone = (event: EventData) => {
    const clonedEvent = {
      ...event,
      title: `${event.title} (Copy)`,
      passes: event.passes.map(pass => ({
        ...pass,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      }))
    };
    delete (clonedEvent as any).id;
    addEvent(clonedEvent);
    loadEvents();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.passes.length === 0) {
      alert('Please add at least one pass type for this event.');
      return;
    }

    const invalidPass = formData.passes.find(pass =>
      !pass.name.trim() || pass.price < 0 || pass.available < 0
    );
    if (invalidPass) {
      alert('Please ensure all passes have valid name, price, and availability.');
      return;
    }

    const eventData = { ...formData };
    if (!eventData.image || eventData.image.trim() === '') {
      eventData.image = '/Assets/Passes_outlet design.jpg';
    }

    try {
      if (editingEvent) {
        updateEvent(editingEvent.id, eventData);
        alert('Event updated successfully!');
      } else {
        addEvent(eventData);
        alert('Event added successfully!');
      }
      
      loadEvents();
      resetForm();
      window.dispatchEvent(new Event('events-updated'));
      
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event. Please try again.');
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Event Management</h1>
          <p className="text-white/60">Create, edit, and manage your event cards with advanced carousel settings</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* View Toggle */}
          <div className="flex bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              List
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
          >
            <Plus size={16} />
            <span className="font-medium">Add Event</span>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="text-purple-400" size={20} />
            <h3 className="text-white/80 font-medium">Total Events</h3>
          </div>
          <p className="text-white text-3xl font-bold">{events.length}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Eye className="text-green-400" size={20} />
            <h3 className="text-white/80 font-medium">Active Events</h3>
          </div>
          <p className="text-white text-3xl font-bold">{events.filter(e => e.isActive).length}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Ticket className="text-blue-400" size={20} />
            <h3 className="text-white/80 font-medium">Total Passes</h3>
          </div>
          <p className="text-white text-3xl font-bold">
            {events.reduce((total, event) => total + event.passes.length, 0)}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="text-yellow-400" size={20} />
            <h3 className="text-white/80 font-medium">Avg. Price</h3>
          </div>
          <p className="text-white text-3xl font-bold">
            ₹{events.length ? Math.round(events.reduce((sum, e) => sum + e.price, 0) / events.length) : 0}
          </p>
        </div>
      </div>

      {/* Events Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={`${event.id}-${refreshKey}`} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-300">
              {/* Event Image */}
              <div className="h-48 overflow-hidden relative">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.isActive 
                      ? 'bg-green-500/80 text-white' 
                      : 'bg-gray-500/80 text-white'
                  }`}>
                    {event.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-6">
                <h3 className="text-white text-xl font-bold mb-2 line-clamp-2">{event.title}</h3>
                <p className="text-white/70 text-sm mb-4 line-clamp-2">{event.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Calendar size={14} />
                    <span>{new Date(event.date).toLocaleDateString()} at {formatTime12Hour(event.time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <MapPin size={14} />
                    <span className="line-clamp-1">{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Ticket size={14} />
                    <span>{event.passes.length} pass types</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <DollarSign size={14} />
                    <span>From ₹{event.price}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(event)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-colors text-sm"
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleClone(event)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl transition-colors text-sm"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors text-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/80 font-medium py-4 px-6">Event</th>
                  <th className="text-left text-white/80 font-medium py-4 px-6">Date & Time</th>
                  <th className="text-left text-white/80 font-medium py-4 px-6">Venue</th>
                  <th className="text-center text-white/80 font-medium py-4 px-6">Passes</th>
                  <th className="text-center text-white/80 font-medium py-4 px-6">Status</th>
                  <th className="text-center text-white/80 font-medium py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={`${event.id}-${refreshKey}`} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
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
                      <span className="text-white">{event.passes.length}</span>
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
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
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
                  <div className="relative mb-4">
                    <img 
                      src={imagePreview} 
                      alt="Event preview" 
                      className="w-full h-48 object-cover rounded-xl border border-white/20"
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
                          <Image size={32} className="text-white/60 mb-4" />
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

              {/* Pass Types */}
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
                          onChange={(e) => updatePass(index, 'price', Number(e.target.value))}
                          className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Available tickets"
                          value={pass.available}
                          onChange={(e) => updatePass(index, 'available', Number(e.target.value))}
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