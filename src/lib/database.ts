import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

export interface EventData {
  id: string;
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

export interface PassType {
  id: string;
  name: string;
  price: number;
  available: number;
}

export interface InfluencerData {
  id: string;
  name: string;
  code: string;
  ticketsSold: number;
  revenue: number;
  conversionRate: number;
  createdAt: string;
}

// Initialize database tables
export const initDatabase = async () => {
  const client = await pool.connect();

  try {
    // Create events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        date VARCHAR(20) NOT NULL,
        time VARCHAR(10) NOT NULL,
        venue VARCHAR(200) NOT NULL,
        venue_icon VARCHAR(10) DEFAULT '🏢',
        price INTEGER NOT NULL,
        image VARCHAR(500) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create pass_types table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pass_types (
        id SERIAL PRIMARY KEY,
        pass_id VARCHAR(50) UNIQUE NOT NULL,
        event_id VARCHAR(50) REFERENCES events(event_id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        price INTEGER NOT NULL,
        available INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR(50) UNIQUE NOT NULL,
        event_id VARCHAR(50) REFERENCES events(event_id),
        pass_id VARCHAR(50) REFERENCES pass_types(pass_id),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        quantity INTEGER NOT NULL,
        total_amount INTEGER NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending',
        payment_id VARCHAR(100),
        qr_code TEXT,
        attendance_status VARCHAR(20) DEFAULT 'not_attended',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR(50) REFERENCES bookings(booking_id),
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        scanned_by VARCHAR(50) DEFAULT 'admin'
      )
    `);

    // Create influencers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS influencers (
        id SERIAL PRIMARY KEY,
        influencer_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        tickets_sold INTEGER DEFAULT 0,
        revenue INTEGER DEFAULT 0,
        conversion_rate DECIMAL(5,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables created successfully!');
  } catch (error) {
    console.error('❌ Database setup error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Database operations
export const db = {
  // Events management
  async getAllEvents(): Promise<EventData[]> {
    const client = await pool.connect();
    try {
      const eventsResult = await client.query('SELECT * FROM events ORDER BY created_at DESC');
      const events: EventData[] = [];

      for (const event of eventsResult.rows) {
        // Get pass types for each event
        const passesResult = await client.query(
          'SELECT * FROM pass_types WHERE event_id = $1',
          [event.event_id]
        );

        events.push({
          id: event.event_id,
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          venue: event.venue,
          venueIcon: event.venue_icon,
          price: event.price,
          image: event.image,
          isActive: event.is_active,
          passes: passesResult.rows.map(pass => ({
            id: pass.pass_id,
            name: pass.name,
            price: pass.price,
            available: pass.available
          }))
        });
      }

      return events;
    } finally {
      client.release();
    }
  },

  async getActiveEvents(): Promise<EventData[]> {
    const client = await pool.connect();
    try {
      const eventsResult = await client.query(
        'SELECT * FROM events WHERE is_active = true ORDER BY date ASC'
      );
      const events: EventData[] = [];

      for (const event of eventsResult.rows) {
        const passesResult = await client.query(
          'SELECT * FROM pass_types WHERE event_id = $1',
          [event.event_id]
        );

        events.push({
          id: event.event_id,
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          venue: event.venue,
          venueIcon: event.venue_icon,
          price: event.price,
          image: event.image,
          isActive: event.is_active,
          passes: passesResult.rows.map(pass => ({
            id: pass.pass_id,
            name: pass.name,
            price: pass.price,
            available: pass.available
          }))
        });
      }

      return events;
    } finally {
      client.release();
    }
  },

  async createEvent(eventData: Omit<EventData, 'id'>): Promise<EventData> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Insert event
      await client.query(`
        INSERT INTO events (event_id, title, description, date, time, venue, venue_icon, price, image, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        eventId,
        eventData.title,
        eventData.description,
        eventData.date,
        eventData.time,
        eventData.venue,
        eventData.venueIcon || '🏢',
        eventData.price,
        eventData.image,
        eventData.isActive !== undefined ? eventData.isActive : true
      ]);

      // Insert pass types
      for (const pass of eventData.passes || []) {
        const passId = `pass_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await client.query(`
          INSERT INTO pass_types (pass_id, event_id, name, price, available)
          VALUES ($1, $2, $3, $4, $5)
        `, [passId, eventId, pass.name, pass.price, pass.available]);
      }

      await client.query('COMMIT');
      console.log('✅ Event created successfully:', eventId);

      return { id: eventId, ...eventData };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateEvent(eventId: string, updates: Partial<EventData>): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update event
      const setClause: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      if (updates.title !== undefined) {
        setClause.push(`title = $${valueIndex++}`);
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        setClause.push(`description = $${valueIndex++}`);
        values.push(updates.description);
      }
      if (updates.date !== undefined) {
        setClause.push(`date = $${valueIndex++}`);
        values.push(updates.date);
      }
      if (updates.time !== undefined) {
        setClause.push(`time = $${valueIndex++}`);
        values.push(updates.time);
      }
      if (updates.venue !== undefined) {
        setClause.push(`venue = $${valueIndex++}`);
        values.push(updates.venue);
      }
      if (updates.venueIcon !== undefined) {
        setClause.push(`venue_icon = $${valueIndex++}`);
        values.push(updates.venueIcon);
      }
      if (updates.price !== undefined) {
        setClause.push(`price = $${valueIndex++}`);
        values.push(updates.price);
      }
      if (updates.image !== undefined) {
        setClause.push(`image = $${valueIndex++}`);
        values.push(updates.image);
      }
      if (updates.isActive !== undefined) {
        setClause.push(`is_active = $${valueIndex++}`);
        values.push(updates.isActive);
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(eventId);

      const query = `UPDATE events SET ${setClause.join(', ')} WHERE event_id = $${valueIndex}`;
      await client.query(query, values);

      // Update passes if provided
      if (updates.passes) {
        // Delete existing passes
        await client.query('DELETE FROM pass_types WHERE event_id = $1', [eventId]);

        // Insert new passes
        for (const pass of updates.passes) {
          const passId = pass.id || `pass_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await client.query(`
            INSERT INTO pass_types (pass_id, event_id, name, price, available)
            VALUES ($1, $2, $3, $4, $5)
          `, [passId, eventId, pass.name, pass.price, pass.available]);
        }
      }

      await client.query('COMMIT');
      console.log('✅ Event updated successfully:', eventId);

      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async deleteEvent(eventId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM events WHERE event_id = $1', [eventId]);
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  },

  // Influencer methods
  async getAllInfluencers(): Promise<InfluencerData[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT
          influencer_id as id,
          name,
          code,
          tickets_sold as "ticketsSold",
          revenue,
          conversion_rate as "conversionRate",
          created_at as "createdAt"
        FROM influencers
        ORDER BY created_at DESC
      `);

      return result.rows.map(row => ({
        ...row,
        createdAt: row.createdAt.toISOString()
      }));
    } finally {
      client.release();
    }
  },

  async createInfluencer(data: Omit<InfluencerData, 'id' | 'createdAt'>): Promise<InfluencerData> {
    const client = await pool.connect();
    try {
      const influencerId = `inf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = await client.query(`
        INSERT INTO influencers (influencer_id, name, code, tickets_sold, revenue, conversion_rate)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          influencer_id as id,
          name,
          code,
          tickets_sold as "ticketsSold",
          revenue,
          conversion_rate as "conversionRate",
          created_at as "createdAt"
      `, [influencerId, data.name, data.code, data.ticketsSold, data.revenue, data.conversionRate]);

      const row = result.rows[0];
      return {
        ...row,
        createdAt: row.createdAt.toISOString()
      };
    } finally {
      client.release();
    }
  },

