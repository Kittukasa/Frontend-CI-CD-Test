import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Unlock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { maskPhoneNumber } from '@/lib/maskPhone';
import { cn } from '@/lib/utils';
import ChatDrawer from '@/components/ChatDrawer';
import KPICards from '@/components/KPICards';
import Campaigns from './Campaigns';
import type { Campaign } from './Campaigns';
import Customers from './Customers';
import Invoices, { type FiltersState as InvoiceFiltersState } from './Invoices';
import WhatsApp from './WhatsApp';
import Loyalty from './Loyalty';
import TemplateLibrary from './TemplateLibrary.tsx';
import Automation from './Automation';
import WhatsAppCommerce from './WhatsAppCommerce';
import CDP from './CDP';
import dayjs, { parseInvoiceDate as parseInvoiceDateDayjs, toDateOrNull } from '@/lib/date';
import {
  determineCustomerType as resolveCustomerType,
  loadCustomerTypeConfig,
} from '@/lib/customerTypes';
import { clearAuthStorage, clearPostLoginRedirect, setSessionNotice } from '@/lib/session';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import type {
  CustomerDetail,
  CustomerKPIs,
  DateRangeFilter,
  Store,
  LoyaltyPrograms,
  LoyaltyProgramKey,
  LoyaltyEditFormData,
  CDPCustomer,
  CustomerLifecycleRow,
} from './analyticsTypes';
import {
  FileText,
  MessageCircle,
  Megaphone,
  Users,
  X,
  LogOut,
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  User,
  Home,
  Package,
  BarChart,
  PieChart,
  LineChart,
  Clock,
  Zap,
  MessageSquare,
  Gift,
  Database,
  UserCircle2,
  ShoppingCart,
} from 'lucide-react';
import { BillboxLogo } from '@/components/common/BillboxLogo';
import { AppHeader } from '@/components/layout/AppHeader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate, useLocation } from 'react-router-dom';
import { FEATURE_FLAGS, type AnalyticsFeatureKey } from '@/config/featureFlags';
import { getDateRange, getDateRangeLabel, formatLocalDateKey } from '@/utils/dateRanges';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

interface Invoice {
  customer_phone: string;
  invoice_id: string | number | null;
  invoice_date: string;
  total_amount: number;
  customer_name?: string;
  invoice_no?: string | number | null;
  processed_timestamp_ist?: string | null;
  is_excluded?: boolean;
  fingerprint?: string | null;
  is_daily_end_report?: boolean;
}

interface WhatsAppEvent {
  id: string;
  type: 'message' | 'status';
  timestamp: string;
  from?: string;
  text?: string;
  status?: string;
  recipient?: string;
}

interface WhatsAppLog {
  timestamp: string;
  level: string;
  message: string;
}

interface WhatsAppUserAnalytics {
  user: string;
  messages_received: number;
  last_message_text: string;
  last_message_time: string;
  statuses: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    other: number;
  };
  last_status: string;
  last_status_time: string;
}

interface KPIData {
  totalCustomers: number;
  repeatCustomerRate: number;
  avgTransactionValue: number;
  newCustomersThisMonth: number;
}

interface Customer {
  phone: string;
  name: string;
  lastTransaction?: string;
  totalSpent?: number;
}

interface WindowedInvoice extends Invoice {
  parsedDate: Date;
  isoDate: string;
}

const parseProcessedTimestamp = (value?: string | null): Date | null =>
  toDateOrNull(parseInvoiceDateDayjs(value ?? null));

const parseInvoiceDate = (input: string | undefined | null): Date | null =>
  toDateOrNull(parseInvoiceDateDayjs(input ?? null));

const normalizePhoneDigits = (phone?: string | null) => (phone || '').replace(/\D/g, '');

const ANONYMOUS_PHONE = '0000000000';
const ANONYMOUS_KEY_PREFIX = 'anonymous:';

const isAnonymousPhone = (phone?: string | null) => normalizePhoneDigits(phone) === ANONYMOUS_PHONE;

const buildAnonymousCustomerKey = (invoice: {
  invoice_id?: string | number | null;
  invoice_no?: string | number | null;
  processed_timestamp_ist?: string | null;
  invoice_date?: string | null;
}) => {
  const identifier =
    invoice.invoice_id ??
    invoice.invoice_no ??
    invoice.processed_timestamp_ist ??
    invoice.invoice_date ??
    Math.random().toString(36).slice(2);
  return `${ANONYMOUS_KEY_PREFIX}${identifier}`;
};

const getInvoiceCustomerKey = (invoice: {
  customer_phone?: string | null;
  invoice_id?: string | number | null;
  invoice_no?: string | number | null;
  processed_timestamp_ist?: string | null;
  invoice_date?: string | null;
}) => {
  const phone = typeof invoice.customer_phone === 'string' ? invoice.customer_phone.trim() : '';
  if (!phone) {
    return null;
  }
  if (isAnonymousPhone(phone)) {
    return buildAnonymousCustomerKey(invoice);
  }
  return phone;
};

const REVENUE_UNLOCK_SESSION_KEY = 'bb:analytics:revenueUnlocked';
const isOwnerModeActive = () =>
  typeof window !== 'undefined' && localStorage.getItem('bb_owner_mode') === 'true';

export const getMaskedDisplayName = (rawName: string | null | undefined, phone: string): string => {
  const trimmed = (rawName || '').trim();
  if (!trimmed) {
    return `Customer ${maskPhoneNumber(phone)}`;
  }

  const digitsInName = trimmed.replace(/\D/g, '');
  const digitsInPhone = phone.replace(/\D/g, '');

  if (digitsInName.length >= 6 && digitsInName === digitsInPhone) {
    return `Customer ${maskPhoneNumber(phone)}`;
  }

  return trimmed;
};

const formatIsoDateLabel = (iso: string) => {
  const parsed = dayjs(iso, ['YYYY-MM-DD', 'YYYY/MM/DD'], true);
  if (!parsed.isValid()) {
    return iso;
  }
  return parsed.format('MMM D');
};

const ANALYTICS_TABS = [
  'dashboard',
  'invoices',
  'whatsapp',
  'templates',
  'automation',
  'whatsapp-commerce',
  'campaigns',
  'customers',
  'loyalty',
  'cdp',
] as const;

type AnalyticsTab = (typeof ANALYTICS_TABS)[number];

const isAnalyticsTab = (value: string | null): value is AnalyticsTab =>
  !!value && (ANALYTICS_TABS as readonly string[]).includes(value);

const OPTIONAL_TAB_FEATURE_MAP: Partial<Record<AnalyticsTab, AnalyticsFeatureKey>> = {
  loyalty: 'loyalty',
  cdp: 'cdp',
};

const isTabFeatureEnabled = (tab: AnalyticsTab): boolean => {
  const featureKey = OPTIONAL_TAB_FEATURE_MAP[tab];
  if (!featureKey) {
    return true;
  }
  return FEATURE_FLAGS.analytics[featureKey];
};

