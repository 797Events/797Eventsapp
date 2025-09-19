'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isValidSession } from '@/lib/auth';
import { userManager } from '@/lib/userManagement';
import ShaderBackground from '@/components/ShaderBackground';
import GrainyOverlay from '@/components/GrainyOverlay';

export default function InfluencerDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [influencerData, setInfluencerData] = useState<any>(null);
  const [referralAnalytics, setReferralAnalytics] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const router = useRouter();

  const loadInfluencerData = async () => {
    // Try new JWT-based auth first
    const userStr = localStorage.getItem('auth_user');
    let user = null;

    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        // Fall back to old session format
        const session = localStorage.getItem('session');
        if (session && isValidSession(session)) {
          user = JSON.parse(atob(session));
        }
      }
    } else {
      // Fall back to old session format
      const session = localStorage.getItem('session');
      if (session && isValidSession(session)) {
        user = JSON.parse(atob(session));
      }
    }

    if (user) {

      // Refresh influencer data from user management
      userManager.getUserById(user.id).then(userData => {
        if (userData) {
          // Initialize with basic data
          setInfluencerData({
            name: userData.full_name,
            email: userData.email,
            phone: userData.phone,
            code: 'INF001',
            totalEarnings: 0,
            currentMonthEarnings: 0,
            totalReferrals: 0,
            currentMonthReferrals: 0,
            conversionRate: 0
          });
        }
      }).catch(error => {
        console.error('Error loading influencer data:', error);
      });

      // Load real referral tracking data
      try {
        const { referralTracker } = await import('@/lib/referralTracking');

        // Get comprehensive analytics for this influencer
        const analytics = referralTracker.getInfluencerAnalytics(user.id);
        setReferralAnalytics(analytics);

        // Set mock recent bookings for now
        setRecentBookings([]);

        console.log('📊 Loaded referral analytics:', analytics);
      } catch (error) {
        console.error('Error loading referral analytics:', error);
      }
    }
  };

  useEffect(() => {
    // Try new JWT-based auth first
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    let user = null;

    if (token && userStr) {
      try {
        user = JSON.parse(userStr);
        console.log('✅ Found JWT user session:', user);
      } catch (e) {
        console.log('❌ Failed to parse JWT user data');
        // Fall back to old session format
        const session = localStorage.getItem('session');
        if (session && isValidSession(session)) {
          user = JSON.parse(atob(session));
          console.log('✅ Using old session format:', user);
        }
      }
    } else {
      // Fall back to old session format
      const session = localStorage.getItem('session');
      if (session && isValidSession(session)) {
        user = JSON.parse(atob(session));
        console.log('✅ Using old session format (no JWT found):', user);
      }
    }

    if (user) {
      setCurrentUser(user);

      // Check if user is an influencer
      if (user.role !== 'influencer') {
        console.log('❌ User is not an influencer, redirecting...', user.role);
        if (user.role === 'admin') {
          router.push('/admin');
        } else if (user.role === 'guard') {
          router.push('/guard-dashboard');
        } else {
          router.push('/login');
        }
        return;
      }

      console.log('✅ Influencer authenticated successfully');
      setIsAuthenticated(true);

      // Load influencer data
      loadInfluencerData();

      // Listen for analytics updates (real-time commission updates)
      const handleAnalyticsUpdate = () => {
        console.log('Influencer Dashboard: Analytics updated, refreshing data');
        loadInfluencerData();
      };

      // Listen for real-time system events
      const handleSystemEvent = (event: CustomEvent) => {
        const eventData = event.detail;
        if (eventData.type === 'commission_earned' && eventData.data.influencerId === user.id) {
          console.log('💰 Real-time commission update:', eventData.data);
          loadInfluencerData();
        } else if (eventData.type === 'booking_completed' && eventData.data.influencerId === user.id) {
          console.log('🎫 Real-time booking update:', eventData.data);
          loadInfluencerData();
        }
      };

      window.addEventListener('analytics-updated', handleAnalyticsUpdate);
      window.addEventListener('system-event', handleSystemEvent as EventListener);
      window.addEventListener('commission-updated', handleAnalyticsUpdate);

      // Set up periodic refresh for live updates
      const refreshInterval = setInterval(loadInfluencerData, 30000); // Refresh every 30 seconds

      // Cleanup listeners
      return () => {
        window.removeEventListener('analytics-updated', handleAnalyticsUpdate);
        window.removeEventListener('system-event', handleSystemEvent as EventListener);
        window.removeEventListener('commission-updated', handleAnalyticsUpdate);
        clearInterval(refreshInterval);
      };
    } else {
      console.log('❌ No valid session found, redirecting to login');
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const handleSignOut = () => {
    // Clear both old and new session formats
    localStorage.removeItem('session');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-violet-950 to-indigo-950">
        <div className="text-white text-xl">Loading Influencer Dashboard...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-950 via-purple-900 to-indigo-950 relative overflow-hidden">
      <ShaderBackground />
      <GrainyOverlay />

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="glass-card p-6 mb-6 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-400/30">
                <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" className="text-purple-400">
                  <path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm-36 344l-116-116c-4.686-4.686-4.686-12.284 0-16.971L175.029 148l-7.029-7.029c-4.686-4.686-4.686-12.284 0-16.971L204.69 87.31c4.686-4.686 12.284-4.686 16.971 0L292 158.059l70.34-70.34c4.686-4.686 12.284-4.686 16.971 0L416 124.408c4.686 4.686 4.686 12.284 0 16.971L345.941 212l70.34 70.34c4.686 4.686 4.686 12.284 0 16.971L379.31 336c-4.686 4.686-12.284 4.686-16.971 0L292 265.941 221.66 336.31c-4.686 4.686-12.284 4.686-16.971 0L168 299.31c-4.686-4.686-4.686-12.284 0-16.971L238.059 212 168 141.941c-4.686-4.686-4.686-12.284 0-16.971L204.69 87.31c4.686-4.686 12.284-4.686 16.971 0L292 158.059l70.34-70.34c4.686-4.686 12.284-4.686 16.971 0L416 124.408c4.686 4.686 4.686 12.284 0 16.971L345.941 212z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Influencer Dashboard</h1>
                <p className="text-white/60">Welcome, {currentUser?.name}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white hover:bg-red-500/10 hover:border-red-400/20 border border-transparent rounded-xl transition-all duration-300"
            >
              <svg width="18" height="18" viewBox="0 0 512 512" fill="currentColor">
                <path d="M497 273L329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-96c0-13.3 10.7-24 24-24h136V88c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 436v-40c0-6.6-5.4-12-12-12H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h84c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12H96c-53 0-96 43-96 96v192c0 53 43 96 96 96h84c6.6 0 12-5.4 12-12z"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Total Revenue */}
            <div className="glass-card p-6 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-400">₹{referralAnalytics?.totalRevenue || influencerData?.totalRevenue || 0}</p>
                  <p className="text-white/40 text-xs mt-1">{influencerData?.commissionRate || 10}% commission rate</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-400/30">
                  <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" className="text-green-400">
                    <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm80 248c0 44.112-35.888 80-80 80s-80-35.888-80-80 35.888-80 80-80 80 35.888 80 80z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Sales */}
            <div className="glass-card p-6 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Tickets Sold</p>
                  <p className="text-3xl font-bold text-blue-400">{referralAnalytics?.totalTicketsSold || influencerData?.totalSales || 0}</p>
                  <p className="text-white/40 text-xs mt-1">Through your referrals</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-400/30">
                  <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" className="text-blue-400">
                    <path d="M32 464a48 48 0 0 0 48 48h352a48 48 0 0 0 48-48V128H32zm272-256a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zM432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H230.9a24 24 0 0 0-21.5 13.3L200 32H80a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h352a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Referrals */}
            <div className="glass-card p-6 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Referrals</p>
                  <p className="text-3xl font-bold text-purple-400">{referralAnalytics?.totalReferrals || 0}</p>
                  <p className="text-white/40 text-xs mt-1">Successful bookings</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-400/30">
                  <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" className="text-purple-400">
                    <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-26.51-21.49-48-48-48H48C21.49 28 0 49.49 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <div className="glass-card p-6 border border-white/10 rounded-2xl">
              <div>
                <p className="text-white/60 text-sm mb-2">Your Promo Code</p>
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-3 border border-white/20">
                  <code className="text-xl font-bold text-purple-400">{influencerData?.promoCode || 'N/A'}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(influencerData?.promoCode || '');
                      alert('Promo code copied to clipboard!');
                    }}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M320 448v40c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24V120c0-13.255 10.745-24 24-24h72v296c0 30.879 25.121 56 56 56h168zm0-344V0H152c-13.255 0-24 10.745-24 24v368c0 13.255 10.745 24 24 24h272c13.255 0 24-10.745 24-24V128H344c-13.2 0-24-10.8-24-24zm120.971-31.029L375.029 7.029A24 24 0 0 0 358.059 0H352v96h96v-6.059a24 24 0 0 0-7.029-16.97z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Chart & Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Section */}
            <div className="glass-card p-6 border border-white/10 rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Full Name</label>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <input
                      type="text"
                      value={currentUser?.name || ''}
                      readOnly
                      className="bg-transparent text-white w-full outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-2">Email Address</label>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <input
                      type="email"
                      value={currentUser?.email || ''}
                      readOnly
                      className="bg-transparent text-white w-full outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-2">Commission Rate</label>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <input
                      type="text"
                      value={`${influencerData?.commissionRate || 10}%`}
                      readOnly
                      className="bg-transparent text-white w-full outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-2">Instagram Handle</label>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <input
                      type="text"
                      value={influencerData?.socialMedia?.instagram || 'Not set'}
                      readOnly
                      className="bg-transparent text-white w-full outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="glass-card p-6 border border-white/10 rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-6">Performance Overview</h2>

              <div className="space-y-4">
                {/* Revenue Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/70">Revenue Goal</span>
                    <span className="text-white">₹{referralAnalytics?.totalRevenue || 0} / ₹10,000</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full"
                      style={{
                        width: `${Math.min(((referralAnalytics?.totalRevenue || 0) / 10000) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Sales Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/70">Sales Target</span>
                    <span className="text-white">{referralAnalytics?.totalTicketsSold || 0} / 50 tickets</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full"
                      style={{
                        width: `${Math.min(((referralAnalytics?.totalTicketsSold || 0) / 50) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Monthly Performance */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/70">This Month</span>
                    <span className="text-white">₹{referralAnalytics?.thisMonthStats?.revenue || 0}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-400">{referralAnalytics?.thisMonthStats?.referrals || 0}</div>
                      <div className="text-white/60 text-xs">Referrals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">{referralAnalytics?.thisMonthStats?.tickets || 0}</div>
                      <div className="text-white/60 text-xs">Tickets</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-purple-500/10 rounded-xl border border-purple-400/20">
                <h3 className="text-purple-400 font-semibold mb-2">🚀 Promotion Tips</h3>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• Share your promo code on social media</li>
                  <li>• Create engaging content about upcoming events</li>
                  <li>• Collaborate with other influencers</li>
                  <li>• Use event hashtags in your posts</li>
                  <li>• Share behind-the-scenes content</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 glass-card p-6 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Recent Referral Activity</h2>
              <p className="text-white/60">Latest bookings through your referral code</p>
            </div>
            {referralAnalytics && (
              <div className="text-right">
                <div className="text-sm text-white/60">Top Event</div>
                <div className="text-white font-medium">{referralAnalytics.topPerformingEvent}</div>
              </div>
            )}
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking, index) => (
                <div key={booking.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center border border-green-400/30">
                    <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor" className="text-green-400">
                      <path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium">{booking.customerName}</p>
                      <span className="text-green-400 font-semibold">+₹{booking.commissionAmount}</span>
                    </div>
                    <p className="text-white/60 text-sm">{booking.eventTitle}</p>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span>{booking.ticketQuantity} tickets</span>
                      <span>•</span>
                      <span>{booking.passType}</span>
                      <span>•</span>
                      <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : referralAnalytics?.totalReferrals > 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" className="text-green-400">
                    <path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Great Progress!</h3>
                <p className="text-white/60">You have {referralAnalytics.totalReferrals} successful referrals</p>
                <p className="text-white/60">Total commission earned: ₹{referralAnalytics.totalRevenue}</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" className="text-white/50">
                    <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm-32-316v116h64v-116c0-17.7-14.3-32-32-32s-32 14.3-32 32zm32 164c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Referrals Yet</h3>
                <p className="text-white/60">Start promoting events to see your referral activity here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
}