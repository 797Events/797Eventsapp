'use client';

import { AdminTab } from '@/app/admin/page';
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  Calendar, 
  Settings,
  Home,
  LogOut,
  Menu,
  X
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
  { id: 'overview' as AdminTab, label: 'Overview', icon: BarChart3 },
  { id: 'sales' as AdminTab, label: 'Sales & Revenue', icon: DollarSign },
  { id: 'influencer' as AdminTab, label: 'Influencer & Referrals', icon: Users },
  { id: 'events' as AdminTab, label: 'Event Management', icon: Calendar },
  { id: 'settings' as AdminTab, label: 'Settings', icon: Settings },
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
      <div className="hidden lg:flex lg:flex-col lg:w-72 bg-white/10 backdrop-blur-xl border-r border-white/20">
        {/* Logo Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">797</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">797 Events</h1>
              <p className="text-white/60 text-sm">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/20 text-white shadow-lg shadow-purple-500/10' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/20 space-y-2">
          <button
            onClick={onViewSite}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <Home size={20} />
            <span className="font-medium">View Website</span>
          </button>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-red-500/20 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-white/10 backdrop-blur-xl border-r border-white/20 z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Header */}
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">797</span>
            </div>
            <div>
              <h1 className="text-white font-bold">797 Events</h1>
              <p className="text-white/60 text-xs">Admin Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white/70 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 p-4 space-y-1">
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/20 text-white shadow-lg shadow-purple-500/10' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Footer Actions */}
        <div className="p-4 border-t border-white/20 space-y-2">
          <button
            onClick={() => {
              onViewSite();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <Home size={20} />
            <span className="font-medium">View Website</span>
          </button>
          <button
            onClick={() => {
              onSignOut();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-red-500/20 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}