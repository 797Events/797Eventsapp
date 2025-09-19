import { supabase, getSupabaseAdmin } from './supabase';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'customer' | 'guard' | 'influencer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getUsers(): Promise<User[]> {
  try {
    const response = await fetch('/api/admin/users');
    const result = await response.json();

    if (!response.ok) {
      console.error('Error fetching users:', result.error);
      return [];
    }

    return result.users || [];
  } catch (error) {
    console.error('Error in getUsers:', error);
    return [];
  }
}

export async function createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'> & { password?: string }): Promise<User | null> {
  try {
    // Generate a default password hash if none provided
    const defaultPassword = userData.password || '797@default';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const userDataWithHash = {
      ...userData,
      password_hash: passwordHash
    };

    // Remove password from the data before inserting
    delete userDataWithHash.password;

    const { data, error } = await supabase
      .from('users')
      .insert([userDataWithHash])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createUser:', error);
    return null;
  }
}

export async function createUserWithAuth(userData: {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
}): Promise<User | null> {
  try {
    console.log('🔧 Creating user via API:', { email: userData.email, role: userData.role });

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ API creation failed:', result.error);
      throw new Error(result.error);
    }

    console.log('✅ User created successfully via API');
    console.log(`📧 User can now login with email: ${result.credentials.email} and password: ${result.credentials.password}`);

    return result.user;
  } catch (error) {
    console.error('❌ Error creating user:', error);
    return null;
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUser:', error);
    return null;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return false;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    return null;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user by id:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
}

// User management instance
export const userManager = {
  getUsers,
  createUser,
  createUserWithAuth,
  updateUser,
  deleteUser,
  getUserByEmail,
  getUserById
};

// Permissions system
export const permissions = {
  canManageUsers: (role: string) => role === 'admin',
  canManageEvents: (role: string) => ['admin', 'guard'].includes(role),
  canScanTickets: (role: string) => ['admin', 'guard'].includes(role),
  canViewReports: (role: string) => role === 'admin',
  canManageInfluencers: (role: string) => role === 'admin'
};