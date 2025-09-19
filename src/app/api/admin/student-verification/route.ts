import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('student_verifications')
      .select(`
        id,
        student_id,
        student_name,
        student_email,
        institution_name,
        course,
        year_of_study,
        document_type,
        document_url,
        verification_status,
        verified_by,
        verification_notes,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('verification_status', status);
    }

    const { data: verifications, error } = await query;

    if (error) {
      console.error('Error fetching student verifications:', error);
      return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 });
    }

    // Get stats
    const { data: statsData, error: statsError } = await supabase
      .from('student_verifications')
      .select('verification_status');

    const stats = {
      total: statsData?.length || 0,
      pending: statsData?.filter(v => v.verification_status === 'pending').length || 0,
      approved: statsData?.filter(v => v.verification_status === 'approved').length || 0,
      rejected: statsData?.filter(v => v.verification_status === 'rejected').length || 0
    };

    return NextResponse.json({
      verifications: verifications || [],
      stats
    });

  } catch (error) {
    console.error('Student verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verificationId = searchParams.get('id');

    if (!verificationId) {
      return NextResponse.json({ error: 'Verification ID is required' }, { status: 400 });
    }

    const { status, notes, verifiedBy } = await request.json();

    const { data, error } = await supabase
      .from('student_verifications')
      .update({
        verification_status: status,
        verification_notes: notes,
        verified_by: verifiedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', verificationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating verification:', error);
      return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Verification updated successfully',
      verification: data
    });

  } catch (error) {
    console.error('Update verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verificationId = searchParams.get('id');

    if (!verificationId) {
      return NextResponse.json({ error: 'Verification ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('student_verifications')
      .delete()
      .eq('id', verificationId);

    if (error) {
      console.error('Error deleting verification:', error);
      return NextResponse.json({ error: 'Failed to delete verification' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Verification deleted successfully' });

  } catch (error) {
    console.error('Delete verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}