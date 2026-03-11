import dayjs from "dayjs";
import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Search, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import StoreCard, { type StoreSummary } from "./StoreCard";
import AdminDateRangeControl from "@/components/admin/AdminDateRangeControl";
import { useAdminDateRange } from "@/hooks/useAdminDateRange";
import StoreLifecycleBoard, {
  MOCK_LIFECYCLE_DATA,
  type StoreLifecycleCard,
} from "./StoreLifecycleBoard";
import { clearAdminSession, fetchAdminJson } from "@/utils/adminAuth";

type StoreHealth = StoreSummary["health"];

interface StoresAnalyticsResponse {
  stores: Array<{
    storeId: string;
    name: string;
    city?: string | null;
    franchiseId?: string | null;
    franchiseName?: string | null;
    invoices: number;
    ebillInvoices?: number;
    anonymousCustomers?: number;
    totalCustomers: number;
    eBillCustomers: number;
    campaignsSent: number;
    messagesSent?: number;
    lastActiveAt?: string | null;
    healthStatus: StoreHealth;
    trialPeriod?: number | string | null;
    trialStarted?: string | null;
  }>;
}

const STORE_FILTER_OPTIONS = [
  { value: "top", label: "Top performers" },
  { value: "risk", label: "At risk" },
  { value: "low", label: "Low adoption" },
] as const;

const formatNumber = (value?: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }
  return value.toLocaleString();
};

const normalizeFranchiseId = (value: unknown) => {
  const raw = value === null || value === undefined ? "" : String(value).trim();
  return raw ? raw.toLowerCase() : "unassigned";
};

const normalizeStoreId = (value: unknown) => {
  const raw = value === null || value === undefined ? "" : String(value).trim();
  return raw;
};