  async updateInfluencer(id: string, data: Partial<Omit<InfluencerData, 'id' | 'createdAt'>>): Promise<InfluencerData | null> {
    const client = await pool.connect();
    try {
      const setParts = [];
      const values = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        setParts.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.code !== undefined) {
        setParts.push(`code = $${paramIndex++}`);
        values.push(data.code);
      }
      if (data.ticketsSold !== undefined) {
        setParts.push(`tickets_sold = $${paramIndex++}`);
        values.push(data.ticketsSold);
      }
      if (data.revenue !== undefined) {
        setParts.push(`revenue = $${paramIndex++}`);
        values.push(data.revenue);
      }
      if (data.conversionRate !== undefined) {
        setParts.push(`conversion_rate = $${paramIndex++}`);
        values.push(data.conversionRate);
      }

      if (setParts.length === 0) return null;

      values.push(id);
      const result = await client.query(`
        UPDATE influencers
        SET ${setParts.join(', ')}
        WHERE influencer_id = $${paramIndex}
        RETURNING
          influencer_id as id,
          name,
          code,
          tickets_sold as "ticketsSold",
          revenue,
          conversion_rate as "conversionRate",
          created_at as "createdAt"
      `, values);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        ...row,
        createdAt: row.createdAt.toISOString()
      };
    } finally {
      client.release();
    }
  },

  async deleteInfluencer(id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM influencers WHERE influencer_id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }
};

export default pool;