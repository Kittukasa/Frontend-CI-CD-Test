import type { FC } from 'react';
import { Link } from 'react-router-dom';

export type StoreHealth = 'healthy' | 'watch' | 'risk';

export interface StoreSummary {
  id: string;
  name: string;
  storeId: string;
  city: string;
  health: StoreHealth;
  badgeLabel?: string;
  invoicesToday: string;
  ebillInvoices: string;
  totalCustomers: string;
  ebillCustomers: string;
  anonymousCustomers: string;
  campaignsSent: string;
  messagesSent: string;
  lastActiveLabel: string;
  trialEndsLabel: string;
  campaigns7dLabel: string;
}

const HEALTH_STYLES: Record<StoreHealth, { badge: string; dot: string; accent: string }> = {
  healthy: {
    badge: 'bg-emerald-500/20 text-emerald-200',
    dot: 'bg-emerald-400',
    accent: 'text-emerald-200',
  },
  watch: {
    badge: 'bg-amber-500/30 text-amber-200',
    dot: 'bg-amber-400',
    accent: 'text-amber-200',
  },
  risk: {
    badge: 'bg-rose-500/30 text-rose-200',
    dot: 'bg-rose-400',
    accent: 'text-rose-200',
  },
};

const StoreCard: FC<{ store: StoreSummary }> = ({ store }) => {
  const palette = HEALTH_STYLES[store.health];
  return (
    <Link to={`/admin-panel/stores/${store.storeId}`} className="group block focus:outline-none">
      <article className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c1024] via-[#131f4a] to-[#0b0f20] px-5 py-5 text-white shadow-[0_30px_80px_rgba(3,7,18,0.7)] transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_40px_90px_rgba(3,7,18,0.75)] sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-4 sm:gap-6">
          <div>
            <h3 className="text-lg font-semibold sm:text-xl">{store.name}</h3>
            <p className="text-sm text-white/70">
              Store ID {store.storeId} • {store.city}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide ${palette.badge}`}
            >
              {store.health === 'healthy'
                ? 'Healthy'
                : store.health === 'watch'
                ? 'Watch'
                : 'At risk'}
            </span>
            {store.badgeLabel && (
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {store.badgeLabel}
              </span>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 sm:gap-6">
          <div className="space-y-2">
            <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">
              Total invoices
            </dt>
            <dd className="text-lg font-semibold">{store.invoicesToday}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">
              E-bill invoices
            </dt>
            <dd className="text-lg font-semibold">{store.ebillInvoices}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">
              Total customers
            </dt>
            <dd className="text-lg font-semibold">{store.totalCustomers}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">
              E-bill customers
            </dt>
            <dd className="text-lg font-semibold">{store.ebillCustomers}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">
              Anonymous customers
            </dt>
            <dd className="text-lg font-semibold">{store.anonymousCustomers}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">
              Campaigns sent
            </dt>
            <dd className="text-lg font-semibold">{store.campaignsSent}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.3em]">
              Messages sent
            </dt>
            <dd className="text-lg font-semibold">{store.messagesSent}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
          <div className="inline-flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${palette.dot}`} />
            <span>
              Last active: <strong className="text-white/90">{store.lastActiveLabel}</strong>
            </span>
          </div>
          {store.trialEndsLabel ? (
            <span className="text-xs text-white/60">{store.trialEndsLabel}</span>
          ) : null}
        </div>
      </article>
    </Link>
  );
};

export default StoreCard;
