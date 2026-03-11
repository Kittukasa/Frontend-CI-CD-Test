import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AdminDateRangeControl, {
  getAdminDateRangeLabel,
} from '@/components/admin/AdminDateRangeControl';
import { useAdminDateRange } from '@/hooks/useAdminDateRange';
import { clearAdminSession, fetchAdminJson } from '@/utils/adminAuth';

export type OverviewStat = {
  id: string;
  label: string;
  value?: string;
  subLabel?: string;
};

export interface AdminOverviewProps {
  stats?: OverviewStat[];
}

interface OverviewMetrics {
  totalInvoices: number;
  ebillInvoices: number;
  activeStores: number;
  eBillCustomers: number;
  anonymousCustomers: number;
  totalCustomers: number;
  campaignsSent: number;
  messagesSent: number;
}

const formatNumber = (value?: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }
  return value.toLocaleString();
};

const normalizeFranchiseId = (value: unknown) => {
  const raw = value === null || value === undefined ? '' : String(value).trim();
  return raw ? raw.toLowerCase() : 'unassigned';
};

const normalizeStoreId = (value: unknown) => {
  const raw = value === null || value === undefined ? '' : String(value).trim();
  return raw;
};

const AdminOverviewPage: FC<AdminOverviewProps> = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [franchiseOptions, setFranchiseOptions] = useState<Array<{ id: string; label: string }>>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();
  const {
    dateRange,
    setDateRange,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    queryString,
    resetRange,
  } = useAdminDateRange('today');
  const viewingLabel = useMemo(() => getAdminDateRangeLabel(dateRange), [dateRange]);

  useEffect(() => {
    const loadFranchiseOptions = async () => {
      try {
        const result = await fetchAdminJson<{
          stores?: Array<Record<string, unknown>>;
        }>(`/api/admin/stores-analytics?range=today`);
        if (!result.ok) {
          if (result.isAuthError || result.isHtml) {
            clearAdminSession();
            const redirectFrom = `${location.pathname}${location.search}`;
            navigate('/admin/login', { replace: true, state: { from: redirectFrom } });
            return;
          }
          throw new Error(result.error || 'Failed to load franchises');
        }
        const payload = result.data || {};
        const storesData = Array.isArray(payload?.stores) ? payload.stores : [];
        const map = new Map<string, string>();
        storesData.forEach(store => {
          const id = normalizeFranchiseId(store.franchiseId);
          const label = store.franchiseName || store.franchiseId || 'Unassigned';
          if (!map.has(id)) {
            map.set(id, label);
          }
        });
        setFranchiseOptions(
          Array.from(map, ([id, label]) => ({ id, label })).sort((a, b) =>
            a.label.localeCompare(b.label)
          )
        );
      } catch (err) {
        setError((err as Error).message || 'Failed to load franchises');
      }
    };
    loadFranchiseOptions();
  }, []);

  useEffect(() => {
    if (!selectedFranchiseId) {
      return;
    }
    const loadMetrics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchAdminJson<{
          stores?: Array<Record<string, unknown>>;
        }>(`/api/admin/stores-analytics?${queryString}`);
        if (!result.ok) {
          if (result.isAuthError || result.isHtml) {
            clearAdminSession();
            const redirectFrom = `${location.pathname}${location.search}`;
            navigate('/admin/login', { replace: true, state: { from: redirectFrom } });
            return;
          }
          throw new Error(result.error || 'Failed to load overview metrics');
        }
        const payload = result.data || {};
        const storesData = Array.isArray(payload?.stores) ? payload.stores : [];
        setStores(storesData);
        setLastUpdated(
          new Intl.DateTimeFormat('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date())
        );
      } catch (err) {
        setError((err as Error).message);
        setStores([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadMetrics();
  }, [queryString, selectedFranchiseId]);

  const metrics = useMemo<OverviewMetrics | null>(() => {
    if (!stores.length || !selectedFranchiseId) {
      return null;
    }
    return stores.reduce(
      (
        acc: OverviewMetrics,
        store: {
          invoices?: number;
          ebillInvoices?: number;
          totalCustomers?: number;
          eBillCustomers?: number;
          campaignsSent?: number;
          messagesSent?: number;
          storeId?: string;
          franchiseId?: string | null;
        }
      ) => {
        const franchiseKey = normalizeFranchiseId(store.franchiseId);
        if (franchiseKey !== selectedFranchiseId) {
          return acc;
        }
        const storeKey = normalizeStoreId(store.storeId);
        if (selectedStoreId !== 'all' && storeKey !== selectedStoreId) {
          return acc;
        }
        const invoices = Number(store.invoices) || 0;
        const ebillInvoices = Number(store.ebillInvoices) || 0;
        const totalCustomers = Number(store.totalCustomers) || 0;
        const eBillCustomers = Number(store.eBillCustomers) || 0;
        const campaignsSent = Number(store.campaignsSent) || 0;
        const messagesSent = Number(store.messagesSent) || 0;

        acc.totalInvoices += invoices;
        acc.ebillInvoices += ebillInvoices;
        acc.totalCustomers += totalCustomers;
        acc.eBillCustomers += eBillCustomers;
        acc.anonymousCustomers += Math.max(totalCustomers - eBillCustomers, 0);
        acc.campaignsSent += campaignsSent;
        acc.messagesSent += messagesSent;
        if (invoices > 0) {
          acc.activeStores += 1;
        }
        return acc;
      },
      {
        totalInvoices: 0,
        ebillInvoices: 0,
        activeStores: 0,
        eBillCustomers: 0,
        anonymousCustomers: 0,
        totalCustomers: 0,
        campaignsSent: 0,
        messagesSent: 0,
      }
    );
  }, [stores, selectedFranchiseId, selectedStoreId]);

  const storeOptions = useMemo(() => {
    const filtered = stores.filter(store => {
      const franchiseKey = normalizeFranchiseId(store.franchiseId);
      return franchiseKey === selectedFranchiseId;
    });
    return filtered
      .map(store => ({
        id: normalizeStoreId(store.storeId),
        label: store.name ? `${store.name} (${store.storeId})` : store.storeId,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [stores, selectedFranchiseId]);

  useEffect(() => {
    if (selectedStoreId !== 'all' && !storeOptions.some(option => option.id === selectedStoreId)) {
      setSelectedStoreId('all');
    }
  }, [selectedStoreId, storeOptions]);

  useEffect(() => {
    setSelectedStoreId('all');
  }, [selectedFranchiseId]);

  useEffect(() => {
    if (!selectedFranchiseId && franchiseOptions.length > 0) {
      setSelectedFranchiseId(franchiseOptions[0].id);
      setSelectedStoreId('all');
    }
  }, [selectedFranchiseId, franchiseOptions]);

  const resolvedStats: OverviewStat[] = [
    {
      id: 'invoices',
      label: 'Total invoices',
      value: formatNumber(metrics?.totalInvoices),
      subLabel: metrics ? 'Invoices in range' : 'Awaiting data',
    },
    {
      id: 'ebillInvoices',
      label: 'E-bill invoices',
      value: formatNumber(metrics?.ebillInvoices),
      subLabel: metrics ? 'Phone numbers captured' : 'Awaiting data',
    },
    {
      id: 'stores',
      label: 'Active stores',
      value: formatNumber(metrics?.activeStores),
      subLabel: metrics ? 'Stores with invoices' : 'Awaiting data',
    },
    {
      id: 'ebill',
      label: 'E-bill customers',
      value: formatNumber(metrics?.eBillCustomers),
      subLabel: metrics ? 'Unique customers with phone' : 'Awaiting data',
    },
    {
      id: 'anonymous',
      label: 'Anonymous customers',
      value: formatNumber(metrics?.anonymousCustomers),
      subLabel: metrics ? 'Invoices without phone' : 'Awaiting data',
    },
    {
      id: 'totalCustomers',
      label: 'Total customers',
      value: formatNumber(metrics?.totalCustomers),
      subLabel: metrics ? 'E-bill + anonymous' : 'Awaiting data',
    },
    {
      id: 'campaignsSent',
      label: 'Campaigns sent',
      value: formatNumber(metrics?.campaignsSent),
      subLabel: metrics ? 'Sent during range' : 'Awaiting data',
    },
    {
      id: 'messagesSent',
      label: 'Messages sent',
      value: formatNumber(metrics?.messagesSent),
      subLabel: metrics ? 'WhatsApp messages' : 'Awaiting data',
    },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 rounded-3xl border border-white/5 bg-gradient-to-r from-slate-950/70 via-indigo-900/40 to-slate-900/30 px-5 py-6 shadow-[0_20px_60px_rgba(2,6,23,0.65)] backdrop-blur sm:px-6 sm:py-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200/90">
            Dashboard
          </p>
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Overview</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              High-level health of Billbox across all vendors: invoices, customer adoption, and
              messaging performance.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <AdminDateRangeControl
            value={dateRange}
            customStart={customStart}
            customEnd={customEnd}
            onRangeChange={setDateRange}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />
          <select
            value={selectedFranchiseId}
            onChange={event => setSelectedFranchiseId(event.target.value)}
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white sm:w-auto"
          >
            {franchiseOptions.map(option => (
              <option key={option.id} value={option.id} className="bg-[#050816] text-white">
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={selectedStoreId}
            onChange={event => setSelectedStoreId(event.target.value)}
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white sm:w-auto"
          >
            <option value="all" className="bg-[#050816] text-white">
              All stores
            </option>
            {storeOptions.map(option => (
              <option key={option.id} value={option.id} className="bg-[#050816] text-white">
                {option.label}
              </option>
            ))}
          </select>
          {isLoading ? (
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-cyan-100/90">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading
            </span>
          ) : null}
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">
            Viewing: {viewingLabel}
          </span>
          <button
            type="button"
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white sm:w-auto"
          >
            Compare: Previous 24h
          </button>
          <button
            type="button"
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white sm:w-auto"
          >
            Light mode
          </button>
          <button
            type="button"
            onClick={resetRange}
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 hover:text-white sm:w-auto"
          >
            Reset
          </button>
        </div>
      </header>

      {error && <p className="text-sm text-rose-300">{error}</p>}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/50">
          Key Health Signals
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {resolvedStats.map(stat => (
            <article
              key={stat.id}
              className="flex min-h-[200px] flex-col gap-4 rounded-3xl border border-white/5 bg-slate-950/70 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.55)]"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/40">
                  {stat.label}
                </p>
                {isLoading ? (
                  <div className="mt-2 h-8 w-24 animate-pulse rounded-full bg-white/10" />
                ) : (
                  <p className="mt-2 text-3xl font-bold text-white">{stat.value ?? '--'}</p>
                )}
                <p className="text-sm text-white/60">
                  {metrics ? stat.subLabel ?? 'Live data' : 'Awaiting data'}
                </p>
              </div>
              <div className="flex items-center justify-end text-xs text-white/50">
                <span>{lastUpdated ? `Updated ${lastUpdated} IST` : 'Waiting for data'}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-white/20 bg-slate-950/50 p-6 text-sm text-white/70">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
          Upcoming widgets
        </p>
        <p className="mt-3">
          Next ideas for Overview: system health (OCR queue, WA API errors), LLM cost monitor, and
          anomaly alerts like drops in store activity.{' '}
          {/* TODO: Wire these cards to the admin analytics API when available */}
        </p>
      </section>
    </div>
  );
};

export default AdminOverviewPage;
