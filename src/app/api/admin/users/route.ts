import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();

    console.log('🔧 Creating user via API:', { email: userData.email, role: userData.role });

    // Validate required fields
    if (!userData.email || !userData.password || !userData.full_name || !userData.role) {
      console.error('❌ Missing required fields:', {
        email: !!userData.email,
        password: !!userData.password,
        full_name: !!userData.full_name,
        role: !!userData.role
      });
      return NextResponse.json(
        { error: 'Missing required fields: email, password, full_name, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'guard', 'influencer'];
    if (!validRoles.includes(userData.role)) {
      console.error('❌ Invalid role:', userData.role);
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      console.error('❌ Invalid email format:', userData.email);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userData.email.toLowerCase())
      .single();

    if (existingUser) {
      console.error('❌ User already exists:', userData.email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password before storing
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // Create user record in database directly
    console.log('💾 Inserting user into database...');
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert([{
        email: userData.email.toLowerCase(),
        password_hash: passwordHash,
        full_name: userData.full_name,
        phone: userData.phone || '',
        role: userData.role,
        is_active: true
      }])
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database creation failed:', dbError);

      // Handle specific database errors
      if (dbError.code === '23505') {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: 'Database creation failed',
          details: dbError.message,
          code: dbError.code
        },
        { status: 500 }
      );
    }

    console.log('✅ Database user record created successfully:', dbUser.id);

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        full_name: dbUser.full_name,
        role: dbUser.role,
        is_active: dbUser.is_active,
        created_at: dbUser.created_at
      },
      credentials: {
        email: userData.email,
        password: userData.password
      }
    });

  } catch (error: any) {
    console.error('❌ Error creating user:', error);
    return NextResponse.json(
      {
        error: 'Error creating user',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Only fetch actual app users (not guest customers from bookings)
    // Filter out users with role 'customer' or users with password_hash 'guest_booking'
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .neq('password_hash', 'guest_booking') // Exclude guest booking users
      .in('role', ['admin', 'guard', 'influencer']) // Only show actual app users
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error in getUsers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}