const formatLastActive = (value?: string | null) => {
  if (!value) {
    return "Pending";
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM, HH:mm") : "Pending";
};

const formatTrialEndsLabel = (trialStarted?: string | null, trialPeriod?: number | string | null) => {
  if (!trialStarted || trialPeriod === null || trialPeriod === undefined || trialPeriod === "") {
    return "";
  }
  const start = dayjs(trialStarted);
  const periodDays = Number(trialPeriod);
  if (!start.isValid() || Number.isNaN(periodDays)) {
    return "";
  }
  const end = start.add(periodDays, "day");
  const daysLeft = Math.ceil(end.diff(dayjs(), "day", true));
  if (daysLeft <= 0) {
    return "Trial ended";
  }
  return `Trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
};

const VIEW_TABS = [
  { label: "Franchises", value: "franchises" },
  { label: "Stores", value: "roster" },
  { label: "Lifecycle", value: "lifecycle" },
] as const;

const LIFECYCLE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
] as const;

const LIFECYCLE_SEGMENT_OPTIONS = ["All segments", "City", "Category", "Partner"] as const;

const AdminStoresPage: FC = () => {
  const {
    dateRange,
    setDateRange,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    queryString,
    resetRange,
  } = useAdminDateRange("today");
  const [storeFilter, setStoreFilter] = useState<string>("top");
  const [searchQuery, setSearchQuery] = useState("");
  const [stores, setStores] = useState<StoresAnalyticsResponse["stores"]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<(typeof VIEW_TABS)[number]["value"]>("franchises");
  const [lifecycleRange, setLifecycleRange] = useState<(typeof LIFECYCLE_RANGE_OPTIONS)[number]["value"]>("30d");
  const [lifecycleSegment, setLifecycleSegment] = useState<(typeof LIFECYCLE_SEGMENT_OPTIONS)[number]>("All segments");
  const [lifecycleSearch, setLifecycleSearch] = useState("");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("all");
  const [activeFranchiseDrilldown, setActiveFranchiseDrilldown] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchAdminJson<StoresAnalyticsResponse>(
          `/api/admin/stores-analytics?${queryString}`
        );
        if (!result.ok) {
          if (result.isAuthError || result.isHtml) {
            clearAdminSession();
            const redirectFrom = `${location.pathname}${location.search}`;
            navigate("/admin/login", { replace: true, state: { from: redirectFrom } });
            return;
          }
          throw new Error(result.error || "Failed to load store analytics");
        }
        const payload = (result.data || {}) as StoresAnalyticsResponse;
        setStores(payload.stores || []);
      } catch (err) {
        setStores([]);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [queryString]);

  const franchiseOptions = useMemo(() => {
    const map = new Map<string, string>();
    stores.forEach((store) => {
      const id = normalizeFranchiseId(store.franchiseId);
      const label = store.franchiseName || store.franchiseId || "Unassigned";
      if (!map.has(id)) {
        map.set(id, label);
      }
    });
    return Array.from(map, ([id, label]) => ({ id, label })).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [stores]);

  const storeOptions = useMemo(() => {
    const filtered = stores.filter((store) => {
      const franchiseKey = normalizeFranchiseId(store.franchiseId);
      return franchiseKey === selectedFranchiseId;
    });
    return filtered
      .map((store) => ({
        id: normalizeStoreId(store.storeId),
        label: store.name ? `${store.name} (${store.storeId})` : store.storeId,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [stores, selectedFranchiseId]);

  useEffect(() => {
    if (selectedStoreId !== "all" && !storeOptions.some((option) => option.id === selectedStoreId)) {
      setSelectedStoreId("all");
    }
  }, [selectedStoreId, storeOptions]);

  useEffect(() => {
    setSelectedStoreId("all");
  }, [selectedFranchiseId]);

  useEffect(() => {
    if (activeView === "roster") {
      setSelectedFranchiseId((current) => current || franchiseOptions[0]?.id || "");
      setSelectedStoreId("all");
    }
  }, [activeView, franchiseOptions]);

  useEffect(() => {
    if (!selectedFranchiseId && franchiseOptions.length > 0) {
      setSelectedFranchiseId(franchiseOptions[0].id);
      setSelectedStoreId("all");
    }
  }, [selectedFranchiseId, franchiseOptions]);

  const scopedStores = useMemo(() => {
    if (!selectedFranchiseId) {
      return [];
    }
    return stores.filter((store) => {
      const franchiseKey = normalizeFranchiseId(store.franchiseId);
      if (franchiseKey !== selectedFranchiseId) {
        return false;
      }
      const storeKey = normalizeStoreId(store.storeId);
      if (selectedStoreId !== "all" && storeKey !== selectedStoreId) {
        return false;
      }
      return true;
    });
  }, [stores, selectedFranchiseId, selectedStoreId]);

  const franchiseCards = useMemo(() => {
    const groups = new Map<
      string,
      {
        franchiseId: string;
        franchiseName: string;
        cities: string[];
        storeCount: number;
        health: StoreHealth;
        invoices: number;
        ebillInvoices: number;
        totalCustomers: number;
        ebillCustomers: number;
        anonymousCustomers: number;
        campaignsSent: number;
        messagesSent: number;
      }
    >();

    const healthRank: Record<StoreHealth, number> = { healthy: 0, watch: 1, risk: 2 };

    scopedStores.forEach((store) => {
      const franchiseKey = normalizeFranchiseId(store.franchiseId);
      const franchiseLabel =
        store.franchiseName || store.franchiseId || "Unassigned";
      const cityValue = store.city ? String(store.city) : "";

      if (!groups.has(franchiseKey)) {
        groups.set(franchiseKey, {
          franchiseId: store.franchiseId ? String(store.franchiseId) : "Unassigned",
          franchiseName: franchiseLabel,
          cities: cityValue ? [cityValue] : [],
          storeCount: 0,
          health: store.healthStatus ?? "watch",
          invoices: 0,
          ebillInvoices: 0,
          totalCustomers: 0,
          ebillCustomers: 0,
          anonymousCustomers: 0,
          campaignsSent: 0,
          messagesSent: 0,
        });
      }

      const entry = groups.get(franchiseKey)!;
      entry.storeCount += 1;
      if (cityValue && !entry.cities.includes(cityValue)) {
        entry.cities.push(cityValue);
      }
      const nextHealth = store.healthStatus ?? "watch";
      if (healthRank[nextHealth] > healthRank[entry.health]) {
        entry.health = nextHealth;
      }
      entry.invoices += Number(store.invoices) || 0;
      entry.ebillInvoices += Number(store.ebillInvoices) || 0;
      entry.totalCustomers += Number(store.totalCustomers) || 0;
      entry.ebillCustomers += Number(store.eBillCustomers) || 0;
      entry.anonymousCustomers += Number(store.anonymousCustomers) || 0;
      entry.campaignsSent += Number(store.campaignsSent) || 0;
      entry.messagesSent += Number(store.messagesSent) || 0;
    });

    return Array.from(groups.values());
  }, [scopedStores]);

  const filteredFranchises = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    let data = franchiseCards;
    if (storeFilter === "risk") {
      data = data.filter((item) => item.health === "risk");
    } else if (storeFilter === "low") {
      data = data.filter((item) => item.health === "watch");
    }
    if (!normalized) {
      return data;
    }
    return data.filter((item) => {
      const haystack = [
        item.franchiseName,
        item.franchiseId,
        item.cities.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [franchiseCards, searchQuery, storeFilter]);

  const resolvedStores = useMemo<StoreSummary[]>(() => {
    if (!selectedFranchiseId) {
      return [];
    }
    if (!scopedStores.length) {
      return [
        {
          id: "placeholder",
          name: "Awaiting data",
          storeId: "--",
          city: "Pending",
          health: "healthy",
          badgeLabel: "Placeholder",
          invoicesToday: "--",
          ebillInvoices: "--",
          totalCustomers: "--",
          ebillCustomers: "--",
          anonymousCustomers: "--",
          campaignsSent: "--",
          messagesSent: "--",
          lastActiveLabel: "Pending",
          trialEndsLabel: "",
          campaigns7dLabel: "",
        },
      ];
    }
    return scopedStores.map((store) => ({
      id: store.storeId,
      name: store.name,
      storeId: store.storeId,
      city: store.city ?? "—",
      health: store.healthStatus ?? "watch",
      invoicesToday: formatNumber(store.invoices),
      ebillInvoices: formatNumber(store.ebillInvoices),
      totalCustomers: formatNumber(store.totalCustomers),
      ebillCustomers: formatNumber(store.eBillCustomers),
      anonymousCustomers: formatNumber(store.anonymousCustomers),
      campaignsSent: formatNumber(store.campaignsSent),
      messagesSent: formatNumber(store.messagesSent),
      lastActiveLabel: formatLastActive(store.lastActiveAt),
      trialEndsLabel: formatTrialEndsLabel(store.trialStarted, store.trialPeriod),
      campaigns7dLabel: "",
    }));
  }, [scopedStores]);

  const filteredStores = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return resolvedStores.filter((store) => {
      if (storeFilter === "risk") {
        return store.health === "risk";
      }
      if (storeFilter === "low") {
        return store.health === "watch";
      }
      const haystack = [store.name, store.storeId, store.city].filter(Boolean).join(" ").toLowerCase();
      if (!normalized) {
        return true;
      }
      return haystack.includes(normalized);
    });
  }, [resolvedStores, storeFilter, searchQuery]);

  const drilldownStores = useMemo(() => {
    if (!activeFranchiseDrilldown) {
      return [];
    }
    return scopedStores.filter(
      (store) => normalizeFranchiseId(store.franchiseId) === activeFranchiseDrilldown
    );
  }, [activeFranchiseDrilldown, scopedStores]);

  const filteredLifecycleData = useMemo<StoreLifecycleCard[]>(() => {
    const normalizedSearch = lifecycleSearch.trim().toLowerCase();
    return MOCK_LIFECYCLE_DATA.filter((card) => {
      const haystack = [card.storeName, card.storeId, card.city].join(" ").toLowerCase();
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
      // Segment filtering placeholder: when future segments exist, apply more nuanced logic.
      if (lifecycleSegment === "All segments") {
        return matchesSearch;
      }
      return matchesSearch;
    });
  }, [lifecycleSearch, lifecycleSegment]);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-gradient-to-r from-slate-950/70 via-indigo-900/40 to-slate-900/30 px-5 py-6 shadow-[0_20px_60px_rgba(2,6,23,0.65)] backdrop-blur sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200/90">
              {activeView === "roster" ? "Dashboard" : activeView === "franchises" ? "Franchise" : "Lifecycle"}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              {activeView === "roster"
                ? "Stores"
                : activeView === "franchises"
                ? "Franchise Roster"
                : "Store Lifecycle"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              {activeView === "roster"
                ? "Plug backend store metrics into these cards to monitor franchise health."
                : activeView === "franchises"
                ? "Review franchise health at a glance before drilling into stores."
                : "Track stores from onboarding to churn and see where activity is getting stuck."}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="inline-flex w-full flex-wrap rounded-full border border-white/10 bg-white/5 p-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 sm:w-auto">
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveView(tab.value)}
                  className={[
                    "flex-1 rounded-full px-4 py-2 text-center transition sm:flex-none",
                    activeView === tab.value ? "bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 text-white" : "text-white/60",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {activeView === "roster" || activeView === "franchises" ? (
              <>
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
                  onChange={(event) => setSelectedFranchiseId(event.target.value)}
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white sm:w-auto"
                >
                  {franchiseOptions.map((option) => (
                    <option key={option.id} value={option.id} className="bg-[#050816] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedStoreId}
                  onChange={(event) => setSelectedStoreId(event.target.value)}
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white sm:w-auto"
                >
                  <option value="all" className="bg-[#050816] text-white">
                    All stores
                  </option>
                  {storeOptions.map((option) => (
                    <option key={option.id} value={option.id} className="bg-[#050816] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <select
                  value={lifecycleRange}
                  onChange={(event) => setLifecycleRange(event.target.value as typeof lifecycleRange)}
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_10px_40px_rgba(2,6,23,0.5)] sm:w-auto"
                >
                  {LIFECYCLE_RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#050816] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedFranchiseId}
                  onChange={(event) => setSelectedFranchiseId(event.target.value)}
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white sm:w-auto"
                >
                  {franchiseOptions.map((option) => (
                    <option key={option.id} value={option.id} className="bg-[#050816] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedStoreId}
                  onChange={(event) => setSelectedStoreId(event.target.value)}
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white sm:w-auto"
                >
                  <option value="all" className="bg-[#050816] text-white">
                    All stores
                  </option>
                  {storeOptions.map((option) => (
                    <option key={option.id} value={option.id} className="bg-[#050816] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {activeView === "roster" ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={storeFilter}
                onChange={(event) => setStoreFilter(event.target.value)}
                className="w-full appearance-none rounded-full border border-white/10 bg-white/5 px-4 py-2 pr-10 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_10px_40px_rgba(2,6,23,0.5)] sm:w-auto"
              >
                {STORE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#050816] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/70">
                <ChevronDown className="h-3 w-3" />
              </span>
            </div>
            <button
              type="button"
              onClick={resetRange}
              className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 shadow-[0_10px_40px_rgba(2,6,23,0.5)] hover:text-white sm:w-auto"
            >
              Reset
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={lifecycleSegment}
              onChange={(event) =>
                setLifecycleSegment(event.target.value as (typeof LIFECYCLE_SEGMENT_OPTIONS)[number])
              }
              className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_10px_40px_rgba(2,6,23,0.5)] sm:w-auto"
            >
              {LIFECYCLE_SEGMENT_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-[#050816] text-white">
                  {option}
                </option>
              ))}
            </select>
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={lifecycleSearch}
                onChange={(event) => setLifecycleSearch(event.target.value)}
                placeholder="Search by store name, ID, or phone…"
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 pl-10 text-sm text-white placeholder-white/40 focus:border-cyan-300/50 focus:outline-none"
              />
            </div>
          </div>
        )}
      </header>

      {activeView === "franchises" ? (
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">Franchise roster</p>
          <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-5 sm:p-6">
            {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}
            <div className="mb-4">
              <label htmlFor="franchise-search" className="sr-only">
                Search franchises
              </label>
              <input
                id="franchise-search"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search franchise name, ID, or city"
                className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white placeholder-white/40 shadow-[0_10px_35px_rgba(2,6,23,0.45)] focus:border-cyan-300/50 focus:outline-none"
              />
            </div>
            {isLoading ? (
              <p className="text-sm text-white/70">Loading franchises…</p>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {filteredFranchises.map((franchise) => {
                  const adoption =
                    franchise.invoices > 0
                      ? (franchise.ebillInvoices / franchise.invoices) * 100
                      : 0;
                  const badgeLabel =
                    franchise.health === "risk"
                      ? "AT_RISK"
                      : franchise.health === "watch"
                      ? "NEW"
                      : "HEALTHY";
                  return (
                    <article
                      key={franchise.franchiseId}
                      className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c1024] via-[#131f4a] to-[#0b0f20] px-5 py-6 text-white shadow-[0_30px_80px_rgba(3,7,18,0.7)] sm:px-8 sm:py-7"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4 sm:gap-6">
                        <div>
                          <h3 className="text-lg font-semibold sm:text-xl">{franchise.franchiseName}</h3>
                          <p className="text-sm text-white/70">
                            Franchise ID {franchise.franchiseId}
                            {franchise.cities.length ? ` • ${franchise.cities.join(", ")}` : ""}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/50">
                            {franchise.storeCount} stores
                          </p>
                        </div>
                        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                          {badgeLabel}
                        </span>
                      </div>

                      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 sm:gap-6">
                        <div className="space-y-2">
                          <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">Total invoices</dt>
                          <dd className="text-lg font-semibold">{formatNumber(franchise.invoices)}</dd>
                        </div>
                        <div className="space-y-2">
                          <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">E-bill invoices</dt>
                          <dd className="text-lg font-semibold">{formatNumber(franchise.ebillInvoices)}</dd>
                        </div>
                        <div className="space-y-2">
                          <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">Total customers</dt>
                          <dd className="text-lg font-semibold">{formatNumber(franchise.totalCustomers)}</dd>
                        </div>
                        <div className="space-y-2">
                          <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">E-bill customers</dt>
                          <dd className="text-lg font-semibold">{formatNumber(franchise.ebillCustomers)}</dd>
                        </div>
                        <div className="space-y-2">
                          <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">Anonymous customers</dt>
                          <dd className="text-lg font-semibold">{formatNumber(franchise.anonymousCustomers)}</dd>
                        </div>
                        <div className="space-y-2">
                          <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">Campaigns sent</dt>
                          <dd className="text-lg font-semibold">{formatNumber(franchise.campaignsSent)}</dd>
                        </div>
                        <div className="space-y-2">
                          <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">Messages sent</dt>
                          <dd className="text-lg font-semibold">{formatNumber(franchise.messagesSent)}</dd>
                        </div>
                        <div className="space-y-2">
                          <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">Adoption %</dt>
                          <dd className="text-lg font-semibold">{adoption.toFixed(1)}%</dd>
                        </div>
                      </dl>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
                        <span>Worst health: {badgeLabel.replace("_", " ")}</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveFranchiseDrilldown(normalizeFranchiseId(franchise.franchiseId))}
                            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white/20"
                          >
                            View stores
                          </button>
                          <Link
                            to={`/admin-panel/franchises/${franchise.franchiseId}`}
                            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white/20"
                          >
                            <Settings className="h-3.5 w-3.5" />
                            Manage Franchise
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : activeView === "roster" ? (
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">Store roster</p>
          <div className="rounded-3xl border border-white/5 bg-slate-950/60 p-5 sm:p-6">
            {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}
            <div className="mb-4">
              <label htmlFor="store-search" className="sr-only">
                Search stores
              </label>
              <input
                id="store-search"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search store, ID, or city…"
                className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white placeholder-white/40 shadow-[0_10px_35px_rgba(2,6,23,0.45)] focus:border-cyan-300/50 focus:outline-none"
              />
            </div>
            {isLoading ? (
              <p className="text-sm text-white/70">Loading stores…</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredStores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <StoreLifecycleBoard data={filteredLifecycleData} />
      )}

      {activeFranchiseDrilldown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b1020] p-4 text-white shadow-[0_25px_80px_rgba(2,6,23,0.7)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Stores</p>
                <h2 className="text-2xl font-semibold text-white">Franchise stores</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveFranchiseDrilldown(null)}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {drilldownStores.length ? (
                drilldownStores.map((store) => (
                  <StoreCard
                    key={store.storeId}
                    store={{
                      id: store.storeId,
                      name: store.name,
                      storeId: store.storeId,
                      city: store.city ?? "--",
                      health: store.healthStatus ?? "watch",
                      invoicesToday: formatNumber(store.invoices),
                      ebillInvoices: formatNumber(store.ebillInvoices),
                      totalCustomers: formatNumber(store.totalCustomers),
                      ebillCustomers: formatNumber(store.eBillCustomers),
                      anonymousCustomers: formatNumber(store.anonymousCustomers),
                      campaignsSent: formatNumber(store.campaignsSent),
                      messagesSent: formatNumber(store.messagesSent),
                      lastActiveLabel: formatLastActive(store.lastActiveAt),
                      trialEndsLabel: formatTrialEndsLabel(store.trialStarted, store.trialPeriod),
                      campaigns7dLabel: "",
                    }}
                  />
                ))
              ) : (
                <p className="text-sm text-white/70">No stores for this franchise.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStoresPage;
