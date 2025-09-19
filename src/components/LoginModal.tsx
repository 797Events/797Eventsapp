'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateUser, createSession } from '@/lib/auth';
import Button from './Button';
import GlassmorphModal from './GlassmorphModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { email: string; isAdmin: boolean; role?: 'admin' | 'guard' | 'influencer' }) => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await authenticateUser(email, password);

      if (user) {
        const session = createSession(user);
        localStorage.setItem('session', session);

        // Set role-specific session storage
        if (user.role === 'influencer') {
          localStorage.setItem('influencerSession', session);
          localStorage.setItem('influencer_auth', session);
        } else if (user.role === 'guard') {
          localStorage.setItem('scanner_auth', session);
          localStorage.setItem('guard_info', JSON.stringify({
            id: user.id,
            name: user.name,
            location: 'Main Gate'
          }));
        }

        onLoginSuccess({
          email: user.email,
          isAdmin: user.isAdmin,
          role: user.role
        });
        onClose();

        // Route based on user role
        switch (user.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'guard':
            router.push('/scanner');
            break;
          case 'influencer':
            router.push('/influencer');
            break;
          default:
            router.push('/admin');
        }

        // Reset form
        setEmail('');
        setPassword('');
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <GlassmorphModal
      isOpen={isOpen}
      onClose={handleClose}
      title="797 Events Login"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="text-white/80">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-white/90 text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-200"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-white/90 text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all duration-200"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>


      </div>
    </GlassmorphModal>
  );
}