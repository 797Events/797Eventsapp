import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { code, eventId, orderAmount } = await request.json();

    // Enhanced input validation
    if (!code || !eventId || orderAmount === undefined) {
      return NextResponse.json({
        isValid: false,
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    // Validate input types and ranges
    if (typeof code !== 'string' || code.length > 50) {
      return NextResponse.json({
        isValid: false,
        error: 'Invalid promo code format'
      }, { status: 400 });
    }

    if (typeof orderAmount !== 'number' || orderAmount <= 0 || orderAmount > 1000000) {
      return NextResponse.json({
        isValid: false,
        error: 'Invalid order amount'
      }, { status: 400 });
    }

    // Sanitize input
    const sanitizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Get promo code from database
    const { data: promo, error: promoError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', sanitizedCode)
      .single();

    if (promoError || !promo) {
      return NextResponse.json({
        isValid: false,
        error: 'Promo code not found'
      });
    }

    // Validate promo code
    if (!promo.is_active) {
      return NextResponse.json({
        isValid: false,
        error: 'Promo code is inactive'
      });
    }

    const now = new Date();
    if (new Date(promo.valid_from) > now) {
      return NextResponse.json({
        isValid: false,
        error: 'Promo code is not yet valid'
      });
    }

    if (new Date(promo.valid_until) < now) {
      return NextResponse.json({
        isValid: false,
        error: 'Promo code has expired'
      });
    }

    if (promo.max_usage && promo.current_usage >= promo.max_usage) {
      return NextResponse.json({
        isValid: false,
        error: 'Promo code usage limit reached'
      });
    }

    if (promo.minimum_amount && orderAmount < promo.minimum_amount) {
      return NextResponse.json({
        isValid: false,
        error: `Minimum order amount is ₹${promo.minimum_amount}`
      });
    }

    // Check if promo is applicable to this event
    if (promo.applicable_events && promo.applicable_events.length > 0 && !promo.applicable_events.includes(eventId)) {
      return NextResponse.json({
        isValid: false,
        error: 'Promo code not applicable to this event'
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (promo.discount_type === 'percentage') {
      discountAmount = Math.round((orderAmount * promo.discount_value) / 100);
      if (promo.maximum_discount) {
        discountAmount = Math.min(discountAmount, promo.maximum_discount);
      }
    } else {
      discountAmount = Math.min(promo.discount_value, orderAmount);
    }

    return NextResponse.json({
      isValid: true,
      promo: {
        id: promo.id,
        code: promo.code,
        discountType: promo.discount_type,
        discountValue: promo.discount_value,
        minimumAmount: promo.minimum_amount,
        maxUsage: promo.max_usage,
        currentUsage: promo.current_usage,
        validFrom: promo.valid_from,
        validUntil: promo.valid_until
      },
      discountAmount
    });

  } catch (error) {
    console.error('POST /api/validate-promo error:', error);
    return NextResponse.json(
      { isValid: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}

// Increment usage count after successful booking
export async function PATCH(request: NextRequest) {
  try {
    const { promoCodeId } = await request.json();

    // Enhanced input validation
    if (!promoCodeId) {
      return NextResponse.json({
        success: false,
        error: 'Promo code ID is required'
      }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof promoCodeId !== 'string' || !uuidRegex.test(promoCodeId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid promo code ID format'
      }, { status: 400 });
    }

    // First get current usage
    const { data: currentPromo } = await supabase
      .from('promo_codes')
      .select('current_usage')
      .eq('id', promoCodeId)
      .single();

    const { error } = await supabase
      .from('promo_codes')
      .update({
        current_usage: (currentPromo?.current_usage || 0) + 1
      })
      .eq('id', promoCodeId);

    if (error) {
      console.error('Error incrementing promo code usage:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update usage count'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Usage count updated'
    });

  } catch (error) {
    console.error('PATCH /api/validate-promo error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update usage count' },
      { status: 500 }
    );
  }
}