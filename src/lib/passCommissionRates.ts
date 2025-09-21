/**
 * Pass-based commission rates for influencers
 * Based on the commission structure from commission.jpeg
 */

export interface PassCommission {
  passType: string;
  mrp: number;
  commission: number;
  amountPayable: number;
}

// Commission structure for Sept 27, 2025 event
export const SEPT_27_COMMISSIONS: PassCommission[] = [
  { passType: 'Kids 3-8 Years', mrp: 199, commission: 9, amountPayable: 190 },
  { passType: 'General Access- Single', mrp: 399, commission: 39, amountPayable: 360 },
  { passType: 'Premium Access - Single', mrp: 599, commission: 59, amountPayable: 540 },
  { passType: 'General Access- Couple', mrp: 699, commission: 59, amountPayable: 640 },
  { passType: 'Premium Access - Couple', mrp: 1099, commission: 99, amountPayable: 1000 },
  { passType: 'General Access - Group of 5', mrp: 1799, commission: 149, amountPayable: 1650 },
  { passType: 'Premium Access - Group of 5', mrp: 2499, commission: 199, amountPayable: 2300 },
  { passType: 'General Access - Group of 10', mrp: 2999, commission: 249, amountPayable: 2750 },
  { passType: 'Premium Access - Group of 10', mrp: 3999, commission: 299, amountPayable: 3700 }
];

// Commission structure for Sept 28, 2025 event
export const SEPT_28_COMMISSIONS: PassCommission[] = [
  { passType: 'Kids 3-8 Years', mrp: 199, commission: 9, amountPayable: 190 },
  { passType: 'General Access- Single', mrp: 399, commission: 39, amountPayable: 360 },
  { passType: 'Premium Access - Single', mrp: 699, commission: 69, amountPayable: 630 },
  { passType: 'Fanpit Access- Single', mrp: 999, commission: 99, amountPayable: 900 },
  { passType: 'General Access- Couple', mrp: 699, commission: 59, amountPayable: 640 },
  { passType: 'Premium Access - Couple', mrp: 1299, commission: 99, amountPayable: 1200 },
  { passType: 'Fanpit Access- Couple', mrp: 1799, commission: 149, amountPayable: 1650 },
  { passType: 'General Access - Group of 5', mrp: 1799, commission: 149, amountPayable: 1650 },
  { passType: 'Premium Access - Group of 5', mrp: 2999, commission: 299, amountPayable: 2700 },
  { passType: 'General Access - Group of 10', mrp: 2999, commission: 249, amountPayable: 2750 },
  { passType: 'Premium Access - Group of 10', mrp: 5999, commission: 499, amountPayable: 5500 }
];

// Default commission rates for general use
export const DEFAULT_COMMISSION_RATES: Record<string, number> = {
  'kids': 9,
  'general': 39,
  'premium': 69,
  'fanpit': 99,
  'couple': 59,
  'group': 149
};

/**
 * Calculate commission based on pass type and event date
 */
export function calculatePassCommission(
  passType: string,
  eventDate: string,
  totalAmount: number
): number {
  const eventDateObj = new Date(eventDate);
  const sept27 = new Date('2025-09-27');
  const sept28 = new Date('2025-09-28');

  let commissionStructure: PassCommission[];

  if (eventDateObj.toDateString() === sept27.toDateString()) {
    commissionStructure = SEPT_27_COMMISSIONS;
  } else if (eventDateObj.toDateString() === sept28.toDateString()) {
    commissionStructure = SEPT_28_COMMISSIONS;
  } else {
    // For other events, use default commission calculation
    return calculateDefaultCommission(passType, totalAmount);
  }

  // Find exact match first
  const exactMatch = commissionStructure.find(
    comm => comm.passType.toLowerCase() === passType.toLowerCase()
  );

  if (exactMatch) {
    return exactMatch.commission;
  }

  // If no exact match, try fuzzy matching
  const fuzzyMatch = commissionStructure.find(comm => {
    const commTypeKey = comm.passType.toLowerCase();
    const passTypeKey = passType.toLowerCase();

    return commTypeKey.includes(passTypeKey) || passTypeKey.includes(commTypeKey);
  });

  if (fuzzyMatch) {
    // For fuzzy matches, calculate proportional commission based on actual amount
    const commissionRate = fuzzyMatch.commission / fuzzyMatch.mrp;
    return Math.round(totalAmount * commissionRate);
  }

  // Fallback to default commission calculation
  return calculateDefaultCommission(passType, totalAmount);
}

/**
 * Calculate default commission for events not covered by specific commission structure
 */
function calculateDefaultCommission(passType: string, totalAmount: number): number {
  const passTypeKey = passType.toLowerCase();

  // Determine commission rate based on pass type
  let commissionRate = 0.10; // Default 10%

  if (passTypeKey.includes('kids')) {
    commissionRate = 0.045; // 4.5% for kids passes
  } else if (passTypeKey.includes('general')) {
    commissionRate = 0.098; // ~9.8% for general passes
  } else if (passTypeKey.includes('premium')) {
    commissionRate = 0.099; // ~9.9% for premium passes
  } else if (passTypeKey.includes('fanpit')) {
    commissionRate = 0.099; // ~9.9% for fanpit passes
  } else if (passTypeKey.includes('couple')) {
    commissionRate = 0.084; // ~8.4% for couple passes
  } else if (passTypeKey.includes('group')) {
    commissionRate = 0.083; // ~8.3% for group passes
  }

  return Math.round(totalAmount * commissionRate);
}

/**
 * Get commission rate percentage for a pass type
 */
export function getCommissionRate(passType: string, eventDate: string, mrpAmount: number): number {
  const commission = calculatePassCommission(passType, eventDate, mrpAmount);
  if (mrpAmount === 0) return 0;
  return Math.round((commission / mrpAmount) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Get all commission rates for display purposes
 */
export function getAllCommissionRates(eventDate: string): PassCommission[] {
  const eventDateObj = new Date(eventDate);
  const sept27 = new Date('2025-09-27');
  const sept28 = new Date('2025-09-28');

  if (eventDateObj.toDateString() === sept27.toDateString()) {
    return SEPT_27_COMMISSIONS;
  } else if (eventDateObj.toDateString() === sept28.toDateString()) {
    return SEPT_28_COMMISSIONS;
  }

  // Return default structure for other dates
  return [
    { passType: 'Kids 3-8 Years', mrp: 199, commission: 9, amountPayable: 190 },
    { passType: 'General Access- Single', mrp: 399, commission: 39, amountPayable: 360 },
    { passType: 'Premium Access - Single', mrp: 599, commission: 59, amountPayable: 540 },
    { passType: 'General Access- Couple', mrp: 699, commission: 59, amountPayable: 640 },
    { passType: 'Premium Access - Couple', mrp: 1099, commission: 99, amountPayable: 1000 }
  ];
}