'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import ShaderBackground from '@/components/ShaderBackground';
import GrainyOverlay from '@/components/GrainyOverlay';
import ShimmerOverlay from '@/components/ShimmerOverlay';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const router = useRouter();

  // Clear any old session data when user visits login page
  useEffect(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('session');
    localStorage.removeItem('temp_admin_session');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use custom authentication API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Login failed');
        return;
      }

      // Store authentication data
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));

      // Redirect to dashboard
      router.push(result.redirectTo);

    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // TODO: Implement actual password reset functionality
    setError('Password reset functionality will be implemented soon');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Implement actual OTP verification
    setError('OTP verification will be implemented soon');
  };


  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-950 via-violet-950 via-purple-900 to-indigo-950">
      <ShaderBackground />
      <GrainyOverlay />
      <ShimmerOverlay />
      
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
          {!showForgotPassword ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 font-montserrat">Login</h1>
                <p className="text-white/70">Access your dashboard - All user types</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-lg"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-white/70 hover:text-white text-sm transition-colors block mx-auto"
                >
                  Forgot your password?
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="text-white/70 hover:text-white text-sm transition-colors"
                >
                  ← Back to Home
                </button>
              </div>

            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 font-montserrat">Reset Password</h1>
                <p className="text-white/70">
                  {!otpSent ? 'Enter your email to receive OTP' : 'Enter the OTP sent to your email'}
                </p>
              </div>

              {!otpSent ? (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-white/90 text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-3 text-lg"
                  >
                    Send OTP
                  </Button>

                  <div className="text-center">
                    <button
                      onClick={() => setShowForgotPassword(false)}
                      className="text-white/70 hover:text-white text-sm transition-colors"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-white/90 text-sm font-medium mb-2">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors text-center text-2xl tracking-widest font-mono"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-3 text-lg"
                  >
                    Verify OTP
                  </Button>

                  <div className="text-center space-y-2">
                    <button
                      onClick={() => setError('OTP resend will be implemented soon')}
                      className="text-white/70 hover:text-white text-sm transition-colors block mx-auto"
                    >
                      Resend OTP
                    </button>
                    <button
                      onClick={() => {
                        setShowForgotPassword(false);
                        setOtpSent(false);
                        setForgotEmail('');
                        setOtp('');
                      }}
                      className="text-white/70 hover:text-white text-sm transition-colors"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}