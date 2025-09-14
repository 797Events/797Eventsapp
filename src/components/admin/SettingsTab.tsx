'use client';

import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  Bell,
  Globe,
  Percent,
  Hash,
  AlertTriangle,
  Check,
  Copy
} from 'lucide-react';
import { mockReferralCodes } from '@/lib/mockData';

interface ReferralCode {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  isActive: boolean;
  usageCount: number;
}

export default function SettingsTab() {
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>(mockReferralCodes);
  const [showAddCode, setShowAddCode] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  
  // Alert thresholds
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [criticalStockThreshold, setCriticalStockThreshold] = useState(5);
  
  // General settings
  const [websiteSettings, setWebsiteSettings] = useState({
    siteName: '797 Events',
    tagline: 'Unforgettable Events, Unmatched Experiences',
    enableBookings: true,
    maintenanceMode: false,
    analyticsEnabled: true,
    notificationsEnabled: true
  });

  const [newCode, setNewCode] = useState({
    code: '',
    discount: 0,
    type: 'percentage' as 'percentage' | 'fixed',
    isActive: true
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode({ ...newCode, code: result });
  };

  const addReferralCode = () => {
    if (!newCode.code.trim()) {
      alert('Please enter a code');
      return;
    }
    
    if (referralCodes.some(c => c.code === newCode.code)) {
      alert('Code already exists');
      return;
    }

    const code: ReferralCode = {
      id: Date.now().toString(),
      code: newCode.code.toUpperCase(),
      discount: newCode.discount,
      type: newCode.type,
      isActive: newCode.isActive,
      usageCount: 0
    };

    setReferralCodes([...referralCodes, code]);
    setNewCode({ code: '', discount: 0, type: 'percentage', isActive: true });
    setShowAddCode(false);
  };

  const toggleCodeStatus = (id: string) => {
    setReferralCodes(codes =>
      codes.map(code =>
        code.id === id ? { ...code, isActive: !code.isActive } : code
      )
    );
  };

  const deleteCode = (id: string) => {
    if (confirm('Are you sure you want to delete this referral code?')) {
      setReferralCodes(codes => codes.filter(code => code.id !== id));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/60">Manage referral codes, alerts, and general website settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Referral Codes Management */}
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20">
                  <Percent size={20} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold">Referral Codes</h3>
                  <p className="text-white/60 text-sm">Manage discount and promotional codes</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCode(!showAddCode)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors text-sm"
              >
                <Plus size={16} />
                Add Code
              </button>
            </div>

            {/* Add New Code Form */}
            {showAddCode && (
              <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                <h4 className="text-white font-medium mb-4">Add New Referral Code</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCode.code}
                          onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                          placeholder="DISCOUNT10"
                        />
                        <button
                          onClick={generateRandomCode}
                          className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
                        >
                          <Hash size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Discount</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={newCode.discount}
                          onChange={(e) => setNewCode({ ...newCode, discount: Number(e.target.value) })}
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
                          placeholder="10"
                        />
                        <select
                          value={newCode.type}
                          onChange={(e) => setNewCode({ ...newCode, type: e.target.value as 'percentage' | 'fixed' })}
                          className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 text-sm"
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">₹</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="activeCode"
                      checked={newCode.isActive}
                      onChange={(e) => setNewCode({ ...newCode, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-2 border-white/20 bg-white/5 checked:bg-purple-600"
                    />
                    <label htmlFor="activeCode" className="text-white/80 text-sm">Active immediately</label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAddCode(false)}
                      className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addReferralCode}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                    >
                      Add Code
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Codes List */}
            <div className="space-y-3">
              {referralCodes.map((code) => (
                <div key={code.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <code className="px-3 py-1 bg-purple-500/20 rounded-lg text-purple-400 font-mono text-sm">
                          {code.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-white">
                          {code.discount}{code.type === 'percentage' ? '%' : '₹'} off
                        </span>
                        <span className="text-white/60">
                          Used {code.usageCount} times
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          code.isActive 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {code.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCodeStatus(code.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          code.isActive
                            ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'
                            : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                        }`}
                      >
                        {code.isActive ? <AlertTriangle size={14} /> : <Check size={14} />}
                      </button>
                      <button
                        onClick={() => deleteCode(code.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {referralCodes.length === 0 && (
                <div className="text-center py-8 text-white/60">
                  <Percent size={32} className="mx-auto mb-3 opacity-50" />
                  <p>No referral codes yet. Add your first one!</p>
                </div>
              )}
            </div>
          </div>

          {/* Alert Thresholds */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-orange-500/20">
                <Bell size={20} className="text-orange-400" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold">Alert Thresholds</h3>
                <p className="text-white/60 text-sm">Set low stock warnings for ticket availability</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Low Stock Warning (tickets remaining)
                </label>
                <input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                  min="1"
                />
                <p className="text-white/60 text-xs mt-1">
                  Alert when ticket availability drops to this number
                </p>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Critical Stock Alert (tickets remaining)
                </label>
                <input
                  type="number"
                  value={criticalStockThreshold}
                  onChange={(e) => setCriticalStockThreshold(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                  min="1"
                />
                <p className="text-white/60 text-xs mt-1">
                  Urgent alert when ticket availability drops to this number
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Current Alerts
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-300">The Great Indian Navratri - VIP</span>
                    <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full text-xs">
                      8 left
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-300">Tech Conference - Early Bird</span>
                    <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs">
                      3 left
                    </span>
                  </div>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors">
                <Save size={16} />
                Save Alert Settings
              </button>
            </div>
          </div>
        </div>

        {/* General Website Settings */}
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-blue-500/20">
                <Globe size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold">General Settings</h3>
                <p className="text-white/60 text-sm">Website configuration and preferences</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Site Name</label>
                <input
                  type="text"
                  value={websiteSettings.siteName}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, siteName: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Tagline</label>
                <input
                  type="text"
                  value={websiteSettings.tagline}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, tagline: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-medium">Feature Toggles</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white/80">Enable Event Bookings</span>
                    <input
                      type="checkbox"
                      checked={websiteSettings.enableBookings}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, enableBookings: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-purple-600"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white/80">Maintenance Mode</span>
                    <input
                      type="checkbox"
                      checked={websiteSettings.maintenanceMode}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, maintenanceMode: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-purple-600"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white/80">Analytics Tracking</span>
                    <input
                      type="checkbox"
                      checked={websiteSettings.analyticsEnabled}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, analyticsEnabled: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-purple-600"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white/80">Push Notifications</span>
                    <input
                      type="checkbox"
                      checked={websiteSettings.notificationsEnabled}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, notificationsEnabled: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-purple-600"
                    />
                  </label>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                <Save size={16} />
                Save General Settings
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-green-500/20">
                <SettingsIcon size={20} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold">Quick Actions</h3>
                <p className="text-white/60 text-sm">Common administrative tasks</p>
              </div>
            </div>

            <div className="space-y-4">
              <button className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-left">
                <span className="text-white">Clear Cache</span>
                <span className="text-white/60 text-sm">Last: 2 hours ago</span>
              </button>

              <button className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-left">
                <span className="text-white">Export Data</span>
                <span className="text-white/60 text-sm">All events & bookings</span>
              </button>

              <button className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-left">
                <span className="text-white">Backup Database</span>
                <span className="text-white/60 text-sm">Last: Yesterday</span>
              </button>

              <button className="w-full flex items-center justify-between px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors text-left border border-red-500/20">
                <span className="text-red-400">Reset All Data</span>
                <span className="text-red-400/60 text-sm">⚠️ Destructive</span>
              </button>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">System Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Version</span>
                <span className="text-white">v1.2.3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Last Updated</span>
                <span className="text-white">2 days ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Environment</span>
                <span className="text-green-400">Production</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Uptime</span>
                <span className="text-white">15d 7h 23m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}