import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔹 GET /api/influencers - Fetching influencers with real-time sales data');

    // Get influencers data
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

    // Get real-time sales data for each influencer
    const influencersWithSales = await Promise.all((influencers || []).map(async (inf) => {
      // Get bookings with this influencer's referral code
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, quantity, total_amount, booking_status, referral_code')
        .eq('referral_code', inf.code);

      if (bookingsError) {
        console.warn('⚠️ Error fetching bookings for influencer', inf.code, ':', bookingsError);
      }

      // Get commission data from booking_analytics
      const { data: commissionData, error: commissionError } = await supabase
        .from('booking_analytics')
        .select('commission')
        .in('booking_id', (bookings || []).map(b => b.id || 'none'));

      if (commissionError) {
        console.warn('⚠️ Error fetching commission data for influencer', inf.code, ':', commissionError);
      }

      // Calculate real-time sales data
      const confirmedBookings = (bookings || []).filter(b => b.booking_status === 'confirmed');
      const realTimeSales = confirmedBookings.reduce((sum, booking) => sum + (booking.quantity || 0), 0);
      const realTimeRevenue = confirmedBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
      const totalCommission = (commissionData || []).reduce((sum, analytics) => sum + (analytics.commission || 0), 0);

      // Update the influencer record with real-time data
      if (realTimeSales > 0 || totalCommission > 0) {
        await supabase
          .from('influencers')
          .update({
            total_sales: realTimeSales,
            total_revenue: realTimeRevenue,
            total_commission: totalCommission,
            updated_at: new Date().toISOString()
          })
          .eq('id', inf.id);
      }

      return {
        id: inf.id,
        name: inf.name,
        email: inf.email,
        referralCode: inf.code,
        isActive: inf.is_active,
        phone: inf.phone,
        commissionRate: 'Pass-based', // Show as pass-based instead of fixed rate
        totalSales: realTimeSales || inf.total_sales || 0,
        totalRevenue: realTimeRevenue || inf.total_revenue || 0,
        totalCommission: totalCommission || inf.total_commission || 0,
        createdAt: inf.created_at,
        updatedAt: inf.updated_at
      };
    }));

    console.log('✅ Loaded', influencersWithSales.length, 'influencers with real-time sales data');

    return NextResponse.json({
      success: true,
      influencers: influencersWithSales
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

    // Step 1: Create user account for login
    const bcrypt = await import('bcryptjs');
    const defaultPassword = 'influencer123'; // Default password, should be changed on first login
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([{
        email: body.email.toLowerCase(),
        password_hash: hashedPassword,
        full_name: body.name,
        role: 'influencer',
        is_active: body.isActive !== undefined ? body.isActive : true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user account:', userError);
      return NextResponse.json(
        { success: false, error: 'Failed to create user account', details: userError },
        { status: 500 }
      );
    }

    // Step 2: Create influencer record
    const { data: newInfluencer, error } = await supabase
      .from('influencers')
      .insert([{
        name: body.name,
        email: body.email,
        phone: body.phone,
        code: referralCode.toUpperCase(),
        commission_rate: body.commissionRate || 10.00,
        is_active: body.isActive !== undefined ? body.isActive : true,
        user_id: newUser.id // Link to user account
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
      createdAt: newInfluencer.created_at,
      userId: newUser.id
    };

    console.log('✅ Influencer and user account created successfully');

    return NextResponse.json({
      success: true,
      influencer: transformedInfluencer,
      loginCredentials: {
        email: body.email,
        defaultPassword: defaultPassword,
        message: 'User account created. Please change password on first login.'
      }
    });
  } catch (error) {
    console.error('❌ POST /api/influencers error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create influencer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Influencer ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('🔹 PUT /api/influencers - Updating influencer:', id, body);

    const { data: updatedInfluencer, error } = await supabase
      .from('influencers')
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        code: body.code?.toUpperCase(),
        commission_rate: body.commissionRate || body.commission_rate,
        is_active: body.isActive !== undefined ? body.isActive : body.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error updating influencer:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update influencer', details: error },
        { status: 500 }
      );
    }

    // Transform response to match frontend expectations
    const transformedInfluencer = {
      id: updatedInfluencer.id,
      name: updatedInfluencer.name,
      email: updatedInfluencer.email,
      referralCode: updatedInfluencer.code,
      isActive: updatedInfluencer.is_active,
      phone: updatedInfluencer.phone,
      commissionRate: updatedInfluencer.commission_rate,
      totalSales: updatedInfluencer.total_sales,
      totalCommission: updatedInfluencer.total_commission,
      createdAt: updatedInfluencer.created_at,
      updatedAt: updatedInfluencer.updated_at
    };

    return NextResponse.json({
      success: true,
      influencer: transformedInfluencer
    });
  } catch (error) {
    console.error('❌ PUT /api/influencers error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update influencer' },
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

    // Step 1: Get influencer to find associated user
    const { data: influencer } = await supabase
      .from('influencers')
      .select('user_id, email')
      .eq('id', id)
      .single();

    // Step 2: Delete influencer record
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

    // Step 3: Delete associated user account if exists
    if (influencer?.user_id) {
      await supabase
        .from('users')
        .delete()
        .eq('id', influencer.user_id);
      console.log('✅ Associated user account deleted');
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