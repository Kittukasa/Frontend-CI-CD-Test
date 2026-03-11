import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { clearAdminSession, withAdminAuthHeaders } from '@/utils/adminAuth';

type FranchiseConfig = {
  franchise_id?: string;
  utility_charges?: number | string | null;
  marketing_charges?: number | string | null;
  balance_credits?: number | string | null;
  last_recharge_amount?: number | string | null;
  last_recharge_date?: string | null;
  recharge_history?: string | null;
  usage_history?: string | null;
  campaign_free_messages?: number | string | null;
  minimum_charge?: number | string | null;
  reserved_credits?: number | string | null;
  recharge_alert_credits?: number | string | null;
  wallet_enabled?: boolean | null;
  trial_start?: string | null;
  trial_end?: string | null;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  plan_start_date?: string | null;
  plan_end_date?: string | null;
  global_smart_ebill_enabled?: boolean | null;
};

type FranchiseFormState = {
  utility_charges: string;
  marketing_charges: string;
  balance_credits: string;
  last_recharge_amount: string;
  last_recharge_date: string;
  recharge_history: string;
  usage_history: string;
  campaign_free_messages: string;
  minimum_charge: string;
  reserved_credits: string;
  recharge_alert_credits: string;
  wallet_enabled: boolean;
  trial_start: string;
  trial_end: string;
  trial_start_date: string;
  trial_end_date: string;
  plan_start_date: string;
  plan_end_date: string;
  global_smart_ebill_enabled: boolean;
};

