'use client';

import { AdminTab } from '@/app/admin/page';
import LuxuryCard from '@/components/ui/LuxuryCard';
import {
  BarChart3,
  DollarSign,
  Users,
  Calendar,
  Home,
  LogOut,
  Menu,
  X,
  Tag,
  Database,
  Activity,
  GraduationCap,
  Download
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onSignOut: () => void;
  onViewSite: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const sidebarItems = [
  { id: 'overview' as AdminTab, label: 'Overview & Analytics', icon: BarChart3 },
  { id: 'events' as AdminTab, label: 'Event Management', icon: Calendar },
  { id: 'users' as AdminTab, label: 'User Management', icon: Users },
  { id: 'student-verification' as AdminTab, label: 'Student Verification', icon: GraduationCap },
  { id: 'attendance-analytics' as AdminTab, label: 'Attendance Analytics', icon: Activity },
];

export default function AdminSidebar({
  activeTab,
  onTabChange,
  onSignOut,
  onViewSite,
  sidebarOpen,
  setSidebarOpen
}: AdminSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-80 glass-luxury border-r border-glass">
        {/* Logo Header */}
        <div className="p-8 border-b border-glass">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-luxury-gradient rounded-2xl flex items-center justify-center shadow-luxury">
              <span className="text-white font-bold text-xl">797</span>
            </div>
            <div>
              <h1 className="heading-font text-white font-light text-xl">797 Events</h1>
              <p className="body-font text-white/60 text-sm">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left outline-none focus:outline-none ${
                  isActive
                    ? 'glass-card text-white shadow-luxury-lg'
                    : 'text-white/70'
                }`}
                style={{ border: 'none', boxShadow: 'none' }}
              >
                <Icon size={22} className={isActive ? 'text-white' : 'text-white/60'} />
                <span className="body-font font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-6 border-t border-glass space-y-3">
          <button
            onClick={onViewSite}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-white/70 hover:text-white hover:glass-card hover:border-white/10 hover:shadow-luxury transition-all duration-500 group"
          >
            <Home size={22} className="text-white/60 group-hover:text-white" />
            <span className="body-font font-medium">View Website</span>
          </button>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-white/70 hover:text-white hover:bg-red-500/10 hover:border-red-400/20 transition-all duration-500 group border border-transparent"
          >
            <LogOut size={22} className="text-white/60 group-hover:text-red-400" />
            <span className="body-font font-medium group-hover:text-red-400">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 w-80 glass-luxury border-r border-glass z-50 transform transition-transform duration-500 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Header */}
        <div className="p-6 border-b border-glass flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-luxury-gradient rounded-xl flex items-center justify-center shadow-luxury">
              <span className="text-white font-bold">797</span>
            </div>
            <div>
              <h1 className="heading-font text-white font-light text-lg">797 Events</h1>
              <p className="body-font text-white/60 text-sm">Admin Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
          >
            <X size={22} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 p-6 space-y-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left outline-none focus:outline-none ${
                  isActive
                    ? 'glass-card text-white shadow-luxury-lg'
                    : 'text-white/70'
                }`}
                style={{ border: 'none', boxShadow: 'none' }}
              >
                <Icon size={22} className={isActive ? 'text-white' : 'text-white/60'} />
                <span className="body-font font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Footer Actions */}
        <div className="p-6 border-t border-glass space-y-3">
          <button
            onClick={() => {
              onViewSite();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-white/70 hover:text-white hover:glass-card hover:border-white/10 hover:shadow-luxury transition-all duration-500 group"
          >
            <Home size={22} className="text-white/60 group-hover:text-white" />
            <span className="body-font font-medium">View Website</span>
          </button>
          <button
            onClick={() => {
              onSignOut();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-white/70 hover:text-white hover:bg-red-500/10 hover:border-red-400/20 transition-all duration-500 group border border-transparent"
          >
            <LogOut size={22} className="text-white/60 group-hover:text-red-400" />
            <span className="body-font font-medium group-hover:text-red-400">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}