const Analytics: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab');
  }, [location.search]);

  const activeTab: AnalyticsTab = useMemo(() => {
    if (isAnalyticsTab(tabParam) && isTabFeatureEnabled(tabParam)) {
      return tabParam;
    }
    return 'dashboard';
  }, [tabParam]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [stores, setStores] = useState<Store[]>([]);

  // Date range filter states (dashboard vs customers)
  const [dashboardDateRangeFilter, setDashboardDateRangeFilter] =
    useState<DateRangeFilter>('today');
  const [dashboardCustomStartDate, setDashboardCustomStartDate] = useState<string>('');
  const [dashboardCustomEndDate, setDashboardCustomEndDate] = useState<string>('');
  const [customerDateRangeFilter, setCustomerDateRangeFilter] = useState<DateRangeFilter>('today');
  const [customerCustomStartDate, setCustomerCustomStartDate] = useState<string>('');
  const [customerCustomEndDate, setCustomerCustomEndDate] = useState<string>('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dailyEndInvoices, setDailyEndInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [dailyEndReportsLoading, setDailyEndReportsLoading] = useState(false);
  const [filters, setFilters] = useState<InvoiceFiltersState>({
    searchTerm: '',
    searchColumn: 'customer_phone',
  });

  // WhatsApp state
  const [whatsappEvents, setWhatsappEvents] = useState<WhatsAppEvent[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLog[]>([]);
  const [whatsappAnalytics, setWhatsappAnalytics] = useState<WhatsAppUserAnalytics[]>([]);
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  // Chat drawer state
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // KPI state
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(false);

  // Customers state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Campaign state
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [ownerMode, setOwnerMode] = useState<boolean>(() => isOwnerModeActive());
  const [revenueUnlocked, setRevenueUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    if (isOwnerModeActive()) {
      return true;
    }
    return window.sessionStorage.getItem(REVENUE_UNLOCK_SESSION_KEY) === 'true';
  });
  const [revenuePinModalOpen, setRevenuePinModalOpen] = useState(false);
  const [revenuePinInput, setRevenuePinInput] = useState('');
  const [revenuePinError, setRevenuePinError] = useState('');
  const [revenuePinLoading, setRevenuePinLoading] = useState(false);
  const [hasRevenuePin, setHasRevenuePin] = useState<boolean | null>(null);
  const [revenuePinStatusError, setRevenuePinStatusError] = useState('');
  const [revenuePinStatusLoading, setRevenuePinStatusLoading] = useState(false);
  const [showRevenueResetCta, setShowRevenueResetCta] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletBalanceThreshold, setWalletBalanceThreshold] = useState<number | null>(null);
  const [walletEnabledByAdmin, setWalletEnabledByAdmin] = useState(true);
  const [walletBalanceLoading, setWalletBalanceLoading] = useState(false);
  const [walletBalanceError, setWalletBalanceError] = useState<string | null>(null);
  const buildAuthHeaders = useCallback((includeJson = false) => {
    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('bb_token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }, []);

  const loadWalletBalance = useCallback(async () => {
    setWalletBalanceLoading(true);
    setWalletBalanceError(null);
    try {
      const response = await fetch('/api/analytics/wallet-balance', {
        headers: buildAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load wallet balance.');
      }
      setWalletBalance(Number(data.balance ?? 0));
      setWalletBalanceThreshold(
        data.low_balance_threshold !== undefined ? Number(data.low_balance_threshold) : null
      );
      setWalletEnabledByAdmin(data.wallet_enabled !== false);
    } catch (error) {
      setWalletBalanceError(
        error instanceof Error ? error.message : 'Failed to load wallet balance.'
      );
    } finally {
      setWalletBalanceLoading(false);
    }
  }, [buildAuthHeaders]);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (ownerMode || revenueUnlocked) {
      window.sessionStorage.setItem(REVENUE_UNLOCK_SESSION_KEY, 'true');
    } else {
      window.sessionStorage.removeItem(REVENUE_UNLOCK_SESSION_KEY);
    }
  }, [revenueUnlocked, ownerMode]);

  useEffect(() => {
    if (ownerMode) {
      setRevenueUnlocked(true);
    }
  }, [ownerMode]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'bb_owner_mode') {
        setOwnerMode(isOwnerModeActive());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const fetchRevenuePinStatus = useCallback(async (): Promise<boolean | null> => {
    if (ownerMode) {
      setHasRevenuePin(true);
      setRevenuePinStatusLoading(false);
      return true;
    }
    setRevenuePinStatusLoading(true);
    setRevenuePinStatusError('');
    try {
      const response = await fetch('/api/auth/revenue-pin/status', {
        headers: buildAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to verify PIN status.');
      }
      const status = Boolean(data?.has_pin);
      setHasRevenuePin(status);
      return status;
    } catch (error) {
      setHasRevenuePin(null);
      setRevenuePinStatusError(
        error instanceof Error ? error.message : 'Unable to verify PIN status.'
      );
      return null;
    } finally {
      setRevenuePinStatusLoading(false);
    }
  }, [buildAuthHeaders, ownerMode]);

  useEffect(() => {
    fetchRevenuePinStatus();
  }, [fetchRevenuePinStatus]);

  const redirectToRevenueSecurity = useCallback(() => {
    navigate('/profile?section=settings&focus=security');
  }, [navigate]);

  const handleOpenRevenueUnlock = useCallback(async () => {
    if (ownerMode) {
      return;
    }
    setRevenuePinInput('');
    setRevenuePinError('');
    setShowRevenueResetCta(false);
    let status = hasRevenuePin;
    if (status === null) {
      status = await fetchRevenuePinStatus();
    }
    if (status === false) {
      redirectToRevenueSecurity();
      return;
    }
    setRevenuePinModalOpen(true);
  }, [fetchRevenuePinStatus, hasRevenuePin, redirectToRevenueSecurity, ownerMode]);

  const handleLockRevenue = useCallback(() => {
    if (ownerMode) {
      return;
    }
    setRevenueUnlocked(false);
  }, [ownerMode]);

  const handleCloseRevenueModal = useCallback(() => {
    setRevenuePinModalOpen(false);
    setRevenuePinError('');
    setRevenuePinInput('');
    setShowRevenueResetCta(false);
    setRevenuePinLoading(false);
  }, []);

  const handleRevenuePinSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = revenuePinInput.trim();
    setShowRevenueResetCta(false);
    if (!trimmed) {
      setRevenuePinError('Enter the PIN provided by the franchise owner.');
      return;
    }
    if (hasRevenuePin === false) {
      setRevenuePinError('Revenue PIN is not configured yet. Ask the franchise owner to set it.');
      return;
    }
    setRevenuePinLoading(true);
    try {
      const response = await fetch('/api/auth/revenue-pin/verify', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        body: JSON.stringify({ pin: trimmed }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setRevenuePinError('Wrong PIN. Reset it from Profile → Settings → Security.');
          setShowRevenueResetCta(true);
          return;
        }
        throw new Error(data?.error || 'Invalid PIN.');
      }
      setRevenueUnlocked(true);
      handleCloseRevenueModal();
    } catch (error) {
      setShowRevenueResetCta(false);
      setRevenuePinError(
        error instanceof Error ? error.message : 'Unable to verify PIN at this time.'
      );
    } finally {
      setRevenuePinLoading(false);
    }
  };

  const effectiveRevenueUnlocked = ownerMode || revenueUnlocked;

  const renderRevenueValue = (content: React.ReactNode) => {
    if (effectiveRevenueUnlocked) {
      return <>{content}</>;
    }
    const placeholder =
      typeof content === 'string' && content.trim().startsWith('₹') ? '₹••••' : '••••';
    return (
      <span className="flex flex-col gap-1">
        <span className="select-none text-gray-400">{placeholder}</span>
        <button
          type="button"
          className="text-xs text-indigo-600 hover:text-indigo-500 underline decoration-dotted"
          onClick={handleOpenRevenueUnlock}
        >
          Unlock with PIN
        </button>
      </span>
    );
  };

  const RevenueSectionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    effectiveRevenueUnlocked ? (
      <>{children}</>
    ) : (
      <div className="relative w-full">
        <div className="select-none pointer-events-none opacity-60">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center rounded-lg bg-white/95 backdrop-blur-sm px-4">
          <p className="text-sm text-gray-700 mb-3">Revenue KPIs are hidden for store staff.</p>
          <Button size="sm" onClick={handleOpenRevenueUnlock}>
            Unlock with PIN
          </Button>
        </div>
      </div>
    );

  // CDP state
  const [cdpCustomers, setCdpCustomers] = useState<CDPCustomer[]>([
    {
      id: 'cdp001',
      name: 'Rajesh Kumar',
      mobile: '+91 98765 43210',
      customerType: 'Premium',
      suggestedMessage:
        'Hi Rajesh! 🌟 Your exclusive premium offer awaits - 25% off on your favorite items. Valid till midnight!',
      communicationPaths: {
        email: { available: true, openRate: 78 },
        sms: { available: true, openRate: 92 },
        appNotification: { available: true, openRate: 65 },
        whatsapp: { available: true, openRate: 89 },
      },
      lastActivity: '2 hours ago',
      totalSpent: 45000,
    },
    {
      id: 'cdp002',
      name: 'Priya Sharma',
      mobile: '+91 98765 43211',
      customerType: 'Standard',
      suggestedMessage:
        'Hello Priya! 🛍️ Check out our new arrivals - perfect for the season. Free delivery on orders above ₹999!',
      communicationPaths: {
        email: { available: true, openRate: 65 },
        sms: { available: true, openRate: 88 },
        appNotification: { available: false, openRate: 0 },
        whatsapp: { available: true, openRate: 82 },
      },
      lastActivity: '1 day ago',
      totalSpent: 8500,
    },
    {
      id: 'cdp003',
      name: 'Amit Patel',
      mobile: '+91 98765 43212',
      customerType: 'Premium',
      suggestedMessage:
        'Dear Amit, 💎 Your VIP status unlocks early access to our flash sale. Shop now before it goes public!',
      communicationPaths: {
        email: { available: true, openRate: 85 },
        sms: { available: true, openRate: 95 },
        appNotification: { available: true, openRate: 72 },
        whatsapp: { available: true, openRate: 91 },
      },
      lastActivity: '30 minutes ago',
      totalSpent: 67000,
    },
    {
      id: 'cdp004',
      name: 'Sneha Reddy',
      mobile: '+91 98765 43213',
      customerType: 'Basic',
      suggestedMessage:
        "Hi Sneha! 🎉 Welcome back! Here's a special 15% discount just for you. Use code WELCOME15",
      communicationPaths: {
        email: { available: false, openRate: 0 },
        sms: { available: true, openRate: 75 },
        appNotification: { available: false, openRate: 0 },
        whatsapp: { available: true, openRate: 68 },
      },
      lastActivity: '3 days ago',
      totalSpent: 2800,
    },
    {
      id: 'cdp005',
      name: 'Vikram Singh',
      mobile: '+91 98765 43214',
      customerType: 'Standard',
      suggestedMessage:
        'Hey Vikram! 🚀 Your cart is waiting! Complete your purchase and get 10% off with code COMPLETE10',
      communicationPaths: {
        email: { available: true, openRate: 58 },
        sms: { available: true, openRate: 84 },
        appNotification: { available: true, openRate: 45 },
        whatsapp: { available: true, openRate: 76 },
      },
      lastActivity: '5 hours ago',
      totalSpent: 12400,
    },
  ]);
  const [selectedCdpCustomer, setSelectedCdpCustomer] = useState<CDPCustomer | null>(null);

  // Chart data state

  // Customer analytics state
  const [customerKPIs, setCustomerKPIs] = useState<CustomerKPIs | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetail[]>([]);
  const [customerLifecycleTables, setCustomerLifecycleTables] = useState<{
    newCustomers: CustomerLifecycleRow[];
    returningCustomers: CustomerLifecycleRow[];
    anonymousCustomers: CustomerLifecycleRow[];
  }>({
    newCustomers: [],
    returningCustomers: [],
    anonymousCustomers: [],
  });
  const [customerSpendOverTime, setCustomerSpendOverTime] = useState<{
    labels: string[];
    newSpend: number[];
    returningSpend: number[];
    anonymousSpend: number[];
    totals: number[];
  }>({
    labels: [],
    newSpend: [],
    returningSpend: [],
    anonymousSpend: [],
    totals: [],
  });

  const lifecycleSummary = useMemo(() => {
    const sumSpend = (rows: CustomerLifecycleRow[]) =>
      rows.reduce((sum, row) => sum + row.totalSpend, 0);

    return {
      newCount: customerLifecycleTables.newCustomers.length,
      returningCount: customerLifecycleTables.returningCustomers.length,
      anonymousCount: customerLifecycleTables.anonymousCustomers.length,
      newSpend: sumSpend(customerLifecycleTables.newCustomers),
      returningSpend: sumSpend(customerLifecycleTables.returningCustomers),
      anonymousSpend: sumSpend(customerLifecycleTables.anonymousCustomers),
    };
  }, [customerLifecycleTables]);

  const [customerAnalyticsLoading, setCustomerAnalyticsLoading] = useState(false);
  const [customerCurrentPage, setCustomerCurrentPage] = useState(0);
  const [customerPageSize] = useState(10);

  const DAY_MS = 24 * 60 * 60 * 1000;

  const addDays = (date: Date, count: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + count);
    return result;
  };

  const formatRangeLabel = (start: Date, end: Date) => {
    const sameDay = start.toDateString() === end.toDateString();
    if (sameDay) {
      return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    const sameMonth =
      start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    if (sameMonth) {
      return `${start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} – ${end.toLocaleDateString('en-US', { day: 'numeric' })}`;
    }
    return `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const buildSpendBuckets = (
    filter: string,
    rangeStart: Date,
    rangeEnd: Date
  ): Array<{ label: string; start: Date; end: Date }> => {
    const buckets: Array<{ label: string; start: Date; end: Date }> = [];
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const createBucket = (label: string, startDate: Date, endDate: Date) => {
      const bucketStart = new Date(startDate);
      const bucketEnd = new Date(endDate);
      bucketStart.setMilliseconds(0);
      bucketEnd.setMilliseconds(999);
      buckets.push({ label, start: bucketStart, end: bucketEnd });
    };

    const buildFourHourBuckets = () => {
      const blockHours = [0, 4, 8, 12, 16, 20];
      blockHours.forEach(hour => {
        const bucketStart = new Date(start);
        bucketStart.setHours(hour, 0, 0, 0);
        if (bucketStart > end) {
          return;
        }
        const bucketEnd = new Date(bucketStart.getTime() + 4 * 60 * 60 * 1000 - 1);
        const effectiveEnd = bucketEnd > end ? end : bucketEnd;
        const labelEndDate = new Date(
          Math.min(end.getTime(), bucketStart.getTime() + 4 * 60 * 60 * 1000)
        );
        const label = `${bucketStart.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })} – ${labelEndDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })}`;
        createBucket(label, bucketStart, effectiveEnd);
      });
    };

    if (filter === 'today') {
      buildFourHourBuckets();
      return buckets;
    }

    const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime() + 1) / DAY_MS));

    if (filter === 'custom' && diffDays === 1) {
      buildFourHourBuckets();
      return buckets;
    }

    const buildDailyBuckets = () => {
      let cursor = new Date(start);
      while (cursor <= end) {
        const bucketStart = new Date(cursor);
        const bucketEnd = new Date(cursor);
        bucketEnd.setHours(23, 59, 59, 999);
        if (bucketEnd > end) {
          bucketEnd.setTime(end.getTime());
        }
        const label = bucketStart.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        createBucket(label, bucketStart, bucketEnd);
        cursor = addDays(bucketStart, 1);
      }
    };

    const buildWeeklyBuckets = () => {
      let cursor = new Date(start);
      cursor.setHours(0, 0, 0, 0);
      while (cursor <= end) {
        const bucketStart = new Date(cursor);
        bucketStart.setHours(0, 0, 0, 0);
        const bucketEnd = addDays(bucketStart, 6);
        bucketEnd.setHours(23, 59, 59, 999);
        if (bucketEnd > end) {
          bucketEnd.setTime(end.getTime());
        }
        const label = formatRangeLabel(bucketStart, bucketEnd);
        createBucket(label, bucketStart, bucketEnd);
        const nextStart = new Date(bucketEnd);
        nextStart.setHours(0, 0, 0, 0);
        cursor = addDays(nextStart, 1);
      }
    };

    if (filter === 'thisWeek' || (filter === 'custom' && diffDays <= 7)) {
      buildDailyBuckets();
      return buckets;
    }

    if (filter === 'thisMonth' || (filter === 'custom' && diffDays <= 31)) {
      buildWeeklyBuckets();
      return buckets;
    }

    const segments = Math.min(6, Math.max(1, Math.ceil(diffDays / 30)));
    const totalMs = end.getTime() - start.getTime();
    const sliceMs = Math.max(DAY_MS, Math.ceil(totalMs / segments));

    for (let index = 0; index < segments; index += 1) {
      const sliceStartMs = start.getTime() + index * sliceMs;
      const sliceEndMs =
        index === segments - 1
          ? end.getTime()
          : Math.min(end.getTime(), sliceStartMs + sliceMs - 1);
      const bucketStart = new Date(sliceStartMs);
      bucketStart.setHours(0, 0, 0, 0);
      const bucketEnd = new Date(sliceEndMs);
      bucketEnd.setHours(23, 59, 59, 999);
      createBucket(formatRangeLabel(bucketStart, bucketEnd), bucketStart, bucketEnd);
    }

    return buckets;
  };

  const storeTimeZone = useMemo(() => {
    const storeMatch = stores.find(store => store.store_id === selectedStore);
    return (
      storeMatch?.timezone ||
      storeMatch?.time_zone ||
      storeMatch?.timeZone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'UTC'
    );
  }, [stores, selectedStore]);

  // Loyalty program state
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyPrograms>({
    points: {
      active: true,
      conversionRate: 1, // points per rupee (1₹ = 1 point)
      redeemRate: 0.1, // rupees per point (1 point = ₹0.10)
      minSpend: 1,
      title: 'Loyalty Points',
      description: 'Earn 1 point for every ₹1 spent',
    },
    cashback: {
      active: false,
      percentage: 10,
      maxAmount: 500,
      minPurchaseAmount: 1000, // minimum purchase required for cashback
      title: 'Cashback Rewards',
      description: 'Get 10% cashback on purchases above ₹1000',
    },
    freeItem: {
      active: false,
      minSpend: 1000,
      itemName: 'Free Veg Burger',
      itemDescription: 'Complimentary item for loyal customers',
      title: 'Free Item Rewards',
      description: 'Get a free [Item] on purchases above ₹1000',
    },
    appReferral: {
      active: false,
      pointsPerReferral: 100,
      maxReferrals: 10,
      referralBonus: 50,
      title: 'App Referral Program',
      description: 'Earn points by referring friends to the app',
    },
    influencerReferral: {
      active: false,
      commissionRate: 15,
      minReferrals: 5,
      bonusThreshold: 20,
      bonusAmount: 1000,
      title: 'Influencer Referral Program',
      description: 'Earn commissions by referring customers as an influencer',
    },
  });
  const [editingLoyalty, setEditingLoyalty] = useState<LoyaltyProgramKey | null>(null);
  const [loyaltyModalOpen, setLoyaltyModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<LoyaltyEditFormData>({
    conversionRate: 1,
    redeemRate: 0.1,
    percentage: 10,
    maxAmount: 500,
    minPurchaseAmount: 1000,
    minSpend: 1000,
    itemName: 'Free Veg Burger',
    itemDescription: 'Complimentary item for loyal customers',
    pointsPerReferral: 100,
    maxReferrals: 10,
    referralBonus: 50,
    commissionRate: 15,
    minReferrals: 5,
    bonusThreshold: 20,
    bonusAmount: 1000,
  });

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [trialStartedAt, setTrialStartedAt] = useState<string | null>(null);
  const [trialPeriodDays, setTrialPeriodDays] = useState<number | null>(null);
  const [comingSoonTab, setComingSoonTab] = useState<AnalyticsTab | null>(null);
  const [campaignPrefill, setCampaignPrefill] = useState<{
    recipients: Array<{
      phone: string;
      name?: string;
      totalSpent?: number;
      lifecycleSegment?: 'new' | 'returning' | 'anonymous';
    }>;
  } | null>(null);

  const updateTabInUrl = useCallback(
    (
      tab: AnalyticsTab,
      options?: { replace?: boolean; params?: Record<string, string | null> }
    ) => {
      const params = new URLSearchParams(location.search);
      params.set('tab', tab);
      params.delete('openTemplateModal');

      if (options?.params) {
        Object.entries(options.params).forEach(([key, value]) => {
          if (value === null) {
            params.delete(key);
          } else {
            params.set(key, value);
          }
        });
      }

      const searchString = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: searchString ? `?${searchString}` : '',
        },
        { replace: options?.replace ?? false }
      );
    },
    [location.pathname, location.search, navigate]
  );

  useEffect(() => {
    if (!tabParam) {
      return;
    }

    if (!isAnalyticsTab(tabParam)) {
      updateTabInUrl('dashboard', { replace: true });
      return;
    }

    if (!isTabFeatureEnabled(tabParam)) {
      setComingSoonTab(tabParam);
      updateTabInUrl('dashboard', { replace: true });
    }
  }, [tabParam, updateTabInUrl, setComingSoonTab]);

  const ensureAuthenticated = useCallback(() => {
    const hasToken = Boolean(localStorage.getItem('bb_token'));
    if (!hasToken) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    ensureAuthenticated();

    const handlePageShow = () => {
      ensureAuthenticated();
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [ensureAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setTrialStartedAt(localStorage.getItem('bb_trial_started'));
    const storedPeriod = localStorage.getItem('bb_trial_period');
    const parsedPeriod = storedPeriod ? Number(storedPeriod) : null;
    setTrialPeriodDays(
      parsedPeriod && Number.isFinite(parsedPeriod) && parsedPeriod > 0 ? parsedPeriod : null
    );
  }, []);

  const dashboardDateRange = useMemo(() => {
    const { startDate, endDate } = getDateRange(
      dashboardDateRangeFilter,
      dashboardCustomStartDate,
      dashboardCustomEndDate
    );
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    const label = getDateRangeLabel(dashboardDateRangeFilter, startDate, endDate);

    return { start, end, label };
  }, [dashboardDateRangeFilter, dashboardCustomStartDate, dashboardCustomEndDate]);

  const dashboardInvoices = useMemo(() => {
    const startTime = dashboardDateRange.start?.getTime() ?? null;
    const endTime = dashboardDateRange.end?.getTime() ?? null;

    return invoices.filter(invoice => {
      if (invoice.is_excluded) {
        return false;
      }
      const parsed =
        parseProcessedTimestamp(invoice.processed_timestamp_ist) ||
        parseInvoiceDate(invoice.invoice_date);
      if (!parsed) return true;
      const time = parsed.getTime();
      if (startTime !== null && time < startTime) return false;
      if (endTime !== null && time > endTime) return false;
      return true;
    });
  }, [invoices, dashboardDateRange.start, dashboardDateRange.end]);

  const dashboardCustomers = useMemo(() => {
    const startTime = dashboardDateRange.start?.getTime() ?? null;
    const endTime = dashboardDateRange.end?.getTime() ?? null;

    return customerDetails.filter(detail => {
      const parsed = parseInvoiceDate(detail.lastPurchase);
      if (!parsed) return true;
      const time = parsed.getTime();
      if (startTime !== null && time < startTime) return false;
      if (endTime !== null && time > endTime) return false;
      return true;
    });
  }, [customerDetails, dashboardDateRange.start, dashboardDateRange.end]);

  const handleLaunchCampaignPrefill = useCallback(
    (
      recipients: Array<{
        phone: string;
        name?: string;
        totalSpent?: number;
        lifecycleSegment?: 'new' | 'returning' | 'anonymous';
      }>
    ) => {
      const sanitized = (recipients ?? [])
        .filter(recipient => recipient.phone && recipient.phone.trim().length > 0)
        .map(recipient => ({
          phone: recipient.phone.trim(),
          name:
            recipient.name || getMaskedDisplayName(recipient.name || '', recipient.phone.trim()),
          totalSpent: recipient.totalSpent ?? 0,
          lifecycleSegment: recipient.lifecycleSegment,
        }));

      if (sanitized.length > 0) {
        setCampaignPrefill({ recipients: sanitized });
      } else {
        setCampaignPrefill(null);
      }

      updateTabInUrl('campaigns', { params: { focusCreateCampaign: '1' } });
    },
    [updateTabInUrl]
  );

  const dashboardCampaigns = useMemo(() => {
    const startTime = dashboardDateRange.start?.getTime() ?? null;
    const endTime = dashboardDateRange.end?.getTime() ?? null;

    return recentCampaigns.filter(campaign => {
      if (!campaign.sentDate) return true;
      const parsed = new Date(campaign.sentDate);
      if (Number.isNaN(parsed.getTime())) return true;
      const time = parsed.getTime();
      if (startTime !== null && time < startTime) return false;
      if (endTime !== null && time > endTime) return false;
      return true;
    });
  }, [recentCampaigns, dashboardDateRange.start, dashboardDateRange.end]);

  const {
    total: dashboardCustomerCount,
    anonymous: dashboardAnonymousCustomerCount,
    ebill: dashboardEbillCustomerCount,
  } = useMemo(() => {
    const uniqueCustomers = new Set<string>();
    let anonymousCount = 0;

    dashboardInvoices.forEach(invoice => {
      const key = getInvoiceCustomerKey(invoice);
      if (!key || uniqueCustomers.has(key)) {
        return;
      }
      uniqueCustomers.add(key);
      if (key.startsWith(ANONYMOUS_KEY_PREFIX)) {
        anonymousCount += 1;
      }
    });

    const total = uniqueCustomers.size;
    return {
      total,
      anonymous: anonymousCount,
      ebill: Math.max(total - anonymousCount, 0),
    };
  }, [dashboardInvoices]);

  const dashboardEbillInvoiceCount = useMemo(() => {
    return dashboardInvoices.filter(invoice => !isAnonymousPhone(invoice.customer_phone)).length;
  }, [dashboardInvoices]);

  // Customer type categorization function
  const getCustomerType = (totalSpent: number): string => {
    const config = loadCustomerTypeConfig();
    return resolveCustomerType(totalSpent, config);
  };

  // Get customer type styling
  const getCustomerTypeStyle = (customerType: string): string => {
    switch (customerType) {
      case 'Premium':
        return 'bg-purple-100 text-purple-800';
      case 'Standard':
        return 'bg-blue-100 text-blue-800';
      case 'Basic':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Charts and analytics generators are defined later in this file for customers tab.

  // Loyalty program handlers
  const handleLoyaltyEdit = (type: LoyaltyProgramKey) => {
    setEditingLoyalty(type);
    // Pre-populate form with current values
    const currentProgram = loyaltyPrograms[type];
    setEditFormData({
      conversionRate: currentProgram.conversionRate ?? 1,
      redeemRate: currentProgram.redeemRate ?? 0.1,
      percentage: currentProgram.percentage ?? 10,
      maxAmount: currentProgram.maxAmount ?? 500,
      minPurchaseAmount: currentProgram.minPurchaseAmount ?? 1000,
      minSpend: currentProgram.minSpend ?? 1000,
      itemName: currentProgram.itemName ?? 'Free Veg Burger',
      itemDescription: currentProgram.itemDescription ?? 'Complimentary item for loyal customers',
      pointsPerReferral: currentProgram.pointsPerReferral ?? 100,
      maxReferrals: currentProgram.maxReferrals ?? 10,
      referralBonus: currentProgram.referralBonus ?? 50,
      commissionRate: currentProgram.commissionRate ?? 15,
      minReferrals: currentProgram.minReferrals ?? 5,
      bonusThreshold: currentProgram.bonusThreshold ?? 20,
      bonusAmount: currentProgram.bonusAmount ?? 1000,
    });
    setLoyaltyModalOpen(true);
  };

  const handleLoyaltyToggle = (type: LoyaltyProgramKey) => {
    setLoyaltyPrograms(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        active: !prev[type].active,
      },
    }));
  };

  const handleLoyaltySave = () => {
    if (editingLoyalty) {
      setLoyaltyPrograms(prev => ({
        ...prev,
        [editingLoyalty]: {
          ...prev[editingLoyalty],
          conversionRate: editFormData.conversionRate,
          redeemRate: editFormData.redeemRate,
          percentage: editFormData.percentage,
          maxAmount: editFormData.maxAmount,
          minPurchaseAmount: editFormData.minPurchaseAmount,
          minSpend: editFormData.minSpend,
          itemName: editFormData.itemName,
          itemDescription: editFormData.itemDescription,
          pointsPerReferral: editFormData.pointsPerReferral,
          maxReferrals: editFormData.maxReferrals,
          referralBonus: editFormData.referralBonus,
          commissionRate: editFormData.commissionRate,
          minReferrals: editFormData.minReferrals,
          bonusThreshold: editFormData.bonusThreshold,
          bonusAmount: editFormData.bonusAmount,
        },
      }));
      setLoyaltyModalOpen(false);
      setEditingLoyalty(null);
    }
  };

  const handleFormChange = <K extends keyof LoyaltyEditFormData>(
    field: K,
    value: LoyaltyEditFormData[K]
  ) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Navigation items
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      active: activeTab === 'dashboard',
      disabled: false,
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: FileText,
      active: activeTab === 'invoices',
      disabled: false,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      active: activeTab === 'customers',
      disabled: false,
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: MessageSquare,
      active: activeTab === 'campaigns',
      disabled: false,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      active: activeTab === 'whatsapp',
      disabled: false,
    },
    {
      id: 'templates',
      label: 'Template Library',
      icon: FileText,
      active: activeTab === 'templates',
      disabled: false,
    },
    {
      id: 'automation',
      label: 'Automation',
      icon: Zap,
      active: activeTab === 'automation',
      disabled: false,
    },
    {
      id: 'whatsapp-commerce',
      label: 'WhatsApp Commerce',
      icon: ShoppingCart,
      active: activeTab === 'whatsapp-commerce',
      disabled: false,
    },
    {
      id: 'loyalty',
      label: 'Loyalty',
      icon: Gift,
      active: activeTab === 'loyalty',
      disabled: !isTabFeatureEnabled('loyalty'),
    },
    {
      id: 'cdp',
      label: 'CDP',
      icon: Database,
      active: activeTab === 'cdp',
      disabled: !isTabFeatureEnabled('cdp'),
    },
  ];
  const mobileNavItems = navigationItems.filter(item =>
    ['dashboard', 'invoices', 'customers', 'whatsapp', 'campaigns'].includes(item.id)
  );

  const comingSoonLabel =
    comingSoonTab !== null
      ? navigationItems.find(item => item.id === comingSoonTab)?.label ?? 'This feature'
      : null;

  const handleTabChange = (tab: AnalyticsTab): boolean => {
    console.log(`Switching to tab: ${tab}`);
    console.log(`Current customerDetails length: ${customerDetails.length}`);
    console.log(`Current customerKPIs:`, customerKPIs);

    if (!isTabFeatureEnabled(tab)) {
      setComingSoonTab(tab);
      return false;
    }

    if (comingSoonTab) {
      setComingSoonTab(null);
    }

    if (tab !== activeTab) {
      updateTabInUrl(tab);
    }

    // Force reload customer data when switching to customers tab
    if (tab === 'customers' && selectedStore) {
      console.log('Force loading customer analytics...');
      setTimeout(() => {
        loadCustomerAnalytics();
      }, 100); // Small delay to ensure state is settled
    }

    return true;
  };

  const handleLogout = () => {
    clearAuthStorage();
    clearPostLoginRedirect();
    setSessionNotice(null);

    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handleExternalTemplateModal = () => {
      updateTabInUrl('whatsapp', { params: { openTemplateModal: '1' }, replace: true });
    };

    window.addEventListener('bbx-open-template-modal', handleExternalTemplateModal);
    return () => window.removeEventListener('bbx-open-template-modal', handleExternalTemplateModal);
  }, [updateTabInUrl]);

  // Load authenticated store on component mount
  useEffect(() => {
    const authenticatedStoreId = localStorage.getItem('bb_store_id');

    if (authenticatedStoreId) {
      // Use authenticated store_id
      setSelectedStore(authenticatedStoreId);
      setStores([{ store_id: authenticatedStoreId, name: `Store ${authenticatedStoreId}` }]);
    } else {
      // Fallback: fetch all stores if no auth
      const fetchStores = async () => {
        try {
          const token = localStorage.getItem('bb_token');
          const response = await fetch('/api/analytics/stores', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setStores(data);
          }
        } catch (error) {
          console.error('Error fetching stores:', error);
        }
      };
      fetchStores();
    }
  }, []);

  const normalizeInvoicePayload = (raw: unknown): Invoice[] => {
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.map(item => {
      const invoiceItem = item as Partial<Invoice> & { total_amount?: number };
      const resolvedNumber = invoiceItem.invoice_no ?? invoiceItem.invoice_id ?? null;
      const totalAmount = Number(invoiceItem.total_amount) || 0;
      return {
        customer_phone: invoiceItem.customer_phone || 'N/A',
        invoice_no: resolvedNumber,
        invoice_id: invoiceItem.invoice_id ?? resolvedNumber,
        invoice_date: invoiceItem.invoice_date || '',
        processed_timestamp_ist:
          invoiceItem.processed_timestamp_ist || invoiceItem.invoice_date || null,
        total_amount: totalAmount,
        is_excluded: Boolean(invoiceItem.is_excluded),
        fingerprint: invoiceItem.fingerprint || null,
        customer_name: invoiceItem.customer_name || '',
        is_daily_end_report: Boolean(invoiceItem.is_daily_end_report),
      };
    });
  };

  // Load invoices for selected store
  const loadInvoices = async () => {
    if (!selectedStore) {
      setInvoices([]);
      setDailyEndInvoices([]);
      return;
    }

    const headers = buildAuthHeaders();

    const fetchRegularInvoices = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/invoices?storeId=${selectedStore}`, {
          headers,
        });
        if (response.ok) {
          const raw = await response.json().catch(() => []);
          setInvoices(normalizeInvoicePayload(raw));
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchDailyEndReports = async () => {
      setDailyEndReportsLoading(true);
      try {
        const response = await fetch(`/api/analytics/daily-end-reports?storeId=${selectedStore}`, {
          headers,
        });
        if (response.ok) {
          const raw = await response.json().catch(() => []);
          setDailyEndInvoices(normalizeInvoicePayload(raw));
        }
      } catch (error) {
        console.error('Error fetching daily end reports:', error);
      } finally {
        setDailyEndReportsLoading(false);
      }
    };

    await Promise.all([fetchRegularInvoices(), fetchDailyEndReports()]);
  };

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  // Filter invoices client-side
  const applyInvoiceFilters = useCallback(
    (invoiceList: Invoice[]): Invoice[] => {
      const term = filters.searchTerm.trim().toLowerCase();
      if (!term) {
        return invoiceList;
      }

      const matchesValue = (value: unknown) => {
        if (value === undefined || value === null) return false;
        return String(value).toLowerCase().includes(term);
      };

      return invoiceList.filter(invoice => {
        const invoiceIdentifier = invoice.invoice_no ?? invoice.invoice_id ?? '';
        const timestampSource = invoice.processed_timestamp_ist || invoice.invoice_date || '';

        switch (filters.searchColumn) {
          case 'bill_id':
            return matchesValue(invoiceIdentifier);
          case 'total_amount':
            return matchesValue(invoice.total_amount);
          case 'invoice_timestamp': {
            if (!timestampSource) {
              return false;
            }

            const parsedDate =
              parseProcessedTimestamp(timestampSource) || parseInvoiceDate(timestampSource);

            const dateCandidates: string[] = [];

            if (parsedDate) {
              dateCandidates.push(
                parsedDate
                  .toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                  .toLowerCase()
              );
              dateCandidates.push(parsedDate.toISOString().slice(0, 10));
              dateCandidates.push(
                parsedDate
                  .toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                  .toLowerCase()
              );
            }

            const segments = timestampSource
              .split(/[T,]/)
              .map(part => part.trim().toLowerCase())
              .filter(Boolean);

            segments.forEach(segment => {
              const cleaned = segment.replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, '').trim();
              if (cleaned) {
                dateCandidates.push(cleaned);
              }
            });

            return dateCandidates.some(candidate => candidate.includes(term));
          }
          case 'customer_phone':
          default:
            return matchesValue(invoice.customer_phone);
        }
      });
    },
    [filters]
  );

  const filteredInvoices = useMemo(
    () => applyInvoiceFilters(invoices),
    [applyInvoiceFilters, invoices]
  );

  const filteredDailyEndInvoices = useMemo(
    () => applyInvoiceFilters(dailyEndInvoices),
    [applyInvoiceFilters, dailyEndInvoices]
  );

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      searchColumn: 'customer_phone',
    });
  };

  // WhatsApp functions
  const loadWhatsAppEvents = async () => {
    setWhatsappLoading(true);
    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch('/api/whatsapp/events?format=json', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWhatsappEvents(data);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp events:', error);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const loadWhatsAppLogs = async () => {
    setWhatsappLoading(true);
    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch('/api/whatsapp/logs?format=json', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWhatsappLogs(data);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp logs:', error);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const loadWhatsAppAnalytics = async () => {
    setWhatsappLoading(true);
    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch('/api/whatsapp/analytics?format=json', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWhatsappAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp analytics:', error);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const openChat = (userId: string) => {
    setSelectedUserId(userId);
    setChatDrawerOpen(true);
  };

  // Store management functions
  // CDP handler functions
  const handleCdpCustomerClick = (customer: CDPCustomer) => {
    setSelectedCdpCustomer(customer);
  };

  const handleCloseCdpDetails = () => {
    setSelectedCdpCustomer(null);
  };

  const closeChat = () => {
    setChatDrawerOpen(false);
    setSelectedUserId('');
  };

  // Load KPIs for selected store
  const loadKPIs = async () => {
    if (!selectedStore) return;

    setKpiLoading(true);
    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch(`/api/analytics/kpis?storeId=${selectedStore}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setKpiData(data);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setKpiLoading(false);
    }
  };

  // Load customers for dashboard KPI
  const loadCustomers = async () => {
    if (!selectedStore) return;

    setCustomersLoading(true);
    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch(`/api/analytics/customers?storeId=${selectedStore}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
        console.log(`Loaded ${data.length} customers for dashboard KPI`);
      } else {
        console.error('Failed to fetch customers:', response.status);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  };

  // Load customer analytics data for all customers (date-range aware)
  const loadCustomerAnalytics = async () => {
    if (!selectedStore) {
      console.log('No selectedStore, skipping customer analytics load');
      return;
    }

    console.log('Loading customer analytics for store:', selectedStore);
    setCustomerAnalyticsLoading(true);

    try {
      const token = localStorage.getItem('bb_token');
      const dateRange = getDateRange(
        customerDateRangeFilter,
        customerCustomStartDate,
        customerCustomEndDate
      );

      const invRes = await fetch(`/api/analytics/invoices?storeId=${selectedStore}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawInvoices: Invoice[] = invRes.ok ? await invRes.json() : [];

      const enrichedInvoices: WindowedInvoice[] = rawInvoices
        .map(invoice => {
          const parsedDate =
            parseProcessedTimestamp(invoice.processed_timestamp_ist) ||
            parseInvoiceDate(invoice.invoice_date);
          if (!parsedDate) {
            return null;
          }
          return {
            ...invoice,
            parsedDate,
            isoDate: formatLocalDateKey(parsedDate),
          };
        })
        .filter((invoice): invoice is WindowedInvoice => Boolean(invoice));

      const startD = new Date(`${dateRange.startDate}T00:00:00`);
      const endD = new Date(`${dateRange.endDate}T23:59:59.999`);

      const windowed = enrichedInvoices
        .filter(invoice => !invoice.is_excluded)
        .filter(invoice => invoice.parsedDate >= startD && invoice.parsedDate <= endD)
        .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

      const firstPurchaseByCustomer = new Map<string, Date>();
      enrichedInvoices.forEach(invoice => {
        const key = getInvoiceCustomerKey(invoice);
        if (!key) {
          return;
        }
        const existing = firstPurchaseByCustomer.get(key);
        if (!existing || invoice.parsedDate < existing) {
          firstPurchaseByCustomer.set(key, invoice.parsedDate);
        }
      });

      const spendBuckets = buildSpendBuckets(customerDateRangeFilter as string, startD, endD).map(
        bucket => ({
          ...bucket,
          newSpend: 0,
          returningSpend: 0,
          anonymousSpend: 0,
        })
      );

      const totals = new Map<
        string,
        {
          name: string;
          totalSpent: number;
          lastPurchase: string;
          phone: string;
          isAnonymous: boolean;
        }
      >();
      const spendByCustomer = new Map<
        string,
        { name: string; invoices: number; totalSpend: number; phone: string; isAnonymous: boolean }
      >();
      const customersSeenInRange = new Set<string>();

      windowed.forEach(invoice => {
        const key = getInvoiceCustomerKey(invoice);
        if (!key) {
          return;
        }
        const rawPhone =
          typeof invoice.customer_phone === 'string' ? invoice.customer_phone.trim() : '';
        const isAnonymousCustomer = isAnonymousPhone(rawPhone);
        const amount = Number(invoice.total_amount || 0);
        const firstPurchase = firstPurchaseByCustomer.get(key);
        const hasPriorPurchase = firstPurchase ? firstPurchase.getTime() < startD.getTime() : false;
        const isFirstEncounter = !customersSeenInRange.has(key);
        if (isFirstEncounter) {
          customersSeenInRange.add(key);
        }

        const bucketIndex = spendBuckets.findIndex(
          bucket => invoice.parsedDate >= bucket.start && invoice.parsedDate <= bucket.end
        );
        if (bucketIndex !== -1) {
          if (isAnonymousCustomer) {
            spendBuckets[bucketIndex].anonymousSpend += amount;
          } else if (isFirstEncounter && !hasPriorPurchase) {
            spendBuckets[bucketIndex].newSpend += amount;
          } else {
            spendBuckets[bucketIndex].returningSpend += amount;
          }
        }

        const maskedName = isAnonymousCustomer
          ? 'Anonymous Customer'
          : getMaskedDisplayName(invoice.customer_name, rawPhone || key);
        const previous = totals.get(key) || {
          name: maskedName,
          totalSpent: 0,
          lastPurchase: invoice.isoDate,
          phone: rawPhone || key,
          isAnonymous: isAnonymousCustomer,
        };
        previous.totalSpent += amount;
        if (invoice.isoDate > previous.lastPurchase) {
          previous.lastPurchase = invoice.isoDate;
        }
        previous.name = maskedName;
        previous.phone = rawPhone || previous.phone;
        previous.isAnonymous = isAnonymousCustomer;
        totals.set(key, previous);
        const existing = spendByCustomer.get(key) || {
          name: maskedName,
          invoices: 0,
          totalSpend: 0,
          phone: rawPhone || key,
          isAnonymous: isAnonymousCustomer,
        };
        existing.invoices += 1;
        existing.totalSpend += amount;
        existing.name = maskedName;
        existing.phone = rawPhone || existing.phone;
        existing.isAnonymous = isAnonymousCustomer;
        spendByCustomer.set(key, existing);
      });

      const newCustomers: CustomerLifecycleRow[] = [];
      const returningCustomers: CustomerLifecycleRow[] = [];
      const anonymousCustomersRows: CustomerLifecycleRow[] = [];
      spendByCustomer.forEach(value => {
        const row: CustomerLifecycleRow = {
          phone: value.phone,
          name: value.name,
          invoices: value.invoices,
          totalSpend: value.totalSpend,
        };
        if (value.isAnonymous) {
          anonymousCustomersRows.push(row);
        } else if (value.invoices <= 1) {
          newCustomers.push(row);
        } else {
          returningCustomers.push(row);
        }
      });

      setCustomerLifecycleTables({
        newCustomers: newCustomers.sort((a, b) => b.totalSpend - a.totalSpend),
        returningCustomers: returningCustomers.sort((a, b) => b.totalSpend - a.totalSpend),
        anonymousCustomers: anonymousCustomersRows.sort((a, b) => b.totalSpend - a.totalSpend),
      });

      const details: CustomerDetail[] = Array.from(totals.values()).map(info => ({
        phone: info.phone,
        name: info.name,
        totalSpent: info.totalSpent,
        customerType: getCustomerType(info.totalSpent),
        lastPurchase: info.lastPurchase,
      }));
      setCustomerDetails(details);

      setCustomerSpendOverTime({
        labels: spendBuckets.map(bucket => bucket.label),
        newSpend: spendBuckets.map(bucket => bucket.newSpend),
        returningSpend: spendBuckets.map(bucket => bucket.returningSpend),
        anonymousSpend: spendBuckets.map(bucket => bucket.anonymousSpend),
        totals: spendBuckets.map(
          bucket => bucket.newSpend + bucket.returningSpend + bucket.anonymousSpend
        ),
      });

      // KPIs based on windowed invoices
      const totalSales = windowed.reduce(
        (sum, invoice) => sum + Number(invoice.total_amount || 0),
        0
      );
      const customerKeySet = new Set(
        windowed
          .map(invoice => getInvoiceCustomerKey(invoice))
          .filter((key): key is string => Boolean(key))
      );
      const uniqueCustomers = customerKeySet.size;
      const anonymousCustomerCount = Array.from(customerKeySet).filter(key =>
        key.startsWith(ANONYMOUS_KEY_PREFIX)
      ).length;

      setCustomerKPIs({
        totalBills: windowed.length,
        totalCustomers: uniqueCustomers,
        totalSales: Math.round(totalSales),
        avgBillSpent: windowed.length ? Math.round(totalSales / windowed.length) : 0,
        newCustomers: newCustomers.length,
        returningCustomers: returningCustomers.length,
        anonymousCustomers: anonymousCustomerCount,
      });
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      // Set default values on error
      setCustomerKPIs({
        totalBills: 0,
        totalCustomers: 0,
        totalSales: 0,
        avgBillSpent: 0,
        newCustomers: 0,
        returningCustomers: 0,
        anonymousCustomers: 0,
      });
      setCustomerDetails([]);
      setCustomerLifecycleTables({
        newCustomers: [],
        returningCustomers: [],
        anonymousCustomers: [],
      });
      setCustomerSpendOverTime({
        labels: [],
        newSpend: [],
        returningSpend: [],
        anonymousSpend: [],
        totals: [],
      });
    } finally {
      setCustomerAnalyticsLoading(false);
      console.log('Customer analytics loading completed');
    }
  };

  const loadDashboardCampaignHistory = async () => {
    if (!selectedStore) {
      setRecentCampaigns([]);
      return;
    }

    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch(`/api/analytics/campaign-history?storeId=${selectedStore}`, {
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to load campaign history for dashboard');
        setRecentCampaigns([]);
        return;
      }

      const payload = await response.json();
      const rawCampaigns: any[] = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];

      const campaignMap = new Map<string, Campaign>();

      rawCampaigns.forEach(entry => {
        const campaignName = entry.campaignName || entry.campaign_name || 'Untitled Campaign';
        const campaignIdValue =
          entry.id ||
          entry.campaignId ||
          entry.campaign_id ||
          entry.messageId ||
          entry.message_id ||
          null;
        const sentDateValue = entry.sentDate || entry.sent_date || entry.sent_at || null;
        const sentDate =
          typeof sentDateValue === 'string' && !Number.isNaN(Date.parse(sentDateValue))
            ? sentDateValue
            : new Date().toISOString();
        const campaignKey = campaignIdValue
          ? String(campaignIdValue)
          : `${campaignName}-${sentDate}`;
        const templateNameValue =
          entry.templateName ||
          entry.template_name ||
          (entry.template && (entry.template.name || entry.template.TemplateName)) ||
          null;
        const resendSettingsValue = entry.resendSettings || entry.resend_settings || null;
        const latestResendAttemptValue =
          entry.latestResendAttempt || entry.latest_resend_attempt || null;
        const overallCampaignStatusValue =
          entry.overallCampaignStatus || entry.overall_campaign_status || null;
        const timeWindowStartValue = entry.timeWindowStart || entry.time_window_start || null;
        const timeWindowEndValue = entry.timeWindowEnd || entry.time_window_end || null;

        let campaign = campaignMap.get(campaignKey);
        if (!campaign) {
          campaign = {
            id: campaignKey,
            campaignName,
            message: entry.message || 'No message content',
            recipients: [],
            sentDate,
            status: entry.status || 'unknown',
            totalRecipients: 0,
            seenCount: 0,
            deliveredCount: 0,
            templateName: templateNameValue,
            campaignId: campaignIdValue,
            resendSettings: resendSettingsValue,
            latestResendAttempt: latestResendAttemptValue,
            overallCampaignStatus: overallCampaignStatusValue,
            timeWindowStart: timeWindowStartValue,
            timeWindowEnd: timeWindowEndValue,
          };
          campaignMap.set(campaignKey, campaign);
        } else if (!campaign.templateName && templateNameValue) {
          campaign.templateName = templateNameValue;
        }
        if (!campaign.campaignId && campaignIdValue) {
          campaign.campaignId = campaignIdValue;
        }
        if (!campaign.resendSettings && resendSettingsValue) {
          campaign.resendSettings = resendSettingsValue;
        }
        if (!campaign.latestResendAttempt && latestResendAttemptValue) {
          campaign.latestResendAttempt = latestResendAttemptValue;
        }
        if (!campaign.overallCampaignStatus && overallCampaignStatusValue) {
          campaign.overallCampaignStatus = overallCampaignStatusValue;
        }
        if (!campaign.timeWindowStart && timeWindowStartValue) {
          campaign.timeWindowStart = timeWindowStartValue;
        }
        if (!campaign.timeWindowEnd && timeWindowEndValue) {
          campaign.timeWindowEnd = timeWindowEndValue;
        }

        const status = (entry.status || '').toLowerCase();
        if (entry.customerPhone || entry.customer_phone) {
          campaign.totalRecipients += 1;
          if (status === 'delivered' || status === 'read' || status === 'seen') {
            campaign.deliveredCount = (campaign.deliveredCount || 0) + 1;
          }
          if (status === 'delivered' || status === 'read' || status === 'seen') {
            campaign.seenCount = (campaign.seenCount || 0) + 1;
          }
        }
      });

      const campaigns = Array.from(campaignMap.values()).sort(
        (a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime()
      );

      setRecentCampaigns(campaigns);
    } catch (error) {
      console.error('Error loading campaign history for dashboard:', error);
      setRecentCampaigns([]);
    }
  };

  // Load KPIs when store changes
  useEffect(() => {
    if (selectedStore) {
      loadKPIs();
      loadCustomers();
      loadInvoices();
      loadWhatsAppEvents();
      loadWhatsAppLogs();
      loadWhatsAppAnalytics();
      loadCustomerAnalytics();
      loadDashboardCampaignHistory();
    }
  }, [selectedStore]);

  useEffect(() => {
    if (selectedStore) {
      loadWalletBalance();
    }
  }, [selectedStore, loadWalletBalance]);

  // Load customer analytics when date range filter changes
  useEffect(() => {
    if (selectedStore && activeTab === 'customers') {
      loadCustomerAnalytics();
    }
  }, [
    selectedStore,
    activeTab,
    customerDateRangeFilter,
    customerCustomStartDate,
    customerCustomEndDate,
  ]);
  // Load charts data
  const showSidebarLabels = isSidebarExpanded || sidebarOpen;
  const sidebarWidthClass = isSidebarExpanded ? 'lg:w-64' : 'lg:w-16';
  const mainOffsetClass = `transition-all duration-200 ease-out ${
    isSidebarExpanded ? 'lg:ml-64' : 'lg:ml-16'
  }`;
  const isWhatsAppTabActive = activeTab === 'whatsapp';
  const isWalletLow =
    walletBalance !== null &&
    walletBalanceThreshold !== null &&
    walletBalance <= walletBalanceThreshold;

  return (
    <div className={cn('min-h-screen bg-[#e8f0fe] pt-16', isWhatsAppTabActive && 'pt-0 sm:pt-16')}>
      {isWhatsAppTabActive ? (
        <div className="hidden sm:block">
          <AppHeader
            showSidebarToggle
            onToggleSidebar={() => setSidebarOpen(true)}
            revenueUnlocked={revenueUnlocked}
            ownerMode={ownerMode}
            onLock={handleLockRevenue}
            onUnlock={handleOpenRevenueUnlock}
            onProfile={() => navigate('/profile')}
            trialStartedAt={trialStartedAt}
            trialPeriodDays={trialPeriodDays}
            walletBalance={walletBalance}
            walletBalanceLoading={walletBalanceLoading}
            walletBalanceError={walletBalanceError}
            walletBalanceLow={isWalletLow}
            walletBalanceLabel="Wallet Balance"
            showWalletBalance={walletEnabledByAdmin}
          />
        </div>
      ) : (
        <AppHeader
          showSidebarToggle
          onToggleSidebar={() => setSidebarOpen(true)}
          revenueUnlocked={revenueUnlocked}
          ownerMode={ownerMode}
          onLock={handleLockRevenue}
          onUnlock={handleOpenRevenueUnlock}
          onProfile={() => navigate('/profile')}
          trialStartedAt={trialStartedAt}
          trialPeriodDays={trialPeriodDays}
          walletBalance={walletBalance}
          walletBalanceLoading={walletBalanceLoading}
          walletBalanceError={walletBalanceError}
          walletBalanceLow={isWalletLow}
          walletBalanceLabel="Wallet Balance"
          showWalletBalance={walletEnabledByAdmin}
        />
      )}
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-40 h-screen bg-gray-900 transform transition-all duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarWidthClass} lg:translate-x-0`}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      >
        <div
          className={`flex items-center justify-between h-16 bg-gray-800 ${
            showSidebarLabels ? 'px-6' : 'px-2'
          }`}
        >
          <div className="flex w-full items-center justify-center" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-300 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav
          className={`flex flex-col h-[calc(100vh-64px)] ${showSidebarLabels ? 'px-4' : 'px-2'}`}
        >
          <div className="flex-1 space-y-2 overflow-y-auto">
            <TooltipProvider>
              {navigationItems.map(item => {
                const IconComponent = item.icon;
                const button = (
                  <button
                    key={item.id}
                    onClick={() => {
                      const changed = handleTabChange(item.id as AnalyticsTab);
                      if (changed) {
                        setSidebarOpen(false);
                      }
                    }}
                    type="button"
                    aria-disabled={item.disabled}
                    className={`w-full flex items-center py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      showSidebarLabels ? 'justify-start px-4' : 'justify-center px-2'
                    } ${
                      item.active
                        ? 'bg-blue-600 text-white'
                        : item.disabled
                        ? 'text-gray-500 bg-gray-800/40 cursor-not-allowed'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <IconComponent className={showSidebarLabels ? 'h-5 w-5 mr-3' : 'h-5 w-5'} />
                    <span
                      className={`text-left transition-all duration-200 ${
                        showSidebarLabels ? 'flex-1 opacity-100' : 'w-0 opacity-0 overflow-hidden'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.disabled && showSidebarLabels && (
                      <span className="ml-3 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-blue-200">
                        Coming Soon
                      </span>
                    )}
                  </button>
                );

                if (showSidebarLabels) {
                  return <React.Fragment key={item.id}>{button}</React.Fragment>;
                }

                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>

          <div className={`mt-4 ${showSidebarLabels ? 'px-2' : 'px-0'}`} />

          {/* Logout button at the bottom */}
          <div className="py-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center py-3 text-sm font-medium rounded-lg transition-colors duration-200 text-red-400 hover:bg-red-900/30 hover:text-red-300 ${
                showSidebarLabels ? 'justify-start px-4' : 'justify-center px-2'
              }`}
            >
              <LogOut className={showSidebarLabels ? 'h-5 w-5 mr-3' : 'h-5 w-5'} />
              <span
                className={`transition-all duration-200 ${
                  showSidebarLabels ? 'opacity-100' : 'w-0 opacity-0 overflow-hidden'
                }`}
              >
                Logout
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={mainOffsetClass}>
        {/* Main content area */}
        <div
          className={cn(
            'min-h-screen bg-[#e8f0fe]',
            activeTab === 'whatsapp' ? 'p-0 pb-20' : 'p-6 pb-24 lg:pb-6'
          )}
        >
          {activeTab === 'campaigns' ? (
            <Campaigns
              selectedStore={selectedStore}
              customerDetails={customerDetails}
              recentCampaigns={recentCampaigns}
              onRecentCampaignsChange={setRecentCampaigns}
              preselectedRecipients={campaignPrefill?.recipients || []}
              onRecipientsConsumed={() => setCampaignPrefill(null)}
            />
          ) : (
            <div className="p-6 min-h-screen bg-[#e8f0fe]">
              {activeTab !== 'automation' && (
                <div className="hidden lg:block mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {navigationItems.find(item => item.active)?.label} Analytics
                  </h1>
                </div>
              )}
              {comingSoonLabel && (
                <div className="mb-6 rounded-lg border border-dashed border-blue-300 bg-white/70 p-4 text-blue-900 shadow-sm backdrop-blur-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{comingSoonLabel} is coming soon</p>
                      <p className="text-sm text-blue-700">
                        We&apos;re finalizing this experience. Stay tuned—once it&apos;s ready,
                        we&apos;ll light up the tab automatically.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleTabChange('dashboard');
                        }}
                        className="whitespace-nowrap"
                      >
                        Back to dashboard
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setComingSoonTab(null)}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dashboard Section */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Dashboard Date Filters */}
                  <div className="sticky top-16 z-40 bg-white rounded-lg shadow p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500">
                      Insights for{' '}
                      <span className="font-medium text-gray-700">{dashboardDateRange.label}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <select
                        value={dashboardDateRangeFilter}
                        onChange={event =>
                          setDashboardDateRangeFilter(event.target.value as DateRangeFilter)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="today">Today</option>
                        <option value="thisWeek">This Week</option>
                        <option value="thisMonth">This Month</option>
                        <option value="thisYear">This Year</option>
                        <option value="alltime">All Time</option>
                        <option value="custom">Custom</option>
                      </select>
                      {dashboardDateRangeFilter === 'custom' && (
                        <>
                          <input
                            type="date"
                            value={dashboardCustomStartDate}
                            onChange={event => setDashboardCustomStartDate(event.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="text-gray-400">–</span>
                          <input
                            type="date"
                            value={dashboardCustomEndDate}
                            onChange={event => setDashboardCustomEndDate(event.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </>
                      )}
                      <Button
                        variant="outline"
                        className="px-3 py-2"
                        onClick={() => {
                          setDashboardDateRangeFilter('today');
                          setDashboardCustomStartDate('');
                          setDashboardCustomEndDate('');
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>

                  {/* Dashboard Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
                      <p className="text-3xl font-bold text-green-600">
                        {renderRevenueValue(
                          `₹${Math.round(
                            dashboardInvoices.reduce((sum, inv) => sum + inv.total_amount, 0)
                          ).toLocaleString()}`
                        )}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{dashboardDateRange.label}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Invoices</h3>
                      <p className="text-3xl font-bold text-blue-600">
                        {dashboardInvoices.length.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{dashboardDateRange.label}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-t-4 border-teal-500">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">E-bill Invoices</h3>
                      <p className="text-3xl font-bold text-teal-600">
                        {dashboardEbillInvoiceCount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Phone numbers captured</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Customers</h3>
                      <p className="text-3xl font-bold text-purple-600">
                        {dashboardCustomerCount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{dashboardDateRange.label}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-t-4 border-indigo-500">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">E-bill Customers</h3>
                      <p className="text-3xl font-bold text-indigo-600">
                        {dashboardEbillCustomerCount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Provided phone numbers</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-t-4 border-red-500">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Anonymous Customers
                      </h3>
                      <p className="text-3xl font-bold text-red-600">
                        {dashboardAnonymousCustomerCount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">No Phone Number</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-t-4 border-orange-500">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaigns Sent</h3>
                      <p className="text-3xl font-bold text-orange-600">
                        {dashboardCampaigns.length.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{dashboardDateRange.label}</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center mb-4">
                        <FileText className="h-8 w-8 text-blue-600 mr-3" />
                        <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
                      </div>
                      <p className="text-gray-600 mb-4">View and manage your invoices</p>
                      <Button
                        onClick={() => handleTabChange('invoices')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        View Invoices
                      </Button>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center mb-4">
                        <MessageCircle className="h-8 w-8 text-green-600 mr-3" />
                        <h3 className="text-lg font-semibold text-gray-900">WhatsApp</h3>
                      </div>
                      <p className="text-gray-600 mb-4">Monitor WhatsApp communications</p>
                      <Button
                        onClick={() => handleTabChange('whatsapp')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        View WhatsApp
                      </Button>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center mb-4">
                        <Megaphone className="h-8 w-8 text-purple-600 mr-3" />
                        <h3 className="text-lg font-semibold text-gray-900">Campaigns</h3>
                      </div>
                      <p className="text-gray-600 mb-4">Create and manage campaigns</p>
                      <Button
                        onClick={() => handleTabChange('campaigns')}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        View Campaigns
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoices Section */}
              {activeTab === 'invoices' && (
                <Invoices
                  selectedStore={selectedStore}
                  onLoadInvoices={loadInvoices}
                  loading={loading}
                  invoices={invoices}
                  filteredInvoices={filteredInvoices}
                  dailyEndInvoices={dailyEndInvoices}
                  dailyEndFilteredInvoices={filteredDailyEndInvoices}
                  dailyEndReportsLoading={dailyEndReportsLoading}
                  filters={filters}
                  onFiltersChange={value => setFilters(value)}
                  onClearFilters={clearFilters}
                  kpiData={kpiData}
                  revenueUnlocked={effectiveRevenueUnlocked}
                  onRequestRevenueUnlock={handleOpenRevenueUnlock}
                />
              )}
              {activeTab === 'whatsapp' && <WhatsApp />}
              {activeTab === 'templates' && <TemplateLibrary />}
              {activeTab === 'automation' && <Automation />}
              {activeTab === 'whatsapp-commerce' && <WhatsAppCommerce />}

              {activeTab === 'customers' && (
                <Customers
                  dateRangeFilter={customerDateRangeFilter}
                  setDateRangeFilter={setCustomerDateRangeFilter}
                  customStartDate={customerCustomStartDate}
                  setCustomStartDate={setCustomerCustomStartDate}
                  customEndDate={customerCustomEndDate}
                  setCustomEndDate={setCustomerCustomEndDate}
                  customerAnalyticsLoading={customerAnalyticsLoading}
                  customerKPIs={customerKPIs}
                  customerDetails={customerDetails}
                  customerLifecycleTables={customerLifecycleTables}
                  customerSpendOverTime={customerSpendOverTime}
                  lifecycleSummary={lifecycleSummary}
                  getCustomerType={getCustomerType}
                  getCustomerTypeStyle={getCustomerTypeStyle}
                  customerCurrentPage={customerCurrentPage}
                  setCustomerCurrentPage={setCustomerCurrentPage}
                  customerPageSize={customerPageSize}
                  revenueUnlocked={effectiveRevenueUnlocked}
                  onRequestRevenueUnlock={handleOpenRevenueUnlock}
                  onLaunchCampaign={handleLaunchCampaignPrefill}
                />
              )}

              {isTabFeatureEnabled('loyalty') && activeTab === 'loyalty' && (
                <Loyalty
                  loyaltyPrograms={loyaltyPrograms}
                  onLoyaltyEdit={handleLoyaltyEdit}
                  onLoyaltyToggle={handleLoyaltyToggle}
                  loyaltyModalOpen={loyaltyModalOpen}
                  editingLoyalty={editingLoyalty}
                  onCloseModal={() => setLoyaltyModalOpen(false)}
                  onLoyaltySave={handleLoyaltySave}
                  editFormData={editFormData}
                  onFormChange={handleFormChange}
                />
              )}

              {isTabFeatureEnabled('cdp') && activeTab === 'cdp' && (
                <CDP
                  customers={cdpCustomers}
                  selectedCustomer={selectedCdpCustomer}
                  onCustomerSelect={handleCdpCustomerClick}
                  onCloseDetails={handleCloseCdpDetails}
                />
              )}
              <div className="h-16 lg:hidden" />
            </div>
          )}
        </div>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="grid grid-cols-5">
            {mobileNavItems.map(item => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-disabled={item.disabled}
                  onClick={() => {
                    const changed = handleTabChange(item.id as AnalyticsTab);
                    if (changed) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-semibold',
                    item.active ? 'text-blue-600' : 'text-gray-500',
                    item.disabled && 'opacity-40'
                  )}
                >
                  <IconComponent className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
      {!ownerMode && (
        <Dialog
          open={revenuePinModalOpen}
          onOpenChange={open => (open ? setRevenuePinModalOpen(true) : handleCloseRevenueModal())}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unlock revenue KPIs</DialogTitle>
              <DialogDescription>
                Only franchise owners can view revenue numbers. Enter the PIN shared with you to
                continue.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRevenuePinSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">4-6 digit PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={revenuePinInput}
                  disabled={hasRevenuePin === false}
                  onChange={event => {
                    setRevenuePinError('');
                    setShowRevenueResetCta(false);
                    setRevenuePinInput(event.target.value.replace(/\D/g, '').slice(0, 6));
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
                  placeholder="Enter PIN"
                />
                {revenuePinStatusLoading && (
                  <p className="text-xs text-gray-500">Checking PIN status…</p>
                )}
                {revenuePinStatusError && (
                  <p className="text-xs text-amber-600">{revenuePinStatusError}</p>
                )}
                {hasRevenuePin === false && (
                  <p className="text-sm text-amber-600">
                    Revenue PIN is not configured yet. Ask the franchise owner to set it from
                    Profile → Settings → Security.
                  </p>
                )}
                {revenuePinError && (
                  <div className="space-y-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    <p>{revenuePinError}</p>
                    {showRevenueResetCta && (
                      <button
                        type="button"
                        className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-rose-700 underline decoration-dotted"
                        onClick={() => {
                          handleCloseRevenueModal();
                          redirectToRevenueSecurity();
                        }}
                      >
                        Go to Profile to reset PIN
                      </button>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseRevenueModal}
                  disabled={revenuePinLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={revenuePinLoading || hasRevenuePin === false}>
                  {revenuePinLoading ? 'Verifying…' : 'Unlock'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Analytics;
