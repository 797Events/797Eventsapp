import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    razorpay_key_id_exists: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    razorpay_secret_exists: !!process.env.RAZORPAY_KEY_SECRET,
    key_id_preview: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.substring(0, 12) + '...',
    secret_length: process.env.RAZORPAY_KEY_SECRET?.length || 0,
    env_loaded: true
  });
}