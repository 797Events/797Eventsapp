'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Import dashboard components
import AdminSidebar from '@/components/admin/AdminSidebar';
import OverviewTab from '@/components/admin/OverviewTab';
import EventManagementTab from '@/components/admin/EventManagementTab';
import UserManagementTab from '@/components/admin/UserManagementTab';
import StudentVerificationTab from '@/components/admin/StudentVerificationTab';
import AttendanceAnalyticsTab from '@/components/admin/AttendanceAnalyticsTab';

export type AdminTab = 'overview' | 'events' | 'users' | 'student-verification' | 'attendance-analytics';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Admin dashboard checking authentication...');

        // First check new JWT-based auth
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');

        if (token && userStr) {
          try {
            const userData = JSON.parse(userStr);
            console.log('📊 Found JWT session data:', userData);

            if (userData.role === 'admin') {
              console.log('✅ Valid admin JWT session found');
              setCurrentUser({
                id: userData.id,
                email: userData.email,
                name: userData.name,
                role: 'admin'
              });
              setIsAuthenticated(true);
              setLoading(false);
              return;
            } else {
              console.log('❌ User is not admin:', userData.role);
            }
          } catch (e) {
            console.log('❌ Failed to parse JWT user data');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }

        // Fallback: Check Supabase auth (legacy)
        const { data: { user }, error } = await supabase.auth.getUser();

        if (!error && user) {
          // Check if user is admin in Supabase
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          if (!userError && userData && userData.role === 'admin') {
            setCurrentUser({ id: user.id, email: user.email, role: 'admin' });
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }
        }

        // Fallback: Check temporary session for demo/testing
        const tempSession = localStorage.getItem('temp_admin_session');
        if (tempSession) {
          try {
            const session = JSON.parse(tempSession);
            if (session.expires_at > Date.now() && session.role === 'admin') {
              setCurrentUser({
                id: session.user.id,
                email: session.user.email,
                role: 'admin'
              });
              setIsAuthenticated(true);
              setLoading(false);
              return;
            } else {
              // Session expired, remove it
              localStorage.removeItem('temp_admin_session');
            }
          } catch (e) {
            localStorage.removeItem('temp_admin_session');
          }
        }

        // No valid authentication found
        console.log('❌ No valid admin session found, redirecting to login');
        router.push('/login');
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear all session data (both old and new formats)
      localStorage.removeItem('temp_admin_session');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('session');

      console.log('✅ Successfully signed out, cleared all session data');
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if Supabase sign out fails, clear all sessions and redirect
      localStorage.removeItem('temp_admin_session');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('session');

      console.log('🔄 Cleared session data after error');
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-violet-950 to-indigo-950">
        <div className="text-white text-xl">Loading Dashboard...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'events':
        return <EventManagementTab />;
      case 'users':
        return <UserManagementTab currentUserRole={currentUser?.role || 'admin'} />;
      case 'student-verification':
        return <StudentVerificationTab />;
      case 'attendance-analytics':
        return <AttendanceAnalyticsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSignOut={handleSignOut}
          onViewSite={() => router.push('/')}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white/10 backdrop-blur-xl border-b border-white/20 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {renderActiveTab()}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}