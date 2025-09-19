import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔹 GET /api/influencers - Fetching influencers from Supabase');

    const { data: influencers, error } = await supabase
      .from('influencers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error fetching influencers:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch influencers', details: error },
        { status: 500 }
      );
    }

    // Transform data to match frontend expectations
    const transformedInfluencers = (influencers || []).map(inf => ({
      id: inf.id,
      name: inf.name,
      email: inf.email,
      referralCode: inf.code,
      isActive: inf.is_active,
      phone: inf.phone,
      commissionRate: inf.commission_rate,
      totalSales: inf.total_sales,
      totalCommission: inf.total_commission,
      createdAt: inf.created_at
    }));

    return NextResponse.json({
      success: true,
      influencers: transformedInfluencers
    });
  } catch (error) {
    console.error('❌ GET /api/influencers error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch influencers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔹 POST /api/influencers - Creating influencer:', body);

    // Generate unique referral code if not provided
    const referralCode = body.referralCode || body.code || `REF${Date.now()}`;

    const { data: newInfluencer, error } = await supabase
      .from('influencers')
      .insert([{
        name: body.name,
        email: body.email,
        phone: body.phone,
        code: referralCode.toUpperCase(),
        commission_rate: body.commissionRate || 10.00,
        is_active: body.isActive !== undefined ? body.isActive : true
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error creating influencer:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create influencer', details: error },
        { status: 500 }
      );
    }

    // Transform response to match frontend expectations
    const transformedInfluencer = {
      id: newInfluencer.id,
      name: newInfluencer.name,
      email: newInfluencer.email,
      referralCode: newInfluencer.code,
      isActive: newInfluencer.is_active,
      phone: newInfluencer.phone,
      commissionRate: newInfluencer.commission_rate,
      totalSales: newInfluencer.total_sales,
      totalCommission: newInfluencer.total_commission,
      createdAt: newInfluencer.created_at
    };

    return NextResponse.json({
      success: true,
      influencer: transformedInfluencer
    });
  } catch (error) {
    console.error('❌ POST /api/influencers error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create influencer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Influencer ID is required' },
        { status: 400 }
      );
    }

    console.log('🔹 DELETE /api/influencers - Deleting influencer:', id);

    const { error } = await supabase
      .from('influencers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Supabase error deleting influencer:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete influencer', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Influencer deleted successfully'
    });
  } catch (error) {
    console.error('❌ DELETE /api/influencers error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete influencer' },
      { status: 500 }
    );
  }
}