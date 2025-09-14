// Mock data for admin dashboard analytics
export interface SalesData {
  date: string;
  tickets: number;
  revenue: number;
}

export interface InfluencerData {
  id: string;
  name: string;
  code: string;
  ticketsSold: number;
  revenue: number;
  conversionRate: number;
}

export interface EventAnalytics {
  eventId: string;
  eventName: string;
  totalTickets: number;
  ticketsSold: number;
  revenue: number;
  ticketTypes: {
    type: string;
    sold: number;
    revenue: number;
  }[];
}

export interface KPIData {
  totalTicketsSold: number;
  totalRevenue: number;
  averageTicketPrice: number;
  activeEvents: number;
  conversionRate: number;
  topSellingEvent: string;
}

// Mock sales data for the last 30 days
export const mockSalesData: SalesData[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split('T')[0],
    tickets: Math.floor(Math.random() * 50) + 10,
    revenue: Math.floor(Math.random() * 15000) + 3000,
  };
});

// Mock influencer data
export const mockInfluencers: InfluencerData[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    code: 'PRIYA25',
    ticketsSold: 234,
    revenue: 87500,
    conversionRate: 12.5
  },
  {
    id: '2',
    name: 'Rahul Mehta',
    code: 'RAHUL15',
    ticketsSold: 189,
    revenue: 72000,
    conversionRate: 9.8
  },
  {
    id: '3',
    name: 'Sneha Patel',
    code: 'SNEHA30',
    ticketsSold: 156,
    revenue: 58000,
    conversionRate: 8.2
  },
  {
    id: '4',
    name: 'Arjun Singh',
    code: 'ARJUN20',
    ticketsSold: 134,
    revenue: 51200,
    conversionRate: 7.4
  },
  {
    id: '5',
    name: 'Kavya Reddy',
    code: 'KAVYA10',
    ticketsSold: 98,
    revenue: 35000,
    conversionRate: 6.1
  }
];

// Mock event analytics
export const mockEventAnalytics: EventAnalytics[] = [
  {
    eventId: '1',
    eventName: 'The Great Indian Navratri',
    totalTickets: 500,
    ticketsSold: 347,
    revenue: 125000,
    ticketTypes: [
      { type: 'General', sold: 197, revenue: 39400 },
      { type: 'VIP', sold: 89, revenue: 53400 },
      { type: 'Premium', sold: 61, revenue: 32200 }
    ]
  },
  {
    eventId: '2',
    eventName: 'Cultural Fest 2024',
    totalTickets: 300,
    ticketsSold: 234,
    revenue: 87500,
    ticketTypes: [
      { type: 'Student', sold: 156, revenue: 31200 },
      { type: 'General', sold: 78, revenue: 39000 }
    ]
  },
  {
    eventId: '3',
    eventName: 'Tech Conference',
    totalTickets: 200,
    ticketsSold: 189,
    revenue: 94500,
    ticketTypes: [
      { type: 'Early Bird', sold: 98, revenue: 39200 },
      { type: 'Regular', sold: 91, revenue: 55300 }
    ]
  }
];

// Mock KPI data
export const mockKPIs: KPIData = {
  totalTicketsSold: 1247,
  totalRevenue: 425750,
  averageTicketPrice: 341,
  activeEvents: 8,
  conversionRate: 68.2,
  topSellingEvent: 'The Great Indian Navratri'
};

// Mock referral codes
export const mockReferralCodes = [
  { id: '1', code: 'WELCOME10', discount: 10, type: 'percentage' as const, isActive: true, usageCount: 45 },
  { id: '2', code: 'EARLY25', discount: 25, type: 'percentage' as const, isActive: true, usageCount: 23 },
  { id: '3', code: 'STUDENT50', discount: 50, type: 'fixed' as const, isActive: true, usageCount: 67 },
  { id: '4', code: 'VIP100', discount: 100, type: 'fixed' as const, isActive: false, usageCount: 12 }
];

// Helper function to calculate trends
export function calculateTrend(data: number[]): { value: number; isPositive: boolean } {
  if (data.length < 2) return { value: 0, isPositive: true };
  
  const recent = data.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const previous = data.slice(-14, -7).reduce((a, b) => a + b, 0) / 7;
  
  const change = ((recent - previous) / previous) * 100;
  return {
    value: Math.abs(change),
    isPositive: change >= 0
  };
}

// Generate revenue breakdown by ticket type
export function getRevenueByTicketType() {
  const breakdown = [
    { type: 'General', revenue: 156800, percentage: 36.8, color: '#8b5cf6' },
    { type: 'VIP', revenue: 145200, percentage: 34.1, color: '#06b6d4' },
    { type: 'Premium', revenue: 89750, percentage: 21.1, color: '#10b981' },
    { type: 'Student', revenue: 34000, percentage: 8.0, color: '#f59e0b' }
  ];
  
  return breakdown;
}