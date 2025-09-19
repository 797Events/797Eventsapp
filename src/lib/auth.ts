export interface SessionUser {
  id?: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  role?: 'admin' | 'guard' | 'influencer';
  exp: number;
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
        email,
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