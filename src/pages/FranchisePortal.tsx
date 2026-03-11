import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  DollarSign,
  EyeOff,
  Loader2,
  MapPin,
  Phone,
  ShoppingCart,
  Users,
  LayoutDashboard,
  Store,
  Shield,
  Settings,
  Mail,
  Key,
  CheckCircle,
  AlertTriangle,
  Megaphone,
  Send,
  Calendar,
  Wallet,
  User,
  UploadCloud
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import type { Plugin } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Button } from '@/components/ui/button';
import FranchiseSidebar from '@/components/layout/FranchiseSidebar';
import { maskPhoneNumber } from '@/lib/maskPhone';
import {
  DEFAULT_CUSTOMER_TYPE_CONFIG,
  persistCustomerTypeConfig,
  CustomerTypeConfig
} from '@/lib/customerTypes';
import type { DateRangeFilter } from './analyticsTypes';
import { getDateRange, getDateRangeLabel } from '@/utils/dateRanges';
import { formatINR } from '@/utils/formatCurrency';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ChartTooltip, Legend);

const parseCalendarDate = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

interface FranchiseStoreSummary {
  store_id: string;
  franchise_id: string;
  store_name: string;
  city?: string | null;
  brand_name?: string;
  business_type?: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  onboarding_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  trial_started?: string | null;
  trial_period?: number | string | null;
  total_revenue?: number;
  total_invoices?: number;
  total_customers?: number;
  total_ebill_customers?: number;
  total_anonymous_customers?: number;
  total_campaigns?: number;
  total_campaign_messages?: number;
  franchise_access?: boolean | null;
}

interface FranchiseMetrics {
  storeCount: number;
  totalRevenue: number;
  totalInvoices: number;
  totalCustomers: number;
  totalEbillCustomers: number;
  totalAnonymousCustomers: number;
  totalCampaigns?: number;
  totalMessages?: number;
}

interface FranchiseResponse {
  success: boolean;
  franchise_id: string;
  store_count: number;
  stores: FranchiseStoreSummary[];
  metrics?: FranchiseMetrics | null;
  campaign_free_messages?: number | null;
  campaign_remaining_messages?: number | null;
  wallet_enabled?: boolean;
  trial_start?: string | null;
  trial_end?: string | null;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  session_token?: string | null;
}

interface FranchiseSmartEbillResponse {
  success?: boolean;
  smart_img_urls?: string[];
  smart_header_text?: string | null;
  smart_footer_text?: string | null;
  smart_address_text?: string | null;
  smart_header_images?: string[];
  smart_bottom_banner?: string | null;
  updated_store_count?: number;
}

interface StoreDailyStat {
  date: string;
  invoices: number;
  revenue: number;
  customers: number;
  ebill_customers?: number;
  anonymous_customers?: number;
  ebill_invoices?: number;
  customer_keys?: string[];
}

interface StoreComparisonSeries {
  store_id: string;
  label: string;
  points: { date: string; revenue: number }[];
}

interface StoreAuditEntry {
  location?: string | null;
  time?: string | null;
  system?: string | null;
}

interface StoreSsoResponse {
  token: string;
  store_id: string;
  franchise_id: string | null;
  whatsapp_api_url?: string | null;
  access_token?: string | null;
  waba_id?: string | null;
  phone_number_id?: string | null;
  waba_mobile_number?: string | null;
  template_name?: string | null;
  template_language?: string | null;
  vendor_name?: string | null;
  verified_name?: string | null;
  store_name?: string | null;
  webhook_config?: Record<string, unknown> | null;
  customer_type_config?: CustomerTypeConfig;
  trial_started?: string | null;
  trial_period?: number | string | null;
}

type CustomerTypeFormState = {
  premiumMin: number;
  standardMin: number;
  standardMax: number;
  basicMax: number;
};

type CapturePoint = {
  date: string;
  ebill: number;
  anonymous: number;
  ebillCount?: number;
  eBillCount?: number;
  anonymousCount?: number;
};

const STORAGE_KEY = 'franchisePortal:data';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'stores', label: 'Stores', icon: Store },
  { id: 'wallet', label: 'Payments', icon: DollarSign },
  { id: 'smart-ebill', label: 'Smart E-bill', icon: UploadCloud },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'admin', label: 'Admin panel', icon: Shield }
];

const comparisonColors = ['#a855f7', '#22d3ee', '#fb923c', '#34d399', '#f472b6', '#38bdf8', '#facc15', '#94a3b8', '#f87171'];
const ANONYMOUS_KEY_PREFIX = 'anonymous:';
const SMART_EBILL_MAX_IMAGES = 10;
const MAX_SMART_HEADER_IMAGES = 7;
const formatCount = (value?: number | null) =>
  Number.isFinite(Number(value)) ? Number(value).toLocaleString() : '—';

const bootstrapStoreSession = (payload: StoreSsoResponse) => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem('bb_owner_mode', 'true');
  localStorage.setItem('bb_token', payload.token);
  localStorage.setItem('bb_store_id', payload.store_id);
  localStorage.setItem('bb_franchise_id', payload.franchise_id ?? '');
  localStorage.setItem('bb_whatsapp_api_url', payload.whatsapp_api_url ?? '');
  localStorage.setItem('bb_access_token', payload.access_token ?? '');
  localStorage.setItem('bb_waba_id', payload.waba_id ?? '');
  localStorage.setItem('bb_phone_number_id', payload.phone_number_id ?? '');
  localStorage.setItem('bb_waba_mobile_number', payload.waba_mobile_number ?? '');
  localStorage.setItem('bb_template_name', payload.template_name ?? '');
  localStorage.setItem('bb_template_language', payload.template_language ?? '');
  localStorage.setItem('bb_vendor_name', payload.vendor_name ?? '');
  localStorage.setItem('bb_verified_name', payload.verified_name ?? '');
  localStorage.setItem('bb_store_name', payload.store_name ?? '');
  localStorage.setItem('bb_trial_started', payload.trial_started ?? '');
  localStorage.setItem('bb_trial_period', String(payload.trial_period ?? ''));
  if (payload.webhook_config) {
    localStorage.setItem('bb_webhook_config', JSON.stringify(payload.webhook_config));
  } else {
    localStorage.removeItem('bb_webhook_config');
  }
  persistCustomerTypeConfig(payload.customer_type_config || undefined);
};

const ebillAnonymousValueLabelPlugin: Plugin<'bar'> = {
  id: 'ebillAnonymousValueLabels',
  afterDatasetsDraw: chart => {
    const { ctx } = chart;
    ctx.save();
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (!chart.isDatasetVisible(datasetIndex)) {
        return;
      }
      meta.data.forEach((element, index) => {
        const rawValue = dataset.data[index];
        if (rawValue === null || rawValue === undefined) {
          return;
        }
        const value = Number(rawValue);
        if (!Number.isFinite(value)) {
          return;
        }
        const position = element.tooltipPosition(false);
        ctx.font = '500 11px "Inter", sans-serif';
        ctx.fillStyle = '#F8FAFC';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(value.toLocaleString(), position.x, position.y - 6);
      });
    });
    ctx.restore();
  }
};

