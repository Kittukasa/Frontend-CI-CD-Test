import { ArrowRight, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import type { FC, ReactNode } from 'react';

export type StoreLifecycleStage = 'LEAD' | 'ONBOARDING' | 'LIVE' | 'AT_RISK' | 'CHURNED';

export interface StoreLifecycleCard {
  storeId: string;
  storeName: string;
  city: string;
  plan: 'Free' | 'Basic' | 'Pro' | 'Enterprise';
  mrrInr: number;
  stage: StoreLifecycleStage;
  daysInStage: number;
  lastInvoiceAt?: string;
  churnedAt?: string;
  churnReason?: string;
  onboardingChecklist?: {
    kycCompleted: boolean;
    whatsappConnected: boolean;
    posIntegrated: boolean;
    firstBillSent: boolean;
  };
  riskFlags?: string[];
}

export const MOCK_LIFECYCLE_DATA: StoreLifecycleCard[] = [
  {
    storeId: 'BBX-2031',
    storeName: 'Organic Basket',
    city: 'Bengaluru',
    plan: 'Basic',
    mrrInr: 6500,
    stage: 'LEAD',
    daysInStage: 4,
  },
  {
    storeId: 'BBX-1954',
    storeName: 'Lotus Luxe Salon',
    city: 'Hyderabad',
    plan: 'Pro',
    mrrInr: 12500,
    stage: 'ONBOARDING',
    daysInStage: 9,
    onboardingChecklist: {
      kycCompleted: true,
      whatsappConnected: false,
      posIntegrated: true,
      firstBillSent: false,
    },
  },
  {
    storeId: 'BBX-1822',
    storeName: 'Metro Mart',
    city: 'Mumbai',
    plan: 'Enterprise',
    mrrInr: 42000,
    stage: 'LIVE',
    daysInStage: 72,
    lastInvoiceAt: 'Today 10:32 AM',
  },
  {
    storeId: 'BBX-1765',
    storeName: 'Cafe Verde',
    city: 'Delhi',
    plan: 'Basic',
    mrrInr: 9800,
    stage: 'AT_RISK',
    daysInStage: 11,
    riskFlags: ['Low invoices (35% drop)', 'Last invoice 8 days ago'],
  },
  {
    storeId: 'BBX-1602',
    storeName: 'Pixel Electronics',
    city: 'Pune',
    plan: 'Pro',
    mrrInr: 0,
    stage: 'CHURNED',
    daysInStage: 3,
    churnedAt: '24 Nov 2025',
    churnReason: 'Switched to in-house billing',
  },
  {
    storeId: 'BBX-2044',
    storeName: 'Wellness Plus Pharmacy',
    city: 'Bengaluru',
    plan: 'Enterprise',
    mrrInr: 38000,
    stage: 'LIVE',
    daysInStage: 15,
    lastInvoiceAt: 'Yesterday 6:15 PM',
  },
  {
    storeId: 'BBX-1999',
    storeName: 'City Fresh Supermarket',
    city: 'Chennai',
    plan: 'Pro',
    mrrInr: 20500,
    stage: 'ONBOARDING',
    daysInStage: 6,
    onboardingChecklist: {
      kycCompleted: true,
      whatsappConnected: true,
      posIntegrated: false,
      firstBillSent: false,
    },
  },
  {
    storeId: 'BBX-1744',
    storeName: 'Beacon Outfitters',
    city: 'Delhi',
    plan: 'Basic',
    mrrInr: 8700,
    stage: 'AT_RISK',
    daysInStage: 18,
    riskFlags: ['WA delivery issues', 'No campaigns in 21 days'],
  },
  {
    storeId: 'BBX-2077',
    storeName: 'Nova Hyperlocal',
    city: 'Kolkata',
    plan: 'Free',
    mrrInr: 0,
    stage: 'LEAD',
    daysInStage: 2,
  },
];

const LIFECYCLE_COLUMNS: Array<{
  stage: StoreLifecycleStage;
  label: string;
  accent: string;
}> = [
  { stage: 'LEAD', label: 'Leads', accent: 'text-cyan-300' },
  { stage: 'ONBOARDING', label: 'Onboarding', accent: 'text-indigo-300' },
  { stage: 'LIVE', label: 'Live', accent: 'text-emerald-300' },
  { stage: 'AT_RISK', label: 'At Risk', accent: 'text-amber-300' },
  { stage: 'CHURNED', label: 'Churned', accent: 'text-rose-300' },
];

interface StoreLifecycleBoardProps {
  data: StoreLifecycleCard[];
}

const StoreLifecycleBoard: FC<StoreLifecycleBoardProps> = ({ data }) => {
  const grouped = LIFECYCLE_COLUMNS.reduce<Record<StoreLifecycleStage, StoreLifecycleCard[]>>(
    (acc, column) => {
      acc[column.stage] = data.filter(card => card.stage === column.stage);
      return acc;
    },
    {
      LEAD: [],
      ONBOARDING: [],
      LIVE: [],
      AT_RISK: [],
      CHURNED: [],
    }
  );

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {LIFECYCLE_COLUMNS.map(column => (
          <LifecycleColumn
            key={column.stage}
            label={column.label}
            accentClass={column.accent}
            cards={grouped[column.stage]}
          />
        ))}
      </div>
    </section>
  );
};

