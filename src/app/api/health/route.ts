import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check database connectivity
    const { data: dbCheck, error: dbError } = await supabase
      .from('events')
      .select('count')
      .limit(1);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET'
    ];

    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    );

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbError ? 'unhealthy' : 'healthy',
          responseTime: `${responseTime}ms`,
          error: dbError?.message || null
        },
        environment: {
          status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
          missingVariables: missingEnvVars
        }
      },
      performance: {
        responseTime: `${responseTime}ms`,
        uptime: process.uptime()
      }
    };

    // Determine overall health
    const isHealthy = !dbError && missingEnvVars.length === 0;
    healthStatus.status = isHealthy ? 'healthy' : 'unhealthy';

    return NextResponse.json(healthStatus, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      performance: {
        responseTime: `${responseTime}ms`
      }
    }, {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}