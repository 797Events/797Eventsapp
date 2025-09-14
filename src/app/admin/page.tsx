'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isValidSession } from '@/lib/auth';
import ShaderBackground from '@/components/ShaderBackground';
import GrainyOverlay from '@/components/GrainyOverlay';
import ShimmerOverlay from '@/components/ShimmerOverlay';

// Import dashboard components
import AdminSidebar from '@/components/admin/AdminSidebar';
import OverviewTab from '@/components/admin/OverviewTab';
import SalesRevenueTab from '@/components/admin/SalesRevenueTab';
import InfluencerTab from '@/components/admin/InfluencerTab';
import EventManagementTab from '@/components/admin/EventManagementTab';
import SettingsTab from '@/components/admin/SettingsTab';

export type AdminTab = 'overview' | 'sales' | 'influencer' | 'events' | 'settings';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem('session');
    if (session && isValidSession(session)) {
      setIsAuthenticated(true);
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem('session');
    router.push('/');
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
      case 'sales':
        return <SalesRevenueTab />;
      case 'influencer':
        return <InfluencerTab />;
      case 'events':
        return <EventManagementTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-950 via-purple-900 to-indigo-950 relative overflow-hidden">
      <ShaderBackground />
      <GrainyOverlay />
      <ShimmerOverlay />
      
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