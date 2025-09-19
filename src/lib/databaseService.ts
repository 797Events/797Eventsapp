import { supabase, DatabaseEvent, DatabasePass, DatabaseBooking, DatabaseUser, DatabaseInfluencer } from './supabase';
import { EventData, PassType } from './data';

export class DatabaseService {

  // Events Operations
  async getAllEvents(): Promise<EventData[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          passes(*)
        `)
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (error) throw error;

      return this.formatEventsData(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  async getEventById(id: string): Promise<EventData | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          passes(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.formatEventData(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  }

  async createEvent(eventData: Omit<EventData, 'id' | 'passes'>): Promise<EventData | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          time: eventData.time,
          venue: eventData.venue,
          venue_icon: eventData.venueIcon,
          price: eventData.price,
          image: eventData.image,
          is_active: eventData.isActive
        })
        .select()
        .single();

      if (error) throw error;

      return this.formatEventData({ ...data, passes: [] });
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  }

  async updateEvent(id: string, updates: Partial<EventData>): Promise<EventData | null> {
    try {
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.date) updateData.date = updates.date;
      if (updates.time) updateData.time = updates.time;
      if (updates.venue) updateData.venue = updates.venue;
      if (updates.venueIcon) updateData.venue_icon = updates.venueIcon;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.image) updateData.image = updates.image;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          passes(*)
        `)
        .single();

      if (error) throw error;

      return this.formatEventData(data);
    } catch (error) {
      console.error('Error updating event:', error);
      return null;
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }

  // Pass Operations
  async createPass(eventId: string, passData: Omit<PassType, 'id'>): Promise<PassType | null> {
    try {
      const { data, error } = await supabase
        .from('passes')
        .insert({
          event_id: eventId,
          name: passData.name,
          price: passData.price,
          available: passData.available
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        price: data.price,
        available: data.available
      };
    } catch (error) {
      console.error('Error creating pass:', error);
      return null;
    }
  }

  async updatePass(passId: string, updates: Partial<PassType>): Promise<PassType | null> {
    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.available !== undefined) updateData.available = updates.available;

      const { data, error } = await supabase
        .from('passes')
        .update(updateData)
        .eq('id', passId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        price: data.price,
        available: data.available
      };
    } catch (error) {
      console.error('Error updating pass:', error);
      return null;
    }
  }

  async deletePass(passId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('passes')
        .delete()
        .eq('id', passId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting pass:', error);
      return false;
    }
  }

  // Booking Operations
  async createBooking(bookingData: {
    eventId: string;
    passId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    quantity: number;
    totalAmount: number;
    paymentId?: string;
    userId?: string;
  }): Promise<DatabaseBooking | null> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          event_id: bookingData.eventId,
          pass_id: bookingData.passId,
          user_id: bookingData.userId,
          customer_name: bookingData.customerName,
          customer_email: bookingData.customerEmail,
          customer_phone: bookingData.customerPhone,
          quantity: bookingData.quantity,
          total_amount: bookingData.totalAmount,
          payment_id: bookingData.paymentId,
          booking_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      return null;
    }
  }

  async updateBookingStatus(bookingId: string, status: 'pending' | 'confirmed' | 'cancelled', paymentId?: string): Promise<boolean> {
    try {
      const updateData: any = { booking_status: status };
      if (paymentId) updateData.payment_id = paymentId;

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      // If confirmed, update pass sold count
      if (status === 'confirmed') {
        const { data: booking } = await supabase
          .from('bookings')
          .select('pass_id, quantity')
          .eq('id', bookingId)
          .single();

        if (booking) {
          await supabase.rpc('increment_pass_sold', {
            pass_id: booking.pass_id,
            quantity: booking.quantity
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating booking status:', error);
      return false;
    }
  }

  async getBookingsByEmail(email: string): Promise<DatabaseBooking[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          events(title, date, time, venue),
          passes(name, price)
        `)
        .eq('customer_email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }

  async getAllBookings(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          events(title, date, time, venue),
          passes(name, price)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all bookings:', error);
      return [];
    }
  }

  async getUserBookings(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          events(title, date, time, venue),
          passes(name, price)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      return [];
    }
  }

  async updateBooking(bookingId: string, updates: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating booking:', error);
      return null;
    }
  }

  // Analytics Operations
  async getDashboardStats() {
    try {
      // Get total events
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Get active events
      const { count: activeEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get confirmed bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('quantity, total_amount')
        .eq('booking_status', 'confirmed');

      const totalTickets = bookings?.reduce((sum, booking) => sum + booking.quantity, 0) || 0;
      const totalRevenue = bookings?.reduce((sum, booking) => sum + booking.total_amount, 0) || 0;
      const averageTicketPrice = totalTickets > 0 ? totalRevenue / totalTickets : 0;

      // Get sales data for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: salesData } = await supabase
        .from('bookings')
        .select('created_at, quantity, total_amount')
        .eq('booking_status', 'confirmed')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      return {
        totalEvents: totalEvents || 0,
        activeEvents: activeEvents || 0,
        totalTickets,
        totalRevenue,
        averageTicketPrice: Math.round(averageTicketPrice),
        salesData: salesData || []
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalEvents: 0,
        activeEvents: 0,
        totalTickets: 0,
        totalRevenue: 0,
        averageTicketPrice: 0,
        salesData: []
      };
    }
  }

  // User Operations
  async createUser(userData: {
    email: string;
    fullName: string;
    phone?: string;
    role?: 'admin' | 'customer';
  }): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          full_name: userData.fullName,
          phone: userData.phone,
          role: userData.role || 'customer'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  // Helper methods
  private formatEventsData(data: any[]): EventData[] {
    return data.map(event => this.formatEventData(event));
  }

  private formatEventData(data: any): EventData {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time,
      venue: data.venue,
      venueIcon: data.venue_icon,
      price: data.price,
      image: data.image,
      isActive: data.is_active,
      passes: (data.passes || []).map((pass: any) => ({
        id: pass.id,
        name: pass.name,
        price: pass.price,
        available: pass.available
      }))
    };
  }

  // Database initialization
  async initializeDatabase(): Promise<boolean> {
    try {
      // Check if tables exist by trying to select from events
      const { error } = await supabase
        .from('events')
        .select('id')
        .limit(1);

      if (error && error.message.includes('relation "events" does not exist')) {
        console.log('🗄️ Initializing database tables...');
        // Tables don't exist, need to create them
        // Note: In production, you would run the SQL through Supabase dashboard
        return false; // Return false to indicate manual setup needed
      }

      console.log('✅ Database connection verified');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }
}

export const db = new DatabaseService();