import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const headers = request.headers;

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    url: request.url,
    origin: headers.get('origin'),
    referer: headers.get('referer'),
    host: headers.get('host'),
    userAgent: headers.get('user-agent'),
    allHeaders: Object.fromEntries(headers.entries()),
    razorpayKeys: {
      publicKeyExists: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      publicKeyPrefix: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.substring(0, 12),
      secretExists: !!process.env.RAZORPAY_KEY_SECRET,
      secretLength: process.env.RAZORPAY_KEY_SECRET?.length
    }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const headers = request.headers;

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    receivedData: body,
    origin: headers.get('origin'),
    referer: headers.get('referer'),
    host: headers.get('host'),
    userAgent: headers.get('user-agent')
  });
}