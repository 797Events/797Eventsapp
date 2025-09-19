'use client';

import { useState, useEffect, useCallback } from 'react';
import LuxuryCard from '@/components/ui/LuxuryCard';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
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
  TrendingDown,
  Download
} from 'lucide-react';

interface DashboardData {
  kpis: {
    totalTicketsSold: number;
    totalRevenue: number;
    averageTicketPrice: number;
    activeEvents: number;
    conversionRate: number;
    topSellingEvent: string;
  };
  salesData: any[];
  eventAnalytics: any[];
  revenueBreakdown: any[];
}

export default function OverviewTab() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [viewType, setViewType] = useState<'revenue' | 'tickets'>('revenue');

  const loadDashboardData = useCallback(async () => {
    try {
      // Fetch analytics data from backend API
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();

      setDashboardData({
        kpis: data.kpis,
        salesData: data.salesData || [],
        eventAnalytics: data.eventAnalytics || [],
        revenueBreakdown: data.revenueBreakdown || []
      });

    } catch (error) {
      console.error('📊 OverviewTab: Error loading dashboard data:', error);
      // Fallback to empty data instead of crashing
      setDashboardData({
        kpis: {
          totalTicketsSold: 0,
          totalRevenue: 0,
          averageTicketPrice: 0,
          activeEvents: 0,
          conversionRate: 0,
          topSellingEvent: 'No data available'
        },
        salesData: [],
        eventAnalytics: [],
        revenueBreakdown: []
      });
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadDashboardData();

    // Listen for analytics updates
    const handleAnalyticsUpdate = () => {
      console.log('OverviewTab: Analytics updated, refreshing dashboard data');
      loadDashboardData();
    };

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('OverviewTab: Auto-refreshing dashboard data');
      loadDashboardData();
    }, 30000);

    window.addEventListener('analytics-updated', handleAnalyticsUpdate);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('analytics-updated', handleAnalyticsUpdate);
    };
  }, [timeRange, loadDashboardData]); // Reload when timeRange changes

  const getFilteredSalesData = () => {
    if (!dashboardData?.salesData) return [];
    const days = { '7d': 7, '30d': 30, '90d': 90 }[timeRange];
    return dashboardData.salesData.slice(-days);
  };

  const exportToCSV = () => {
    const data = getFilteredSalesData();
    if (!data || data.length === 0) {
      alert('No sales data available for export');
      return;
    }

    // Enhanced CSV headers with Supabase schema context
    const headers = [
      'Date',
      'Tickets Sold',
      'Revenue (₹)',
      'Average Ticket Price (₹)',
      'Event Count',
      'Conversion Rate (%)'
    ];

    // Enhanced data export with additional calculated fields
    const csvRows = data.map(row => [
      row.date,
      row.tickets || 0,
      row.revenue || 0,
      row.tickets > 0 ? Math.round((row.revenue || 0) / row.tickets) : 0,
      row.eventCount || 1,
      row.conversionRate || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => {
        const value = String(cell || '');
        // Escape CSV values that contain commas or quotes
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `797events-sales-data-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportBookingsData = async () => {
    try {
      const url = '/api/admin/export-bookings?format=csv';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `797events-all-bookings-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Bookings export error:', error);
      alert('Failed to export bookings data. Please try again.');
    }
  };

  const exportAttendanceData = async () => {
    try {
      const url = '/api/admin/export-attendance?format=csv';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `797events-all-attendance-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Attendance export error:', error);
      alert('Failed to export attendance data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-white text-center">Loading dashboard data...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="text-white text-center">Failed to load dashboard data</div>
      </div>
    );
  }
  const { kpis, salesData, revenueBreakdown } = dashboardData;

  // Calculate trends (will be 0 initially since no sales yet)
  const salesTrend = { value: 0, isPositive: true };
  const revenueTrend = { value: 0, isPositive: true };

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
  }) => {
    const getColorClasses = (color: string) => {
      const colors = {
        purple: { bg: 'from-purple-500/20 to-violet-500/20', icon: 'text-purple-300', border: 'border-purple-400/20' },
        green: { bg: 'from-emerald-500/20 to-green-500/20', icon: 'text-emerald-300', border: 'border-emerald-400/20' },
        blue: { bg: 'from-blue-500/20 to-cyan-500/20', icon: 'text-blue-300', border: 'border-blue-400/20' },
        orange: { bg: 'from-orange-500/20 to-amber-500/20', icon: 'text-orange-300', border: 'border-orange-400/20' }
      };
      return colors[color as keyof typeof colors] || colors.purple;
    };

    const colorClasses = getColorClasses(color);

    return (
      <LuxuryCard variant="elevated" className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br ${colorClasses.bg} border ${colorClasses.border}`}>
            <Icon size={20} className={`sm:hidden ${colorClasses.icon}`} />
            <Icon size={24} className={`hidden sm:block ${colorClasses.icon}`} />
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl lg:text-3xl font-light text-white mb-1">{value}</div>
            {trend && (
              <div className={`flex items-center gap-1 text-xs sm:text-sm ${
                trend.isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {trend.isPositive ? <TrendingUp size={14} className="sm:hidden" /> : <TrendingDown size={14} className="sm:hidden" />}
                {trend.isPositive ? <TrendingUp size={16} className="hidden sm:block" /> : <TrendingDown size={16} className="hidden sm:block" />}
                <span>{trend.value.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-white/80 text-xs sm:text-sm truncate pr-2">{title}</span>
            <span className="text-xs text-white/60 whitespace-nowrap">vs last period</span>
          </div>
          <div className="progress-luxury" style={{width: '75%'}}></div>
        </div>
      </LuxuryCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="heading-font text-2xl sm:text-3xl font-light text-luxury-gradient leading-tight">
            Dashboard Overview
          </h1>
          <p className="body-font text-sm text-white/60 max-w-2xl">
            Complete view of your event sales, revenue, and performance metrics
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Time Range Selector */}
          <LuxuryCard variant="minimal" className="flex p-1 sm:p-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-500 flex-1 sm:flex-none ${
                  timeRange === range
                    ? 'glass-card border-white/20 text-white shadow-luxury'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="hidden sm:inline">{range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}</span>
                <span className="sm:hidden">{range}</span>
              </button>
            ))}
          </LuxuryCard>

          {/* Refresh and Export Options */}
          <div className="relative">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  console.log('Manual refresh triggered');
                  setLoading(true);
                  loadDashboardData();
                }}
                className="btn-luxury flex items-center gap-2 px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                disabled={loading}
              >
                <TrendingUp size={14} className={loading ? 'animate-spin' : ''} />
                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={exportToCSV}
                className="btn-luxury flex items-center gap-2 px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm justify-center"
              >
                <Download size={14} />
                <span>Sales Data</span>
              </button>
              <button
                onClick={exportBookingsData}
                className="btn-luxury flex items-center gap-2 px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm justify-center"
              >
                <Download size={14} />
                <span>All Bookings</span>
              </button>
              <button
                onClick={exportAttendanceData}
                className="btn-luxury flex items-center gap-2 px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm justify-center"
              >
                <Download size={14} />
                <span>Attendance</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KPICard
          title="Total Tickets Sold"
          value={kpis.totalTicketsSold.toLocaleString()}
          trend={salesTrend}
          icon={Ticket}
          color="purple"
        />
        <KPICard
          title="Total Revenue"
          value={kpis.totalRevenue >= 1000
            ? `₹${(kpis.totalRevenue / 1000).toFixed(1)}K`
            : `₹${kpis.totalRevenue}`
          }
          trend={revenueTrend}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="Average Ticket Price"
          value={`₹${kpis.averageTicketPrice}`}
          icon={Calculator}
          color="blue"
        />
        <KPICard
          title="Active Events"
          value={kpis.activeEvents}
          icon={Calendar}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Sales Trend Chart */}
        <LuxuryCard variant="elevated" className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div>
              <h3 className="heading-font text-2xl font-light text-white mb-2">Sales Performance</h3>
              <p className="body-font text-white/60">
                {viewType === 'revenue' ? 'Revenue' : 'Ticket sales'} over time ({timeRange})
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
              {/* Chart Type Toggle */}
              <LuxuryCard variant="minimal" className="flex p-1 sm:p-2 w-full sm:w-auto">
                <button
                  onClick={() => setViewType('revenue')}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-500 flex-1 sm:flex-none ${
                    viewType === 'revenue'
                      ? 'glass-card border-white/20 text-white shadow-luxury'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setViewType('tickets')}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-500 flex-1 sm:flex-none ${
                    viewType === 'tickets'
                      ? 'glass-card border-white/20 text-white shadow-luxury'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Tickets
                </button>
              </LuxuryCard>

              <div className="text-left sm:text-right w-full sm:w-auto">
                <p className="text-white/60 text-xs sm:text-sm">Total ({timeRange})</p>
                <p className="text-white text-base sm:text-lg font-bold">
                  {viewType === 'revenue'
                    ? (() => {
                        const totalRevenue = getFilteredSalesData().reduce((sum, day) => sum + (day.revenue || 0), 0);
                        return totalRevenue >= 1000
                          ? `₹${(totalRevenue / 1000).toFixed(1)}K`
                          : `₹${totalRevenue}`;
                      })()
                    : `${getFilteredSalesData().reduce((sum, day) => sum + (day.tickets || 0), 0)} tickets`
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getFilteredSalesData()}>
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
                  tickFormatter={(value) =>
                    viewType === 'revenue'
                      ? value >= 1000
                        ? `₹${(value/1000).toFixed(1)}K`
                        : `₹${value}`
                      : value
                  }
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
                  stroke={viewType === 'revenue' ? '#10b981' : '#8b5cf6'}
                  strokeWidth={3}
                  dot={{ fill: viewType === 'revenue' ? '#10b981' : '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </LuxuryCard>

        {/* Revenue by Ticket Type */}
        <LuxuryCard variant="elevated" className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="heading-font text-2xl font-light text-white mb-2">Revenue by Ticket Type</h3>
              <p className="body-font text-white/60">Distribution of revenue across ticket categories</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Total</p>
              <p className="text-white text-lg font-bold">
                {kpis.totalRevenue >= 1000
                  ? `₹${(kpis.totalRevenue / 1000).toFixed(1)}K`
                  : `₹${kpis.totalRevenue}`
                }
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Pie Chart */}
            <div className="h-40 sm:h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="revenue"
                  >
                    {revenueBreakdown.map((entry, index) => (
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
                    formatter={(value: number) => [
                      value >= 1000 ? `₹${(value / 1000).toFixed(1)}K` : `₹${value}`,
                      'Revenue'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              {revenueBreakdown.map((item, index) => (
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
                      {item.revenue >= 1000
                        ? `₹${(item.revenue / 1000).toFixed(1)}K`
                        : `₹${item.revenue}`
                      }
                    </p>
                    <p className="text-white/60 text-xs">{item.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </LuxuryCard>
      </div>

      {/* Event Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Revenue by Event */}
        <LuxuryCard variant="elevated" className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="heading-font text-2xl font-light text-white mb-2">Revenue by Event</h3>
              <p className="body-font text-white/60">Performance of individual events</p>
            </div>
          </div>

          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData?.eventAnalytics || []}>
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
        </LuxuryCard>

        {/* Ticket Sales by Event */}
        <LuxuryCard variant="elevated" className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="heading-font text-2xl font-light text-white mb-2">Ticket Sales by Event</h3>
              <p className="body-font text-white/60">Volume of tickets sold per event</p>
            </div>
          </div>

          <div className="space-y-4">
            {(dashboardData?.eventAnalytics || []).length > 0 ? (
              dashboardData?.eventAnalytics.map((event, index) => (
                <LuxuryCard key={event.eventId} variant="minimal" className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-medium">{event.eventName}</h4>
                    <span className="text-white/60">
                      {event.ticketsSold}/{event.totalTickets}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                    <div
                      className="bg-luxury-gradient h-2 rounded-full transition-all duration-700"
                      style={{ width: `${event.totalTickets > 0 ? (event.ticketsSold / event.totalTickets) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-300 font-medium">
                      {event.totalTickets > 0 ? Math.round((event.ticketsSold / event.totalTickets) * 100) : 0}% sold
                    </span>
                    <span className="text-emerald-300">
                      ₹{event.revenue.toLocaleString()}
                    </span>
                  </div>
                </LuxuryCard>
              ))
            ) : (
              <div className="text-center text-white/60 py-8">
                No event data available yet. Events will appear here once you have active events.
              </div>
            )}
          </div>
        </LuxuryCard>
      </div>

      {/* Ticket Type Breakdown */}
      <LuxuryCard variant="elevated" className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="heading-font text-2xl font-light text-white mb-2">Sales by Ticket Type</h3>
            <p className="body-font text-white/60">Performance breakdown across all events</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/80 font-medium py-2 sm:py-3 text-sm sm:text-base">Event</th>
                <th className="text-left text-white/80 font-medium py-2 sm:py-3 text-sm sm:text-base">Ticket Type</th>
                <th className="text-right text-white/80 font-medium py-2 sm:py-3 text-sm sm:text-base">Sold</th>
                <th className="text-right text-white/80 font-medium py-2 sm:py-3 text-sm sm:text-base">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(dashboardData?.eventAnalytics || []).length > 0 ? (
                dashboardData?.eventAnalytics.flatMap(event =>
                  event.ticketTypes?.map((type: any, typeIndex: number) => (
                    <tr key={`${event.eventId}-${typeIndex}`} className="border-b border-white/5">
                      <td className="text-white py-2 sm:py-3 text-sm sm:text-base">{event.eventName}</td>
                      <td className="text-white/80 py-2 sm:py-3 text-sm sm:text-base">{type.type}</td>
                      <td className="text-right text-white py-2 sm:py-3 text-sm sm:text-base">{type.sold}</td>
                      <td className="text-right text-emerald-400 py-2 sm:py-3 font-medium text-sm sm:text-base">₹{type.revenue.toLocaleString()}</td>
                    </tr>
                  )) || []
                )
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-6 sm:py-8 text-white/60 text-sm sm:text-base">
                    No ticket sales data available yet. Data will appear here once tickets are sold.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </LuxuryCard>

    </div>
  );
}