interface LifecycleColumnProps {
  label: string;
  accentClass: string;
  cards: StoreLifecycleCard[];
}

const LifecycleColumn = ({ label, accentClass, cards }: LifecycleColumnProps) => (
  <div className="flex h-full flex-col rounded-3xl border border-white/5 bg-slate-950/60 p-4 shadow-[0_25px_80px_rgba(2,6,23,0.65)] backdrop-blur">
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${accentClass}`}>{label}</p>
        <p className="text-sm text-white/60">
          {cards.length} store{cards.length === 1 ? '' : 's'}
        </p>
      </div>
    </div>
    <div className="mt-4 flex-1 space-y-4 overflow-auto pr-1">
      {cards.length === 0 ? (
        <p className="text-sm text-white/50">No stores in this stage.</p>
      ) : (
        cards.map(card => <LifecycleStoreCard key={card.storeId} card={card} />)
      )}
    </div>
  </div>
);

interface LifecycleStoreCardProps {
  card: StoreLifecycleCard;
}

const LifecycleStoreCard = ({ card }: LifecycleStoreCardProps) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-[0_20px_60px_rgba(1,3,12,0.65)]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-base font-semibold">{card.storeName}</p>
        <p className="text-xs text-white/60">
          {card.storeId} • {card.city}
        </p>
      </div>
      <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-widest text-white/70">
        {card.plan}
      </span>
    </div>
    <div className="mt-3 flex items-center justify-between text-sm text-white/70">
      <span className="font-semibold text-white">₹{card.mrrInr.toLocaleString('en-IN')}</span>
      <span>{card.daysInStage} days in stage</span>
    </div>
    {card.onboardingChecklist && <OnboardingChecklistBadges checklist={card.onboardingChecklist} />}
    {card.riskFlags && card.riskFlags.length > 0 && <RiskFlagsBadges flags={card.riskFlags} />}
    {card.stage === 'LIVE' && card.lastInvoiceAt && (
      <p className="mt-3 text-xs text-white/60">Last invoice: {card.lastInvoiceAt}</p>
    )}
    {card.stage === 'CHURNED' && (
      <div className="mt-3 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-200">
        <p className="font-semibold">Churned on {card.churnedAt}</p>
        <p className="mt-1 text-rose-100/80">{card.churnReason}</p>
      </div>
    )}
    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-cyan-200">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200 hover:bg-cyan-500/10"
      >
        View store
        <ArrowRight className="h-3 w-3" />
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/70 hover:bg-white/5"
      >
        Move
      </button>
    </div>
  </div>
);

interface OnboardingChecklistBadgesProps {
  checklist: NonNullable<StoreLifecycleCard['onboardingChecklist']>;
}

const OnboardingChecklistBadges = ({ checklist }: OnboardingChecklistBadgesProps) => {
  const entries: Array<{ key: keyof typeof checklist; label: string; value: boolean }> = [
    { key: 'kycCompleted', label: 'KYC', value: checklist.kycCompleted },
    { key: 'whatsappConnected', label: 'WhatsApp', value: checklist.whatsappConnected },
    { key: 'posIntegrated', label: 'POS', value: checklist.posIntegrated },
    { key: 'firstBillSent', label: 'First bill', value: checklist.firstBillSent },
  ];

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {entries.map(entry => (
        <ChecklistBadge key={entry.key} label={entry.label} completed={entry.value} />
      ))}
    </div>
  );
};

interface ChecklistBadgeProps {
  label: string;
  completed: boolean;
}

const ChecklistBadge = ({ label, completed }: ChecklistBadgeProps) => {
  const Icon = completed ? CheckCircle2 : Circle;
  const badgeClasses = completed
    ? 'bg-emerald-500/10 text-emerald-200 border-emerald-400/20'
    : 'bg-white/5 text-white/60 border-white/10';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] uppercase tracking-widest ${badgeClasses}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

interface RiskFlagsBadgesProps {
  flags: string[];
}

const RiskFlagsBadges = ({ flags }: RiskFlagsBadgesProps) => (
  <div className="mt-3 space-y-2">
    {flags.map(flag => (
      <RiskBadge key={flag}>{flag}</RiskBadge>
    ))}
  </div>
);

const RiskBadge = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
    <AlertTriangle className="h-3.5 w-3.5" />
    <span>{children}</span>
  </div>
);

export default StoreLifecycleBoard;
