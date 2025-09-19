import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();

    console.log('🔧 Creating user via API:', { email: userData.email, role: userData.role });

    // Hash the password before storing
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // Create user record in database directly
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert([{
        email: userData.email,
        password_hash: passwordHash,
        full_name: userData.full_name,
        phone: userData.phone || '',
        role: userData.role,
        is_active: true
      }])
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database creation failed:', dbError.message);
      return NextResponse.json(
        { error: `Database creation failed: ${dbError.message}` },
        { status: 400 }
      );
    }

    console.log('✅ Database user record created successfully');

    return NextResponse.json({
      success: true,
      user: dbUser,
      credentials: {
        email: userData.email,
        password: userData.password
      }
    });

  } catch (error: any) {
    console.error('❌ Error creating user:', error);
    return NextResponse.json(
      { error: `Error creating user: ${error.message}` },
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