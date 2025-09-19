import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query = supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString());
    }

    const { data: promoCodes, error } = await query;

    if (error) {
      console.error('Error fetching promo codes:', error);
      return NextResponse.json({ error: 'Failed to fetch promo codes', details: error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      promoCodes: promoCodes || []
    });
  } catch (error) {
    console.error('GET /api/admin/promo-codes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promo codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating promo code:', body);

    const { data: newPromoCode, error } = await supabase
      .from('promo_codes')
      .insert([{
        code: body.code.toUpperCase(),
        discount_type: body.discountType || 'percentage',
        discount_value: body.discountValue,
        minimum_amount: body.minimumAmount || 0,
        maximum_discount: body.maximumDiscount,
        max_usage: body.maxUsage,
        valid_from: body.validFrom || new Date().toISOString(),
        valid_until: body.validUntil,
        applicable_events: body.applicableEvents || [],
        is_active: body.isActive !== undefined ? body.isActive : true
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating promo code:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create promo code', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      promoCode: newPromoCode
    });
  } catch (error) {
    console.error('POST /api/admin/promo-codes error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create promo code' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Promo code ID is required' },
        { status: 400 }
      );
    }

    const { data: updatedPromoCode, error } = await supabase
      .from('promo_codes')
      .update({
        code: updateData.code?.toUpperCase(),
        discount_type: updateData.discountType,
        discount_value: updateData.discountValue,
        minimum_amount: updateData.minimumAmount,
        maximum_discount: updateData.maximumDiscount,
        max_usage: updateData.maxUsage,
        valid_from: updateData.validFrom,
        valid_until: updateData.validUntil,
        applicable_events: updateData.applicableEvents,
        is_active: updateData.isActive
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating promo code:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update promo code', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      promoCode: updatedPromoCode
    });
  } catch (error) {
    console.error('PUT /api/admin/promo-codes error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update promo code' },
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
        { success: false, error: 'Promo code ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error deleting promo code:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete promo code', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Promo code deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /api/admin/promo-codes error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete promo code' },
      { status: 500 }
    );
  }
}