const toDateInputValue = (value: unknown) => {
  if (!value) return '';
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return '';
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

const buildInitialForm = (franchise?: FranchiseConfig | null): FranchiseFormState => ({
  utility_charges:
    franchise?.utility_charges === null || franchise?.utility_charges === undefined
      ? ''
      : String(franchise.utility_charges),
  marketing_charges:
    franchise?.marketing_charges === null || franchise?.marketing_charges === undefined
      ? ''
      : String(franchise.marketing_charges),
  balance_credits:
    franchise?.balance_credits === null || franchise?.balance_credits === undefined
      ? ''
      : String(franchise.balance_credits),
  last_recharge_amount:
    franchise?.last_recharge_amount === null || franchise?.last_recharge_amount === undefined
      ? ''
      : String(franchise.last_recharge_amount),
  last_recharge_date: toDateInputValue(franchise?.last_recharge_date),
  recharge_history: franchise?.recharge_history ? String(franchise.recharge_history) : '',
  usage_history: franchise?.usage_history ? String(franchise.usage_history) : '',
  campaign_free_messages:
    franchise?.campaign_free_messages === null || franchise?.campaign_free_messages === undefined
      ? ''
      : String(franchise.campaign_free_messages),
  minimum_charge:
    franchise?.minimum_charge === null || franchise?.minimum_charge === undefined
      ? ''
      : String(franchise.minimum_charge),
  reserved_credits:
    franchise?.reserved_credits === null || franchise?.reserved_credits === undefined
      ? ''
      : String(franchise.reserved_credits),
  recharge_alert_credits:
    franchise?.recharge_alert_credits === null || franchise?.recharge_alert_credits === undefined
      ? ''
      : String(franchise.recharge_alert_credits),
  wallet_enabled: franchise?.wallet_enabled !== false,
  trial_start: toDateInputValue(franchise?.trial_start_date ?? franchise?.trial_start),
  trial_end: toDateInputValue(franchise?.trial_end_date ?? franchise?.trial_end),
  trial_start_date: toDateInputValue(franchise?.trial_start_date ?? franchise?.trial_start),
  trial_end_date: toDateInputValue(franchise?.trial_end_date ?? franchise?.trial_end),
  plan_start_date: toDateInputValue(franchise?.plan_start_date),
  plan_end_date: toDateInputValue(franchise?.plan_end_date),
  global_smart_ebill_enabled: franchise?.global_smart_ebill_enabled === true,
});

const AdminFranchiseDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { franchiseId } = useParams<{ franchiseId: string }>();
  const [franchise, setFranchise] = useState<FranchiseConfig | null>(null);
  const [formState, setFormState] = useState<FranchiseFormState>(() => buildInitialForm(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [updatedStoreCount, setUpdatedStoreCount] = useState<number | null>(null);

  useEffect(() => {
    if (!franchiseId) {
      setError('Franchise ID is missing.');
      setLoading(false);
      return;
    }

    const fetchFranchise = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/admin/franchises/${franchiseId}`, {
          headers: withAdminAuthHeaders(),
        });
        if (response.status === 401 || response.status === 403) {
          clearAdminSession();
          const redirectFrom = `${location.pathname}${location.search}`;
          navigate('/admin/login', { replace: true, state: { from: redirectFrom } });
          return;
        }
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || 'Unable to load franchise details.');
        }
        const franchiseData = (payload?.franchise || null) as FranchiseConfig | null;
        setFranchise(franchiseData);
        setFormState(buildInitialForm(franchiseData));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load franchise details.');
      } finally {
        setLoading(false);
      }
    };

    fetchFranchise();
  }, [franchiseId, location.pathname, location.search, navigate]);

  const handleFieldChange = (key: keyof FranchiseFormState, value: string | boolean) => {
    setFormState(prev => ({ ...prev, [key]: value }));
    setStatus(null);
    setUpdatedStoreCount(null);
  };

  const handleSave = async () => {
    if (!franchiseId || saving) return;
    setSaving(true);
    setStatus(null);
    try {
      const payload = {
        utility_charges: formState.utility_charges || null,
        marketing_charges: formState.marketing_charges || null,
        balance_credits: formState.balance_credits || null,
        last_recharge_amount: formState.last_recharge_amount || null,
        last_recharge_date: formState.last_recharge_date || null,
        recharge_history: formState.recharge_history || null,
        usage_history: formState.usage_history || null,
        campaign_free_messages: formState.campaign_free_messages || null,
        minimum_charge: formState.minimum_charge || null,
        reserved_credits: formState.reserved_credits || null,
        recharge_alert_credits: formState.recharge_alert_credits || null,
        wallet_enabled: formState.wallet_enabled,
        trial_start: formState.trial_start || null,
        trial_end: formState.trial_end || null,
        trial_start_date: formState.trial_start || null,
        trial_end_date: formState.trial_end || null,
        plan_start_date: formState.plan_start_date || null,
        plan_end_date: formState.plan_end_date || null,
        global_smart_ebill_enabled: formState.global_smart_ebill_enabled,
      };
      const response = await fetch(`/api/admin/franchises/${franchiseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...withAdminAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });
      if (response.status === 401 || response.status === 403) {
        clearAdminSession();
        const redirectFrom = `${location.pathname}${location.search}`;
        navigate('/admin/login', { replace: true, state: { from: redirectFrom } });
        return;
      }
      const payloadResponse = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payloadResponse?.error || 'Unable to save franchise details.');
      }
      const updated = (payloadResponse?.franchise || null) as FranchiseConfig | null;
      setFranchise(updated);
      setFormState(buildInitialForm(updated));
      setUpdatedStoreCount(
        typeof payloadResponse?.updated_store_count === 'number'
          ? payloadResponse.updated_store_count
          : null
      );
      setStatus('Saved successfully.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to save franchise details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate('/admin-panel/stores')}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 hover:bg-white/10 sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Stores
        </button>
        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
            Franchise Settings
          </p>
          <h1 className="text-2xl font-semibold text-white">{franchiseId || 'Franchise'}</h1>
          <p className="text-xs text-white/50">Franchise ID {franchiseId}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.65)]">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading franchise details…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
                Wallet Access
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Wallet visibility
                  </label>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('wallet_enabled', true)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                        formState.wallet_enabled
                          ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-300/40'
                          : 'bg-white/5 text-white/70 border border-white/10'
                      }`}
                    >
                      Enabled
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('wallet_enabled', false)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                        !formState.wallet_enabled
                          ? 'bg-rose-400/20 text-rose-200 border border-rose-300/40'
                          : 'bg-white/5 text-white/70 border border-white/10'
                      }`}
                    >
                      Disabled
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Global Smart E-bill
                  </label>
                  <p className="mt-2 text-xs text-white/50">
                    One click updates Smart E-bill enablement for every store in this franchise.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('global_smart_ebill_enabled', true)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                        formState.global_smart_ebill_enabled
                          ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-300/40'
                          : 'bg-white/5 text-white/70 border border-white/10'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('global_smart_ebill_enabled', false)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                        !formState.global_smart_ebill_enabled
                          ? 'bg-rose-400/20 text-rose-200 border border-rose-300/40'
                          : 'bg-white/5 text-white/70 border border-white/10'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
                Plan / Trial Details
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Trial start
                  </label>
                  <input
                    type="date"
                    value={formState.trial_start}
                    onChange={event => handleFieldChange('trial_start', event.target.value)}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Trial end
                  </label>
                  <input
                    type="date"
                    value={formState.trial_end}
                    onChange={event => handleFieldChange('trial_end', event.target.value)}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Plan start date
                  </label>
                  <input
                    type="date"
                    value={formState.plan_start_date}
                    onChange={event => handleFieldChange('plan_start_date', event.target.value)}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Plan end date
                  </label>
                  <input
                    type="date"
                    value={formState.plan_end_date}
                    onChange={event => handleFieldChange('plan_end_date', event.target.value)}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
                Campaign Free Trial
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Campaign messages (free trial)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.campaign_free_messages}
                    onChange={event =>
                      handleFieldChange('campaign_free_messages', event.target.value)
                    }
                    placeholder="e.g. 30000"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
                Admin Panel – Pricing
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Utility charges (Smart e-bill)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.utility_charges}
                    onChange={event => handleFieldChange('utility_charges', event.target.value)}
                    placeholder="e.g. 0.5"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Marketing charges
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.marketing_charges}
                    onChange={event => handleFieldChange('marketing_charges', event.target.value)}
                    placeholder="e.g. 1"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Minimum charge
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.minimum_charge}
                    onChange={event => handleFieldChange('minimum_charge', event.target.value)}
                    placeholder="e.g. 100"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
                Wallet & Recharge
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Balance credits
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.balance_credits}
                    onChange={event => handleFieldChange('balance_credits', event.target.value)}
                    placeholder="e.g. 10000"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Reserved credits
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.reserved_credits}
                    onChange={event => handleFieldChange('reserved_credits', event.target.value)}
                    placeholder="e.g. 500"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Recharge alert credits
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.recharge_alert_credits}
                    onChange={event =>
                      handleFieldChange('recharge_alert_credits', event.target.value)
                    }
                    placeholder="e.g. 200"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Last recharge amount
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.last_recharge_amount}
                    onChange={event =>
                      handleFieldChange('last_recharge_amount', event.target.value)
                    }
                    placeholder="e.g. 5000"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Last recharge date
                  </label>
                  <input
                    type="date"
                    value={formState.last_recharge_date}
                    onChange={event => handleFieldChange('last_recharge_date', event.target.value)}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)] md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Recharge history / Wallet activity
                  </label>
                  <textarea
                    value={formState.recharge_history}
                    onChange={event => handleFieldChange('recharge_history', event.target.value)}
                    placeholder="Notes or ledger references"
                    className="mt-3 min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
                Usage History
              </p>
              <div className="mt-4 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Usage history
                  </label>
                  <textarea
                    value={formState.usage_history}
                    onChange={event => handleFieldChange('usage_history', event.target.value)}
                    placeholder="Usage notes or analytics references"
                    className="mt-3 min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {status && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                {status}
                {updatedStoreCount !== null && (
                  <span className="ml-2 text-white/60">
                    Updated {updatedStoreCount} store rows.
                  </span>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(34,211,238,0.4)] transition hover:bg-cyan-400 disabled:opacity-60 sm:w-auto"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFranchiseDetailsPage;
