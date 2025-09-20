import { supabase } from './supabase';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  role: 'admin' | 'guard' | 'influencer';
  exp: number;
}

export interface AuthResult {
  success: boolean;
  user?: SessionUser;
  token?: string;
  redirectTo?: string;
  error?: string;
}

/**
 * Enhanced authentication that works seamlessly with Supabase and Vercel
 */
export class AuthService {

  /**
   * Authenticate user with email and password
   */
  static async login(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔐 Authenticating user:', email);

      // Step 1: Get user from database with password verification
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (userError || !user) {
        console.log('❌ User not found or inactive:', email);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Step 2: Verify password using bcrypt
      const bcrypt = await import('bcryptjs');
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        console.log('❌ Password mismatch for user:', email);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Step 3: Create session token
      const sessionData = {
        id: user.id,
        email: user.email,
        name: user.full_name,
        isAdmin: user.role === 'admin',
        role: user.role,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      const token = JSON.stringify(sessionData);

      // Step 4: Determine redirect based on role
      const redirectTo = this.getRedirectPath(user.role);

      console.log('✅ Authentication successful for:', email, 'Role:', user.role);

      return {
        success: true,
        user: sessionData,
        token,
        redirectTo
      };

    } catch (error: any) {
      console.error('❌ Authentication error:', error);
      return {
        success: false,
        error: 'Authentication service error'
      };
    }
  }

  /**
   * Get appropriate redirect path based on user role
   */
  static getRedirectPath(role: string): string {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'guard':
        return '/guard-dashboard';
      case 'influencer':
        return '/influencer-dashboard';
      default:
        return '/';
    }
  }

  /**
   * Check if user has required role for a resource
   */
  static hasRole(userRole: string, requiredRoles: string[]): boolean {
    return requiredRoles.includes(userRole);
  }

  /**
   * Check if user can access admin features
   */
  static isAdmin(userRole: string): boolean {
    return userRole === 'admin';
  }

  /**
   * Check if user can access guard features
   */
  static isGuard(userRole: string): boolean {
    return ['admin', 'guard'].includes(userRole);
  }

  /**
   * Check if user can access influencer features
   */
  static isInfluencer(userRole: string): boolean {
    return ['admin', 'influencer'].includes(userRole);
  }

  /**
   * Logout user (client-side cleanup)
   */
  static logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('session');
    localStorage.removeItem('temp_admin_session');
  }
}

export function isValidSession(session: string): boolean {
  try {
    const sessionData = JSON.parse(session);
    return sessionData && sessionData.exp > Date.now();
  } catch {
    return false;
  }
}

export function decodeSession(session: string): SessionUser | null {
  try {
    const sessionData = JSON.parse(session);
    if (sessionData && sessionData.exp > Date.now()) {
      return sessionData;
    }
    return null;
  } catch {
    return null;
  }
}

export function createSession(user: Omit<SessionUser, 'exp'>): string {
  const sessionData: SessionUser = {
    ...user,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  return JSON.stringify(sessionData);
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  try {
    // Mock authentication - in production, use Supabase auth
    if (email === 'admin@797events.com' && password === 'admin123') {
      return {
        id: 'admin-001',
        email,
        name: 'Admin User',
        isAdmin: true,
        role: 'admin',
        exp: Date.now() + (24 * 60 * 60 * 1000)
      };
    }

    // Could add more user checks here
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}