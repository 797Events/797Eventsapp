'use client';

import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Ticket, 
  DollarSign, 
  Calculator, 
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { 
  mockKPIs, 
  mockSalesData, 
  getRevenueByTicketType, 
  calculateTrend 
} from '@/lib/mockData';

export default function OverviewTab() {
  const revenueByType = getRevenueByTicketType();
  const salesTrend = calculateTrend(mockSalesData.map(d => d.tickets));
  const revenueTrend = calculateTrend(mockSalesData.map(d => d.revenue));

  const KPICard = ({ 
    title, 
    value, 
    trend, 
    icon: Icon, 
    color = "purple" 
  }: { 
    title: string; 
    value: string | number; 
    trend?: { value: number; isPositive: boolean }; 
    icon: any; 
    color?: string; 
  }) => (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl bg-${color}-500/20`}>
              <Icon size={20} className={`text-${color}-400`} />
            </div>
            <h3 className="text-white/80 text-sm font-medium">{title}</h3>
          </div>
          <p className="text-white text-2xl font-bold mb-1">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trend.isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{trend.value.toFixed(1)}% from last week</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
          <p className="text-white/60">Welcome back! Here's what's happening with your events.</p>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-sm">Last updated</p>
          <p className="text-white font-medium">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Tickets Sold"
          value={mockKPIs.totalTicketsSold.toLocaleString()}
          trend={salesTrend}
          icon={Ticket}
          color="purple"
        />
        <KPICard
          title="Total Revenue"
          value={`₹${(mockKPIs.totalRevenue / 1000).toFixed(0)}K`}
          trend={revenueTrend}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="Average Ticket Price"
          value={`₹${mockKPIs.averageTicketPrice}`}
          icon={Calculator}
          color="blue"
        />
        <KPICard
          title="Active Events"
          value={mockKPIs.activeEvents}
          icon={Calendar}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-xl font-bold mb-1">Sales Trend</h3>
              <p className="text-white/60 text-sm">Ticket sales over the last 30 days</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">This month</p>
              <p className="text-white text-lg font-bold">
                {mockSalesData.reduce((sum, day) => sum + day.tickets, 0)} tickets
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockSalesData.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={12}
                />
                <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="tickets" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#a855f7' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Ticket Type */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-xl font-bold mb-1">Revenue by Ticket Type</h3>
              <p className="text-white/60 text-sm">Distribution of revenue across ticket categories</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Total</p>
              <p className="text-white text-lg font-bold">₹{(mockKPIs.totalRevenue / 1000).toFixed(0)}K</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="revenue"
                  >
                    {revenueByType.map((entry, index) => (
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

            {/* Legend */}
            <div className="space-y-3">
              {revenueByType.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-white/80 text-sm">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">
                      ₹{(item.revenue / 1000).toFixed(0)}K
                    </p>
                    <p className="text-white/60 text-xs">{item.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <h3 className="text-white text-xl font-bold mb-4">Quick Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-purple-500/20 rounded-xl p-4 mb-3">
              <p className="text-purple-400 text-2xl font-bold">{mockKPIs.conversionRate}%</p>
            </div>
            <p className="text-white/80 font-medium">Conversion Rate</p>
            <p className="text-white/60 text-sm">Visitors to buyers</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-500/20 rounded-xl p-4 mb-3">
              <p className="text-blue-400 text-2xl font-bold">
                ₹{Math.round(mockKPIs.totalRevenue / mockKPIs.totalTicketsSold)}
              </p>
            </div>
            <p className="text-white/80 font-medium">Avg. Order Value</p>
            <p className="text-white/60 text-sm">Per transaction</p>
          </div>
          <div className="text-center">
            <div className="bg-green-500/20 rounded-xl p-4 mb-3">
              <p className="text-green-400 text-2xl font-bold truncate">
                {mockKPIs.topSellingEvent.split(' ').slice(0, 2).join(' ')}
              </p>
            </div>
            <p className="text-white/80 font-medium">Top Event</p>
            <p className="text-white/60 text-sm">Best performer</p>
          </div>
        </div>
      </div>
    </div>
  );
}