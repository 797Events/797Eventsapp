export interface User {
  email: string;
  isAdmin: boolean;
}

export const ADMIN_CREDENTIALS = {
  email: 'the797events@gmail.com',
  password: 'Pass@123'
};

export function authenticateUser(email: string, password: string): User | null {
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    return {
      email: ADMIN_CREDENTIALS.email,
      isAdmin: true
    };
  }
  return null;
}

export function isValidSession(token: string): boolean {
  try {
    // Simple session validation - in a real app you'd use proper JWT
    const decoded = JSON.parse(atob(token));
    return decoded.email === ADMIN_CREDENTIALS.email && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export function createSession(user: User): string {
  // Simple session token - in a real app you'd use proper JWT
  const payload = {
    email: user.email,
    isAdmin: user.isAdmin,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  return btoa(JSON.stringify(payload));
}