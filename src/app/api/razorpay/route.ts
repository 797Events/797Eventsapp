import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔹 Razorpay create order request:', body);

    // Enhanced input validation
    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0 || body.amount > 1000000) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (body.currency && typeof body.currency !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid currency' },
        { status: 400 }
      );
    }

    if (body.receipt && (typeof body.receipt !== 'string' || body.receipt.length > 40)) {
      return NextResponse.json(
        { success: false, error: 'Invalid receipt format' },
        { status: 400 }
      );
    }

    // Initialize Razorpay with credentials
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Create order with Razorpay
    const order = await razorpay.orders.create({
      amount: Math.round(body.amount * 100), // Convert to paise
      currency: body.currency || 'INR',
      receipt: body.receipt || `receipt_${Date.now()}`,
    });

    console.log('✅ Razorpay order created:', order.id);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('❌ Razorpay order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}