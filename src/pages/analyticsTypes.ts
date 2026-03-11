export type DateRangeFilter =
  | 'all'
  | 'alltime'
  | 'today'
  | 'thisWeek'
  | 'last7d'
  | 'thisMonth'
  | 'thisYear'
  | 'custom';

export interface Store {
  store_id: string;
  name: string;
  timezone?: string;
  time_zone?: string;
  timeZone?: string;
}

export interface CustomerKPIs {
  totalBills: number;
  totalCustomers: number;
  totalSales: number;
  avgBillSpent: number;
  newCustomers: number;
  returningCustomers: number;
  anonymousCustomers: number;
}

export interface CustomerDetail {
  phone: string;
  name: string;
  totalSpent: number;
  customerType: string;
  lastPurchase: string;
}

export interface CustomerLifecycleRow {
  phone: string;
  name: string;
  invoices: number;
  totalSpend: number;
}


export type LoyaltyProgramKey = 'points' | 'cashback' | 'freeItem' | 'appReferral' | 'influencerReferral';

export interface StoreCard {
  id: string;
  name: string;
  address: string;
  phone: string;
  monthlyRevenue: number;
  ordersCount: number;
  priority: number;
  isPinned: boolean;
}

export interface StoreDetailsData {
  dailySales: number;
  dailyCustomers: number;
  weeklySales: number;
  weeklyCustomers: number;
  campaignResults: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
}

export type CustomerTier = 'Premium' | 'Standard' | 'Basic';

export interface CommunicationChannelStats {
  available: boolean;
  openRate: number;
}

export interface CommunicationPaths {
  email: CommunicationChannelStats;
  sms: CommunicationChannelStats;
  appNotification: CommunicationChannelStats;
  whatsapp: CommunicationChannelStats;
}

export interface CDPCustomer {
  id: string;
  name: string;
  mobile: string;
  customerType: CustomerTier;
  suggestedMessage: string;
  communicationPaths: CommunicationPaths;
  lastActivity: string;
  totalSpent: number;
}

export interface LoyaltyProgramConfig {
  active: boolean;
  title: string;
  description: string;
  conversionRate?: number;
  redeemRate?: number;
  minSpend?: number;
  percentage?: number;
  maxAmount?: number;
  minPurchaseAmount?: number;
  itemName?: string;
  itemDescription?: string;
  pointsPerReferral?: number;
  maxReferrals?: number;
  referralBonus?: number;
  commissionRate?: number;
  minReferrals?: number;
  bonusThreshold?: number;
  bonusAmount?: number;
}

export type LoyaltyPrograms = {
  [K in LoyaltyProgramKey]: LoyaltyProgramConfig;
};

export interface LoyaltyEditFormData {
  conversionRate: number;
  redeemRate: number;
  percentage: number;
  maxAmount: number;
  minPurchaseAmount: number;
  minSpend: number;
  itemName: string;
  itemDescription: string;
  pointsPerReferral: number;
  maxReferrals: number;
  referralBonus: number;
  commissionRate: number;
  minReferrals: number;
  bonusThreshold: number;
  bonusAmount: number;
}
