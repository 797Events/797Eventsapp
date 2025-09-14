'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  Users, 
  TrendingUp, 
  Award, 
  Copy, 
  Plus, 
  Edit2, 
  Trash2,
  Star,
  Crown,
  Medal
} from 'lucide-react';
import { mockInfluencers } from '@/lib/mockData';

export default function InfluencerTab() {
  const [showAddInfluencer, setShowAddInfluencer] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<string | null>(null);

  const totalRevenue = mockInfluencers.reduce((sum, inf) => sum + inf.revenue, 0);
  const totalTickets = mockInfluencers.reduce((sum, inf) => sum + inf.ticketsSold, 0);

  const pieChartData = mockInfluencers.map((inf, index) => ({
    name: inf.name,
    value: inf.revenue,
    color: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][index % 5]
  }));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <Crown size={16} className="text-yellow-400" />;
      case 1: return <Medal size={16} className="text-gray-300" />;
      case 2: return <Medal size={16} className="text-amber-600" />;
      default: return <Star size={16} className="text-purple-400" />;
    }
  };

  const AddInfluencerModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-white text-xl font-bold mb-4">Add New Influencer</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              placeholder="Enter influencer name"
            />
          </div>
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Referral Code</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
              placeholder="e.g., INFLUENCER20"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowAddInfluencer(false)}
              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowAddInfluencer(false)}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
            >
              Add Influencer
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Influencer & Referral Management</h1>
          <p className="text-white/60">Track performance and manage your brand ambassadors</p>
        </div>
        
        <button
          onClick={() => setShowAddInfluencer(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
        >
          <Plus size={16} />
          <span className="font-medium">Add Influencer</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-purple-500/20">
              <Users size={20} className="text-purple-400" />
            </div>
            <h3 className="text-white/80 font-medium">Active Influencers</h3>
          </div>
          <p className="text-white text-3xl font-bold">{mockInfluencers.length}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-green-500/20">
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <h3 className="text-white/80 font-medium">Total Revenue</h3>
          </div>
          <p className="text-white text-3xl font-bold">₹{(totalRevenue / 1000).toFixed(0)}K</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <Award size={20} className="text-blue-400" />
            </div>
            <h3 className="text-white/80 font-medium">Tickets Sold</h3>
          </div>
          <p className="text-white text-3xl font-bold">{totalTickets}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-yellow-500/20">
              <Star size={20} className="text-yellow-400" />
            </div>
            <h3 className="text-white/80 font-medium">Avg. Conversion</h3>
          </div>
          <p className="text-white text-3xl font-bold">
            {(mockInfluencers.reduce((sum, inf) => sum + inf.conversionRate, 0) / mockInfluencers.length).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Charts and Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Distribution */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-xl font-bold mb-1">Revenue Distribution</h3>
              <p className="text-white/60 text-sm">Share of total revenue by influencer</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="flex-1 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    formatter={(value: number) => [`₹${(value / 1000).toFixed(0)}K`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-2 ml-4">
              {pieChartData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1">
                    <p className="text-white/80 text-sm">{item.name}</p>
                    <p className="text-white/60 text-xs">₹{(item.value / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-xl font-bold mb-1">Leaderboard</h3>
              <p className="text-white/60 text-sm">Top performing influencers</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {mockInfluencers.map((influencer, index) => (
              <div key={influencer.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-sm font-mono w-6">#{index + 1}</span>
                  {getRankIcon(index)}
                </div>
                
                <div className="flex-1">
                  <h4 className="text-white font-medium">{influencer.name}</h4>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-purple-400">{influencer.ticketsSold} tickets</span>
                    <span className="text-green-400">₹{(influencer.revenue / 1000).toFixed(0)}K</span>
                    <span className="text-blue-400">{influencer.conversionRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Influencer Management Table */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white text-xl font-bold mb-1">Influencer Management</h3>
            <p className="text-white/60 text-sm">Manage codes and track performance</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/80 font-medium py-3">Rank</th>
                <th className="text-left text-white/80 font-medium py-3">Influencer</th>
                <th className="text-left text-white/80 font-medium py-3">Code</th>
                <th className="text-right text-white/80 font-medium py-3">Tickets</th>
                <th className="text-right text-white/80 font-medium py-3">Revenue</th>
                <th className="text-right text-white/80 font-medium py-3">Conversion</th>
                <th className="text-center text-white/80 font-medium py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockInfluencers.map((influencer, index) => (
                <tr key={influencer.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-sm font-mono">#{index + 1}</span>
                      {getRankIcon(index)}
                    </div>
                  </td>
                  <td className="py-4">
                    <div>
                      <p className="text-white font-medium">{influencer.name}</p>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-white/10 rounded text-purple-400 text-sm font-mono">
                        {influencer.code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(influencer.code)}
                        className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="text-right py-4">
                    <span className="text-white">{influencer.ticketsSold}</span>
                  </td>
                  <td className="text-right py-4">
                    <span className="text-green-400">₹{influencer.revenue.toLocaleString()}</span>
                  </td>
                  <td className="text-right py-4">
                    <span className="text-blue-400">{influencer.conversionRate}%</span>
                  </td>
                  <td className="text-center py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditingInfluencer(influencer.id)}
                        className="p-2 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="p-2 hover:bg-red-500/20 rounded text-white/60 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <h3 className="text-white text-xl font-bold mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-green-500/20 rounded-xl p-4 mb-3">
              <p className="text-green-400 text-2xl font-bold">
                {Math.max(...mockInfluencers.map(i => i.conversionRate)).toFixed(1)}%
              </p>
            </div>
            <p className="text-white/80 font-medium">Best Conversion Rate</p>
            <p className="text-white/60 text-sm">
              {mockInfluencers.find(i => i.conversionRate === Math.max(...mockInfluencers.map(i => i.conversionRate)))?.name}
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-500/20 rounded-xl p-4 mb-3">
              <p className="text-purple-400 text-2xl font-bold">
                {Math.max(...mockInfluencers.map(i => i.ticketsSold))}
              </p>
            </div>
            <p className="text-white/80 font-medium">Most Tickets Sold</p>
            <p className="text-white/60 text-sm">
              {mockInfluencers.find(i => i.ticketsSold === Math.max(...mockInfluencers.map(i => i.ticketsSold)))?.name}
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-yellow-500/20 rounded-xl p-4 mb-3">
              <p className="text-yellow-400 text-2xl font-bold">
                ₹{Math.round(totalRevenue / mockInfluencers.length / 1000)}K
              </p>
            </div>
            <p className="text-white/80 font-medium">Avg. Revenue per Influencer</p>
            <p className="text-white/60 text-sm">Monthly average</p>
          </div>
        </div>
      </div>

      {/* Add Influencer Modal */}
      {showAddInfluencer && <AddInfluencerModal />}
    </div>
  );
}