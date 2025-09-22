'use client';

import React, { useState, useEffect } from 'react';
import LuxuryCard from '@/components/ui/LuxuryCard';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Plus,
  Search,
  TrendingUp,
  DollarSign,
  Award,
  Activity,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Settings
} from 'lucide-react';

interface Influencer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  code: string;
  commission_rate: number;
  total_sales: number;
  total_revenue: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface InfluencerStats {
  totalInfluencers: number;
  activeInfluencers: number;
  totalCommissions: number;
  totalSales: number;
  topPerformer: string;
}

interface InfluencerFormData {
  name: string;
  email: string;
  phone: string;
  code: string;
  commission_rate: number;
  is_active: boolean;
}

export default function InfluencerManagementTab() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [stats, setStats] = useState<InfluencerStats>({
    totalInfluencers: 0,
    activeInfluencers: 0,
    totalCommissions: 0,
    totalSales: 0,
    topPerformer: 'N/A'
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load influencers data with real-time updates
  const loadInfluencers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading influencers data...');

      const response = await fetch('/api/influencers');
      const data = await response.json();

      if (data.success) {
        setInfluencers(data.influencers);
        calculateStats(data.influencers);
        console.log('✅ Loaded', data.influencers.length, 'influencers');
      } else {
        console.error('❌ Failed to load influencers:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading influencers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate real-time statistics
  const calculateStats = (influencersList: Influencer[]) => {
    const activeCount = influencersList.filter(inf => inf.is_active).length;
    const totalCommissions = influencersList.reduce((sum, inf) => sum + (inf.total_revenue * (inf.commission_rate / 100)), 0);
    const totalSales = influencersList.reduce((sum, inf) => sum + inf.total_sales, 0);
    const topPerformer = influencersList.length > 0
      ? influencersList.reduce((top, current) =>
          current.total_sales > top.total_sales ? current : top
        ).name
      : 'N/A';

    setStats({
      totalInfluencers: influencersList.length,
      activeInfluencers: activeCount,
      totalCommissions,
      totalSales,
      topPerformer
    });
  };

  // Filter influencers based on search
  const filteredInfluencers = influencers.filter(influencer =>
    influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Copy referral code to clipboard
  const copyReferralCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Create new influencer
  const handleCreateInfluencer = async (formData: InfluencerFormData) => {
    try {
      console.log('🔄 Creating new influencer:', formData);

      const response = await fetch('/api/influencers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          code: formData.code,
          commissionRate: formData.commission_rate,
          isActive: formData.is_active
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Influencer created successfully');

        // Show login credentials to admin
        if (data.loginCredentials) {
          alert(`Influencer created successfully!\n\nLogin Credentials:\nEmail: ${data.loginCredentials.email}\nPassword: ${data.loginCredentials.defaultPassword}\n\n${data.loginCredentials.message}`);
        }

        setShowCreateModal(false);
        loadInfluencers(); // Refresh data
      } else {
        console.error('❌ Failed to create influencer:', data.error);
        alert('Failed to create influencer: ' + data.error);
      }
    } catch (error) {
      console.error('❌ Error creating influencer:', error);
      alert('Failed to create influencer. Please try again.');
    }
  };

  // Update existing influencer
  const handleUpdateInfluencer = async (id: string, formData: InfluencerFormData) => {
    try {
      console.log('🔄 Updating influencer:', id, formData);

      const response = await fetch(`/api/influencers?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          code: formData.code,
          commissionRate: formData.commission_rate,
          isActive: formData.is_active
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Influencer updated successfully');
        setEditingInfluencer(null);
        loadInfluencers(); // Refresh data
      } else {
        console.error('❌ Failed to update influencer:', data.error);
        alert('Failed to update influencer: ' + data.error);
      }
    } catch (error) {
      console.error('❌ Error updating influencer:', error);
      alert('Failed to update influencer. Please try again.');
    }
  };

  // Delete influencer
  const handleDeleteInfluencer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete influencer "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('🔄 Deleting influencer:', id);

      const response = await fetch(`/api/influencers?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Influencer deleted successfully');
        loadInfluencers(); // Refresh data
      } else {
        console.error('❌ Failed to delete influencer:', data.error);
        alert('Failed to delete influencer: ' + data.error);
      }
    } catch (error) {
      console.error('❌ Error deleting influencer:', error);
      alert('Failed to delete influencer. Please try again.');
    }
  };

  // Toggle influencer active status
  const toggleInfluencerStatus = async (influencer: Influencer) => {
    const updatedData = {
      name: influencer.name,
      email: influencer.email,
      phone: influencer.phone || '',
      code: influencer.code,
      commission_rate: influencer.commission_rate,
      is_active: !influencer.is_active
    };

    await handleUpdateInfluencer(influencer.id, updatedData);
  };

  // Load data on component mount and set up real-time updates
  useEffect(() => {
    loadInfluencers();

    // Set up periodic refresh for real-time data
    const interval = setInterval(() => {
      loadInfluencers();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Influencer Management</h2>
          <p className="text-white/60 mt-1">
            Manage referral codes, commissions, and influencer performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadInfluencers}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all duration-300"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            Add Influencer
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <LuxuryCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-light text-white mb-1">{stats.totalInfluencers}</div>
              <span className="text-white/80 text-sm">Total Influencers</span>
            </div>
            <Users className="h-8 w-8 text-purple-400" />
          </div>
        </LuxuryCard>

        <LuxuryCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-light text-green-400 mb-1">{stats.activeInfluencers}</div>
              <span className="text-white/80 text-sm">Active</span>
            </div>
            <Activity className="h-8 w-8 text-green-400" />
          </div>
        </LuxuryCard>

        <LuxuryCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-light text-blue-400 mb-1">{stats.totalSales}</div>
              <span className="text-white/80 text-sm">Total Sales</span>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </LuxuryCard>

        <LuxuryCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-light text-yellow-400 mb-1">₹{stats.totalCommissions.toLocaleString()}</div>
              <span className="text-white/80 text-sm">Total Commissions</span>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-400" />
          </div>
        </LuxuryCard>

        <LuxuryCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-light text-orange-400 mb-1 truncate">{stats.topPerformer}</div>
              <span className="text-white/80 text-sm">Top Performer</span>
            </div>
            <Award className="h-8 w-8 text-orange-400" />
          </div>
        </LuxuryCard>
      </div>

      {/* Search and Filters */}
      <LuxuryCard className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search by name, email, or referral code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:bg-white/15 transition-all duration-300"
            />
          </div>
        </div>

        {/* Influencers Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white/80 font-medium">Influencer</th>
                <th className="text-left py-3 px-4 text-white/80 font-medium">Referral Code</th>
                <th className="text-left py-3 px-4 text-white/80 font-medium">Commission</th>
                <th className="text-left py-3 px-4 text-white/80 font-medium">Sales</th>
                <th className="text-left py-3 px-4 text-white/80 font-medium">Revenue</th>
                <th className="text-left py-3 px-4 text-white/80 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-white/80 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-white/60">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading influencers...
                  </td>
                </tr>
              ) : filteredInfluencers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-white/60">
                    {searchTerm ? 'No influencers match your search.' : 'No influencers found. Create one to get started.'}
                  </td>
                </tr>
              ) : (
                filteredInfluencers.map((influencer) => (
                  <tr key={influencer.id} className="border-b border-white/5 hover:bg-white/5 transition-all duration-300">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-white">{influencer.name}</div>
                        <div className="text-sm text-white/60">{influencer.email}</div>
                        {influencer.phone && (
                          <div className="text-sm text-white/40">{influencer.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-sm font-mono">
                          {influencer.code}
                        </code>
                        <button
                          onClick={() => copyReferralCode(influencer.code)}
                          className="p-1 hover:bg-white/10 rounded transition-all duration-300"
                          title="Copy code"
                        >
                          {copiedCode === influencer.code ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-white/60" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white">{influencer.commission_rate}%</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white">{influencer.total_sales}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white">₹{influencer.total_revenue.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        influencer.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {influencer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingInfluencer(influencer)}
                          className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-all duration-300"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleInfluencerStatus(influencer)}
                          className={`p-2 hover:bg-opacity-20 rounded-lg transition-all duration-300 ${
                            influencer.is_active
                              ? 'hover:bg-red-500/20 text-red-400'
                              : 'hover:bg-green-500/20 text-green-400'
                          }`}
                          title={influencer.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {influencer.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteInfluencer(influencer.id, influencer.name)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-all duration-300"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </LuxuryCard>

      {/* Create Influencer Modal */}
      {showCreateModal && (
        <InfluencerFormModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateInfluencer}
        />
      )}

      {/* Edit Influencer Modal */}
      {editingInfluencer && (
        <InfluencerFormModal
          influencer={editingInfluencer}
          onClose={() => setEditingInfluencer(null)}
          onSubmit={(formData) => handleUpdateInfluencer(editingInfluencer.id, formData)}
        />
      )}
    </div>
  );
}

// Influencer Form Modal Component
interface InfluencerFormModalProps {
  influencer?: Influencer;
  onClose: () => void;
  onSubmit: (formData: InfluencerFormData) => void;
}

function InfluencerFormModal({ influencer, onClose, onSubmit }: InfluencerFormModalProps) {
  const [formData, setFormData] = useState<InfluencerFormData>({
    name: influencer?.name || '',
    email: influencer?.email || '',
    phone: influencer?.phone || '',
    code: influencer?.code || '',
    commission_rate: influencer?.commission_rate || 10,
    is_active: influencer?.is_active ?? true,
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    code?: string;
    commission_rate?: string;
    is_active?: string;
  }>({});

  // Generate unique referral code
  const generateReferralCode = () => {
    const timestamp = Date.now().toString().slice(-4);
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData(prev => ({ ...prev, code: `REF${timestamp}${randomStr}` }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      email?: string;
      phone?: string;
      code?: string;
      commission_rate?: string;
      is_active?: string;
    } = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.code.trim()) newErrors.code = 'Referral code is required';
    if (formData.commission_rate < 0 || formData.commission_rate > 100) newErrors.commission_rate = 'Commission must be between 0-100%';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <LuxuryCard variant="elevated" className="w-full max-w-md p-8 shadow-luxury-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            {influencer ? 'Edit Influencer' : 'Add New Influencer'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
          >
            <Plus className="h-5 w-5 text-white rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:bg-white/15 transition-all duration-300"
              placeholder="Enter influencer name"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:bg-white/15 transition-all duration-300"
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:bg-white/15 transition-all duration-300"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Referral Code *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:bg-white/15 transition-all duration-300 font-mono"
                placeholder="Enter referral code"
              />
              <button
                type="button"
                onClick={generateReferralCode}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all duration-300"
                title="Generate random code"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            {errors.code && <p className="text-red-400 text-sm mt-1">{errors.code}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Commission Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.commission_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:border-white/40 focus:bg-white/15 transition-all duration-300"
              placeholder="10.0"
            />
            {errors.commission_rate && <p className="text-red-400 text-sm mt-1">{errors.commission_rate}</p>}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
            />
            <label htmlFor="is_active" className="text-sm text-white/80">
              Active (can generate sales)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all duration-300"
            >
              {influencer ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </LuxuryCard>
    </div>
  );
}