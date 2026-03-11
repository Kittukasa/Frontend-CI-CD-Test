import { useEffect, useState } from 'react';
import type { ChangeEvent, FC } from 'react';
import { withAdminAuthHeaders } from '@/utils/adminAuth';
import { formatINR } from '@/utils/formatCurrency';

const AdminWalletsPage: FC = () => {
  const [franchises, setFranchises] = useState<
    Array<{
      franchise_id: string;
      franchise_name?: string | null;
      balance?: number;
      currency?: string | null;
      low_balance_threshold?: number;
      pricing_ebill_invoice?: number;
      pricing_smart_ebill?: number;
      pricing_campaign_message?: number;
    }>
  >([]);
  const [franchiseLoading, setFranchiseLoading] = useState(false);
  const [franchiseError, setFranchiseError] = useState<string | null>(null);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string | null>(null);
  const [selectedFranchiseName, setSelectedFranchiseName] = useState<string | null>(null);
  const [walletForm, setWalletForm] = useState({
    franchiseId: '',
    storeId: 'ALL',
    currency: 'INR',
    balance: '0',
    minBalance: '0',
    lowBalanceThreshold: '0',
    pricingEbillInvoice: '0',
    pricingSmartEbill: '0',
    pricingCampaignMessage: '0',
  });
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [currentCurrency, setCurrentCurrency] = useState<string>('INR');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState<number | null>(null);
  const [walletEvents, setWalletEvents] = useState<
    Array<{
      event_key?: string | null;
      type?: string | null;
      usage_type?: string | null;
      amount?: number;
      unit_price?: number;
      quantity?: number;
      balance_after?: number | null;
      store_id?: string | null;
      source_id?: string | null;
      currency?: string | null;
      timestamp?: string | null;
    }>
  >([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [usageRange, setUsageRange] = useState('this_month');
  const [usageCustomStart, setUsageCustomStart] = useState('');
  const [usageCustomEnd, setUsageCustomEnd] = useState('');
  const [usageSummary, setUsageSummary] = useState<{
    ebillCount: number;
    ebillSpend: number;
    smartEbillCount: number;
    smartEbillSpend: number;
    campaignCount: number;
    campaignSpend: number;
  } | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState('overview');
  const [allStores, setAllStores] = useState<
    Array<{
      storeId: string;
      name?: string | null;
      city?: string | null;
      franchiseId?: string | null;
      invoices?: number;
      ebillInvoices?: number;
      messagesSent?: number;
      campaignsSent?: number;
      lastActiveAt?: string | null;
    }>
  >([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [storeSearch, setStoreSearch] = useState('');
  const [storeSort, setStoreSort] = useState('invoices_desc');
  const [storeUsage, setStoreUsage] = useState<
    Array<{
      store_id: string;
      ebillCount: number;
      ebillSpend: number;
      smartEbillCount: number;
      smartEbillSpend: number;
      campaignCount: number;
      campaignSpend: number;
      totalSpend: number;
    }>
  >([]);
  const [storeUsageLoading, setStoreUsageLoading] = useState(false);
  const [storeUsageError, setStoreUsageError] = useState<string | null>(null);

  const handleWalletFieldChange =
    (field: keyof typeof walletForm) => (event: ChangeEvent<HTMLInputElement>) => {
      setWalletForm(prev => ({ ...prev, [field]: event.target.value }));
    };

  const buildWalletPayload = () => {
    const franchiseId = walletForm.franchiseId.trim();
    const storeId = walletForm.storeId.trim() || 'ALL';
    const currency = walletForm.currency.trim() || 'INR';
    const toNumber = (value: string) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    return {
      franchiseId,
      storeId,
      currency,
      balance: toNumber(walletForm.balance),
      min_balance: toNumber(walletForm.minBalance),
      low_balance_threshold: toNumber(walletForm.lowBalanceThreshold),
      pricing_ebill_invoice: toNumber(walletForm.pricingEbillInvoice),
      pricing_smart_ebill: toNumber(walletForm.pricingSmartEbill),
      pricing_campaign_message: toNumber(walletForm.pricingCampaignMessage),
    };
  };

  const handleWalletLoad = async (overrideFranchiseId?: string | null) => {
    setWalletError(null);
    setWalletMessage(null);
    const franchiseId = (overrideFranchiseId ?? walletForm.franchiseId).trim();
    if (!franchiseId) {
      setWalletError('Franchise ID is required.');
      return;
    }
    const storeId = walletForm.storeId.trim() || 'ALL';
    setWalletLoading(true);
    try {
      const params = new URLSearchParams({ franchiseId, storeId });
      const response = await fetch(`/api/admin/wallets?${params.toString()}`, {
        headers: withAdminAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to load wallet config.');
      }
      const data = await response.json();
      const wallet = data.wallet || {};
      setCurrentBalance(typeof wallet.balance === 'number' ? wallet.balance : null);
      setCurrentCurrency(wallet.currency || 'INR');
      setLowBalanceThreshold(
        typeof wallet.low_balance_threshold === 'number' ? wallet.low_balance_threshold : null
      );
      setWalletForm({
        franchiseId: wallet.franchise_id || franchiseId,
        storeId: wallet.store_id || storeId,
        currency: wallet.currency || 'INR',
        balance: String(wallet.balance ?? 0),
        minBalance: String(wallet.min_balance ?? 0),
        lowBalanceThreshold: String(wallet.low_balance_threshold ?? 0),
        pricingEbillInvoice: String(wallet.pricing_ebill_invoice ?? 0),
        pricingSmartEbill: String(wallet.pricing_smart_ebill ?? 0),
        pricingCampaignMessage: String(wallet.pricing_campaign_message ?? 0),
      });
      setSelectedFranchiseId(wallet.franchise_id || franchiseId);
      setWalletMessage('Wallet settings loaded.');
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : 'Unable to load wallet config.');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleWalletSave = async () => {
    setWalletError(null);
    setWalletMessage(null);
    const payload = buildWalletPayload();
    if (!payload.franchiseId) {
      setWalletError('Franchise ID is required.');
      return;
    }
    setWalletLoading(true);
    try {
      const response = await fetch('/api/admin/wallets', {
        method: 'PATCH',
        headers: withAdminAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to save wallet config.');
      }
      const data = await response.json();
      const wallet = data.wallet || {};
      setWalletForm({
        franchiseId: wallet.franchise_id || payload.franchiseId,
        storeId: wallet.store_id || payload.storeId,
        currency: wallet.currency || payload.currency,
        balance: String(wallet.balance ?? payload.balance),
        minBalance: String(wallet.min_balance ?? payload.min_balance),
        lowBalanceThreshold: String(wallet.low_balance_threshold ?? payload.low_balance_threshold),
        pricingEbillInvoice: String(wallet.pricing_ebill_invoice ?? payload.pricing_ebill_invoice),
        pricingSmartEbill: String(wallet.pricing_smart_ebill ?? payload.pricing_smart_ebill),
        pricingCampaignMessage: String(
          wallet.pricing_campaign_message ?? payload.pricing_campaign_message
        ),
      });
      setSelectedFranchiseId(wallet.franchise_id || payload.franchiseId);
      setCurrentBalance(typeof wallet.balance === 'number' ? wallet.balance : payload.balance);
      setCurrentCurrency(wallet.currency || payload.currency);
      setLowBalanceThreshold(
        typeof wallet.low_balance_threshold === 'number'
          ? wallet.low_balance_threshold
          : payload.low_balance_threshold
      );
      setWalletMessage('Wallet settings saved.');
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : 'Unable to save wallet config.');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleLoadEvents = async (overrideFranchiseId?: string | null) => {
    setEventsError(null);
    const franchiseId = (
      overrideFranchiseId ??
      selectedFranchiseId ??
      walletForm.franchiseId
    ).trim();
    if (!franchiseId) {
      setEventsError('Franchise ID is required to load events.');
      return;
    }
    setEventsLoading(true);
    try {
      const params = new URLSearchParams({ franchiseId, limit: '50' });
      const response = await fetch(`/api/admin/wallet-events?${params.toString()}`, {
        headers: withAdminAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to load wallet events.');
      }
      const data = await response.json();
      const events = Array.isArray(data.events) ? data.events : [];
      setWalletEvents(events);
    } catch (error) {
      setEventsError(error instanceof Error ? error.message : 'Unable to load wallet events.');
    } finally {
      setEventsLoading(false);
    }
  };

  const loadFranchiseSummary = async () => {
    setFranchiseError(null);
    setFranchiseLoading(true);
    try {
      const response = await fetch('/api/admin/wallets/summary', {
        headers: withAdminAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to load franchise wallets.');
      }
      const data = await response.json();
      setFranchises(Array.isArray(data.franchises) ? data.franchises : []);
    } catch (error) {
      setFranchiseError(error instanceof Error ? error.message : 'Unable to load franchises.');
    } finally {
      setFranchiseLoading(false);
    }
  };

  const handleSelectFranchise = async (franchiseId: string, franchiseName?: string | null) => {
    setSelectedFranchiseId(franchiseId);
    setSelectedFranchiseName(franchiseName || null);
    setWalletForm(prev => ({
      ...prev,
      franchiseId,
      storeId: 'ALL',
    }));
    setActiveDetailsTab('overview');
    setEventTypeFilter('all');
    setEventStartDate('');
    setEventEndDate('');
    setUsageRange('this_month');
    setUsageCustomStart('');
    setUsageCustomEnd('');
    await handleWalletLoad(franchiseId);
    await handleLoadEvents(franchiseId);
  };

  const handleClearSelection = () => {
    setSelectedFranchiseId(null);
    setSelectedFranchiseName(null);
    setWalletEvents([]);
    setEventsError(null);
    setEventTypeFilter('all');
    setEventStartDate('');
    setEventEndDate('');
    setUsageRange('this_month');
    setUsageCustomStart('');
    setUsageCustomEnd('');
    setUsageSummary(null);
    setUsageError(null);
    setActiveDetailsTab('overview');
    setStoreUsage([]);
    setStoreUsageError(null);
    setWalletForm(prev => ({
      ...prev,
      franchiseId: '',
      storeId: 'ALL',
    }));
  };

  const loadUsageSummary = async (
    franchiseId: string,
    range: string,
    start?: string,
    end?: string
  ) => {
    setUsageError(null);
    setUsageLoading(true);
    try {
      const params = new URLSearchParams({ franchiseId, range });
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const response = await fetch(`/api/admin/wallet-events/summary?${params.toString()}`, {
        headers: withAdminAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to load usage summary.');
      }
      const data = await response.json();
      setUsageSummary({
        ebillCount: Number(data.ebillCount ?? 0),
        ebillSpend: Number(data.ebillSpend ?? 0),
        smartEbillCount: Number(data.smartEbillCount ?? 0),
        smartEbillSpend: Number(data.smartEbillSpend ?? 0),
        campaignCount: Number(data.campaignCount ?? 0),
        campaignSpend: Number(data.campaignSpend ?? 0),
      });
    } catch (error) {
      setUsageError(error instanceof Error ? error.message : 'Unable to load usage summary.');
    } finally {
      setUsageLoading(false);
    }
  };

  const loadAllStores = async () => {
    setStoresError(null);
    setStoresLoading(true);
    try {
      const params = new URLSearchParams({ range: 'all' });
      const response = await fetch(`/api/admin/stores-analytics?${params.toString()}`, {
        headers: withAdminAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to load stores.');
      }
      const data = await response.json();
      setAllStores(Array.isArray(data.stores) ? data.stores : []);
    } catch (error) {
      setStoresError(error instanceof Error ? error.message : 'Unable to load stores.');
    } finally {
      setStoresLoading(false);
    }
  };

  const loadStoreUsage = async (
    franchiseId: string,
    range: string,
    start?: string,
    end?: string
  ) => {
    setStoreUsageError(null);
    setStoreUsageLoading(true);
    try {
      const params = new URLSearchParams({ franchiseId, range });
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const response = await fetch(`/api/admin/wallet-events/by-store?${params.toString()}`, {
        headers: withAdminAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to load store usage.');
      }
      const data = await response.json();
      setStoreUsage(Array.isArray(data.stores) ? data.stores : []);
    } catch (error) {
      setStoreUsageError(error instanceof Error ? error.message : 'Unable to load store usage.');
    } finally {
      setStoreUsageLoading(false);
    }
  };

  useEffect(() => {
    loadFranchiseSummary();
  }, []);

  useEffect(() => {
    if (selectedFranchiseId && allStores.length === 0 && !storesLoading) {
      loadAllStores();
    }
  }, [selectedFranchiseId, allStores.length, storesLoading]);

  useEffect(() => {
    if (selectedFranchiseId) {
      loadUsageSummary(selectedFranchiseId, usageRange, usageCustomStart, usageCustomEnd);
    }
  }, [selectedFranchiseId, usageRange, usageCustomStart, usageCustomEnd]);

  useEffect(() => {
    if (selectedFranchiseId && activeDetailsTab === 'stores') {
      loadStoreUsage(selectedFranchiseId, usageRange, usageCustomStart, usageCustomEnd);
    }
  }, [selectedFranchiseId, activeDetailsTab, usageRange, usageCustomStart, usageCustomEnd]);

  const selectedSummary = franchises.find(
    franchise => franchise.franchise_id === selectedFranchiseId
  );
  const selectedBalance =
    typeof currentBalance === 'number'
      ? currentBalance
      : typeof selectedSummary?.balance === 'number'
      ? selectedSummary.balance
      : 0;
  const selectedCurrency = currentCurrency || selectedSummary?.currency || 'INR';
  const selectedThreshold =
    typeof lowBalanceThreshold === 'number'
      ? lowBalanceThreshold
      : typeof selectedSummary?.low_balance_threshold === 'number'
      ? selectedSummary.low_balance_threshold
      : 0;
  const isSelectedLow = selectedThreshold > 0 && selectedBalance <= selectedThreshold;
  const reservedBalance = 0;
  const availableBalance = selectedBalance - reservedBalance;
  const combinedEbillCount = (usageSummary?.ebillCount ?? 0) + (usageSummary?.smartEbillCount ?? 0);
  const combinedEbillSpend = (usageSummary?.ebillSpend ?? 0) + (usageSummary?.smartEbillSpend ?? 0);
  const usageSpend = combinedEbillSpend + (usageSummary?.campaignSpend ?? 0);
  const usageLabel = `${combinedEbillCount} e-bills | ${
    usageSummary?.campaignCount ?? 0
  } campaign msgs`;
  const usageRangeLabelMap: Record<string, string> = {
    today: 'today',
    this_week: 'this week',
    this_month: 'this month',
    this_year: 'this year',
    all: 'all time',
    custom: 'custom',
  };
  const usageRangeLabel = usageRangeLabelMap[usageRange] || usageRange;
  const thresholdProgress =
    selectedThreshold > 0 ? Math.min(100, (selectedBalance / selectedThreshold) * 100) : 0;

  const filteredStores = allStores.filter(store => {
    if (!selectedFranchiseId) {
      return false;
    }
    const franchiseId = store.franchiseId ? String(store.franchiseId) : null;
    return franchiseId === String(selectedFranchiseId);
  });

  const normalizedSearch = storeSearch.trim().toLowerCase();
  const searchedStores = normalizedSearch
    ? filteredStores.filter(store => {
        const name = store.name || '';
        const city = store.city || '';
        const id = store.storeId || '';
        return [name, city, id].some(value => value.toLowerCase().includes(normalizedSearch));
      })
    : filteredStores;

  const sortedStores = [...searchedStores].sort((a, b) => {
    switch (storeSort) {
      case 'ebill_desc':
        return (b.ebillInvoices || 0) - (a.ebillInvoices || 0);
      case 'messages_desc':
        return (b.messagesSent || 0) - (a.messagesSent || 0);
      case 'campaigns_desc':
        return (b.campaignsSent || 0) - (a.campaignsSent || 0);
      case 'name_asc':
        return (a.name || a.storeId || '').localeCompare(b.name || b.storeId || '');
      case 'name_desc':
        return (b.name || b.storeId || '').localeCompare(a.name || a.storeId || '');
      case 'invoices_desc':
      default:
        return (b.invoices || 0) - (a.invoices || 0);
    }
  });

  const filteredEvents = walletEvents.filter(event => {
    if (eventTypeFilter !== 'all') {
      const eventType = (event.usage_type || event.type || '').toLowerCase();
      if (eventType !== eventTypeFilter) {
        return false;
      }
    }
    if (eventStartDate) {
      const start = new Date(`${eventStartDate}T00:00:00`);
      const eventDate = event.timestamp ? new Date(event.timestamp) : null;
      if (!eventDate || eventDate < start) {
        return false;
      }
    }
    if (eventEndDate) {
      const end = new Date(`${eventEndDate}T23:59:59`);
      const eventDate = event.timestamp ? new Date(event.timestamp) : null;
      if (!eventDate || eventDate > end) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-white/5 bg-gradient-to-r from-slate-950/70 via-indigo-900/40 to-slate-900/30 px-6 py-8 shadow-[0_20px_60px_rgba(2,6,23,0.65)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">Franchise Wallet Settings</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Update per-franchise pricing, balance, and alert thresholds. Use store overrides when
              needed.
            </p>
          </div>
          <button
            type="button"
            onClick={loadFranchiseSummary}
            className="rounded-full border border-white/20 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 hover:text-white"
            disabled={franchiseLoading}
          >
            {franchiseLoading ? 'Refreshing...' : 'Refresh list'}
          </button>
        </div>
      </header>

      <section className="rounded-3xl border border-white/5 bg-slate-950/60 p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
            Franchises
          </p>
        </div>
        {franchiseError && <p className="mt-4 text-sm text-rose-300">{franchiseError}</p>}
        {franchiseLoading ? (
          <p className="mt-4 text-sm text-white/60">Loading franchises...</p>
        ) : (
          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {franchises.map(franchise => {
              const balance = franchise.balance ?? 0;
              const threshold = franchise.low_balance_threshold ?? 0;
              const isLow = threshold > 0 && balance <= threshold;
              return (
                <button
                  key={franchise.franchise_id}
                  type="button"
                  onClick={() =>
                    handleSelectFranchise(franchise.franchise_id, franchise.franchise_name)
                  }
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left text-white transition hover:border-cyan-400/40 hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">
                        {franchise.franchise_name || franchise.franchise_id}
                      </p>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        {franchise.franchise_id}
                      </p>
                    </div>
                    <span
                      className={[
                        'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                        isLow
                          ? 'bg-amber-500/20 text-amber-200'
                          : 'bg-emerald-500/15 text-emerald-200',
                      ].join(' ')}
                    >
                      {isLow ? 'Low Balance' : 'Healthy'}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Wallet</p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-white/70">Balance</span>
                      <span className="font-semibold text-white">{formatINR(balance)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-white/70">Low threshold</span>
                      <span className="font-semibold text-white">{formatINR(threshold)}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex items-center justify-between text-white/70">
                      <span>E-bill invoice price</span>
                      <span className="font-semibold text-white">
                        {formatINR(franchise.pricing_ebill_invoice ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-white/70">
                      <span>Smart E-bill price</span>
                      <span className="font-semibold text-white">
                        {formatINR(franchise.pricing_smart_ebill ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-white/70">
                      <span>Campaign message price</span>
                      <span className="font-semibold text-white">
                        {formatINR(franchise.pricing_campaign_message ?? 0)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {!franchises.length && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
                No franchises found yet.
              </div>
            )}
          </div>
        )}
      </section>
      {selectedFranchiseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={handleClearSelection}
          />
          <div className="relative w-full max-w-6xl max-h-[calc(100vh-3rem)] overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            <button
              type="button"
              onClick={handleClearSelection}
              aria-label="Close wallet popup"
              className="absolute right-4 top-4 z-10 rounded-full border border-rose-400/50 bg-rose-500/15 px-3 py-1 text-sm font-semibold text-rose-300 hover:bg-rose-500/25 hover:text-rose-200"
            >
              ×
            </button>
            <div className="px-8 py-6 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Billing</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Wallet</h2>
                  <p className="text-sm text-white/60">
                    A clean view of balance, usage, and audit trail - without clutter.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selectedFranchiseId || ''}
                    onChange={event => {
                      const next = event.target.value;
                      const match = franchises.find(item => item.franchise_id === next);
                      handleSelectFranchise(next, match?.franchise_name || null);
                    }}
                    className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm text-white"
                  >
                    {franchises.map(franchise => (
                      <option
                        key={franchise.franchise_id}
                        value={franchise.franchise_id}
                        className="bg-slate-950 text-white"
                      >
                        {franchise.franchise_name || franchise.franchise_id} (
                        {franchise.franchise_id})
                      </option>
                    ))}
                  </select>
                  <select
                    value={usageRange}
                    onChange={event => setUsageRange(event.target.value)}
                    className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm text-white"
                  >
                    <option value="today" className="bg-slate-950 text-white">
                      Today
                    </option>
                    <option value="this_week" className="bg-slate-950 text-white">
                      This week
                    </option>
                    <option value="this_month" className="bg-slate-950 text-white">
                      This month
                    </option>
                    <option value="this_year" className="bg-slate-950 text-white">
                      This year
                    </option>
                    <option value="all" className="bg-slate-950 text-white">
                      All time
                    </option>
                    <option value="custom" className="bg-slate-950 text-white">
                      Custom
                    </option>
                  </select>
                  {usageRange === 'custom' && (
                    <>
                      <input
                        type="date"
                        value={usageCustomStart}
                        onChange={event => setUsageCustomStart(event.target.value)}
                        className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                      <input
                        type="date"
                        value={usageCustomEnd}
                        onChange={event => setUsageCustomEnd(event.target.value)}
                        className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                      />
                    </>
                  )}
                  <button
                    type="button"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:text-white"
                  >
                    Filters
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70 hover:text-white"
                  >
                    Back to franchises
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/70">Current balance</p>
                    <span
                      className={[
                        'rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide',
                        isSelectedLow
                          ? 'bg-amber-500/20 text-amber-200'
                          : 'bg-emerald-500/15 text-emerald-200',
                      ].join(' ')}
                    >
                      {isSelectedLow ? 'Low balance' : 'Healthy'}
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {formatINR(selectedBalance)}
                  </p>
                  <p className="mt-2 text-xs text-white/50">Below threshold - top-up recommended</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/70">Available</p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {formatINR(availableBalance)}
                  </p>
                  <p className="mt-2 text-xs text-white/50">
                    Reserved: {formatINR(reservedBalance)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/70">Usage this window</p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {usageLoading || !usageSummary ? '--' : formatINR(usageSpend)}
                  </p>
                  <p className="mt-2 text-xs text-white/50">
                    {usageLoading || !usageSummary ? 'Loading...' : usageLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/70">Pricing</p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {formatINR(Number(walletForm.pricingEbillInvoice || 0))} /{' '}
                    {formatINR(Number(walletForm.pricingSmartEbill || 0))} /{' '}
                    {formatINR(Number(walletForm.pricingCampaignMessage || 0))}
                  </p>
                  <p className="mt-2 text-xs text-white/50">E-bill / Smart E-bill / Campaign</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>
                    Low balance threshold:{' '}
                    <span className="text-white font-semibold">{formatINR(selectedThreshold)}</span>
                  </span>
                  <span className="text-xs text-white/50">{formatINR(selectedThreshold)}</span>
                </div>
                <div className="mt-4">
                  <div className="h-2 w-full rounded-full bg-white/5">
                    <div
                      className="h-2 rounded-full bg-white/80"
                      style={{ width: `${thresholdProgress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                    <span>0</span>
                    <span>{formatINR(selectedThreshold)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1 text-sm">
                {['overview', 'events', 'stores', 'pricing'].map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveDetailsTab(tab)}
                    className={[
                      'rounded-lg px-4 py-2 text-sm capitalize transition',
                      activeDetailsTab === tab
                        ? 'bg-white text-slate-900'
                        : 'text-white/60 hover:text-white',
                    ].join(' ')}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeDetailsTab === 'overview' && (
                <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white/70">Latest events</p>
                      <select
                        value={eventTypeFilter}
                        onChange={event => setEventTypeFilter(event.target.value)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white"
                      >
                        <option value="all">All types</option>
                        <option value="ebill_invoice">E-bill invoice</option>
                        <option value="smart_ebill_invoice">Smart e-bill invoice</option>
                        <option value="campaign_message">Campaign message</option>
                      </select>
                    </div>
                    <div className="mt-4 space-y-3">
                      {filteredEvents.slice(0, 5).map((event, index) => (
                        <div
                          key={event.event_key || `${event.timestamp}-${index}`}
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs uppercase">
                                {event.usage_type || event.type || '--'}
                              </span>
                              {event.store_id && (
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                                  Store {event.store_id}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-white/50">
                              {event.timestamp ? new Date(event.timestamp).toLocaleString() : '--'}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                            <span>Source: {event.source_id || '--'}</span>
                            <span className="text-white">-{formatINR(event.amount ?? 0)}</span>
                          </div>
                          <div className="mt-1 text-xs text-white/50">
                            Bal:{' '}
                            {event.balance_after === null || event.balance_after === undefined
                              ? '--'
                              : formatINR(event.balance_after)}
                          </div>
                        </div>
                      ))}
                      {!filteredEvents.length && (
                        <p className="text-sm text-white/60">No events found for this filter.</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/60">
                        E-bill invoices billed ({usageRangeLabel})
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-2xl font-semibold text-white">
                          {combinedEbillCount}
                        </span>
                        <span className="text-sm text-white/70">
                          {formatINR(combinedEbillSpend)}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/60">
                        Campaign messages billed ({usageRangeLabel})
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-2xl font-semibold text-white">
                          {usageSummary?.campaignCount ?? 0}
                        </span>
                        <span className="text-sm text-white/70">
                          {formatINR(usageSummary?.campaignSpend ?? 0)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-white/50">
                      Counts come from wallet ledger debits (audit source of truth).
                    </p>
                  </div>
                </div>
              )}

              {activeDetailsTab === 'events' && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-white/70">Events</p>
                      <p className="text-xs text-white/50">Readable event cards</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                      <select
                        value={eventTypeFilter}
                        onChange={event => setEventTypeFilter(event.target.value)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-cyan-300/50 focus:outline-none"
                      >
                        <option value="all">All types</option>
                        <option value="ebill_invoice">E-bill invoice</option>
                        <option value="smart_ebill_invoice">Smart e-bill invoice</option>
                        <option value="campaign_message">Campaign message</option>
                      </select>
                      <input
                        type="date"
                        value={eventStartDate}
                        onChange={event => setEventStartDate(event.target.value)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="date"
                        value={eventEndDate}
                        onChange={event => setEventEndDate(event.target.value)}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {filteredEvents.map((event, index) => (
                      <div
                        key={event.event_key || `${event.timestamp}-${index}`}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                            {event.usage_type || event.type || '--'}
                          </span>
                          <span className="text-xs text-white/50">
                            {event.timestamp ? new Date(event.timestamp).toLocaleString() : '--'}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-white/70 sm:grid-cols-3">
                          <div className="flex items-center justify-between">
                            <span>Usage</span>
                            <span className="text-white">-{formatINR(event.amount ?? 0)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Balance after</span>
                            <span className="text-white">
                              {event.balance_after === null || event.balance_after === undefined
                                ? '--'
                                : formatINR(event.balance_after)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Store ID</span>
                            <span className="text-white">{event.store_id || '--'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!filteredEvents.length && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                        No wallet events found for this filter.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeDetailsTab === 'stores' && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-white/70">Usage split by store (read-only)</p>
                      <p className="text-xs text-white/50">{usageRangeLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="search"
                        value={storeSearch}
                        onChange={event => setStoreSearch(event.target.value)}
                        placeholder="Search store, city, category"
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white placeholder-white/40"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          selectedFranchiseId &&
                          loadStoreUsage(
                            selectedFranchiseId,
                            usageRange,
                            usageCustomStart,
                            usageCustomEnd
                          )
                        }
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:text-white"
                        disabled={storeUsageLoading}
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                  {storeUsageError && (
                    <p className="mt-3 text-sm text-rose-300">{storeUsageError}</p>
                  )}
                  {storeUsageLoading ? (
                    <p className="mt-4 text-sm text-white/60">Loading store usage...</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {sortedStores.map(store => {
                        const usage = storeUsage.find(
                          entry => entry.store_id === store.storeId
                        ) || {
                          ebillCount: 0,
                          smartEbillCount: 0,
                          campaignCount: 0,
                          totalSpend: 0,
                        };
                        const storeEbillCount =
                          (usage.ebillCount ?? 0) + (usage.smartEbillCount ?? 0);
                        return (
                          <div
                            key={store.storeId}
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {store.name || `Store ${store.storeId}`}
                                </p>
                                <p className="text-xs text-white/50">
                                  Store {store.storeId} {store.city ? `- ${store.city}` : ''}
                                </p>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-right text-xs text-white/60">
                                <div>
                                  <p>E-bills (30d)</p>
                                  <p className="text-white font-semibold">{storeEbillCount}</p>
                                </div>
                                <div>
                                  <p>Campaigns (30d)</p>
                                  <p className="text-white font-semibold">
                                    {usage.campaignCount ?? 0}
                                  </p>
                                </div>
                                <div>
                                  <p>Spend (30d)</p>
                                  <p className="text-white font-semibold">
                                    {formatINR(usage.totalSpend ?? 0)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {!sortedStores.length && (
                        <p className="text-sm text-white/60">No stores found for this franchise.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeDetailsTab === 'pricing' && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pricing</p>
                      <p className="text-sm text-white/60">Update franchise pricing defaults.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectedFranchiseId && handleWalletLoad(selectedFranchiseId)}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:text-white"
                        disabled={walletLoading}
                      >
                        {walletLoading ? 'Loading...' : 'Reload'}
                      </button>
                      <button
                        type="button"
                        onClick={handleWalletSave}
                        className="rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-emerald-500/30"
                        disabled={walletLoading}
                      >
                        {walletLoading ? 'Saving...' : 'Save pricing'}
                      </button>
                    </div>
                  </div>
                  {walletError && <p className="mt-4 text-sm text-rose-300">{walletError}</p>}
                  {walletMessage && (
                    <p className="mt-4 text-sm text-emerald-300">{walletMessage}</p>
                  )}
                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/60">E-bill invoice price</p>
                      <input
                        type="number"
                        step="0.01"
                        value={walletForm.pricingEbillInvoice}
                        onChange={handleWalletFieldChange('pricingEbillInvoice')}
                        className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-300/60 focus:outline-none"
                      />
                      <p className="mt-2 text-xs text-white/50">
                        Charged per delivered invoice message.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/60">Smart E-bill price</p>
                      <input
                        type="number"
                        step="0.01"
                        value={walletForm.pricingSmartEbill}
                        onChange={handleWalletFieldChange('pricingSmartEbill')}
                        className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-300/60 focus:outline-none"
                      />
                      <p className="mt-2 text-xs text-white/50">
                        Charged per smart e-bill invoice.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/60">Campaign message price</p>
                      <input
                        type="number"
                        step="0.01"
                        value={walletForm.pricingCampaignMessage}
                        onChange={handleWalletFieldChange('pricingCampaignMessage')}
                        className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-300/60 focus:outline-none"
                      />
                      <p className="mt-2 text-xs text-white/50">
                        Charged per delivered campaign message.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/60">Low balance threshold</p>
                      <input
                        type="number"
                        step="0.01"
                        value={walletForm.lowBalanceThreshold}
                        onChange={handleWalletFieldChange('lowBalanceThreshold')}
                        className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-300/60 focus:outline-none"
                      />
                      <p className="mt-2 text-xs text-white/50">
                        Alert when balance drops below this value.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWalletsPage;
