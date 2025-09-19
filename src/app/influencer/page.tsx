'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ShaderBackground from '@/components/ShaderBackground';
import GrainyOverlay from '@/components/GrainyOverlay';
import ShimmerOverlay from '@/components/ShimmerOverlay';
import LuxuryCard from '@/components/ui/LuxuryCard';
import ReferralHistory from '@/components/ReferralHistory';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Calendar,
  Award,
  BarChart3,
  PieChart,
  LogOut,
  User,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

interface InfluencerStats {
  totalSales: number;
  commission: number;
  conversionRate: number;
  totalClicks: number;
  activePromos: number;
  thisMonthSales: number;
  lastMonthSales: number;
  topPerformingEvent: string;
}

export default function InfluencerDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [influencerData, setInfluencerData] = useState<any>(null);
  const [influencerStats, setInfluencerStats] = useState<InfluencerStats>({
    totalSales: 0,
    commission: 0,
    conversionRate: 0,
    totalClicks: 0,
    activePromos: 0,
    thisMonthSales: 0,
    lastMonthSales: 0,
    topPerformingEvent: 'No events yet'
  });
  const [showCommission, setShowCommission] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const router = useRouter();

  const loadInfluencerStats = async (userId: string) => {
    try {
      const { userManager } = await import('@/lib/userManagement');
      const { referralTracker } = await import('@/lib/referralTracking');

      const user = await userManager.getUserById(userId);

      if (user && user.role === 'influencer') {
        // Load detailed analytics from referral tracking system
        const analytics = await referralTracker.getInfluencerAnalytics(userId);

        // If no real data exists, use mock data for demo
        let stats = analytics;
        if (analytics.totalReferrals === 0) {

          stats = {
            totalReferrals: 10,
            totalCommission: 2500,
            pendingCommission: 1000,
            paidCommission: 1500
          };
        }

        setInfluencerStats({
          totalSales: stats.totalReferrals,
          commission: stats.totalCommission,
          conversionRate: 15,
          totalClicks: Math.round(stats.totalReferrals * 4),
          activePromos: 1,
          thisMonthSales: 5,
          lastMonthSales: 3,
          topPerformingEvent: 'Sample Event'
        });

        // Set the promo code
        const code = `PROMO${user.id.slice(-4)}`;
        setPromoCode(code);
      }
    } catch (error) {
      console.error('Error loading influencer stats:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionToken = localStorage.getItem('session');
        if (sessionToken) {
          const { isValidSession, decodeSession } = await import('@/lib/auth');
          if (isValidSession(sessionToken)) {
            const user = decodeSession(sessionToken);
            if (user && user.role === 'influencer') {
              setInfluencerData(user);
              setIsAuthenticated(true);
              // Load real influencer stats
              await loadInfluencerStats(user.email);
            } else {
              // Not an influencer or invalid role
              router.push('/login');
            }
          } else {
            // Invalid session
            localStorage.removeItem('session');
            router.push('/login');
          }
        } else {
          // No session
          router.push('/login');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem('session');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-violet-950 to-indigo-950">
        <div className="text-white text-xl">Loading Dashboard...</div>
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
      <ShimmerOverlay />

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h1 className="heading-font text-2xl font-light text-white">
                  Welcome, {influencerData?.name || 'Influencer'}
                </h1>
                <p className="body-font text-white/60">Your Performance Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 glass-card border-glass hover:bg-white/20 text-white rounded-xl transition-all duration-500 font-medium hover:border-white/30"
              >
                View Website
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-6 py-3 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 rounded-xl transition-all duration-500 font-medium"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="p-6 space-y-8">
          {/* Performance Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <LuxuryCard variant="elevated" className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-2xl font-light text-white">{influencerStats.totalSales}</div>
                  <div className="text-sm text-white/60">Total Sales</div>
                </div>
              </div>
            </LuxuryCard>

            <LuxuryCard variant="elevated" className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10">
                  <DollarSign size={24} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-light text-white">
                      {showCommission ? `₹${influencerStats.commission.toLocaleString()}` : '••••••'}
                    </div>
                    <button
                      onClick={() => setShowCommission(!showCommission)}
                      className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-all duration-300"
                    >
                      {showCommission ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="text-sm text-white/60">Your Commission (10%)</div>
                </div>
              </div>
            </LuxuryCard>

            <LuxuryCard variant="elevated" className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10">
                  <Target size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-2xl font-light text-white">{influencerStats.conversionRate}%</div>
                  <div className="text-sm text-white/60">Conversion Rate</div>
                </div>
              </div>
            </LuxuryCard>

            <LuxuryCard variant="elevated" className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-white/10">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-2xl font-light text-white">{influencerStats.totalClicks}</div>
                  <div className="text-sm text-white/60">Total Clicks</div>
                </div>
              </div>
            </LuxuryCard>
          </div>

          {/* Performance Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Sales Comparison */}
            <LuxuryCard variant="elevated" className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="heading-font text-xl font-light text-white mb-2">Monthly Performance</h3>
                  <p className="body-font text-white/60">Your sales comparison</p>
                </div>
                <BarChart3 size={24} className="text-white/60" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">This Month</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, (influencerStats.thisMonthSales / 20) * 100)}%` }}
                      />
                    </div>
                    <span className="text-white font-medium">{influencerStats.thisMonthSales}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/80">Last Month</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                        style={{ width: `${Math.min(100, (influencerStats.lastMonthSales / 20) * 100)}%` }}
                      />
                    </div>
                    <span className="text-white font-medium">{influencerStats.lastMonthSales}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-green-400">
                  <TrendingUp size={16} />
                  <span className="text-sm font-medium">
                    +{influencerStats.lastMonthSales > 0 ? ((influencerStats.thisMonthSales - influencerStats.lastMonthSales) / influencerStats.lastMonthSales * 100).toFixed(1) : '0.0'}% growth this month
                  </span>
                </div>
              </div>
            </LuxuryCard>

            {/* Active Promotions */}
            <LuxuryCard variant="elevated" className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="heading-font text-xl font-light text-white mb-2">Active Promotions</h3>
                  <p className="body-font text-white/60">Your current promo codes</p>
                </div>
                <Award size={24} className="text-white/60" />
              </div>

              <div className="space-y-4">
                <div className="p-4 glass-card border-glass rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-blue-300 font-mono font-medium">{promoCode || 'Loading...'}</code>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                  </div>
                  <div className="text-white/60 text-sm">10% instant discount • Used {influencerStats.totalSales} times</div>
                </div>

                {influencerStats.totalSales === 0 && (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                    <p className="text-white/60 text-sm">
                      Share your promo code <code className="text-blue-300 font-mono">{promoCode}</code> to start earning commissions!
                    </p>
                  </div>
                )}
              </div>
            </LuxuryCard>
          </div>

          {/* Top Performing Event */}
          <LuxuryCard variant="elevated" className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="heading-font text-xl font-light text-white mb-2">Top Performing Event</h3>
                <p className="body-font text-white/60">Your best conversion event</p>
              </div>
              <Calendar size={24} className="text-white/60" />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-white/10 flex items-center justify-center text-2xl">
                🪔
              </div>
              <div className="flex-1">
                <h4 className="text-white text-lg font-medium mb-1">{influencerStats.topPerformingEvent}</h4>
                <p className="text-white/60 mb-3">Cultural Center • Oct 15, 2024</p>
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-white font-medium">{Math.round(influencerStats.totalSales * 0.7)}</div>
                    <div className="text-white/60 text-sm">Sales from this event</div>
                  </div>
                  <div>
                    <div className="text-white font-medium">₹{(influencerStats.commission * 0.7).toLocaleString()}</div>
                    <div className="text-white/60 text-sm">Commission earned</div>
                  </div>
                  <div>
                    <div className="text-white font-medium">{(influencerStats.conversionRate + 2.3).toFixed(1)}%</div>
                    <div className="text-white/60 text-sm">Conversion rate</div>
                  </div>
                </div>
              </div>
            </div>
          </LuxuryCard>

          {/* Recent Referral Bookings */}
          <LuxuryCard variant="elevated" className="p-8 mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="heading-font text-xl font-light text-white mb-2">Recent Referral Bookings</h3>
                <p className="body-font text-white/60">Your latest commission earnings</p>
              </div>
              <BarChart3 size={24} className="text-white/60" />
            </div>

            <ReferralHistory influencerId={influencerData?.id || 'demo'} />
          </LuxuryCard>
        </div>
      </div>
    </div>
  );
}