import { supabase } from './supabase';

export interface Referral {
  id: string;
  influencer_id: string;
  booking_id: string;
  commission_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
}

export interface InfluencerStats {
  totalReferrals: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
}

export async function trackReferral(influencerCode: string, bookingId: string, commissionAmount: number): Promise<Referral | null> {
  try {
    // First get the influencer ID from the code
    const { data: influencer, error: influencerError } = await supabase
      .from('influencers')
      .select('id')
      .eq('code', influencerCode)
      .eq('is_active', true)
      .single();

    if (influencerError || !influencer) {
      console.error('Influencer not found:', influencerError);
      return null;
    }

    // Create the referral record
    const { data, error } = await supabase
      .from('referrals')
      .insert([{
        influencer_id: influencer.id,
        booking_id: bookingId,
        commission_amount: commissionAmount,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating referral:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in trackReferral:', error);
    return null;
  }
}

export async function getInfluencerStats(influencerId: string): Promise<InfluencerStats> {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('commission_amount, status')
      .eq('influencer_id', influencerId);

    if (error) {
      console.error('Error fetching influencer stats:', error);
      return {
        totalReferrals: 0,
        totalCommission: 0,
        pendingCommission: 0,
        paidCommission: 0
      };
    }

    const stats = data.reduce((acc, referral) => {
      acc.totalReferrals++;
      acc.totalCommission += referral.commission_amount;

      if (referral.status === 'pending') {
        acc.pendingCommission += referral.commission_amount;
      } else if (referral.status === 'paid') {
        acc.paidCommission += referral.commission_amount;
      }

      return acc;
    }, {
      totalReferrals: 0,
      totalCommission: 0,
      pendingCommission: 0,
      paidCommission: 0
    });

    return stats;
  } catch (error) {
    console.error('Error in getInfluencerStats:', error);
    return {
      totalReferrals: 0,
      totalCommission: 0,
      pendingCommission: 0,
      paidCommission: 0
    };
  }
}

export async function markCommissionPaid(referralIds: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('referrals')
      .update({ status: 'paid' })
      .in('id', referralIds);

    if (error) {
      console.error('Error marking commissions as paid:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markCommissionPaid:', error);
    return false;
  }
}

// Referral tracker object for consistency with imports
export const referralTracker = {
  trackReferral,
  getInfluencerStats,
  markCommissionPaid,
  getInfluencerAnalytics: getInfluencerStats // Alias for analytics
};