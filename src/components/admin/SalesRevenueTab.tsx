'use client';

import { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Download, Calendar, TrendingUp, DollarSign, Ticket } from 'lucide-react';
import { mockSalesData, mockEventAnalytics, mockKPIs } from '@/lib/mockData';

export default function SalesRevenueTab() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [viewType, setViewType] = useState<'revenue' | 'tickets'>('revenue');

  const getFilteredData = () => {
    const days = { '7d': 7, '30d': 30, '90d': 90 }[timeRange];
    return mockSalesData.slice(-days);
  };

  const exportToCSV = () => {
    const data = getFilteredData();
    const csvContent = [
      ['Date', 'Tickets Sold', 'Revenue'],
      ...data.map(row => [row.date, row.tickets, row.revenue])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-data-${timeRange}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredData = getFilteredData();
  const totalRevenue = filteredData.reduce((sum, day) => sum + day.revenue, 0);
  const totalTickets = filteredData.reduce((sum, day) => sum + day.tickets, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sales & Revenue Analytics</h1>
          <p className="text-white/60">Detailed breakdown of your event sales performance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-white/10 rounded-xl p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
          >
            <Download size={16} />
            <span className="font-medium">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-purple-500/20">
              <DollarSign size={20} className="text-purple-400" />
            </div>
            <h3 className="text-white/80 font-medium">Total Revenue</h3>
          </div>
          <p className="text-white text-3xl font-bold mb-1">₹{(totalRevenue / 1000).toFixed(0)}K</p>
          <p className="text-green-400 text-sm">Last {timeRange}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <Ticket size={20} className="text-blue-400" />
            </div>
            <h3 className="text-white/80 font-medium">Tickets Sold</h3>
          </div>
          <p className="text-white text-3xl font-bold mb-1">{totalTickets.toLocaleString()}</p>
          <p className="text-green-400 text-sm">Last {timeRange}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-green-500/20">
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <h3 className="text-white/80 font-medium">Average Daily</h3>
          </div>
          <p className="text-white text-3xl font-bold mb-1">₹{Math.round(totalRevenue / filteredData.length / 1000)}K</p>
          <p className="text-green-400 text-sm">Per day revenue</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-white text-xl font-bold mb-1">Sales Performance</h3>
            <p className="text-white/60 text-sm">
              {viewType === 'revenue' ? 'Revenue' : 'Ticket sales'} over time
            </p>
          </div>
          
          {/* Chart Type Toggle */}
          <div className="flex bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewType('revenue')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewType === 'revenue'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setViewType('tickets')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewType === 'tickets'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Tickets
            </button>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.6)" 
                fontSize={12}
                tickFormatter={(value) => viewType === 'revenue' ? `₹${(value/1000).toFixed(0)}K` : value}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number) => [
                  viewType === 'revenue' ? `₹${value.toLocaleString()}` : `${value} tickets`,
                  viewType === 'revenue' ? 'Revenue' : 'Tickets Sold'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey={viewType} 
                stroke={viewType === 'revenue' ? '#10b981' : '#3b82f6'} 
                strokeWidth={3}
                dot={{ fill: viewType === 'revenue' ? '#10b981' : '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Event Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Event */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-xl font-bold mb-1">Revenue by Event</h3>
              <p className="text-white/60 text-sm">Performance of individual events</p>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockEventAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="eventName" 
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.6)" 
                  fontSize={12}
                  tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ticket Sales by Event */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-xl font-bold mb-1">Ticket Sales by Event</h3>
              <p className="text-white/60 text-sm">Volume of tickets sold per event</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {mockEventAnalytics.map((event, index) => (
              <div key={event.eventId} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium text-sm">{event.eventName}</h4>
                  <span className="text-white/60 text-sm">
                    {event.ticketsSold}/{event.totalTickets}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${(event.ticketsSold / event.totalTickets) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-400 font-medium">
                    {Math.round((event.ticketsSold / event.totalTickets) * 100)}% sold
                  </span>
                  <span className="text-white/60">
                    ₹{event.revenue.toLocaleString()} revenue
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Type Breakdown */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white text-xl font-bold mb-1">Sales by Ticket Type</h3>
            <p className="text-white/60 text-sm">Performance breakdown across all events</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/80 font-medium py-3">Event</th>
                <th className="text-left text-white/80 font-medium py-3">Ticket Type</th>
                <th className="text-right text-white/80 font-medium py-3">Sold</th>
                <th className="text-right text-white/80 font-medium py-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {mockEventAnalytics.flatMap(event =>
                event.ticketTypes.map((type, typeIndex) => (
                  <tr key={`${event.eventId}-${typeIndex}`} className="border-b border-white/5">
                    <td className="text-white py-3">{event.eventName}</td>
                    <td className="text-white/80 py-3">{type.type}</td>
                    <td className="text-right text-white py-3">{type.sold}</td>
                    <td className="text-right text-green-400 py-3">₹{type.revenue.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}