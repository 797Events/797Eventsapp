import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('🔐 Login attempt:', { email });

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      console.log('❌ User not found or inactive:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET environment variable is required');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.full_name
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful:', { email, role: user.role });

    // Return user data and token
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        isActive: user.is_active
      },
      token,
      redirectTo: getRedirectPath(user.role)
    });

  } catch (error: any) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getRedirectPath(role: string): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'guard':
      return '/guard-dashboard';
    case 'influencer':
      return '/influencer-dashboard';
    default:
      return '/';
  }
}