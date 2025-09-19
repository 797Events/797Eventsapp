'use client';

import { useState, useEffect } from 'react';
import { getInfluencerStats, InfluencerStats } from '@/lib/referralTracking';

interface ReferralHistoryProps {
  influencerId: string;
}

interface ReferralRecord {
  id: string;
  eventTitle: string;
  customerName: string;
  commissionAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
}

export default function ReferralHistory({ influencerId }: ReferralHistoryProps) {
  const [stats, setStats] = useState<InfluencerStats>({
    totalReferrals: 0,
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0
  });
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, [influencerId]);

  const loadReferralData = async () => {
    try {
      const influencerStats = await getInfluencerStats(influencerId);
      setStats(influencerStats);

      // Mock referral records - in production, you'd fetch from database
      const mockReferrals: ReferralRecord[] = [
        {
          id: '1',
          eventTitle: 'Luxury Wedding Reception',
          customerName: 'John Doe',
          commissionAmount: 500,
          status: 'paid',
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          eventTitle: 'Corporate Gala Night',
          customerName: 'Jane Smith',
          commissionAmount: 300,
          status: 'pending',
          createdAt: '2024-01-20T14:20:00Z'
        }
      ];

      setReferrals(mockReferrals);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <h3 className="text-white/80 text-sm">Total Referrals</h3>
          <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <h3 className="text-white/80 text-sm">Total Commission</h3>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.totalCommission)}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <h3 className="text-white/80 text-sm">Pending</h3>
          <p className="text-2xl font-bold text-yellow-400">{formatCurrency(stats.pendingCommission)}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <h3 className="text-white/80 text-sm">Paid</h3>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.paidCommission)}</p>
        </div>
      </div>

      {/* Referral History Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white">Referral History</h3>
        </div>

        {referrals.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-white/60">No referrals yet. Start sharing your referral code to earn commissions!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-white/80 font-medium">Event</th>
                  <th className="px-6 py-3 text-left text-white/80 font-medium">Customer</th>
                  <th className="px-6 py-3 text-left text-white/80 font-medium">Commission</th>
                  <th className="px-6 py-3 text-left text-white/80 font-medium">Status</th>
                  <th className="px-6 py-3 text-left text-white/80 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id} className="border-t border-white/10">
                    <td className="px-6 py-4 text-white">{referral.eventTitle}</td>
                    <td className="px-6 py-4 text-white/80">{referral.customerName}</td>
                    <td className="px-6 py-4 text-green-400 font-medium">
                      {formatCurrency(referral.commissionAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        referral.status === 'paid'
                          ? 'bg-green-500/20 text-green-400'
                          : referral.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60">{formatDate(referral.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}