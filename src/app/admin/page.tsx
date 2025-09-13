'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isValidSession } from '@/lib/auth';
import { getAllEvents, addEvent, updateEvent, deleteEvent, EventData, PassType } from '@/lib/data';
import { uploadImage, uploadImageFallback, compressImage } from '@/lib/imageUpload';
import Button from '@/components/Button';
import ShaderBackground from '@/components/ShaderBackground';
import GrainyOverlay from '@/components/GrainyOverlay';
import ShimmerOverlay from '@/components/ShimmerOverlay';

// Helper function to format 24-hour time to 12-hour format
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  const [formData, setFormData] = useState({
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
    ] as PassType[] // Start with one default pass
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('session');
    if (session && isValidSession(session)) {
      setIsAuthenticated(true);
      loadEvents();
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const loadEvents = () => {
    const allEvents = getAllEvents();
    console.log('Admin: loadEvents called, found events:', allEvents.length);
    console.log('Admin: Events data:', allEvents.map(e => ({ id: e.id, title: e.title })));
    setEvents([...allEvents]); // Force new array reference
    setRefreshKey(prev => prev + 1); // Force re-render
  };

  const handleSignOut = () => {
    localStorage.removeItem('session');
    router.push('/');
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
      ] // Start with one default pass
    });
    setSelectedEvent(null);
    setIsEditing(false);
    setImageFile(null);
    setImagePreview('');
    setIsUploadingImage(false);
  };

  const handleEdit = (event: EventData) => {
    setSelectedEvent(event);
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
    setIsEditing(true);
    setImageFile(null);
    setImagePreview(event.image);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 32MB for cloud, 5MB for fallback)
    if (file.size > 32 * 1024 * 1024) {
      alert('File size must be less than 32MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setImageFile(file);
    setIsUploadingImage(true);
    
    try {
      // Compress image if larger than 2MB
      let fileToUpload = file;
      if (file.size > 2 * 1024 * 1024) {
        fileToUpload = await compressImage(file, 1920, 0.8);
      }
      
      // Create preview immediately
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(fileToUpload);

      // Try cloud upload first
      let uploadResult = await uploadImage(fileToUpload);
      
      // If cloud upload fails, fallback to base64
      if (!uploadResult.success) {
        console.warn('Cloud upload failed, using fallback:', uploadResult.error);
        uploadResult = await uploadImageFallback(fileToUpload);
      }

      if (uploadResult.success && uploadResult.url) {
        setFormData(prev => ({ ...prev, image: uploadResult.url! }));
        setIsUploadingImage(false);
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Image upload failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
      setIsUploadingImage(false);
      setImagePreview('');
      setImageFile(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== ADMIN FORM SUBMISSION STARTED ===');
    console.log('Admin: Form event prevented default');
    console.log('Admin: Form data:', JSON.stringify(formData, null, 2));
    console.log('Admin: Passes count:', formData.passes.length);
    console.log('Admin: Form fields check:', {
      title: !!formData.title,
      description: !!formData.description,
      date: !!formData.date,
      time: !!formData.time,
      venue: !!formData.venue,
      image: !!formData.image,
      passesCount: formData.passes.length
    });

    // Validate that at least one pass is added
    if (formData.passes.length === 0) {
      console.log('Admin: No passes added - showing alert');
      alert('Please add at least one pass type for this event.');
      return;
    }

    // Validate that all passes have required fields
    const invalidPass = formData.passes.find(pass =>
      !pass.name.trim() || pass.price < 0 || pass.available < 0
    );
    if (invalidPass) {
      console.log('Admin: Invalid pass found:', invalidPass);
      alert('Please ensure all passes have valid name, price (can be 0 for free events), and availability.');
      return;
    }

    // Auto-set base price to minimum pass price if not already set
    const minPassPrice = Math.min(...formData.passes.map(p => p.price));
    if (formData.price === 0 && minPassPrice > 0) {
      formData.price = minPassPrice;
      console.log('Admin: Auto-set base price to:', minPassPrice);
    }

    console.log('Admin: Validation passed, proceeding with submission');

    // Use default image if none provided
    const eventData = { ...formData };
    if (!eventData.image || eventData.image.trim() === '') {
      eventData.image = '/Assets/Passes_outlet design.jpg'; // Default event image
      console.log('Admin: Using default image');
    }

    try {
      if (selectedEvent) {
        updateEvent(selectedEvent.id, eventData);
        console.log('Event updated successfully:', selectedEvent.id);
      } else {
        const newEvent = addEvent(eventData);
        console.log('Event added successfully:', newEvent);
      }
      
      loadEvents();
      resetForm();
      
      // Force a global events update to synchronize homepage
      window.dispatchEvent(new Event('events-updated'));
      
      alert(selectedEvent ? 'Event updated successfully!' : 'Event added successfully!');
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event. Please try again.');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      console.log('Admin: Attempting to delete event:', id);
      const success = deleteEvent(id);
      console.log('Admin: Delete result:', success);
      
      // Force state update by creating new array and updating refresh key
      const updatedEvents = getAllEvents();
      console.log('Admin: Force updating events state with:', updatedEvents.length, 'events');
      setEvents([...updatedEvents]);
      setRefreshKey(prev => prev + 1); // Force re-render
      
      // Force a global events update to synchronize homepage
      window.dispatchEvent(new Event('events-updated'));
      
      // Also reset form if we were editing the deleted event
      if (selectedEvent && selectedEvent.id === id) {
        console.log('Admin: Deleted event was being edited, resetting form');
        resetForm();
      }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-950 via-violet-950 via-purple-900 to-indigo-950">
      <ShaderBackground />
      <GrainyOverlay />
      <ShimmerOverlay />
      
      <div className="relative z-10 min-h-screen pt-20 p-4">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 font-montserrat">Admin Dashboard</h1>
              <p className="text-white/80">Manage your events and bookings</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button onClick={() => router.push('/')} className="px-4 py-2 w-full sm:w-auto">
                View Site
              </Button>
              <Button onClick={handleSignOut} className="px-4 py-2 w-full sm:w-auto">
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
          {/* Event Form */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 font-montserrat">
              {isEditing ? 'Edit Event' : 'Add New Event'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  required
                />
              </div>

              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 h-24"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="block text-white/90 text-sm font-medium mb-2">Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Venue Icon</label>
                  <select
                    value={formData.venueIcon}
                    onChange={(e) => setFormData({ ...formData, venueIcon: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="📍">📍 Default</option>
                    <option value="🏫">🏫 College</option>
                    <option value="🏛️">🏛️ Hall</option>
                    <option value="🏟️">🏟️ Stadium</option>
                    <option value="🎭">🎭 Theater</option>
                    <option value="🎪">🎪 Arena</option>
                    <option value="🏢">🏢 Convention Center</option>
                    <option value="🌴">🌴 Outdoor</option>
                    <option value="🏖️">🏖️ Beach</option>
                    <option value="🏔️">🏔️ Mountain</option>
                    <option value="🏨">🏨 Hotel</option>
                    <option value="🏰">🏰 Palace</option>
                    <option value="🕌">🕌 Heritage</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Base Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center space-x-2 text-white/90">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Event Image</label>
                <div className="space-y-4">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Event preview" 
                        className="w-full h-32 object-cover rounded-xl border border-white/20"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setImageFile(null);
                          setFormData({ ...formData, image: '' });
                        }}
                        className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* File Upload */}
                  <div className="flex items-center justify-center w-full">
                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-white/20 border-dashed rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isUploadingImage ? (
                          <>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                            <p className="mb-2 text-sm text-white/80">Uploading image...</p>
                          </>
                        ) : (
                          <>
                            <svg className="w-8 h-8 mb-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mb-2 text-sm text-white/80">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-white/60">PNG, JPG or GIF (MAX. 32MB)</p>
                            <p className="text-xs text-white/50">Auto-compresses large images • Cloud storage with fallback</p>
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
                  <Button type="button" onClick={addPass} className="px-3 py-1 text-sm">
                    Add Pass
                  </Button>
                </div>

                {formData.passes.map((pass, index) => (
                  <div key={index} className="bg-white/5 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-3 gap-4 mb-2">
                      <input
                        type="text"
                        placeholder="Pass name"
                        value={pass.name}
                        onChange={(e) => updatePass(index, 'name', e.target.value)}
                        className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                      />
                      <input
                        type="number"
                        placeholder="Price (₹)"
                        value={pass.price}
                        onChange={(e) => updatePass(index, 'price', Number(e.target.value))}
                        className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                      />
                      <input
                        type="number"
                        placeholder="Available"
                        value={pass.available}
                        onChange={(e) => updatePass(index, 'available', Number(e.target.value))}
                        className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => removePass(index)}
                      className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 w-full sm:w-auto"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" className="flex-1 w-full sm:w-auto">
                  {isEditing ? 'Update Event' : 'Add Event'}
                </Button>
                {isEditing && (
                  <Button type="button" onClick={resetForm} className="px-6 w-full sm:w-auto">
                    Cancel
                  </Button>
                )}
              </div>

              {/* Debug Test Button */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  onClick={() => {
                    console.log('Debug: Creating quick test event');
                    const testEventData = {
                      title: `Test Event ${Date.now()}`,
                      description: 'This is a test event created for debugging',
                      date: new Date().toISOString().split('T')[0],
                      time: '19:00',
                      venue: 'Test Venue',
                      venueIcon: '🎪',
                      price: 100,
                      image: '/Assets/Passes_outlet design.jpg',
                      isActive: true,
                      passes: [
                        {
                          id: Date.now().toString(),
                          name: 'Test Pass',
                          price: 100,
                          available: 50
                        }
                      ]
                    };
                    try {
                      const newEvent = addEvent(testEventData);
                      console.log('Debug: Test event created:', newEvent);
                      loadEvents();
                      window.dispatchEvent(new Event('events-updated'));
                      alert('Debug test event created successfully!');
                    } catch (error) {
                      console.error('Debug: Error creating test event:', error);
                      alert('Debug test event creation failed!');
                    }
                  }}
                  className="px-4 py-2 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 w-full"
                >
                  🧪 Debug: Create Test Event
                </Button>
              </div>
            </form>
          </div>

          {/* Events List */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white font-montserrat">All Events</h2>
                <p className="text-white/60 text-sm">
                  {events.length} event{events.length !== 1 ? 's' : ''} total
                </p>
              </div>
              <Button
                onClick={loadEvents}
                className="px-4 py-2 text-sm bg-blue-500/20 hover:bg-blue-500/30"
              >
                Refresh List
              </Button>
            </div>

            <div className="space-y-4" key={refreshKey}>
              {events.map((event) => (
                <div key={`${event.id}-${refreshKey}`} className="bg-white/5 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2 font-montserrat">{event.title}</h3>
                      <p className="text-white/70 text-sm mb-2">{event.description}</p>
                      <div className="text-white/60 text-sm space-y-1">
                        <p>📅 {new Date(event.date).toLocaleDateString()} at {formatTime12Hour(event.time)}</p>
                        <p>{event.venueIcon || '📍'} {event.venue}</p>
                        <p>💰 From ₹{event.price}</p>
                        <p>🎟️ {event.passes.length} pass types</p>
                        <p>Status: <span className={event.isActive ? 'text-green-400' : 'text-red-400'}>{event.isActive ? 'Active' : 'Inactive'}</span></p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 sm:ml-4">
                      <Button
                        onClick={() => handleEdit(event)}
                        className="px-3 py-1 text-sm w-full sm:w-auto"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(event.id)}
                        className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 w-full sm:w-auto"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <div className="text-center text-white/60 py-8">
                  No events found. Add your first event!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}