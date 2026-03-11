import type { FC, ReactNode } from "react";

const SectionCard: FC<{ title: string; description: string; children: ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <section className="rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur">
    <div className="mb-4 space-y-2">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="text-sm text-white/70">{description}</p>
    </div>
    {children}
  </section>
);

const PlaceholderToggle: FC<{ label: string; helper?: string }> = ({ label, helper }) => (
  <label className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
    <div>
      <p className="font-semibold text-white">{label}</p>
      {helper && <p className="text-xs text-white/60">{helper}</p>}
    </div>
    <span className="relative inline-flex h-5 w-10 cursor-not-allowed items-center rounded-full border border-white/20 bg-white/10">
      <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white transition" />
    </span>
  </label>
);

const AdminSettingsPage: FC = () => (
  <div className="space-y-6">
    <header className="rounded-3xl border border-white/5 bg-gradient-to-r from-slate-950/70 via-indigo-900/40 to-slate-900/30 px-6 py-8 shadow-[0_20px_60px_rgba(2,6,23,0.65)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200/90">Operations</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white">Settings</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/70">
        Configure Billbox platform defaults, vendor controls, WhatsApp, OCR, and admin security.
      </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
          Environment: Dev
        </span>
      </div>
    </header>

    <div className="grid gap-6 2xl:grid-cols-2">
      <SectionCard title="Platform & Organization" description="Core Billbox organization details and environment context.">
        <div className="grid gap-4">
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="text-xs uppercase tracking-[0.3em] text-white/50">Org name</label>
            <input
              type="text"
              readOnly
              placeholder="Billbox HQ"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/40"
            />
          </div>
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="text-xs uppercase tracking-[0.3em] text-white/50">Support email</label>
            <input
              type="email"
              placeholder="support@example.com"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/40"
            />
          </div>
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="text-xs uppercase tracking-[0.3em] text-white/50">Default timezone</label>
            <p className="text-sm text-white">IST (UTC+05:30) — locked</p>
          </div>
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="text-xs uppercase tracking-[0.3em] text-white/50">Data retention policy</label>
            <p className="text-sm text-white/70">Placeholder: 365 days (read-only)</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Vendor / Store Defaults" description="Default settings applied when onboarding new stores.">
        <div className="space-y-4">
          <PlaceholderToggle label="WhatsApp campaigns enabled" helper="Toggle future default once backend is ready." />
          <PlaceholderToggle label="E-bill sending enabled" />
          <PlaceholderToggle label="OCR & LLM parsing enabled" />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Store categories</p>
            <p className="text-sm text-white/70">Pharmacy, Grocery, Restaurant — editable soon.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Auto-health thresholds</p>
            <p className="text-sm text-white/70">Placeholder sliders for risk/healthy boundaries.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="WhatsApp & Messaging" description="Phone number quality, campaign guardrails, and retry policies.">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">WABA / number health</p>
            <button className="mt-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
              View dashboard
            </button>
          </div>
          <PlaceholderToggle label="Marketing templates allowed by default" />
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="text-xs uppercase tracking-[0.3em] text-white/50">Daily campaign limit per store</label>
            <input
              type="number"
              placeholder="e.g. 500"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/40"
            />
          </div>
          <PlaceholderToggle label="Retry failed messages" helper="Placeholder retries (3 attempts)" />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Opt-out keywords</p>
            <p className="text-sm text-white/70">STOP, UNSUBSCRIBE — editable soon.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="OCR & Invoice Parsing" description="Manage extraction pipeline defaults and cost guardrails.">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">LLM model</p>
            <p className="text-sm text-white/70">billbox-ocr-v1 (read-only)</p>
          </div>
          <PlaceholderToggle label="Confidence threshold 0.85" helper="Adjust slider once backend ready." />
          <PlaceholderToggle label="Auto-retry parsing (2 attempts)" />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pipeline status</p>
            <button className="mt-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
              View ingestion health
            </button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Cost guardrails</p>
            <p className="text-sm text-white/70">Daily cap ₹-- / Monthly cap ₹-- (placeholder)</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Roles & Access" description="Admin permissions overview and security policies.">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Admins</p>
            <p className="text-sm text-white/70">Placeholder list of Super Admin / Ops Admin / Support Analyst.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Permissions matrix</p>
            <p className="text-sm text-white/50">Coming soon.</p>
          </div>
          <PlaceholderToggle label="Require 2FA for admin login" />
        </div>
      </SectionCard>

      <SectionCard title="Alerts & Notifications" description="Configure thresholds for future alert automation.">
        <div className="space-y-4">
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="text-xs uppercase tracking-[0.3em] text-white/50">Revenue drop threshold (%)</label>
            <input type="number" placeholder="25" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white" />
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="text-xs uppercase tracking-[0.3em] text-white/50">Delivery rate drop (%)</label>
            <input type="number" placeholder="10" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white" />
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="text-xs uppercase tracking-[0.3em] text-white/50">Inactivity duration (hrs)</label>
            <input type="number" placeholder="24" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white" />
          </div>
          <div className="flex flex-wrap gap-3">
            <PlaceholderToggle label="Email notifications" />
            <PlaceholderToggle label="Slack / Webhook" helper="Placeholder" />
            <PlaceholderToggle label="Internal WhatsApp alerts" helper="Placeholder" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Audit & Logs" description="Review admin events, login history, and export audit trails.">
        <div className="space-y-4">
          <button className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white">
            View audit history
          </button>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            Login history • Admin actions • Placeholder feed
          </div>
          <button className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white/40">
            Export logs (coming soon)
          </button>
        </div>
      </SectionCard>
    </div>
  </div>
);

export default AdminSettingsPage;