const FranchisePortal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [franchiseData, setFranchiseData] = useState<FranchiseResponse | null>(null);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [, setActiveStoreId] = useState<string | null>(null);
  const [storeStatsMap, setStoreStatsMap] = useState<Record<string, StoreDailyStat[]>>({});
  const [, setLoadingStats] = useState(false);
  const [, setStatsError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [storeAccessMap, setStoreAccessMap] = useState<Record<string, boolean>>({});
  const [accessLoading, setAccessLoading] = useState<string | null>(null);
  const [accessError, setAccessError] = useState('');
  const [selectedStoreConfig, setSelectedStoreConfig] = useState<FranchiseStoreSummary | null>(null);
  const [configStoreId, setConfigStoreId] = useState<string | null>(null);
  const [customerTypeForm, setCustomerTypeForm] = useState<CustomerTypeFormState>({
    premiumMin: 10000,
    standardMin: 5000,
    standardMax: 9999,
    basicMax: 4999
  });
  const [customerConfigLoading, setCustomerConfigLoading] = useState(false);
  const [customerConfigStatus, setCustomerConfigStatus] = useState('');
  const [customerConfigError, setCustomerConfigError] = useState('');
  const [auditHistory, setAuditHistory] = useState<StoreAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [auditStatus, setAuditStatus] = useState('');
  const [walletSummary, setWalletSummary] = useState<{
    balance: number;
    currency: string;
    low_balance_threshold: number;
    reserved_balance: number;
    pricing_ebill_invoice: number;
    pricing_smart_ebill: number;
    pricing_campaign_message: number;
  } | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [walletEvents, setWalletEvents] = useState<Array<{
    event_key?: string | null;
    type?: string | null;
    usage_type?: string | null;
    amount?: number;
    balance_after?: number | null;
    store_id?: string | null;
    currency?: string | null;
    timestamp?: string | null;
  }>>([]);
  const [walletEventsLoading, setWalletEventsLoading] = useState(false);
  const [walletEventsError, setWalletEventsError] = useState('');
  const [walletEventTypeFilter, setWalletEventTypeFilter] = useState('all');
  const [walletEventStartDate, setWalletEventStartDate] = useState('');
  const [walletEventEndDate, setWalletEventEndDate] = useState('');
  const [walletUsageRange, setWalletUsageRange] = useState('this_month');
  const [walletUsageCustomStart, setWalletUsageCustomStart] = useState('');
  const [walletUsageCustomEnd, setWalletUsageCustomEnd] = useState('');
  const [walletUsageSummary, setWalletUsageSummary] = useState<{
    ebillCount: number;
    ebillSpend: number;
    smartEbillCount: number;
    smartEbillSpend: number;
    campaignCount: number;
    campaignSpend: number;
  } | null>(null);
  const [walletUsageLoading, setWalletUsageLoading] = useState(false);
  const [walletUsageError, setWalletUsageError] = useState('');
  const [walletActiveDetailsTab, setWalletActiveDetailsTab] = useState('overview');
  const [paymentsActiveTab, setPaymentsActiveTab] = useState<
    'wallet' | 'track_expenses' | 'paid_messages' | 'billing_details' | 'manage_subscriptions' | 'invoices'
  >('wallet');
  const [trackExpenseTab, setTrackExpenseTab] = useState<'wallet' | 'subscription'>('wallet');
  const [walletRangeEvents, setWalletRangeEvents] = useState<
    Array<{
      event_key?: string | null;
      type?: string | null;
      usage_type?: string | null;
      amount?: number;
      balance_after?: number | null;
      store_id?: string | null;
      currency?: string | null;
      timestamp?: string | null;
      category?: string | null;
    }>
  >([]);
  const [walletRangeLoading, setWalletRangeLoading] = useState(false);
  const [walletRangeError, setWalletRangeError] = useState('');
  const [billingProfile, setBillingProfile] = useState<{
    franchise_id?: string | null;
    franchise_name?: string | null;
    billing_address?: string | null;
    billing_city?: string | null;
    billing_state?: string | null;
    billing_country?: string | null;
    billing_zip?: string | null;
    gst_number?: string | null;
    billing_email?: string | null;
    billing_phone?: string | null;
    payment_method?: string | null;
    plan_name?: string | null;
    plan_start_date?: string | null;
    plan_end_date?: string | null;
    plan_status?: string | null;
    plan_amount_year?: number | null;
  } | null>(null);
  const [billingProfileLoading, setBillingProfileLoading] = useState(false);
  const [billingProfileError, setBillingProfileError] = useState('');
  const [billingEditOpen, setBillingEditOpen] = useState(false);
  const [billingForm, setBillingForm] = useState({
    country: 'India',
    hasGst: false,
    legalName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    gstNumber: ''
  });
  const [paymentsHistory, setPaymentsHistory] = useState<any[]>([]);
  const [paymentsHistoryLoading, setPaymentsHistoryLoading] = useState(false);
  const [paymentsHistoryError, setPaymentsHistoryError] = useState('');
  const [walletStoreUsage, setWalletStoreUsage] = useState<Array<{
    store_id: string;
    ebillCount: number;
    ebillSpend: number;
    smartEbillCount: number;
    smartEbillSpend: number;
    campaignCount: number;
    campaignSpend: number;
    totalSpend: number;
  }>>([]);
  const [walletStoreUsageLoading, setWalletStoreUsageLoading] = useState(false);
  const [walletStoreUsageError, setWalletStoreUsageError] = useState('');
  const [walletStoreSearch, setWalletStoreSearch] = useState('');
  const [walletTopupOpen, setWalletTopupOpen] = useState(false);
  const [walletTopupAmount, setWalletTopupAmount] = useState('500');
  const [walletTopupLoading, setWalletTopupLoading] = useState(false);
  const [walletTopupError, setWalletTopupError] = useState('');
  const [walletTopupSuccess, setWalletTopupSuccess] = useState('');
  const [walletTopupTermsOpen, setWalletTopupTermsOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaveStatus, setProfileSaveStatus] = useState('');
  const [profileForm, setProfileForm] = useState({
    legalBusinessName: '',
    ownerFullName: '',
    businessEmail: '',
    phonePrimary: '',
    whatsappNumber: '',
    phoneAlternate: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    gstRegistered: false,
    gstNumber: '',
    panNumber: '',
    gstCertificateUrl: '',
    gstCertificateKey: ''
  });
  const [profileInitial, setProfileInitial] = useState<typeof profileForm | null>(null);
  const [gstUploadStatus, setGstUploadStatus] = useState('');
  const [gstUploadError, setGstUploadError] = useState('');
  const [smartImages, setSmartImages] = useState<string[]>([]);
  const [smartHeaderText, setSmartHeaderText] = useState('');
  const [smartFooterText, setSmartFooterText] = useState('');
  const [smartAddressText, setSmartAddressText] = useState('');
  const [headerImages, setHeaderImages] = useState<string[]>([]);
  const [bottomBanner, setBottomBanner] = useState<string | null>(null);
  const [previewHeaderIndex, setPreviewHeaderIndex] = useState(0);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartSaving, setSmartSaving] = useState(false);
  const [smartUploading, setSmartUploading] = useState(false);
  const [smartStatus, setSmartStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const smartFileInputRef = useRef<HTMLInputElement | null>(null);


  const getTrialInfo = (trialStartIso?: string | null, trialEndIso?: string | null) => {
    if (!trialStartIso || !trialEndIso) {
      return null;
    }
    const start = new Date(trialStartIso);
    const end = new Date(trialEndIso);
    if (Number.isNaN(start.getTime())) {
      return null;
    }
    if (Number.isNaN(end.getTime())) {
      return null;
    }
    const diffMs = end.getTime() - Date.now();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return {
      daysLeft,
      endLabel: end.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      })
    };
  };
  const [auditClearing, setAuditClearing] = useState(false);
  const [storeSsoBusyId, setStoreSsoBusyId] = useState<string | null>(null);
  const [storeSsoError, setStoreSsoError] = useState('');
  const [storeComparisonSeries, setStoreComparisonSeries] = useState<StoreComparisonSeries[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState('');
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [logoutAllStatus, setLogoutAllStatus] = useState('');
  const [logoutAllError, setLogoutAllError] = useState('');
  const [ebillAnonymousSeriesMap, setEbillAnonymousSeriesMap] = useState<Record<string, CapturePoint[]>>({});
  const [ebillAnonymousLoading, setEbillAnonymousLoading] = useState(false);
  const [ebillAnonymousError, setEbillAnonymousError] = useState('');
  const [overviewDateFilter, setOverviewDateFilter] = useState<DateRangeFilter>('today');
  const [overviewCustomStart, setOverviewCustomStart] = useState('');
  const [overviewCustomEnd, setOverviewCustomEnd] = useState('');
  const overviewCustomStartRef = useRef<HTMLInputElement | null>(null);
  const overviewCustomEndRef = useRef<HTMLInputElement | null>(null);
  const overviewDateRange = useMemo(() => {
    const { startDate, endDate } = getDateRange(overviewDateFilter, overviewCustomStart, overviewCustomEnd);
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);
    return {
      start,
      end,
      startKey: startDate,
      endKey: endDate,
      startMs: start.getTime(),
      endMs: end.getTime(),
      label: getDateRangeLabel(overviewDateFilter, startDate, endDate)
    };
  }, [overviewDateFilter, overviewCustomStart, overviewCustomEnd]);

  const handleOverviewDateFilterChange = (value: DateRangeFilter) => {
    setOverviewDateFilter(value);
    if (value !== 'custom') {
      setOverviewCustomStart('');
      setOverviewCustomEnd('');
    }
  };

  const handleOverviewCustomChange = (key: 'start' | 'end', value: string) => {
    if (key === 'start') {
      setOverviewCustomStart(value);
      setOverviewCustomEnd(prev => {
        if (!prev) {
          return prev;
        }
        return value && prev && value > prev ? value : prev;
      });
    } else {
      setOverviewCustomEnd(value);
      setOverviewCustomStart(prev => {
        if (!prev) {
          return prev;
        }
        return value && prev && value < prev ? value : prev;
      });
    }
  };

  useEffect(() => {
    if (location.state && typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(location.state));
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as FranchiseResponse & { token?: string | null };
        const normalized = {
          ...parsed,
          session_token: parsed.session_token || (parsed as any).token || null
        };
        setFranchiseData(normalized);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const refreshTokenRef = useRef<string | null>(null);
  useEffect(() => {
    if (!franchiseData) {
      setStoreStatsMap({});
    }
  }, [franchiseData]);

  useEffect(() => {
    if (!franchiseData?.session_token) {
      refreshTokenRef.current = null;
      return;
    }
    const token = franchiseData.session_token;
    if (refreshTokenRef.current === token) {
      return;
    }
    refreshTokenRef.current = token;
    let isMounted = true;
    const refreshOverview = async () => {
      try {
        const response = await fetch('/api/franchise/session/overview', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || 'Unable to refresh franchise overview.');
        }
        if (!isMounted) {
          return;
        }
        setFranchiseData(prev => {
          const next = {
            ...(prev || {}),
            ...data,
            session_token: token
          };
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      } catch (error) {
        console.error('Failed to refresh franchise overview', error);
        refreshTokenRef.current = null;
      }
    };
    refreshOverview();
    return () => {
      isMounted = false;
    };
  }, [franchiseData?.session_token]);

  useEffect(() => {
    if (!franchiseData) {
      if (storeFilter !== 'all') {
        setStoreFilter('all');
      }
      return;
    }
    if (storeFilter !== 'all' && !franchiseData.stores.some(store => store.store_id === storeFilter)) {
      setStoreFilter('all');
    }
  }, [franchiseData, storeFilter]);

  useEffect(() => {
    if (!franchiseData?.session_token) {
      return;
    }
    let isMounted = true;
    const loadWalletSummary = async () => {
      setWalletLoading(true);
      setWalletError('');
      try {
        const response = await fetch('/api/franchise/wallet', {
          headers: {
            Authorization: `Bearer ${franchiseData.session_token}`
          }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || 'Unable to load wallet summary.');
        }
        if (isMounted) {
          const wallet = data.wallet || {};
          setWalletSummary({
            balance: Number(wallet.balance ?? 0),
            currency: wallet.currency || 'INR',
            low_balance_threshold: Number(wallet.low_balance_threshold ?? 0),
            reserved_balance: Number(wallet.reserved_balance ?? 0),
            pricing_ebill_invoice: Number(wallet.pricing_ebill_invoice ?? 0),
            pricing_smart_ebill: Number(wallet.pricing_smart_ebill ?? 0),
            pricing_campaign_message: Number(wallet.pricing_campaign_message ?? 0)
          });
        }
      } catch (error) {
        if (isMounted) {
          setWalletError(error instanceof Error ? error.message : 'Unable to load wallet summary.');
        }
      } finally {
        if (isMounted) {
          setWalletLoading(false);
        }
      }
    };
    loadWalletSummary();
    return () => {
      isMounted = false;
    };
  }, [activeTab, franchiseData?.session_token]);

  const loadWalletEvents = async () => {
    if (!franchiseData?.session_token) {
      return;
    }
    setWalletEventsLoading(true);
    setWalletEventsError('');
    try {
      const response = await fetch('/api/franchise/wallet-events?limit=50', {
        headers: {
          Authorization: `Bearer ${franchiseData.session_token}`
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load wallet events.');
      }
      setWalletEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      setWalletEventsError(error instanceof Error ? error.message : 'Unable to load wallet events.');
    } finally {
      setWalletEventsLoading(false);
    }
  };

  const loadWalletUsageSummary = async (range: string, start?: string, end?: string) => {
    if (!franchiseData?.session_token) {
      return;
    }
    setWalletUsageLoading(true);
    setWalletUsageError('');
    try {
      const params = new URLSearchParams({ range });
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const response = await fetch(`/api/franchise/wallet-events/summary?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${franchiseData.session_token}`
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load wallet usage summary.');
      }
      setWalletUsageSummary({
        ebillCount: Number(data.ebillCount ?? 0),
        ebillSpend: Number(data.ebillSpend ?? 0),
        smartEbillCount: Number(data.smartEbillCount ?? 0),
        smartEbillSpend: Number(data.smartEbillSpend ?? 0),
        campaignCount: Number(data.campaignCount ?? 0),
        campaignSpend: Number(data.campaignSpend ?? 0)
      });
    } catch (error) {
      setWalletUsageError(error instanceof Error ? error.message : 'Unable to load wallet usage summary.');
    } finally {
      setWalletUsageLoading(false);
    }
  };

  const loadWalletStoreUsage = async (range: string, start?: string, end?: string) => {
    if (!franchiseData?.session_token) {
      return;
    }
    setWalletStoreUsageLoading(true);
    setWalletStoreUsageError('');
    try {
      const params = new URLSearchParams({ range });
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const response = await fetch(`/api/franchise/wallet-events/by-store?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${franchiseData.session_token}`
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load store usage.');
      }
      setWalletStoreUsage(Array.isArray(data.stores) ? data.stores : []);
    } catch (error) {
      setWalletStoreUsageError(error instanceof Error ? error.message : 'Unable to load store usage.');
    } finally {
      setWalletStoreUsageLoading(false);
    }
  };

  const loadWalletRangeEvents = async (range: string, start?: string, end?: string) => {
    if (!franchiseData?.session_token) {
      return;
    }
    setWalletRangeLoading(true);
    setWalletRangeError('');
    try {
      const params = new URLSearchParams({ range });
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const response = await fetch(`/api/franchise/wallet-events/range?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${franchiseData.session_token}`
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load wallet events.');
      }
      setWalletRangeEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      setWalletRangeError(error instanceof Error ? error.message : 'Unable to load wallet events.');
    } finally {
      setWalletRangeLoading(false);
    }
  };

  const loadBillingProfile = async () => {
    if (!franchiseData?.session_token) {
      return;
    }
    setBillingProfileLoading(true);
    setBillingProfileError('');
    try {
      const response = await fetch('/api/franchise/billing-profile', {
        headers: {
          Authorization: `Bearer ${franchiseData.session_token}`
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load billing profile.');
      }
      setBillingProfile(data.profile || null);
    } catch (error) {
      setBillingProfileError(error instanceof Error ? error.message : 'Unable to load billing profile.');
    } finally {
      setBillingProfileLoading(false);
    }
  };

  const loadPaymentsHistory = async () => {
    if (!franchiseData?.session_token) {
      return;
    }
    setPaymentsHistoryLoading(true);
    setPaymentsHistoryError('');
    try {
      const response = await fetch('/api/franchise/payments/history?limit=50', {
        headers: {
          Authorization: `Bearer ${franchiseData.session_token}`
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load payment history.');
      }
      setPaymentsHistory(Array.isArray(data.payments) ? data.payments : []);
    } catch (error) {
      setPaymentsHistoryError(error instanceof Error ? error.message : 'Unable to load payment history.');
    } finally {
      setPaymentsHistoryLoading(false);
    }
  };

  const loadFranchiseProfile = async () => {
    if (!franchiseData?.session_token) {
      return;
    }
    setProfileLoading(true);
    setProfileError('');
    try {
      const response = await fetch('/api/franchise/profile', {
        headers: {
          Authorization: `Bearer ${franchiseData.session_token}`
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load franchise profile.');
      }
      const profile = data.profile || {};
      setProfileForm({
        legalBusinessName: profile.legal_business_name || '',
        ownerFullName: profile.owner_full_name || '',
        businessEmail: profile.business_email || '',
        phonePrimary: profile.phone_primary || '',
        whatsappNumber: profile.whatsapp_number || '',
        phoneAlternate: profile.phone_alternate || '',
        addressLine1: profile.address_line1 || '',
        addressLine2: profile.address_line2 || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || 'India',
        pincode: profile.pincode || '',
        gstRegistered: Boolean(profile.gst_registered),
        gstNumber: profile.gst_number || '',
        panNumber: profile.pan_number || '',
        gstCertificateUrl: profile.gst_certificate_url || '',
        gstCertificateKey: profile.gst_certificate_key || ''
      });
      setProfileInitial({
        legalBusinessName: profile.legal_business_name || '',
        ownerFullName: profile.owner_full_name || '',
        businessEmail: profile.business_email || '',
        phonePrimary: profile.phone_primary || '',
        whatsappNumber: profile.whatsapp_number || '',
        phoneAlternate: profile.phone_alternate || '',
        addressLine1: profile.address_line1 || '',
        addressLine2: profile.address_line2 || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || 'India',
        pincode: profile.pincode || '',
        gstRegistered: Boolean(profile.gst_registered),
        gstNumber: profile.gst_number || '',
        panNumber: profile.pan_number || '',
        gstCertificateUrl: profile.gst_certificate_url || '',
        gstCertificateKey: profile.gst_certificate_key || ''
      });
      setProfileSaveStatus('');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to load franchise profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!franchiseData?.session_token) {
      return;
    }
    setProfileSaveStatus('');
    setProfileError('');
    try {
      const response = await fetch('/api/franchise/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${franchiseData.session_token}`
        },
        body: JSON.stringify({
          legal_business_name: profileForm.legalBusinessName,
          owner_full_name: profileForm.ownerFullName,
          business_email: profileForm.businessEmail,
          phone_primary: profileForm.phonePrimary,
          whatsapp_number: profileForm.whatsappNumber,
          phone_alternate: profileForm.phoneAlternate,
          address_line1: profileForm.addressLine1,
          address_line2: profileForm.addressLine2,
          city: profileForm.city,
          state: profileForm.state,
          country: profileForm.country,
          pincode: profileForm.pincode,
          gst_registered: profileForm.gstRegistered,
          gst_number: profileForm.gstNumber,
          pan_number: profileForm.panNumber,
          gst_certificate_url: profileForm.gstCertificateUrl,
          gst_certificate_key: profileForm.gstCertificateKey
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to save franchise profile.');
      }
      setProfileSaveStatus('Profile updated successfully.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to save franchise profile.');
    }
  };

  const handleGstUpload = async (file: File | null) => {
    if (!file || !franchiseData?.session_token) {
      return;
    }
    setGstUploadStatus('');
    setGstUploadError('');

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setGstUploadError('Unsupported file type. Use PDF, JPEG, JPG or PNG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setGstUploadError('File size exceeds 5MB.');
      return;
    }

    try {
      const params = new URLSearchParams({
        filename: file.name,
        contentType: file.type,
        size: String(file.size)
      });
      const response = await fetch(`/api/franchise/profile/gst-upload-url?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${franchiseData.session_token}`
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to create upload URL.');
      }
      const { uploadUrl, publicUrl, key } = data || {};
      if (!uploadUrl || !publicUrl || !key) {
        throw new Error('Upload URL response is invalid.');
      }

      setGstUploadStatus('Uploading...');
      const putResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });
      if (!putResponse.ok) {
        throw new Error('Upload failed.');
      }

      setProfileForm(prev => ({
        ...prev,
        gstCertificateUrl: publicUrl,
        gstCertificateKey: key
      }));
      setGstUploadStatus('Uploaded');
    } catch (error) {
      setGstUploadError(error instanceof Error ? error.message : 'Upload failed.');
    }
  };

  const loadSmartEbillConfig = async () => {
    if (!franchiseData?.session_token) {
      return;
    }
    setSmartLoading(true);
    setSmartStatus(null);
    try {
      const response = await fetch('/api/franchise/smart-ebill', {
        headers: {
          Authorization: `Bearer ${franchiseData.session_token}`
        }
      });
      const data = (await response.json().catch(() => ({}))) as FranchiseSmartEbillResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load Smart E-bill settings.');
      }
      const imgs = Array.isArray(data.smart_img_urls) ? data.smart_img_urls : [];
      const selectedHeaders = Array.isArray(data.smart_header_images)
        ? data.smart_header_images.slice(0, MAX_SMART_HEADER_IMAGES)
        : [];
      const selectedBottom =
        typeof data.smart_bottom_banner === 'string' ? data.smart_bottom_banner : null;

      setSmartImages(imgs);
      setSmartHeaderText(typeof data.smart_header_text === 'string' ? data.smart_header_text : '');
      setSmartFooterText(typeof data.smart_footer_text === 'string' ? data.smart_footer_text : '');
      setSmartAddressText(typeof data.smart_address_text === 'string' ? data.smart_address_text : '');
      setHeaderImages(
        selectedHeaders.length
          ? selectedHeaders
          : imgs.slice(0, Math.min(MAX_SMART_HEADER_IMAGES, imgs.length))
      );
      setBottomBanner(selectedBottom || imgs[0] || null);
    } catch (error) {
      setSmartStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to load Smart E-bill settings.'
      });
    } finally {
      setSmartLoading(false);
    }
  };

  const mergeHeaderImages = (current: string[], nextImages: string[]) => {
    const retained = current.filter(url => nextImages.includes(url));
    const toAdd = nextImages.filter(url => !retained.includes(url));
    return [...retained, ...toAdd].slice(0, MAX_SMART_HEADER_IMAGES);
  };

  const triggerSmartUpload = () => {
    smartFileInputRef.current?.click();
  };

  const uploadSmartImages = async (files: FileList) => {
    if (!franchiseData?.session_token || smartUploading) {
      return;
    }

    const remainingSlots = Math.max(0, SMART_EBILL_MAX_IMAGES - smartImages.length);
    if (remainingSlots <= 0) {
      setSmartStatus({
        type: 'error',
        message: `You can upload up to ${SMART_EBILL_MAX_IMAGES} images.`
      });
      return;
    }

    const accepted = Array.from(files).slice(0, remainingSlots);
    if (!accepted.length) {
      return;
    }

    setSmartUploading(true);
    setSmartStatus(null);
    try {
      const formData = new FormData();
      accepted.forEach(file => formData.append('images', file));
      const response = await fetch('/api/franchise/smart-ebill/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${franchiseData.session_token}`
        },
        body: formData
      });
      const result = (await response.json().catch(() => ({}))) as FranchiseSmartEbillResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to upload Smart E-bill images.');
      }
      const nextImages = Array.isArray(result.smart_img_urls)
        ? result.smart_img_urls
        : Array.isArray((result as any).images)
        ? ((result as any).images as string[])
        : [];
      setSmartImages(nextImages);
      if (nextImages.length > 0) {
        setHeaderImages(prev => mergeHeaderImages(prev, nextImages));
        setBottomBanner(prev => prev || nextImages[0]);
      }
      setSmartStatus({
        type: 'success',
        message: `Images uploaded and synced to ${result.updated_store_count ?? 0} stores.`
      });
    } catch (error) {
      setSmartStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to upload Smart E-bill images.'
      });
    } finally {
      setSmartUploading(false);
    }
  };

  const handleSmartFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadSmartImages(files);
    }
    event.target.value = '';
  };

  const toggleHeaderImage = (url: string) => {
    setHeaderImages(prev => {
      if (prev.includes(url)) {
        return prev.filter(item => item !== url);
      }
      if (prev.length >= MAX_SMART_HEADER_IMAGES) {
        return prev;
      }
      return [...prev, url];
    });
  };

  const moveHeaderImage = (index: number, direction: -1 | 1) => {
    setHeaderImages(prev => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) {
        return prev;
      }
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleRemoveSmartImage = (index: number) => {
    setSmartImages(prev => prev.filter((_, imageIndex) => imageIndex !== index));
  };

  const handleSmartEbillSave = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!franchiseData?.session_token || smartSaving) {
      return;
    }
    setSmartSaving(true);
    setSmartStatus(null);
    try {
      const response = await fetch('/api/franchise/smart-ebill', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${franchiseData.session_token}`
        },
        body: JSON.stringify({
          headerText: smartHeaderText,
          footerText: smartFooterText,
          addressText: smartAddressText,
          images: smartImages,
          headerImages,
          bottomBanner
        })
      });
      const result = (await response.json().catch(() => ({}))) as FranchiseSmartEbillResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to save Smart E-bill settings.');
      }
      const nextImages = Array.isArray(result.smart_img_urls) ? result.smart_img_urls : smartImages;
      setSmartImages(nextImages);
      setSmartHeaderText(typeof result.smart_header_text === 'string' ? result.smart_header_text : smartHeaderText);
      setSmartFooterText(typeof result.smart_footer_text === 'string' ? result.smart_footer_text : smartFooterText);
      setSmartAddressText(
        typeof result.smart_address_text === 'string' ? result.smart_address_text : smartAddressText
      );
      setHeaderImages(
        Array.isArray(result.smart_header_images) ? result.smart_header_images : headerImages
      );
      setBottomBanner(
        typeof result.smart_bottom_banner === 'string' ? result.smart_bottom_banner : bottomBanner
      );
      setSmartStatus({
        type: 'success',
        message: `Smart E-bill settings saved and synced to ${result.updated_store_count ?? 0} stores.`
      });
    } catch (error) {
      setSmartStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to save Smart E-bill settings.'
      });
    } finally {
      setSmartSaving(false);
    }
  };

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window is not available'));
        return;
      }
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'));
      document.body.appendChild(script);
    });

  const handleWalletTopup = async () => {
    if (!franchiseData?.session_token) {
      setWalletTopupError('Session expired. Please log in again.');
      return;
    }
    setWalletTopupError('');
    setWalletTopupSuccess('');
    const amount = Number(walletTopupAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setWalletTopupError('Enter a valid amount.');
      return;
    }
    setWalletTopupLoading(true);
    try {
      await loadRazorpayScript();
      const response = await fetch('/api/franchise/payments/create-order', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${franchiseData.session_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to create payment order.');
      }

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'BillBox',
        description: 'Wallet top-up',
        order_id: data.order_id,
        handler: async (payload: any) => {
          try {
            const verifyResponse = await fetch('/api/franchise/payments/verify', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${franchiseData.session_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });
            const verifyData = await verifyResponse.json().catch(() => ({}));
            if (!verifyResponse.ok) {
              throw new Error(verifyData?.error || 'Payment verification failed.');
            }
            setWalletTopupSuccess('Payment successful. Wallet credited.');
            setWalletTopupOpen(false);
            await loadWalletEvents();
            await loadWalletUsageSummary(walletUsageRange, walletUsageCustomStart, walletUsageCustomEnd);
            const refreshResponse = await fetch('/api/franchise/wallet', {
              headers: {
                Authorization: `Bearer ${franchiseData.session_token}`
              }
            });
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json().catch(() => ({}));
              const wallet = refreshData.wallet || {};
              setWalletSummary({
                balance: Number(wallet.balance ?? 0),
                currency: wallet.currency || 'INR',
                low_balance_threshold: Number(wallet.low_balance_threshold ?? 0),
                reserved_balance: Number(wallet.reserved_balance ?? 0),
                pricing_ebill_invoice: Number(wallet.pricing_ebill_invoice ?? 0),
                pricing_smart_ebill: Number(wallet.pricing_smart_ebill ?? 0),
                pricing_campaign_message: Number(wallet.pricing_campaign_message ?? 0)
              });
            }
          } catch (error) {
            setWalletTopupError(error instanceof Error ? error.message : 'Payment verification failed.');
          }
        },
        prefill: {},
        theme: {
          color: '#4F46E5'
        }
      };

      // @ts-ignore
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      setWalletTopupError(error instanceof Error ? error.message : 'Unable to start payment.');
    } finally {
      setWalletTopupLoading(false);
    }
  };

  const walletEnabledByAdmin = franchiseData ? franchiseData.wallet_enabled !== false : true;
  const franchiseTrialEndDate = franchiseData?.trial_end_date
    ? parseCalendarDate(franchiseData.trial_end_date)
    : franchiseData?.trial_end
    ? parseCalendarDate(franchiseData.trial_end)
    : null;
  const isValidTrialEndDate =
    franchiseTrialEndDate instanceof Date && !Number.isNaN(franchiseTrialEndDate.getTime());
  const trialEndCutoff = isValidTrialEndDate
    ? new Date(
        franchiseTrialEndDate!.getFullYear(),
        franchiseTrialEndDate!.getMonth(),
        franchiseTrialEndDate!.getDate(),
        23,
        59,
        59,
        999
      )
    : null;
  const trialEndedForWallet = !trialEndCutoff ? true : Date.now() >= trialEndCutoff.getTime();
  const walletAccessAllowed = walletEnabledByAdmin && trialEndedForWallet;
  const walletTrialEndLabel = isValidTrialEndDate
    ? franchiseTrialEndDate!.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      })
    : null;
  const franchiseWalletReadOnly = false;
  const globalTrialBanner = (() => {
    const trialStartIso = franchiseData?.trial_start_date ?? franchiseData?.trial_start ?? null;
    const trialEndIso = franchiseData?.trial_end_date ?? franchiseData?.trial_end ?? null;
    if (!trialStartIso || !trialEndIso) {
      return null;
    }
    const start = parseCalendarDate(trialStartIso);
    const end = parseCalendarDate(trialEndIso);
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const endOfToday = new Date(todayStart);
    endOfToday.setHours(23, 59, 59, 999);
    const endDay = new Date(end);
    endDay.setHours(23, 59, 59, 999);
    const daysLeft = Math.max(0, Math.ceil((endDay.getTime() - endOfToday.getTime()) / (1000 * 60 * 60 * 24)));
    const status = endDay.getTime() < todayStart.getTime() ? 'ended' : endDay.getTime() <= endOfToday.getTime() ? 'ends_today' : 'active';
    const isAlert = status === 'ended' || status === 'ends_today' || daysLeft <= 5;
    const statusLabel =
      status === 'ended'
        ? 'Trial ended'
        : status === 'ends_today'
        ? 'Trial ends today'
        : `Trial ends in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;

    return {
      startLabel: start.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      endLabel: end.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      daysLeft,
      status,
      isAlert,
      statusLabel
    };
  })();

  useEffect(() => {
    if (activeTab === 'wallet' && walletAccessAllowed) {
      loadWalletEvents();
    }
  }, [activeTab, walletAccessAllowed]);

  useEffect(() => {
    if (activeTab !== 'wallet' || !walletAccessAllowed) {
      return;
    }
    loadWalletUsageSummary(walletUsageRange, walletUsageCustomStart, walletUsageCustomEnd);
  }, [activeTab, walletAccessAllowed, walletUsageRange, walletUsageCustomStart, walletUsageCustomEnd]);

  useEffect(() => {
    if (activeTab !== 'wallet' || !walletAccessAllowed || walletActiveDetailsTab !== 'stores') {
      return;
    }
    loadWalletStoreUsage(walletUsageRange, walletUsageCustomStart, walletUsageCustomEnd);
  }, [activeTab, walletAccessAllowed, walletActiveDetailsTab, walletUsageRange, walletUsageCustomStart, walletUsageCustomEnd]);

  useEffect(() => {
    if (activeTab !== 'wallet' || !walletAccessAllowed) {
      return;
    }
    if (paymentsActiveTab === 'track_expenses' || paymentsActiveTab === 'paid_messages') {
      loadWalletRangeEvents(walletUsageRange, walletUsageCustomStart, walletUsageCustomEnd);
    }
  }, [activeTab, walletAccessAllowed, paymentsActiveTab, walletUsageRange, walletUsageCustomStart, walletUsageCustomEnd]);

  useEffect(() => {
    if (!franchiseData?.session_token) {
      return;
    }
    loadFranchiseProfile();
  }, [franchiseData?.session_token]);

  useEffect(() => {
    if (activeTab !== 'wallet' || !walletAccessAllowed) {
      return;
    }
    if (paymentsActiveTab === 'billing_details' || paymentsActiveTab === 'manage_subscriptions') {
      loadBillingProfile();
      loadFranchiseProfile();
    }
  }, [activeTab, walletAccessAllowed, paymentsActiveTab]);

  useEffect(() => {
    if (activeTab !== 'wallet' || !walletAccessAllowed) {
      return;
    }
    if (paymentsActiveTab === 'invoices') {
      loadPaymentsHistory();
    }
  }, [activeTab, walletAccessAllowed, paymentsActiveTab]);

  useEffect(() => {
    if (activeTab !== 'profile') {
      return;
    }
    loadFranchiseProfile();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'smart-ebill') {
      return;
    }
    loadSmartEbillConfig();
  }, [activeTab]);

  useEffect(() => {
    if (headerImages.some(img => !smartImages.includes(img))) {
      setHeaderImages(prev => prev.filter(img => smartImages.includes(img)));
    }
    if (smartImages.length > 0 && headerImages.length === 0) {
      setHeaderImages(smartImages.slice(0, Math.min(MAX_SMART_HEADER_IMAGES, smartImages.length)));
    } else if (headerImages.length > MAX_SMART_HEADER_IMAGES) {
      setHeaderImages(prev => prev.slice(0, MAX_SMART_HEADER_IMAGES));
    }
    if (bottomBanner && !smartImages.includes(bottomBanner)) {
      setBottomBanner(smartImages[0] || null);
    } else if (!bottomBanner && smartImages.length > 0) {
      setBottomBanner(smartImages[0]);
    }
  }, [smartImages, headerImages, bottomBanner]);

  useEffect(() => {
    if (headerImages.length === 0) {
      setPreviewHeaderIndex(0);
      return;
    }
    if (previewHeaderIndex >= headerImages.length) {
      setPreviewHeaderIndex(0);
    }
  }, [headerImages, previewHeaderIndex]);

  useEffect(() => {
    if (!profileSaveStatus) {
      return;
    }
    const timer = setTimeout(() => {
      setProfileSaveStatus('');
    }, 4000);
    return () => clearTimeout(timer);
  }, [profileSaveStatus]);

  useEffect(() => {
    if (!smartStatus) {
      return;
    }
    const timer = setTimeout(() => {
      setSmartStatus(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [smartStatus]);

  useEffect(() => {
    if (!billingProfile) {
      return;
    }
    setBillingForm(prev => ({
      ...prev,
      legalName: billingProfile.franchise_name || '',
      addressLine1: billingProfile.billing_address || '',
      city: billingProfile.billing_city || '',
      state: billingProfile.billing_state || '',
      zip: billingProfile.billing_zip || '',
      gstNumber: billingProfile.gst_number || ''
    }));
  }, [billingProfile]);

  useEffect(() => {
    if (franchiseData) {
      const next: Record<string, boolean> = {};
      franchiseData.stores.forEach(store => {
        next[store.store_id] = store.franchise_access !== false;
      });
      setStoreAccessMap(next);
    }
  }, [franchiseData]);

  const filteredStores = useMemo(() => {
    if (!franchiseData) {
      return [];
    }
    if (storeFilter === 'all') {
      return franchiseData.stores;
    }
    return franchiseData.stores.filter(store => store.store_id === storeFilter);
  }, [franchiseData, storeFilter]);

  useEffect(() => {
    if (
      activeTab === 'stores' &&
      franchiseData &&
      franchiseData.stores.length > 0 &&
      !selectedStoreConfig
    ) {
      setSelectedStoreConfig(franchiseData.stores[0]);
    }
  }, [activeTab, franchiseData, selectedStoreConfig]);

  useEffect(() => {
    if (!franchiseData || !franchiseData.stores.length) {
      setConfigStoreId(null);
      return;
    }
    if (!configStoreId || !franchiseData.stores.some(store => store.store_id === configStoreId)) {
      setConfigStoreId(franchiseData.stores[0].store_id);
    }
  }, [franchiseData, configStoreId]);

  useEffect(() => {
    if (!franchiseData || !configStoreId) {
      setAuditHistory([]);
      setAuditStatus('');
      setAuditError('');
      setLogoutAllStatus('');
      setLogoutAllError('');
      return;
    }
    let isMounted = true;
    const loadConfig = async () => {
      setCustomerConfigLoading(true);
      setCustomerConfigError('');
      setCustomerConfigStatus('');
      try {
        const response = await fetch(
          `/api/franchise/stores/${configStoreId}/customer-types?franchise_id=${franchiseData.franchise_id}`
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || 'Unable to load configuration.');
        }
        const config = data.customer_type_config || DEFAULT_CUSTOMER_TYPE_CONFIG;
        if (!isMounted) {
          return;
        }
        setCustomerTypeForm({
          premiumMin: Number(config.premium?.min ?? DEFAULT_CUSTOMER_TYPE_CONFIG.premium.min),
          standardMin: Number(config.standard?.min ?? DEFAULT_CUSTOMER_TYPE_CONFIG.standard.min),
          standardMax: Number(config.standard?.max ?? DEFAULT_CUSTOMER_TYPE_CONFIG.standard.max),
          basicMax: Number(config.basic?.max ?? DEFAULT_CUSTOMER_TYPE_CONFIG.basic.max)
        });
        setCustomerConfigStatus(
          data.updated_at
            ? `Last updated ${dayjs(data.updated_at).format('DD MMM YYYY')}`
            : 'Configuration up to date'
        );
      } catch (error) {
        if (isMounted) {
          setCustomerConfigError(
            error instanceof Error ? error.message : 'Unable to load customer type configuration.'
          );
        }
      } finally {
        if (isMounted) {
          setCustomerConfigLoading(false);
        }
      }
    };
    loadConfig();
    return () => {
      isMounted = false;
    };
  }, [franchiseData, configStoreId]);

  useEffect(() => {
    if (!franchiseData || !configStoreId) {
      setAuditHistory([]);
      setAuditError('');
      setAuditStatus('');
      setLogoutAllStatus('');
      setLogoutAllError('');
      return;
    }

    let isMounted = true;
    const loadAuditHistory = async () => {
      setAuditLoading(true);
      setAuditError('');
      setAuditStatus('');
      setLogoutAllStatus('');
      setLogoutAllError('');
      try {
        const response = await fetch(
          `/api/franchise/stores/${configStoreId}/audit-history?franchise_id=${franchiseData.franchise_id}`
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || 'Unable to load audit history.');
        }
        if (isMounted) {
          setAuditHistory(Array.isArray(data.audit_history) ? data.audit_history : []);
        }
      } catch (error) {
        if (isMounted) {
          setAuditError(error instanceof Error ? error.message : 'Unable to load audit history.');
        }
      } finally {
        if (isMounted) {
          setAuditLoading(false);
        }
      }
    };
    loadAuditHistory();
    return () => {
      isMounted = false;
    };
  }, [franchiseData, configStoreId]);

  useEffect(() => {
    if (!franchiseData || !franchiseData.stores.length) {
      setStoreComparisonSeries([]);
      setComparisonError('');
      return;
    }
    let isMounted = true;
    const storesToCompare = franchiseData.stores;
    const loadComparison = async () => {
      setComparisonLoading(true);
      setComparisonError('');
      try {
        const results = await Promise.all(
          storesToCompare.map(async store => {
            const response = await fetch(`/api/franchise/stores/${store.store_id}/daily-stats`);
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error(data?.error || 'Unable to load daily stats.');
            }
            const stats = Array.isArray(data.stats) ? data.stats : [];
            return {
              store_id: store.store_id,
              label: store.store_name || store.brand_name || `Store ${store.store_id}`,
              points: stats.map(point => ({
                date: point.date,
                revenue: Number(point.revenue ?? 0)
              })),
              stats
            };
          })
        );
        if (isMounted) {
          setStoreStatsMap(prev => {
            const next = { ...prev };
            results.forEach(result => {
              next[result.store_id] = result.stats;
            });
            return next;
          });
          setStoreComparisonSeries(results.map(({ stats, ...series }) => series));
        }
      } catch (error) {
        if (isMounted) {
          setComparisonError(
            error instanceof Error ? error.message : 'Unable to load comparison analytics.'
          );
          setStoreComparisonSeries([]);
        }
      } finally {
        if (isMounted) {
          setComparisonLoading(false);
        }
      }
    };
    loadComparison();
    return () => {
      isMounted = false;
    };
  }, [franchiseData]);

  useEffect(() => {
    if (!franchiseData || !franchiseData.stores.length) {
      setEbillAnonymousSeriesMap({});
      setEbillAnonymousError('');
      setEbillAnonymousLoading(false);
      return;
    }

    const storeIds = franchiseData.stores.map(store => store.store_id);
    const missingStats = storeIds.some(storeId => !Array.isArray(storeStatsMap[storeId]));
    if (missingStats) {
      setEbillAnonymousLoading(true);
      return;
    }

    setEbillAnonymousLoading(false);
    setEbillAnonymousError('');

    const normalizeSeries = (series: CapturePoint[]) => {
      if (!series.length) {
        return [];
      }
      const byDate = new Map<string, { ebill: number; anonymous: number }>();
      series.forEach(point => {
        const entry = byDate.get(point.date) || { ebill: 0, anonymous: 0 };
        entry.ebill += point.ebill;
        entry.anonymous += point.anonymous;
        byDate.set(point.date, entry);
      });
      return Array.from(byDate.entries())
        .map(([date, values]) => ({
          date,
          ebill: values.ebill,
          anonymous: values.anonymous
        }))
        .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
    };

    const perStore: Record<string, CapturePoint[]> = {};
    const aggregateByDate = new Map<string, { ebill: number; anonymous: number }>();

    storeIds.forEach(storeId => {
      const stats = storeStatsMap[storeId] ?? [];
      const series = stats.map(point => ({
        date: point.date,
        ebill: Number(point.customers ?? point.ebill_customers ?? 0) || 0,
        anonymous: Number(point.anonymous_customers ?? 0) || 0
      }));
      const normalized = normalizeSeries(series);
      perStore[storeId] = normalized;
      normalized.forEach(point => {
        const entry = aggregateByDate.get(point.date) || { ebill: 0, anonymous: 0 };
        entry.ebill += point.ebill;
        entry.anonymous += point.anonymous;
        aggregateByDate.set(point.date, entry);
      });
    });

    perStore.all = Array.from(aggregateByDate.entries())
      .map(([date, values]) => ({
        date,
        ebill: values.ebill,
        anonymous: values.anonymous
      }))
      .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

    setEbillAnonymousSeriesMap(perStore);
  }, [franchiseData, storeStatsMap]);

  const totals = useMemo(() => {
    const emptyTotals = {
      revenue: 0,
      invoices: 0,
      customers: 0,
      ebillInvoices: 0,
      ebillCustomers: 0,
      anonymous: 0,
      campaigns: 0,
      messages: 0
    };
    if (!franchiseData || !filteredStores.length) {
      return emptyTotals;
    }

    const aggregated = filteredStores.reduce((acc, store) => {
      const revenue = Number(store.total_revenue ?? 0);
      const invoices = Number(store.total_invoices ?? 0);
      const anonymous = Number(store.total_anonymous_customers ?? 0);
      const ebillCustomers = Number(store.total_ebill_customers ?? 0);
      const totalCustomers = Number(
        store.total_customers ?? ebillCustomers + anonymous
      );
      const campaigns = Number(store.total_campaigns ?? 0);
      const messages = Number(store.total_campaign_messages ?? 0);
      return {
        revenue: Number.isFinite(revenue) ? acc.revenue + revenue : acc.revenue,
        invoices: Number.isFinite(invoices) ? acc.invoices + invoices : acc.invoices,
        customers: Number.isFinite(totalCustomers) ? acc.customers + totalCustomers : acc.customers,
        ebillInvoices: Number.isFinite(invoices)
          ? acc.ebillInvoices + Math.max(invoices - anonymous, 0)
          : acc.ebillInvoices,
        ebillCustomers: Number.isFinite(ebillCustomers)
          ? acc.ebillCustomers + ebillCustomers
          : acc.ebillCustomers,
        anonymous: Number.isFinite(anonymous) ? acc.anonymous + anonymous : acc.anonymous,
        campaigns: Number.isFinite(campaigns) ? acc.campaigns + campaigns : acc.campaigns,
        messages: Number.isFinite(messages) ? acc.messages + messages : acc.messages
      };
    }, emptyTotals);

    const metrics = storeFilter === 'all' ? franchiseData.metrics : null;
    const withMetrics = (value: unknown, fallback: number) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const fallbackTotals = metrics
      ? {
          ...aggregated,
          revenue: withMetrics(metrics.totalRevenue, aggregated.revenue),
          invoices: withMetrics(metrics.totalInvoices, aggregated.invoices),
          customers: withMetrics(metrics.totalCustomers, aggregated.customers),
          ebillCustomers: withMetrics(metrics.totalEbillCustomers, aggregated.ebillCustomers),
          anonymous: withMetrics(metrics.totalAnonymousCustomers, aggregated.anonymous),
          campaigns: withMetrics(metrics.totalCampaigns, aggregated.campaigns),
          messages: withMetrics(metrics.totalMessages, aggregated.messages)
        }
      : aggregated;

    const statsCovered = filteredStores.every(store => Array.isArray(storeStatsMap[store.store_id]));
    if (!statsCovered) {
      return fallbackTotals;
    }

    const statsTotals = filteredStores.reduce(
      (acc, store) => {
        const stats = storeStatsMap[store.store_id] ?? [];
        stats.forEach(point => {
          const parsedTime = dayjs(point.date).valueOf();
          if (Number.isNaN(parsedTime)) {
            return;
          }
          if (
            parsedTime < overviewDateRange.startMs ||
            parsedTime > overviewDateRange.endMs
          ) {
            return;
          }
          const revenue = Number(point.revenue ?? 0);
          const invoices = Number(point.invoices ?? 0);
          const anonymous = Number(point.anonymous_customers ?? 0);
          const ebillInvoices = Number(point.ebill_invoices ?? point.ebill_customers ?? 0);
          if (Number.isFinite(revenue)) {
            acc.revenue += revenue;
          }
          if (Number.isFinite(invoices)) {
            acc.invoices += invoices;
          }
          if (Number.isFinite(anonymous)) {
            acc.anonymous += anonymous;
          }
          if (Number.isFinite(ebillInvoices)) {
            acc.ebillInvoices += ebillInvoices;
          }
          const keys = Array.isArray(point.customer_keys) ? point.customer_keys : [];
          keys.forEach(key => {
            acc.customerKeys.add(key);
          });
        });
        return acc;
      },
      {
        revenue: 0,
        invoices: 0,
        ebillInvoices: 0,
        anonymous: 0,
        customerKeys: new Set(),
        campaigns: fallbackTotals.campaigns,
        messages: fallbackTotals.messages
      }
    );

    return {
      revenue: statsTotals.revenue,
      invoices: statsTotals.invoices,
      customers: statsTotals.customerKeys.size + statsTotals.anonymous,
      ebillInvoices: statsTotals.ebillInvoices,
      ebillCustomers: statsTotals.customerKeys.size,
      anonymous: statsTotals.anonymous,
      campaigns: statsTotals.campaigns,
      messages: statsTotals.messages
    };
  }, [
    franchiseData,
    filteredStores,
    storeFilter,
    storeStatsMap,
    overviewDateRange.startMs,
    overviewDateRange.endMs
  ]);

  const campaignQuota = useMemo(() => {
    if (!franchiseData) {
      return null;
    }
    const limit = Number(franchiseData.campaign_free_messages);
    const used = Number(franchiseData.metrics?.totalMessages ?? 0);
    const hasLimit = Number.isFinite(limit) && limit > 0;
    const remainingFromApi = Number(franchiseData.campaign_remaining_messages);
    const remaining = Number.isFinite(remainingFromApi)
      ? remainingFromApi
      : hasLimit
      ? Math.max(limit - (Number.isFinite(used) ? used : 0), 0)
      : null;

    return {
      limit: hasLimit ? limit : null,
      remaining: hasLimit ? remaining : null,
      used: Number.isFinite(used) ? used : 0
    };
  }, [franchiseData]);

  const storeRangeMetrics = useMemo(() => {
    if (!franchiseData) {
      return {};
    }
    return franchiseData.stores.reduce(
      (acc, store) => {
        const stats = storeStatsMap[store.store_id];
        if (!Array.isArray(stats) || !stats.length) {
          return acc;
        }
        const inRange = stats.filter(point => {
          const pointMs = dayjs(point.date).valueOf();
          if (Number.isNaN(pointMs)) {
            return false;
          }
          return pointMs >= overviewDateRange.startMs && pointMs <= overviewDateRange.endMs;
        });
        const customerKeys = new Set<string>();
        let revenue = 0;
        let invoices = 0;
        let anonymous = 0;
        let ebillInvoices = 0;
        inRange.forEach(point => {
          const pointRevenue = Number(point.revenue ?? 0);
          const pointInvoices = Number(point.invoices ?? 0);
          const pointAnonymous = Number(point.anonymous_customers ?? 0);
          const pointEbillInvoices = Number(point.ebill_invoices ?? point.ebill_customers ?? 0);
          if (Number.isFinite(pointRevenue)) {
            revenue += pointRevenue;
          }
          if (Number.isFinite(pointInvoices)) {
            invoices += pointInvoices;
          }
          if (Number.isFinite(pointAnonymous)) {
            anonymous += pointAnonymous;
          }
          if (Number.isFinite(pointEbillInvoices)) {
            ebillInvoices += pointEbillInvoices;
          }
          const keys = Array.isArray(point.customer_keys) ? point.customer_keys : [];
          keys.forEach(key => customerKeys.add(String(key)));
        });
        acc[store.store_id] = {
          revenue,
          invoices,
          ebillInvoices,
          ebillCustomers: customerKeys.size,
          anonymousCustomers: anonymous,
          totalCustomers: customerKeys.size + anonymous
        };
        return acc;
      },
      {} as Record<
        string,
        {
          revenue: number;
          invoices: number;
          ebillInvoices: number;
          ebillCustomers: number;
          anonymousCustomers: number;
          totalCustomers: number;
        }
      >
    );
  }, [franchiseData, storeStatsMap, overviewDateRange.startMs, overviewDateRange.endMs]);

  const selectedCaptureSeries = useMemo(() => {
    if (storeFilter === 'all') {
      return ebillAnonymousSeriesMap.all ?? [];
    }
    return ebillAnonymousSeriesMap[storeFilter] ?? [];
  }, [ebillAnonymousSeriesMap, storeFilter]);

  const recentCaptureSeries = useMemo(() => {
    if (!selectedCaptureSeries.length) {
      return [];
    }
    return selectedCaptureSeries.length > 14
      ? selectedCaptureSeries.slice(selectedCaptureSeries.length - 14)
      : selectedCaptureSeries;
  }, [selectedCaptureSeries]);


  const deriveEbillReason = (ebill: number, anonymous: number) => {
    if (ebill === 0) {
      return 'Team is skipping phone collection entirely — re-train staff on capturing numbers.';
    }
    const gap = anonymous - ebill;
    if (gap > ebill * 0.5) {
      return 'Likely rush-hour billing: when queues spike, staff skip collecting numbers.';
    }
    if (gap > 25) {
      return 'Remind customers of the benefits of digital bills to improve opt-in rates.';
    }
    return 'Review POS prompts — subtle UI tweaks can encourage E-bill adoption.';
  };

  const comparisonSeriesForChart = useMemo(() => {
    if (!storeComparisonSeries.length) {
      return [];
    }
    if (storeFilter === 'all') {
      return storeComparisonSeries;
    }
    return storeComparisonSeries.filter(series => series.store_id === storeFilter);
  }, [storeComparisonSeries, storeFilter]);

  const comparisonChartData = useMemo(() => {
    if (!comparisonSeriesForChart.length) {
      return null;
    }
    const dateKeys = Array.from(
      new Set(comparisonSeriesForChart.flatMap(series => series.points.map(point => point.date)))
    ).sort();
    if (!dateKeys.length) {
      return null;
    }
    const labels = dateKeys.map(date => dayjs(date).format('DD MMM'));
    return {
      labels,
      datasets: comparisonSeriesForChart.map((series, index) => ({
        label: series.label,
        data: dateKeys.map(date => {
          const match = series.points.find(point => point.date === date);
          return Number(match?.revenue ?? 0);
        }),
        borderColor: comparisonColors[index % comparisonColors.length],
        backgroundColor: comparisonColors[index % comparisonColors.length],
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 2,
        fill: false
      }))
    };
  }, [comparisonSeriesForChart]);

  const comparisonChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: 'rgba(248,250,252,0.8)',
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            padding: 12,
            font: { size: 10 }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(248,250,252,0.6)' },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        y: {
          ticks: { color: 'rgba(248,250,252,0.6)', callback: (value: number | string) => `₹${value}` },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }),
    []
  );

  const ebillAnonymousChart = useMemo(() => {
    if (!recentCaptureSeries.length) {
      return null;
    }
    const labels = recentCaptureSeries.map(entry => dayjs(entry.date).format('DD MMM'));
    const ebillData = recentCaptureSeries.map(entry => entry.ebill);
    const anonymousData = recentCaptureSeries.map(entry => entry.anonymous);
    return {
      labels,
      datasets: [
        {
          label: 'E-bill customers',
          data: ebillData,
          backgroundColor: 'rgba(52,211,153,0.8)',
          borderRadius: 6,
          maxBarThickness: 32
        },
        {
          label: 'Anonymous bills',
          data: anonymousData,
          backgroundColor: 'rgba(248,113,113,0.8)',
          borderRadius: 6,
          maxBarThickness: 32
        }
      ]
    };
  }, [recentCaptureSeries]);

  const ebillMaxValue = useMemo(() => {
  let max = 0;
  recentCaptureSeries.forEach(entry => {
    const ebill = Number(entry?.ebillCount || entry?.eBillCount || entry?.ebill || 0);
    const anon = Number(entry?.anonymousCount || entry?.anonymous || 0);
    max = Math.max(max, ebill, anon);
  });
  return max;
}, [recentCaptureSeries]);

const ebillAnonymousOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: 'rgba(248,250,252,0.8)',
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: context => {
              const value = Number(context.parsed.y ?? context.parsed) || 0;
              return `${context.dataset.label}: ${value.toLocaleString()}`;
            }
          }
        }
      },
      interaction: {
        mode: 'index' as const,
        intersect: false
      },
      scales: {
        x: {
          ticks: { color: 'rgba(248,250,252,0.6)' },
          grid: { color: 'rgba(255,255,255,0.04)' },
          stacked: false,
          title: {
            display: true,
            text: 'Date',
            color: 'rgba(248,250,252,0.7)',
            font: { size: 12 }
          }
        },
        y: {
          beginAtZero: true,
          suggestedMax: ebillMaxValue > 0 ? ebillMaxValue + 3 : undefined,
          ticks: { color: 'rgba(248,250,252,0.6)' },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }),
    []
  );


  const attentionAlerts = useMemo(() => {
    if (!franchiseData || !filteredStores.length) {
      return [];
    }
    return filteredStores
      .map(store => {
        const ebill = Number(store.total_ebill_customers ?? store.total_customers ?? 0) || 0;
        const anonymous = Number(store.total_anonymous_customers ?? 0) || 0;
        return {
          storeId: store.store_id,
          label: store.store_name || store.brand_name || `Store ${store.store_id}`,
          ebill,
          anonymous,
          reason: deriveEbillReason(ebill, anonymous)
        };
      })
      .filter(entry => entry.anonymous > entry.ebill);
  }, [franchiseData, filteredStores]);

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    navigate('/franchise');
  };

  const handleStoreAccessChange = async (storeId: string, nextAllowed: boolean) => {
    if (!franchiseData) return;
    setAccessError('');
    setAccessLoading(storeId);
    try {
      const response = await fetch(`/api/franchise/stores/${storeId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ franchise_id: franchiseData.franchise_id, allowed: nextAllowed })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to update access.');
      }
      setStoreAccessMap(prev => ({ ...prev, [storeId]: nextAllowed }));
      setFranchiseData(prev =>
        prev
          ? {
              ...prev,
              stores: prev.stores.map(store =>
                store.store_id === storeId ? { ...store, franchise_access: nextAllowed } : store
              )
            }
          : prev
      );
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : 'Unable to update access.');
    } finally {
      setAccessLoading(null);
    }
  };

  const openStoreAnalytics = (storeId: string) => {
    const analyticsPath = `/analytics?storeId=${encodeURIComponent(storeId)}`;
    window.open(analyticsPath, '_blank', 'noopener');
  };

  const openLegacyStoreLogin = (storeId: string) => {
    const managerPath = `/analytics?storeId=${encodeURIComponent(storeId)}`;
    const targetUrl = `/login?redirect=${encodeURIComponent(managerPath)}`;
    window.open(targetUrl, '_blank', 'noopener');
  };

  const handleOpenStoreManager = async (store: FranchiseStoreSummary) => {
    if (!franchiseData?.session_token) {
      setStoreSsoError('Franchise session expired. Please log in again.');
      openLegacyStoreLogin(store.store_id);
      return;
    }
    setStoreSsoBusyId(store.store_id);
    setStoreSsoError('');
    let fallbackToLegacy = false;
    try {
      const response = await fetch(`/api/franchise/stores/${store.store_id}/sso-token`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${franchiseData.session_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      const data: Partial<StoreSsoResponse> & { error?: string } = await response
        .json()
        .catch(() => ({}));
      if (!response.ok) {
        fallbackToLegacy = response.status === 404;
        throw new Error(data?.error || 'Unable to open store manager workspace.');
      }
      if (!data?.token || !data.store_id) {
        throw new Error('Store session payload is incomplete.');
      }
      bootstrapStoreSession(data as StoreSsoResponse);
      openStoreAnalytics(data.store_id);
    } catch (error) {
      setStoreSsoError(
        error instanceof Error ? error.message : 'Unable to open store manager workspace.'
      );
      if (fallbackToLegacy) {
        openLegacyStoreLogin(store.store_id);
      }
    } finally {
      setStoreSsoBusyId(null);
    }
  };

  const handleCustomerTypeFieldChange = (field: keyof CustomerTypeFormState, value: string) => {
    const numeric = Number(value);
    setCustomerTypeForm(prev => ({
      ...prev,
      [field]: Number.isFinite(numeric) ? numeric : prev[field]
    }));
  };

  const handleCustomerTypeSubmit = async () => {
    if (!franchiseData || !configStoreId) {
      return;
    }
    setCustomerConfigError('');
    setCustomerConfigStatus('');
    setCustomerConfigLoading(true);
    try {
      const payload = {
        franchise_id: franchiseData.franchise_id,
        config: {
          premium: { min: customerTypeForm.premiumMin },
          standard: { min: customerTypeForm.standardMin, max: customerTypeForm.standardMax },
          basic: { max: customerTypeForm.basicMax }
        }
      };
      const response = await fetch(`/api/franchise/stores/${configStoreId}/customer-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to update configuration.');
      }
      setCustomerConfigStatus(
        'Customer type configuration saved successfully. Logout and login the stores to see new spending tiers.'
      );
    } catch (error) {
      setCustomerConfigError(
        error instanceof Error ? error.message : 'Unable to update configuration.'
      );
    } finally {
      setCustomerConfigLoading(false);
    }
  };

  const loadDailyStats = async (storeId: string) => {
    if (!storeId) return;
    setStatsError('');
    setLoadingStats(true);
    try {
      const response = await fetch(`/api/franchise/stores/${storeId}/daily-stats`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to fetch store stats');
      }
      setStoreStatsMap(prev => ({ ...prev, [storeId]: Array.isArray(data.stats) ? data.stats : [] }));
      setActiveStoreId(storeId);
    } catch (error) {
      setStatsError(error instanceof Error ? error.message : 'Unable to fetch store stats');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleClearAuditHistory = async () => {
    if (!franchiseData || !configStoreId) {
      return;
    }
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'This will permanently delete the audit history for the selected store. Continue?'
      );
      if (!confirmed) {
        return;
      }
    }
    setAuditError('');
    setAuditStatus('');
    setLogoutAllStatus('');
    setLogoutAllError('');
    setAuditClearing(true);
    try {
      const response = await fetch(`/api/franchise/stores/${configStoreId}/audit-history`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ franchise_id: franchiseData.franchise_id })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to clear audit history.');
      }
      setAuditHistory([]);
      setAuditStatus('Audit history cleared successfully.');
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : 'Unable to clear audit history.');
    } finally {
      setAuditClearing(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!franchiseData || !configStoreId) {
      return;
    }
    setLogoutAllError('');
    setLogoutAllStatus('');
    setLogoutAllLoading(true);
    try {
      const response = await fetch(`/api/franchise/stores/${configStoreId}/logout-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ franchise_id: franchiseData.franchise_id })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to logout sessions.');
      }
      setLogoutAllStatus('All devices have been logged out for this store.');
    } catch (error) {
      setLogoutAllError(error instanceof Error ? error.message : 'Unable to logout sessions.');
    } finally {
      setLogoutAllLoading(false);
    }
  };

  const renderPlaceholderTab = (title: string, description: string) => (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center text-white/70">
      <div className="space-y-4 max-w-lg">
        <p className="text-2xl font-semibold text-white">{title}</p>
        <p>{description}</p>
      </div>
    </div>
  );

  const renderStoreCardsGrid = (options: {
    primaryActionLabel: string;
    onPrimaryAction?: (store: FranchiseStoreSummary) => void;
    onSelectStore?: (store: FranchiseStoreSummary) => void;
    highlightStoreId?: string | null;
    busyStoreId?: string | null;
  }) => {
    if (!franchiseData) {
      return null;
    }
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {franchiseData.stores.map(store => {
          const rangeMetrics = storeRangeMetrics[store.store_id];
          const revenue = Math.round(
            rangeMetrics?.revenue ?? Number(store.total_revenue ?? 0)
          );
          const invoices = Math.round(
            rangeMetrics?.invoices ?? Number(store.total_invoices ?? 0)
          );
          const ebillCustomers = Math.max(
            0,
            Number(
              rangeMetrics?.ebillCustomers ??
                store.total_ebill_customers ??
                store.total_customers ??
                0
            )
          );
          const anonymousCustomers = Math.max(
            0,
            Number(rangeMetrics?.anonymousCustomers ?? store.total_anonymous_customers ?? 0)
          );
          const totalCustomers = Math.max(
            0,
            Number(rangeMetrics?.totalCustomers ?? ebillCustomers + anonymousCustomers)
          );
          const isActive = options.highlightStoreId === store.store_id;
          const allowed = storeAccessMap[store.store_id] ?? true;
          const trialInfo = getTrialInfo(
            franchiseData.trial_start_date ?? franchiseData.trial_start,
            franchiseData.trial_end_date ?? franchiseData.trial_end
          );
          const handleSelect = () => options.onSelectStore?.(store);

          return (
            <div
              key={store.store_id}
              className={`relative rounded-2xl border ${
                isActive ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/10 bg-white/5'
              } p-5 shadow-lg transition hover:border-indigo-400 hover:bg-indigo-500/10 cursor-pointer`}
              onClick={handleSelect}
            >
              <div
                className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  isActive ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/80'
                }`}
              >
                #{store.store_id}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {store.store_name || store.brand_name || `Store ${store.store_id}`}
                  </h3>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    allowed ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {allowed ? 'Access enabled' : 'Access disabled'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Revenue</span>
                    <DollarSign className="h-4 w-4 text-emerald-300" />
                  </div>
                  <p className="mt-1 text-lg font-semibold text-white">₹{revenue.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Invoices</span>
                    <ShoppingCart className="h-4 w-4 text-cyan-300" />
                  </div>
                  <p className="mt-1 text-lg font-semibold text-white">{invoices.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>E-bill</span>
                    <Users className="h-4 w-4 text-amber-300" />
                  </div>
                  <p className="mt-1 text-lg font-semibold text-white">{ebillCustomers.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Anonymous</span>
                    <EyeOff className="h-4 w-4 text-rose-300" />
                  </div>
                  <p className="mt-1 text-lg font-semibold text-white">{anonymousCustomers.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Customers</span>
                    <Users className="h-4 w-4 text-sky-300" />
                  </div>
                  <p className="mt-1 text-lg font-semibold text-white">{totalCustomers.toLocaleString()}</p>
                </div>
              </div>

              {trialInfo && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    Free trial
                  </p>
                  <div className="mt-1 flex items-center justify-between text-sm font-semibold text-white">
                    <span>{String(trialInfo.daysLeft).padStart(2, '0')} days left</span>
                    <span className="text-white/70">Ends {trialInfo.endLabel}</span>
                  </div>
                </div>
              )}

              {options.onPrimaryAction && (
                <Button
                  onClick={event => {
                    event.stopPropagation();
                    options.onPrimaryAction?.(store);
                  }}
                  className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white"
                  disabled={options.busyStoreId === store.store_id}
                >
                  {options.busyStoreId === store.store_id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Please wait…
                    </span>
                  ) : (
                    options.primaryActionLabel
                  )}
                </Button>
              )}
              </div>
            );
          })}
      </div>
    );
  };

  const renderOverview = () => {
    if (!franchiseData) {
      return renderPlaceholderTab('Session expired', 'Please log in again to view your franchise stores.');
    }
    const visibleStoreCount = storeFilter === 'all' ? franchiseData.store_count : filteredStores.length;
    return (
      <main className="flex-1 w-full px-4 py-12">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-end">{renderWalletBalancePill()}</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
              <p className="text-sm uppercase tracking-[0.4em] text-indigo-300">Franchise Overview</p>
              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold">
                    {franchiseData.stores.find(store => store.brand_name)?.brand_name ||
                      franchiseData.franchise_id}
                  </h1>
                  <p className="text-white/70 text-sm mt-1 whitespace-nowrap">
                    Managing {franchiseData.store_count} {franchiseData.store_count === 1 ? 'store' : 'stores'}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-end">
                  <div className="w-full sm:w-56">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-1">Store filter</p>
                    <div className="relative">
                      <select
                        value={storeFilter}
                        onChange={event => setStoreFilter(event.target.value)}
                        className="w-full appearance-none rounded-xl border border-white/20 bg-black/30 px-4 py-2 pr-10 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                      >
                        <option value="all">All stores</option>
                        {franchiseData.stores.map(store => (
                          <option key={store.store_id} value={store.store_id}>
                            {store.store_name || store.brand_name || `Store ${store.store_id}`}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="w-full sm:w-56">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-1">Date range</p>
                    <div className="relative">
                      <select
                        value={overviewDateFilter}
                        onChange={event =>
                          handleOverviewDateFilterChange(event.target.value as DateRangeFilter)
                        }
                        className="w-full appearance-none rounded-xl border border-white/20 bg-black/30 px-4 py-2 pr-10 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                      >
                        <option value="today">Today</option>
                        <option value="thisWeek">This Week</option>
                        <option value="thisMonth">This Month</option>
                        <option value="thisYear">This Year</option>
                        <option value="all">All Time</option>
                        <option value="custom">Custom</option>
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {overviewDateFilter === 'custom' && (
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        <div className="relative">
                          <input
                            ref={overviewCustomStartRef}
                            type="date"
                            value={overviewCustomStart}
                            onChange={event => handleOverviewCustomChange('start', event.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/20 bg-black/30 px-3 py-2 pr-10 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 hover:text-white"
                            onClick={() => {
                              if (overviewCustomStartRef.current?.showPicker) {
                                overviewCustomStartRef.current.showPicker();
                              } else {
                                overviewCustomStartRef.current?.focus();
                              }
                            }}
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            ref={overviewCustomEndRef}
                            type="date"
                            value={overviewCustomEnd}
                            onChange={event => handleOverviewCustomChange('end', event.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/20 bg-black/30 px-3 py-2 pr-10 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 hover:text-white"
                            onClick={() => {
                              if (overviewCustomEndRef.current?.showPicker) {
                                overviewCustomEndRef.current.showPicker();
                              } else {
                                overviewCustomEndRef.current?.focus();
                              }
                            }}
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end text-xs text-white/60">Data for {overviewDateRange.label}</div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/60">Stores under this franchise</p>
                <p className="text-3xl font-semibold mt-2">{visibleStoreCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/60">Total reported revenue</p>
                <p className="text-3xl font-semibold mt-2">₹{Math.round(totals.revenue).toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/60">Total invoices</p>
                <p className="text-3xl font-semibold mt-2">{totals.invoices.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/60">E-bill invoices</p>
                <p className="text-3xl font-semibold mt-2">{totals.ebillInvoices.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/60">Total customers</p>
                <p className="text-3xl font-semibold mt-2">{totals.customers.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/60">E-bill customers</p>
                <p className="text-3xl font-semibold mt-2">{totals.ebillCustomers.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/60">Anonymous customers</p>
                <p className="text-3xl font-semibold mt-2">{totals.anonymous.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/60">Campaigns launched</p>
                <p className="text-3xl font-semibold mt-2">{totals.campaigns.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-white/60">Messages sent</p>
                <p className="text-3xl font-semibold mt-2">{totals.messages.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-col gap-1">
                  <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Sales velocity</p>
                  <h3 className="text-2xl font-semibold text-white">Revenue trend by store</h3>
                  <p className="text-sm text-white/60">
                    Compares the latest invoice revenue captured for your busiest stores.
                  </p>
                </div>
                <div className="mt-4 h-64">
                  {comparisonLoading ? (
                    <div className="flex h-full items-center justify-center text-white/70">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading chart…
                    </div>
                  ) : comparisonError ? (
                    <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                      {comparisonError}
                    </div>
                  ) : comparisonChartData ? (
                    <Line data={comparisonChartData} options={comparisonChartOptions} />
                  ) : (
                    <p className="text-sm text-white/60">
                      We need a few days of data before rendering this comparison.
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-col gap-1">
                  <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">E-bill vs anonymous</p>
                  <h3 className="text-2xl font-semibold text-white">Customer capture health</h3>
                  <p className="text-sm text-white/60">
                    Highlights whether teams are capturing phone numbers or letting receipts go anonymous.
                  </p>
                </div>
                <div className="mt-4 h-64">
                  {ebillAnonymousLoading ? (
                    <div className="flex h-full items-center justify-center text-white/70">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading trend…
                    </div>
                  ) : ebillAnonymousError ? (
                    <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                      {ebillAnonymousError}
                    </div>
                  ) : ebillAnonymousChart ? (
                    <Bar
                      data={ebillAnonymousChart}
                      options={ebillAnonymousOptions}
                      plugins={[ebillAnonymousValueLabelPlugin]}
                    />
                  ) : (
                    <p className="text-sm text-white/60">
                      Link at least one store to view this breakdown.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {attentionAlerts.length > 0 && (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-6 text-white">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-amber-200">Attention alerts</p>
                    <h3 className="text-2xl font-semibold">
                      {attentionAlerts.length} store{attentionAlerts.length > 1 ? 's' : ''} need help
                    </h3>
                    <p className="text-sm text-white/80">
                      Anonymous invoices overtook E-bills — investigate the reasons below.
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-300/50 px-3 py-1 text-xs font-semibold text-amber-100">
                    E-bill adoption gap
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {attentionAlerts.map(alert => (
                    <div
                      key={alert.storeId}
                      className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">{alert.label}</p>
                          <p className="text-xs text-white/60">
                            E-bills {alert.ebill.toLocaleString()} vs Anonymous{' '}
                            {alert.anonymous.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-amber-200 text-xs">
                          <AlertTriangle className="h-4 w-4" />
                          Gap of {(alert.anonymous - alert.ebill).toLocaleString()}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-white/70">{alert.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
      </main>
    );
  };

  const renderAdminPanel = () => {
    if (!franchiseData) {
      return renderPlaceholderTab('Session expired', 'Please log in again to manage stores.');
    }

    return (
      <main className="flex-1 w-full px-4 py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-end">{renderWalletBalancePill()}</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold mb-1">Store administration</h2>
              <p className="text-sm text-white/70">
                Toggle store visibility and fine-tune customer segmentation thresholds per store.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Campaign quota</p>
                  <h3 className="text-2xl font-semibold text-white">Free trial campaign quota</h3>
                  <p className="text-sm text-white/70">
                    Free trial campaign limits are shared across every store under this franchise.
                  </p>
                </div>
                <div className="grid w-full max-w-md grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Allowed</p>
                    <p className="text-2xl font-semibold text-white mt-1">
                      {formatCount(campaignQuota?.limit ?? null)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Remaining</p>
                    <p className="text-2xl font-semibold text-white mt-1">
                      {formatCount(campaignQuota?.remaining ?? null)}
                    </p>
                    <p className="text-[11px] text-white/50 mt-1">
                      Used {formatCount(campaignQuota?.used ?? null)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Customer type</p>
                  <h3 className="text-2xl font-semibold text-white">Configure spending tiers</h3>
                  <p className="text-sm text-white/70">
                    Set the thresholds for Premium, Standard, and Basic customers for a specific store.
                  </p>
                </div>
                <div className="w-full max-w-xs">
                  <label className="text-xs uppercase tracking-wide text-white/60">Choose store</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                    value={configStoreId ?? ''}
                    onChange={event => {
                      setCustomerConfigStatus('');
                      setCustomerConfigError('');
                      setConfigStoreId(event.target.value || null);
                    }}
                  >
                    {franchiseData.stores.map(store => (
                      <option
                        key={store.store_id}
                        value={store.store_id}
                        className="bg-slate-900 text-white"
                      >
                        #{store.store_id} · {store.store_name || store.brand_name || 'Store'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/60">Premium minimum (₹)</label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-white focus:border-indigo-400 focus:outline-none"
                    value={customerTypeForm.premiumMin}
                    onChange={event => handleCustomerTypeFieldChange('premiumMin', event.target.value)}
                    disabled={customerConfigLoading || !configStoreId}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/60">Standard minimum (₹)</label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-white focus:border-indigo-400 focus:outline-none"
                    value={customerTypeForm.standardMin}
                    onChange={event => handleCustomerTypeFieldChange('standardMin', event.target.value)}
                    disabled={customerConfigLoading || !configStoreId}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/60">Standard maximum (₹)</label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-white focus:border-indigo-400 focus:outline-none"
                    value={customerTypeForm.standardMax}
                    onChange={event => handleCustomerTypeFieldChange('standardMax', event.target.value)}
                    disabled={customerConfigLoading || !configStoreId}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/60">Basic maximum (₹)</label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-white focus:border-indigo-400 focus:outline-none"
                    value={customerTypeForm.basicMax}
                    onChange={event => handleCustomerTypeFieldChange('basicMax', event.target.value)}
                    disabled={customerConfigLoading || !configStoreId}
                  />
                </div>
              </div>

              {customerConfigError && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {customerConfigError}
                </div>
              )}
              {customerConfigStatus && !customerConfigError && (
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  {customerConfigStatus}
                </div>
              )}

              <Button
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
                onClick={handleCustomerTypeSubmit}
                disabled={customerConfigLoading || !configStoreId}
              >
                {customerConfigLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </span>
                ) : (
                  'Save customer type configuration'
                )}
              </Button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Store audit</p>
                  <h3 className="text-2xl font-semibold text-white">Recent login history</h3>
                  <p className="text-sm text-white/70">
                    Only franchise owners can inspect or clear a store’s audit footprint from here.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant="ghost"
                    className="border border-white/20 text-white hover:bg-white/10"
                    onClick={handleLogoutAllDevices}
                    disabled={logoutAllLoading || auditLoading}
                  >
                    {logoutAllLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Logging out…
                      </span>
                    ) : (
                      'Logout from all devices'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="border border-white/20 text-white hover:bg-white/10"
                    onClick={handleClearAuditHistory}
                    disabled={auditClearing || auditHistory.length === 0 || auditLoading}
                  >
                    {auditClearing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Clearing…
                      </span>
                    ) : (
                      'Delete audit history'
                    )}
                  </Button>
                </div>
              </div>

              {auditError && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {auditError}
                </div>
              )}
              {auditStatus && !auditError && (
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  {auditStatus}
                </div>
              )}

              {auditLoading ? (
                <div className="flex items-center justify-center py-6 text-white/70">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading audit entries…
                </div>
              ) : auditHistory.length === 0 ? (
                <p className="text-sm text-white/60">
                  No audit entries recorded yet for store #{configStoreId}. Entries will appear here as
                  users authenticate.
                </p>
              ) : (
                <div className="space-y-3">
                  {auditHistory.slice(0, 10).map((entry, index) => (
                    <div
                      key={`${entry.time ?? 'unknown'}-${index}`}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {entry.time ? dayjs(entry.time).format('DD MMM YYYY, hh:mm A') : 'Unknown time'}
                          </p>
                          <p className="text-xs text-white/60">
                            {entry.system || 'Unknown system'}
                          </p>
                        </div>
                        <div className="text-xs uppercase tracking-wide text-white/70">
                          {entry.location || 'Unknown location'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {logoutAllError && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {logoutAllError}
                </div>
              )}
              {logoutAllStatus && !logoutAllError && (
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  {logoutAllStatus}
                </div>
              )}
            </div>

            {accessError && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {accessError}
              </div>
            )}
          </div>
      </main>
    );
  };

  const renderStoreConfigurationPanel = () => {
    if (!selectedStoreConfig) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70 text-sm">
          Select a store card to load configuration details.
        </div>
      );
    }
    const allowed = storeAccessMap[selectedStoreConfig.store_id] ?? true;
    const revenue = Number(selectedStoreConfig.total_revenue ?? 0);
    const invoices = Number(selectedStoreConfig.total_invoices ?? 0);
    const totalCustomers = Number(selectedStoreConfig.total_customers ?? 0);
    const storeAgeLabel = selectedStoreConfig.created_at
      ? dayjs(selectedStoreConfig.created_at).format('DD MMM YYYY')
      : 'Not recorded';

    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Configuration</p>
            <h3 className="text-2xl font-semibold text-white">
              {selectedStoreConfig.store_name || selectedStoreConfig.brand_name || 'Store'}
            </h3>
            <p className="text-sm text-white/70">
              #{selectedStoreConfig.store_id} · {selectedStoreConfig.business_type || 'General business'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              className="text-white/80 hover:text-white"
              onClick={() => setSelectedStoreConfig(null)}
            >
              Close panel
            </Button>
            <Button
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
              onClick={() => {
                setActiveStoreId(selectedStoreConfig.store_id);
                setActiveTab('overview');
              }}
            >
              Open in overview
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60">Lifetime revenue</p>
            <p className="text-2xl font-semibold text-white mt-1">₹{revenue.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60">Invoices</p>
            <p className="text-2xl font-semibold text-white mt-1">{invoices.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60">Customers</p>
            <p className="text-2xl font-semibold text-white mt-1">{totalCustomers.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60">Store created</p>
            <p className="text-2xl font-semibold text-white mt-1">{storeAgeLabel}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <div className="flex items-center gap-3">
              {allowed ? (
                <CheckCircle className="h-5 w-5 text-emerald-300" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-rose-300" />
              )}
              <div>
                <p className="text-sm font-semibold text-white">Store access</p>
                <p className="text-xs text-white/60">
                  {allowed ? 'Visible in the franchise workspace' : 'Hidden from franchise workspace'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-white/30 text-white hover:text-white w-full"
              disabled={accessLoading === selectedStoreConfig.store_id}
              onClick={() =>
                handleStoreAccessChange(selectedStoreConfig.store_id, !allowed)
              }
            >
              {accessLoading === selectedStoreConfig.store_id
                ? 'Saving…'
                : allowed
                ? 'Disable store access'
                : 'Enable store access'}
            </Button>
            <div className="text-xs text-white/60">
              Need stricter control? Manage detailed permissions from the Admin Panel tab.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-sky-300" />
              <div>
                <p className="text-sm font-semibold text-white">Contact & metadata</p>
                <p className="text-xs text-white/60">Keep store details in sync to simplify onboarding.</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-white/50" />
                <span>
                  {selectedStoreConfig.contact_phone
                    ? maskPhoneNumber(selectedStoreConfig.contact_phone)
                    : 'Phone unavailable'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-white/50" />
                <span>{selectedStoreConfig.contact_email || 'Email not provided'}</span>
              </div>
              <div className="text-xs text-white/60">
                {selectedStoreConfig.updated_at
                  ? `Last updated ${dayjs(selectedStoreConfig.updated_at).format('DD MMM YYYY')}`
                  : 'No update history'}
              </div>
            </div>
            <Button
              variant="outline"
              className="border-white/30 text-white hover:text-white w-full"
              onClick={() => loadDailyStats(selectedStoreConfig.store_id)}
            >
              View daily performance
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderStoresTab = () => {
    if (!franchiseData) {
      return renderPlaceholderTab(
        'Stores workspace',
        'Detailed store configuration tools will appear here.'
      );
    }

    return (
      <main className="flex-1 w-full px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-end">{renderWalletBalancePill()}</div>
            <div className="space-y-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Stores</h2>
                  <p className="text-sm text-white/60">
                    Tap a store to open its configuration workspace.
                  </p>
                </div>
                <span className="text-sm text-white/60">
                  {selectedStoreConfig
                    ? `${selectedStoreConfig.store_name || 'Selected store'}`
                    : 'Select a store'}
                </span>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="text-xs text-white/60 sm:pt-6">Data for {overviewDateRange.label}</div>
                <div className="w-full sm:w-56">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-1">Date range</p>
                  <div className="relative">
                    <select
                      value={overviewDateFilter}
                      onChange={event =>
                        handleOverviewDateFilterChange(event.target.value as DateRangeFilter)
                      }
                      className="w-full appearance-none rounded-xl border border-white/20 bg-black/30 px-4 py-2 pr-10 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    >
                      <option value="today">Today</option>
                      <option value="thisWeek">This Week</option>
                      <option value="thisMonth">This Month</option>
                      <option value="thisYear">This Year</option>
                      <option value="all">All Time</option>
                      <option value="custom">Custom</option>
                    </select>
                    <svg
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {overviewDateFilter === 'custom' && (
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      <div className="relative">
                        <input
                          ref={overviewCustomStartRef}
                          type="date"
                          value={overviewCustomStart}
                          onChange={event => handleOverviewCustomChange('start', event.target.value)}
                          className="w-full appearance-none rounded-xl border border-white/20 bg-black/30 px-3 py-2 pr-10 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 hover:text-white"
                          onClick={() => {
                            if (overviewCustomStartRef.current?.showPicker) {
                              overviewCustomStartRef.current.showPicker();
                            } else {
                              overviewCustomStartRef.current?.focus();
                            }
                          }}
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          ref={overviewCustomEndRef}
                          type="date"
                          value={overviewCustomEnd}
                          onChange={event => handleOverviewCustomChange('end', event.target.value)}
                          className="w-full appearance-none rounded-xl border border-white/20 bg-black/30 px-3 py-2 pr-10 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 hover:text-white"
                          onClick={() => {
                            if (overviewCustomEndRef.current?.showPicker) {
                              overviewCustomEndRef.current.showPicker();
                            } else {
                              overviewCustomEndRef.current?.focus();
                            }
                          }}
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {storeSsoError && (
                <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  {storeSsoError}
                </div>
              )}
              {renderStoreCardsGrid({
                highlightStoreId: selectedStoreConfig?.store_id ?? null,
                onSelectStore: store => setSelectedStoreConfig(store),
                onPrimaryAction: store => handleOpenStoreManager(store),
                primaryActionLabel: 'Open manager view',
                busyStoreId: storeSsoBusyId
              })}
            </div>

            {/* Config panel removed per request */}
          </div>
      </main>
    );
  };

  const renderWalletBalancePill = () => (
    walletEnabledByAdmin ? (
      <div className="flex max-w-full flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
        <Wallet className="h-4 w-4 text-emerald-600" />
        <span className="font-semibold text-slate-700">Wallet Balance</span>
        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
          {walletLoading ? 'Loading...' : walletError ? '--' : formatINR(walletSummary?.balance ?? 0)}
        </span>
        {walletSummary?.low_balance_threshold !== undefined &&
          walletSummary?.balance !== undefined &&
          walletSummary.low_balance_threshold > 0 &&
          walletSummary.balance <= walletSummary.low_balance_threshold && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Low
            </span>
          )}
      </div>
    ) : null
  );

  const renderWalletTab = () => {
    if (!franchiseData) {
      return renderPlaceholderTab(
        'Wallet overview',
        'Log in again to view franchise wallet details.'
      );
    }

    const balance = Number(walletSummary?.balance ?? 0);
    const reserved = Number(walletSummary?.reserved_balance ?? 0);
    const available = balance - reserved;
    const threshold = Number(walletSummary?.low_balance_threshold ?? 0);
    const isLow = threshold > 0 && balance <= threshold;
    const debitEvents = walletRangeEvents.filter(event => {
      const type = (event.type || 'debit').toString().toLowerCase();
      return type === 'debit' && Number(event.amount ?? 0) > 0;
    });
    const ebillSpend = debitEvents
      .filter(event => (event.usage_type || '').toLowerCase() === 'ebill_invoice')
      .reduce((sum, event) => sum + Number(event.amount ?? 0), 0);
    const smartEbillSpend = debitEvents
      .filter(event => (event.usage_type || '').toLowerCase() === 'smart_ebill_invoice')
      .reduce((sum, event) => sum + Number(event.amount ?? 0), 0);
    const marketingSpend = debitEvents
      .filter(event => (event.usage_type || '').toLowerCase() === 'campaign_message')
      .reduce((sum, event) => sum + Number(event.amount ?? 0), 0);
    const totalSpend = ebillSpend + smartEbillSpend + marketingSpend;

    const ebillCount = debitEvents.filter(
      event => (event.usage_type || '').toLowerCase() === 'ebill_invoice'
    ).length;
    const smartEbillCount = debitEvents.filter(
      event => (event.usage_type || '').toLowerCase() === 'smart_ebill_invoice'
    ).length;
    const campaignCount = debitEvents.filter(
      event => (event.usage_type || '').toLowerCase() === 'campaign_message'
    ).length;
    const totalUsageCount = ebillCount + smartEbillCount + campaignCount;

    const expenseByDate = new Map<string, number>();
    const paidByDate = new Map<string, { ebills: number; smartEbills: number; campaigns: number }>();
    debitEvents.forEach(event => {
      const dateKey = event.timestamp ? dayjs(event.timestamp).format('YYYY-MM-DD') : null;
      if (!dateKey) {
        return;
      }
      const existingSpend = expenseByDate.get(dateKey) || 0;
      expenseByDate.set(dateKey, existingSpend + Number(event.amount ?? 0));
      const usageType = (event.usage_type || '').toLowerCase();
      const current = paidByDate.get(dateKey) || { ebills: 0, smartEbills: 0, campaigns: 0 };
      if (usageType === 'ebill_invoice') {
        current.ebills += 1;
      } else if (usageType === 'smart_ebill_invoice') {
        current.smartEbills += 1;
      } else if (usageType === 'campaign_message') {
        current.campaigns += 1;
      }
      paidByDate.set(dateKey, current);
    });
    const expenseDates = Array.from(expenseByDate.keys()).sort();
    const paidDates = Array.from(paidByDate.keys()).sort();
    const expenseChartData = {
      labels: expenseDates.map(date => dayjs(date).format('MMM D')),
      datasets: [
        {
          label: 'Total expenditure',
          data: expenseDates.map(date => Number(expenseByDate.get(date) || 0)),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22,163,74,0.15)',
          tension: 0.35
        }
      ]
    };
    const paidChartData = {
      labels: paidDates.map(date => dayjs(date).format('MMM D')),
      datasets: [
        {
          label: 'E-bills',
          data: paidDates.map(date => paidByDate.get(date)?.ebills || 0),
          backgroundColor: 'rgba(59,130,246,0.45)'
        },
        {
          label: 'Smart E-bills',
          data: paidDates.map(date => paidByDate.get(date)?.smartEbills || 0),
          backgroundColor: 'rgba(168,85,247,0.45)'
        },
        {
          label: 'Campaigns',
          data: paidDates.map(date => paidByDate.get(date)?.campaigns || 0),
          backgroundColor: 'rgba(16,185,129,0.45)'
        }
      ]
    };

    const paymentsTabs: Array<{ id: typeof paymentsActiveTab; label: string }> = [
      { id: 'wallet', label: 'Wallet' },
      { id: 'track_expenses', label: 'Expenses' },
      { id: 'paid_messages', label: 'Usage Insights' },
      { id: 'billing_details', label: 'Billing Details' },
      { id: 'manage_subscriptions', label: 'Manage Subscriptions' },
      { id: 'invoices', label: 'Invoices' }
    ];
    const showTopControlBar =
      paymentsActiveTab === 'track_expenses' || paymentsActiveTab === 'paid_messages';

    return (
      <main className="flex-1 w-full bg-slate-50 text-slate-900 py-8 px-0">
        <div className="max-w-[1280px] mr-auto ml-0 pr-4 sm:pr-6 pl-0">
          <div className="grid gap-5 lg:grid-cols-[260px_1fr] items-start">
            <aside className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Payments</p>
              <nav className="mt-4 space-y-1 text-sm">
                {paymentsTabs.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPaymentsActiveTab(item.id)}
                    className={[
                      'w-full rounded-lg px-3 py-2 text-left transition',
                      paymentsActiveTab === item.id
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </aside>

            <section className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-emerald-700">Billing</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-900">Wallet</h2>
                  <p className="text-sm text-slate-500">
                    A clean view of balance and usage - without clutter.
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  {renderWalletBalancePill()}
                </div>
                {showTopControlBar && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={franchiseData.franchise_id}
                      disabled
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-900"
                    >
                      <option value={franchiseData.franchise_id} className="bg-white text-slate-900">
                        {franchiseData.franchise_id}
                      </option>
                    </select>
                    <select
                      value={walletUsageRange}
                      onChange={event => setWalletUsageRange(event.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-900"
                    >
                      <option value="today" className="bg-white text-slate-900">Today</option>
                      <option value="this_week" className="bg-white text-slate-900">This week</option>
                      <option value="this_month" className="bg-white text-slate-900">This month</option>
                      <option value="this_year" className="bg-white text-slate-900">This year</option>
                      <option value="all" className="bg-white text-slate-900">All time</option>
                      <option value="custom" className="bg-white text-slate-900">Custom</option>
                    </select>
                    {walletUsageRange === 'custom' && (
                      <>
                        <input
                          type="date"
                          value={walletUsageCustomStart}
                          onChange={event => setWalletUsageCustomStart(event.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                        />
                        <input
                          type="date"
                          value={walletUsageCustomEnd}
                          onChange={event => setWalletUsageCustomEnd(event.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                        />
                      </>
                    )}
                    {!franchiseWalletReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setWalletTopupOpen(true);
                          setWalletTopupError('');
                          setWalletTopupSuccess('');
                        }}
                        className="rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-semibold tracking-wide text-white hover:bg-emerald-700"
                      >
                        Add Money
                      </button>
                    )}
                  </div>
                )}
              </div>

              {paymentsActiveTab === 'wallet' && (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Available Balance</p>
                      {walletLoading ? (
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                        </div>
                      ) : (
                        <>
                          <p className="mt-3 text-3xl font-semibold text-slate-900">{formatINR(available)}</p>
                          <p className="mt-2 text-xs text-slate-500">Reserved: {formatINR(reserved)}</p>
                        </>
                      )}
                    </div>
                    {!franchiseWalletReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setWalletTopupOpen(true);
                          setWalletTopupError('');
                          setWalletTopupSuccess('');
                        }}
                        className="rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-semibold tracking-wide text-white hover:bg-emerald-700"
                      >
                        Add Money
                      </button>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">Notifications</p>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {isLow ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-amber-700">Low Balance Detected</p>
                            <span className="text-xs text-slate-500">Just now</span>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            Wallet balance is below {formatINR(threshold)}. Top up to avoid interruptions.
                          </p>
                          {!franchiseWalletReadOnly && (
                            <button
                              type="button"
                              onClick={() => setWalletTopupOpen(true)}
                              className="mt-3 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1 text-xs font-semibold tracking-wide text-white"
                            >
                              Add Money
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                          No notifications right now.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {paymentsActiveTab === 'track_expenses' && (
                <>
                  <div className="grid gap-4 md:grid-cols-5">
                    {[
                      { label: 'Total Expenditure', value: formatINR(totalSpend) },
                      { label: 'Campaign Charges', value: formatINR(marketingSpend) },
                      { label: 'E-bill Charges', value: formatINR(ebillSpend) },
                      { label: 'Smart E-bill Charges', value: formatINR(smartEbillSpend) }
                    ].map(card => (
                      <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">{card.label}</p>
                        <p className="mt-2 text-xl font-semibold text-slate-900">{card.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">Expenditure History Overview</p>
                      <select
                        value={walletUsageRange}
                        onChange={event => setWalletUsageRange(event.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900"
                      >
                        <option value="today">Today</option>
                        <option value="this_week">This week</option>
                        <option value="this_month">This month</option>
                        <option value="this_year">This year</option>
                        <option value="all">All time</option>
                      </select>
                    </div>
                    <div className="mt-4 h-64 rounded-xl border border-dashed border-slate-200 bg-white p-4">
                      {walletRangeLoading ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                        </div>
                      ) : expenseDates.length ? (
                        <Line
                          data={expenseChartData}
                          options={{
                            responsive: true,
                            plugins: { legend: { display: false } },
                            scales: {
                              x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(148,163,184,0.25)' } },
                              y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(148,163,184,0.25)' } }
                            }
                          }}
                        />
                      ) : (
                        <p className="text-xs text-slate-500">No spend data for this range.</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-600">Transactions</p>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <button
                          type="button"
                          onClick={() => setTrackExpenseTab('wallet')}
                          className={[
                            'rounded-lg px-3 py-1',
                            trackExpenseTab === 'wallet' ? 'bg-slate-100 text-slate-900' : 'bg-white text-slate-500'
                          ].join(' ')}
                        >
                          Wallet Transactions
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrackExpenseTab('subscription')}
                          className={[
                            'rounded-lg px-3 py-1',
                            trackExpenseTab === 'subscription' ? 'bg-slate-100 text-slate-900' : 'bg-white text-slate-500'
                          ].join(' ')}
                        >
                          Subscription Deduction
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                      {trackExpenseTab === 'wallet' ? (
                        <>
                          {walletRangeLoading ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                            </div>
                          ) : debitEvents.length ? (
                            <div className="space-y-2">
                              {debitEvents.slice(0, 20).map(event => (
                                <div
                                  key={event.event_key || event.timestamp}
                                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                                >
                                  <div>
                                    <p className="text-xs text-slate-600">
                                      {(event.usage_type || event.type || '').toString().toUpperCase()}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      {event.timestamp ? dayjs(event.timestamp).format('DD MMM YYYY, HH:mm') : '--'}
                                    </p>
                                  </div>
                                  <span className="text-sm text-slate-900">-{formatINR(event.amount ?? 0)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            'No wallet transactions for this range.'
                          )}
                        </>
                      ) : (
                        <>
                          {paymentsHistoryLoading ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                            </div>
                          ) : paymentsHistory.length ? (
                            <div className="space-y-2">
                              {paymentsHistory.slice(0, 20).map(payment => (
                                <div
                                  key={payment.payment_id || payment.order_id}
                                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                                >
                                  <div>
                                    <p className="text-xs text-slate-600">
                                      {payment.status || 'subscription'}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      {payment.created_at ? dayjs(payment.created_at).format('DD MMM YYYY, HH:mm') : '--'}
                                    </p>
                                  </div>
                                  <span className="text-sm text-slate-900">{formatINR(payment.amount ?? 0)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            'No subscription deductions for this range.'
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

{paymentsActiveTab === 'paid_messages' && (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    {[
                      { label: 'Total Usage', value: totalUsageCount.toString() },
                      { label: 'E-bills', value: ebillCount.toString() },
                      { label: 'Smart E-bills', value: smartEbillCount.toString() },
                      { label: 'Campaigns', value: campaignCount.toString() }
                    ].map(card => (
                      <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">{card.label}</p>
                        <p className="mt-2 text-xl font-semibold text-slate-900">{card.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">Daily usage count by category</p>
                      <select
                        value={walletUsageRange}
                        onChange={event => setWalletUsageRange(event.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900"
                      >
                        <option value="today">Today</option>
                        <option value="this_week">This week</option>
                        <option value="this_month">This month</option>
                        <option value="this_year">This year</option>
                        <option value="all">All time</option>
                      </select>
                    </div>
                    <div className="mt-4 h-64 rounded-xl border border-dashed border-slate-200 bg-white p-4">
                      {walletRangeLoading ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                        </div>
                      ) : paidDates.length ? (
                        <Bar
                          data={paidChartData}
                          options={{
                            responsive: true,
                            plugins: { legend: { position: 'bottom', labels: { color: '#334155' } } },
                            scales: {
                              x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(148,163,184,0.25)' } },
                              y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(148,163,184,0.25)' } }
                            }
                          }}
                        />
                      ) : (
                        <p className="text-xs text-slate-500">No usage data for this range.</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <p className="text-sm text-slate-600">Daily breakdown</p>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                      {paidDates.length ? (
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead className="text-[11px] uppercase text-slate-500">
                            <tr>
                              <th className="py-2">Date</th>
                              <th className="py-2">E-bills</th>
                              <th className="py-2">Smart E-bills</th>
                              <th className="py-2">Campaigns</th>
                              <th className="py-2">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paidDates.map(date => {
                              const row = paidByDate.get(date) || { ebills: 0, smartEbills: 0, campaigns: 0 };
                              const total = row.ebills + row.smartEbills + row.campaigns;
                              return (
                                <tr key={date} className="border-t border-slate-200">
                                  <td className="py-2">{dayjs(date).format('DD MMM YYYY')}</td>
                                  <td className="py-2">{row.ebills}</td>
                                  <td className="py-2">{row.smartEbills}</td>
                                  <td className="py-2">{row.campaigns}</td>
                                  <td className="py-2">{total}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        'No data yet.'
                      )}
                    </div>
                  </div>
                </>
              )}

{paymentsActiveTab === 'billing_details' && (
                <div className="rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">Billing Details</p>
                  </div>
                  {billingProfileError && (
                    <p className="px-6 pt-4 text-sm text-rose-600">{billingProfileError}</p>
                  )}
                  <div className="divide-y divide-slate-200 text-sm text-slate-700">
                    {[
                      {
                        label: 'Legal Business Name',
                        value: profileForm.legalBusinessName || billingProfile?.franchise_name || franchiseData.franchise_id
                      },
                      {
                        label: 'Business Email',
                        value: profileForm.businessEmail || billingProfile?.billing_email || 'Not set'
                      },
                      {
                        label: 'Business Address',
                        value:
                          profileForm.addressLine1 ||
                          [
                            profileForm.addressLine1,
                            profileForm.addressLine2,
                            profileForm.city,
                            profileForm.state,
                            profileForm.country,
                            profileForm.pincode
                          ]
                            .filter(Boolean)
                            .join(', ') ||
                          'Not set'
                      },
                      {
                        label: 'GST Details',
                        value: profileForm.gstNumber ? 'View GST Certificate' : 'Not set',
                        isLink: Boolean(profileForm.gstCertificateUrl)
                      }
                    ].map(row => (
                      <div key={row.label} className="flex items-start justify-between gap-6 px-6 py-4">
                        <div className="text-slate-600">{row.label}</div>
                        <div className="flex items-center gap-3">
                          {row.isLink ? (
                            <a
                              href={profileForm.gstCertificateUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:underline cursor-pointer"
                            >
                              {row.value}
                            </a>
                          ) : (
                            <span className="text-slate-800 text-right max-w-md">{row.value}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

{paymentsActiveTab === 'manage_subscriptions' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                  <p className="text-sm text-slate-600">Manage Subscriptions</p>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">
                      Plan: {billingProfile?.plan_name || '--'}
                    </p>
                    <p className="mt-1 text-slate-500">
                      Renewal date:{' '}
                      {billingProfile?.plan_end_date
                        ? dayjs(billingProfile.plan_end_date).format('DD MMM YYYY')
                        : '--'}
                    </p>
                    <p className="mt-1 text-slate-500">
                      Amount / Year:{' '}
                      {billingProfile?.plan_amount_year
                        ? formatINR(billingProfile.plan_amount_year)
                        : '--'}
                    </p>
                    <p className="mt-1 text-slate-500">
                      Status: {billingProfile?.plan_status || '--'}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">Read-only access</p>
                  </div>
                </div>
              )}

{paymentsActiveTab === 'invoices' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <p className="text-sm text-slate-600">Invoices</p>
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                    {paymentsHistoryLoading ? (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : paymentsHistoryError ? (
                      paymentsHistoryError
                    ) : paymentsHistory.length ? (
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="text-[11px] uppercase text-slate-500">
                          <tr>
                            <th className="py-2">Date</th>
                            <th className="py-2">Type</th>
                            <th className="py-2">Amount</th>
                            <th className="py-2">Status</th>
                            <th className="py-2">Invoice</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentsHistory.map(payment => (
                            <tr key={payment.payment_id || payment.order_id} className="border-t border-slate-200">
                              <td className="py-2">
                                {payment.created_at
                                  ? dayjs(payment.created_at).format('DD MMM YYYY')
                                  : '--'}
                              </td>
                              <td className="py-2">Wallet top-up</td>
                              <td className="py-2">{formatINR(payment.amount ?? 0)}</td>
                              <td className="py-2">{payment.status || '--'}</td>
                              <td className="py-2 text-slate-400">--</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      'No invoices yet.'
                    )}
                  </div>
                </div>
              )}

            </section>
          </div>
        </div>

        {!franchiseWalletReadOnly && walletTopupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setWalletTopupOpen(false)}
            />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  Add Wallet Balance
                </div>
                <button
                  type="button"
                  onClick={() => setWalletTopupOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
                >
                  ×
                </button>
              </div>

              <div className="px-5 py-5 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">
                    Enter the Amount you want to add balance to Wallet
                  </p>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <span className="text-slate-500">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={walletTopupAmount}
                      onChange={event => setWalletTopupAmount(event.target.value)}
                      className="w-full bg-transparent px-2 text-sm text-slate-900 outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[1000, 5000, 10000, 20000].map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setWalletTopupAmount(String(amount))}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setWalletTopupTermsOpen(prev => !prev)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <span>Terms &amp; Conditions</span>
                  <span className="text-slate-500">{walletTopupTermsOpen ? '▴' : '▾'}</span>
                </button>
                {walletTopupTermsOpen && (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Subscription charges are not deducted from wallet balance</li>
                    </ul>
                  </div>
                )}

                {walletTopupError && (
                  <p className="text-sm text-rose-600">{walletTopupError}</p>
                )}
                {walletTopupSuccess && (
                  <p className="text-sm text-emerald-600">{walletTopupSuccess}</p>
                )}

                <button
                  type="button"
                  onClick={handleWalletTopup}
                  disabled={walletTopupLoading}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {walletTopupLoading ? 'Processing...' : 'Add Money'}
                </button>
              </div>
            </div>
          </div>
        )}

        {billingEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setBillingEditOpen(false)}
            />
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.35)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <p className="text-base font-semibold text-slate-900">Update your billing information</p>
                  <p className="text-sm text-slate-500">
                    Please share your business location and the relevant document.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBillingEditOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
                >
                  ×
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Select your Business Location</label>
                  <select
                    value={billingForm.country}
                    onChange={event => setBillingForm(prev => ({ ...prev, country: event.target.value }))}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="India">India</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Do you have a GST Number</label>
                  <div className="mt-2 flex items-center gap-6 text-sm text-slate-700">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gst"
                        checked={billingForm.hasGst}
                        onChange={() => setBillingForm(prev => ({ ...prev, hasGst: true }))}
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gst"
                        checked={!billingForm.hasGst}
                        onChange={() => setBillingForm(prev => ({ ...prev, hasGst: false }))}
                      />
                      No
                    </label>
                  </div>
                  {billingForm.hasGst ? (
                    <div className="mt-3 space-y-3">
                      <input
                        type="text"
                        value={billingForm.gstNumber}
                        onChange={event => setBillingForm(prev => ({ ...prev, gstNumber: event.target.value }))}
                        placeholder="Enter business GST Number"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      />
                      <label className="flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 cursor-pointer">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500">
                          +
                        </div>
                        <div>
                          <p className="font-medium text-slate-700">Upload GST Certificate (Optional)</p>
                          <p className="text-xs text-slate-500">Supported file formats: PDF, JPEG, JPG & PNG</p>
                        </div>
                        <input type="file" className="hidden" accept=".pdf,.jpeg,.jpg,.png" />
                      </label>
                    </div>
                  ) : (
                    <div className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-slate-600">
                      Note: You will not be able to claim GST related benefits.
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Please enter the billing details</label>
                  <input
                    type="text"
                    value={billingForm.legalName}
                    onChange={event => setBillingForm(prev => ({ ...prev, legalName: event.target.value }))}
                    placeholder="Legal Business Name"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      type="text"
                      value={billingForm.addressLine1}
                      onChange={event => setBillingForm(prev => ({ ...prev, addressLine1: event.target.value }))}
                      placeholder="Address line 1"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                    <input
                      type="text"
                      value={billingForm.addressLine2}
                      onChange={event => setBillingForm(prev => ({ ...prev, addressLine2: event.target.value }))}
                      placeholder="Address line 2"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      type="text"
                      value={billingForm.city}
                      onChange={event => setBillingForm(prev => ({ ...prev, city: event.target.value }))}
                      placeholder="City"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                    <input
                      type="text"
                      value={billingForm.state}
                      onChange={event => setBillingForm(prev => ({ ...prev, state: event.target.value }))}
                      placeholder="State"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                    <input
                      type="text"
                      value={billingForm.zip}
                      onChange={event => setBillingForm(prev => ({ ...prev, zip: event.target.value }))}
                      placeholder="Pin code"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  };

  const renderSmartEbillTab = () => {
    if (!franchiseData) {
      return renderPlaceholderTab('Smart E-bill', 'Log in again to manage franchise Smart E-bill assets.');
    }

    return (
      <main className="flex-1 w-full bg-slate-50 text-slate-900 py-8 px-0">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Franchise Smart E-bill studio</h3>
                    <p className="text-sm text-slate-600">
                      Upload once for the franchise. Assets are stored under the franchise folder and synced to every store row.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={triggerSmartUpload}
                  disabled={smartUploading || smartImages.length >= SMART_EBILL_MAX_IMAGES}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {smartUploading ? 'Uploading…' : 'Upload images'}
                </Button>
              </div>

              <form className="mt-6 space-y-6" onSubmit={handleSmartEbillSave}>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Messaging</p>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Header text</label>
                        <textarea
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                          rows={3}
                          value={smartHeaderText}
                          onChange={event => setSmartHeaderText(event.target.value)}
                          placeholder="Franchise-wide header message"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Address line</label>
                        <textarea
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                          rows={2}
                          value={smartAddressText}
                          onChange={event => setSmartAddressText(event.target.value)}
                          placeholder="Franchise support address or location"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Footer text</label>
                        <textarea
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                          rows={3}
                          value={smartFooterText}
                          onChange={event => setSmartFooterText(event.target.value)}
                          placeholder="Footer message for all stores"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Selections</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">Header slider</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                        {headerImages.length}/{MAX_SMART_HEADER_IMAGES}
                      </span>
                    </div>
                    {headerImages.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                        No header images selected yet.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {headerImages.map((url, index) => (
                          <div
                            key={`${url}-header`}
                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                          >
                            <div className="flex items-center gap-3">
                              <img src={url} alt={`Header ${index + 1}`} className="h-12 w-16 rounded-md object-cover" />
                              <div>
                                <p className="text-sm font-semibold text-slate-800">IMG-{smartImages.indexOf(url) + 1}</p>
                                <p className="text-xs text-slate-500">Header banner</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button type="button" variant="outline" size="icon" className="h-8 w-8 border-slate-900 bg-slate-900 text-white hover:bg-slate-800" onClick={() => moveHeaderImage(index, -1)} disabled={index === 0}>
                                ↑
                              </Button>
                              <Button type="button" variant="outline" size="icon" className="h-8 w-8 border-slate-900 bg-slate-900 text-white hover:bg-slate-800" onClick={() => moveHeaderImage(index, 1)} disabled={index === headerImages.length - 1}>
                                ↓
                              </Button>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600" onClick={() => toggleHeaderImage(url)}>
                                ✕
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 border-t border-slate-200 pt-4">
                      <p className="text-sm font-semibold text-slate-900">Bottom banner</p>
                      {bottomBanner ? (
                        <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <img src={bottomBanner} alt="Bottom banner" className="h-12 w-20 rounded-md object-cover" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">
                              IMG-{smartImages.indexOf(bottomBanner) + 1}
                            </p>
                            <p className="text-xs text-slate-500">Bottom banner</p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
                          Choose one image from the library as the bottom banner.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Mobile preview</p>
                      <p className="text-xs text-slate-500">This preview will be applied across all franchise stores.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      {franchiseData.store_count} stores
                    </span>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <div className="w-full max-w-[360px] rounded-[36px] border border-slate-200 bg-slate-100 p-4 shadow-sm">
                      <div className="space-y-4">
                        <div className="relative overflow-hidden rounded-2xl bg-slate-200">
                          {headerImages.length > 0 ? (
                            <img src={headerImages[previewHeaderIndex]} alt="Header banner preview" className="h-32 w-full object-cover" />
                          ) : (
                            <div className="flex h-32 items-center justify-center text-xs text-slate-500">Header banner preview</div>
                          )}
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                          <p className="text-sm font-semibold text-slate-900">
                            {smartHeaderText || 'Thanks for shopping with us'}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                          <p className="text-sm font-semibold text-slate-900">
                            {profileForm.legalBusinessName || franchiseData.franchise_id}
                          </p>
                          <p className="text-xs text-slate-500">
                            {smartAddressText || 'Franchise address appears here'}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
                          <p className="font-semibold text-slate-800">
                            {profileForm.legalBusinessName || franchiseData.franchise_id}
                          </p>
                          <p className="mt-1">{smartFooterText || 'Smart E-bill powered by BillBox'}</p>
                        </div>
                        {bottomBanner ? (
                          <div className="relative overflow-hidden rounded-2xl shadow-sm">
                            <img src={bottomBanner} alt="Bottom banner preview" className="h-28 w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs text-slate-400">
                            Bottom banner preview
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <input
                  ref={smartFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleSmartFileChange}
                />

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Asset library</p>
                      <p className="text-xs text-slate-500">Select franchise assets to use as header or bottom banners.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      {smartImages.length} assets
                    </span>
                  </div>

                  {smartLoading ? (
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading Smart E-bill assets...
                    </div>
                  ) : smartImages.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                      No assets uploaded yet. Use the upload button to add banner images once for the franchise.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {smartImages.map((url, index) => {
                        const inHeader = headerImages.includes(url);
                        const isBottom = bottomBanner === url;
                        return (
                          <div key={url} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                              <img src={url} alt={`Asset ${index + 1}`} className="h-full w-full object-cover" />
                              <div className="absolute left-3 top-3 flex gap-2">
                                {inHeader && (
                                  <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white">Header</span>
                                )}
                                {isBottom && (
                                  <span className="rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white">Bottom</span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-3 p-4">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-800">IMG-{index + 1}</p>
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                                  onClick={() => handleRemoveSmartImage(index)}
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant={inHeader ? 'default' : 'outline'}
                                  size="sm"
                                  className="bg-slate-900 text-white hover:bg-slate-800"
                                  onClick={() => toggleHeaderImage(url)}
                                  disabled={!inHeader && headerImages.length >= MAX_SMART_HEADER_IMAGES}
                                >
                                  {inHeader ? 'In header' : 'Add to header'}
                                </Button>
                                <Button
                                  type="button"
                                  variant={isBottom ? 'default' : 'outline'}
                                  size="sm"
                                  className="bg-emerald-600 text-white hover:bg-emerald-500"
                                  onClick={() => setBottomBanner(url)}
                                >
                                  {isBottom ? 'Bottom selected' : 'Set bottom'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {smartStatus && (
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      smartStatus.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-rose-200 bg-rose-50 text-rose-700'
                    }`}
                  >
                    {smartStatus.message}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="submit"
                    disabled={smartSaving || smartUploading || smartLoading}
                    className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
                  >
                    {smartSaving ? 'Saving…' : 'Save Smart E-bill'}
                  </Button>
                  <p className="text-xs text-slate-500">
                    Saving updates the franchise config and writes the same image paths to every store row.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    );
  };

  const renderProfileTab = () => {
    if (!franchiseData) {
      return renderPlaceholderTab('Profile', 'Log in again to view franchise profile details.');
    }
    const isDirty = profileInitial
      ? JSON.stringify(profileInitial) !== JSON.stringify(profileForm)
      : false;

    return (
      <main className="flex-1 w-full bg-slate-50 text-slate-900 py-8 px-0">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6">
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Franchise</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">Profile</h2>
                  <p className="text-sm text-slate-500">
                    Keep your franchise details up to date for billing and compliance.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {isDirty ? 'Unsaved changes' : 'All changes saved'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (profileInitial) {
                        setProfileForm(profileInitial);
                        setProfileSaveStatus('');
                      }
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProfileSave}
                    disabled={!isDirty}
                    className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-semibold tracking-wide text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {profileError && <p className="text-sm text-rose-600">{profileError}</p>}
              {profileSaveStatus && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle className="h-4 w-4" />
                  {profileSaveStatus}
                </div>
              )}
              {profileLoading && <p className="text-sm text-slate-500">Loading profile...</p>}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-slate-600">Legal business name</label>
                  <input
                    type="text"
                    value={profileForm.legalBusinessName}
                    onChange={event => setProfileForm(prev => ({ ...prev, legalBusinessName: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-600">Franchise owner full name</label>
                <input
                  type="text"
                  value={profileForm.ownerFullName}
                  onChange={event => setProfileForm(prev => ({ ...prev, ownerFullName: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-600">Business Email</label>
                <input
                  type="email"
                  value={profileForm.businessEmail}
                  onChange={event => setProfileForm(prev => ({ ...prev, businessEmail: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-600">Primary phone number</label>
                <input
                  type="tel"
                    value={profileForm.phonePrimary}
                    onChange={event => setProfileForm(prev => ({ ...prev, phonePrimary: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-600">WhatsApp number</label>
                <input
                  type="tel"
                  value={profileForm.whatsappNumber}
                  onChange={event => setProfileForm(prev => ({ ...prev, whatsappNumber: event.target.value }))}
                  placeholder="+91XXXXXXXXXX (E.164 format)"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
                <p className="text-xs text-slate-500">Use country code (e.g., +91XXXXXXXXXX). This is required for daily stats.</p>
              </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-600">Alternate phone number (optional)</label>
                  <input
                    type="tel"
                    value={profileForm.phoneAlternate}
                    onChange={event => setProfileForm(prev => ({ ...prev, phoneAlternate: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm text-slate-600">Business address</label>
                  <input
                    type="text"
                    value={profileForm.addressLine1}
                    onChange={event => setProfileForm(prev => ({ ...prev, addressLine1: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm text-slate-600">Address line 2</label>
                  <input
                    type="text"
                    value={profileForm.addressLine2}
                    onChange={event => setProfileForm(prev => ({ ...prev, addressLine2: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-600">City</label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={event => setProfileForm(prev => ({ ...prev, city: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-600">State</label>
                  <input
                    type="text"
                    value={profileForm.state}
                    onChange={event => setProfileForm(prev => ({ ...prev, state: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-600">Country</label>
                  <input
                    type="text"
                    value={profileForm.country}
                    onChange={event => setProfileForm(prev => ({ ...prev, country: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-600">Pincode</label>
                  <input
                    type="text"
                    value={profileForm.pincode}
                    onChange={event => setProfileForm(prev => ({ ...prev, pincode: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">GST / Tax</p>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="profile-gst"
                        checked={profileForm.gstRegistered}
                        onChange={() => setProfileForm(prev => ({ ...prev, gstRegistered: true }))}
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="profile-gst"
                        checked={!profileForm.gstRegistered}
                        onChange={() => setProfileForm(prev => ({ ...prev, gstRegistered: false }))}
                      />
                      No
                    </label>
                  </div>
                </div>
                {profileForm.gstRegistered && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-slate-600">GST number (optional)</label>
                      <input
                        type="text"
                        value={profileForm.gstNumber}
                        onChange={event => setProfileForm(prev => ({ ...prev, gstNumber: event.target.value }))}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-600">GST certificate (PDF/JPG/PNG)</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={event => handleGstUpload(event.target.files?.[0] || null)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                      />
                      {gstUploadStatus && (
                        <p className="text-xs text-emerald-600">{gstUploadStatus}</p>
                      )}
                      {gstUploadError && (
                        <p className="text-xs text-rose-600">{gstUploadError}</p>
                      )}
                      {profileForm.gstCertificateUrl && (
                        <a
                          href={profileForm.gstCertificateUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-700 hover:underline"
                        >
                          View uploaded certificate
                        </a>
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm text-slate-600">PAN (optional)</label>
                  <input
                    type="text"
                    value={profileForm.panNumber}
                    onChange={event => setProfileForm(prev => ({ ...prev, panNumber: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  };

  const isProfileComplete = () => {
    const profileForValidation = profileInitial || profileForm;
    const required = [
      profileForValidation.legalBusinessName,
      profileForValidation.ownerFullName,
      profileForValidation.businessEmail,
      profileForValidation.phonePrimary,
      profileForValidation.whatsappNumber,
      profileForValidation.addressLine1,
      profileForValidation.city,
      profileForValidation.state,
      profileForValidation.country,
      profileForValidation.pincode
    ];
    return required.every(value => String(value || '').trim().length > 0);
  };

  const renderTabContent = () => {
    if (!franchiseData) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center text-white/70 gap-4">
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-white">Session expired</p>
            <p>Please log in again to view your franchise stores.</p>
          </div>
          <Button onClick={handleLogout} className="bg-white text-slate-950 hover:bg-white/90">
            Go to Franchise Login
          </Button>
        </div>
      );
    }
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'stores':
        return renderStoresTab();
      case 'wallet':
        if (!walletEnabledByAdmin) {
          return (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center text-white/70 gap-4">
              <div className="space-y-2">
                <p className="text-2xl font-semibold text-white">Wallet Disabled</p>
                <p>
                  Wallet access is currently unavailable because you are on a free trial plan. Upgrade to enable wallet features.
                </p>
              </div>
            </div>
          );
        }
        if (!trialEndedForWallet) {
          return (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center text-white/70 gap-4">
              <div className="space-y-2">
                <p className="text-2xl font-semibold text-white">Wallet Locked During Trial</p>
                <p>
                  Wallet will be available after your trial ends
                  {walletTrialEndLabel ? ` on ${walletTrialEndLabel}` : ''}.
                </p>
              </div>
              <Button
                onClick={() => setActiveTab('overview')}
                className="bg-white text-slate-950 hover:bg-white/90"
              >
                Go to Overview
              </Button>
            </div>
          );
        }
        return renderWalletTab();
      case 'smart-ebill':
        return renderSmartEbillTab();
      case 'profile':
        return renderProfileTab();
      case 'admin':
        return renderAdminPanel();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen flex bg-[#050714] text-white">
      <FranchiseSidebar
        tabs={TABS}
        activeTab={activeTab}
        onSelectTab={tabId => {
          setActiveTab(tabId);
        }}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col">
        {franchiseData && globalTrialBanner && (
          <div
            className={`border-b px-4 py-3 ${
              globalTrialBanner.status === 'ended' || globalTrialBanner.status === 'ends_today'
                ? 'border-rose-300/30 bg-rose-500/10 text-rose-100'
                : globalTrialBanner.isAlert
                ? 'border-amber-300/30 bg-amber-400/10 text-amber-100'
                : 'border-amber-300/20 bg-amber-400/10 text-amber-100'
            }`}
          >
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span
                className={`font-semibold uppercase tracking-[0.2em] ${
                  globalTrialBanner.status === 'ended' || globalTrialBanner.status === 'ends_today'
                    ? 'text-rose-200 animate-pulse'
                    : globalTrialBanner.isAlert
                    ? 'text-amber-200 animate-pulse'
                    : 'text-amber-200/90'
                }`}
              >
                Free Trial
              </span>
              <span>
                Start: <span className="font-semibold">{globalTrialBanner.startLabel}</span>
              </span>
              <span>
                Ends: <span className="font-semibold">{globalTrialBanner.endLabel}</span>
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                  globalTrialBanner.status === 'ended' || globalTrialBanner.status === 'ends_today'
                    ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_18px_rgba(225,29,72,0.45)]'
                    : globalTrialBanner.isAlert
                    ? 'bg-amber-400/20 text-amber-100 animate-pulse shadow-[0_0_14px_rgba(251,191,36,0.35)]'
                    : 'text-amber-200'
                }`}
              >
                {globalTrialBanner.statusLabel}
              </span>
            </div>
          </div>
        )}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default FranchisePortal;
