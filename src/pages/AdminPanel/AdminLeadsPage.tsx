import { useEffect, useMemo, useRef, useState } from 'react';
import { Phone, Mail, MessageCircle, Loader2, RefreshCcw, ChevronDown } from 'lucide-react';
import { fetchAdminJson, clearAdminSession } from '@/utils/adminAuth';
import { useLocation, useNavigate } from 'react-router-dom';

type LeadRecord = {
  lead_id: string;
  created_at: string;
  full_name?: string | null;
  store_name?: string | null;
  brand_name?: string | null;
  business_type?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  notes?: string | null;
  assigned_to?: string | null;
  updated_at?: string | null;
};
type LeadDraft = {
  status: string;
  notes: string;
  assigned_to: string;
};

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'converted', 'rejected'] as const;
const ASSIGNED_TO_OPTIONS = ['Manoj Sai', 'Rohith Reddy', 'Santhosh', 'Thirupathi'] as const;

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizePhone = (value?: string | null) =>
  value ? value.toString().replace(/\D/g, '') : '';

const AdminLeadsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const [activeLeadStatusMenu, setActiveLeadStatusMenu] = useState<string | null>(null);
  const leadMenuRef = useRef<HTMLDivElement | null>(null);
  const [leadDrafts, setLeadDrafts] = useState<Record<string, LeadDraft>>({});

  const loadLeads = async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchAdminJson<{ leads?: LeadRecord[] }>('/api/admin/leads');
    if (!result.ok) {
      if (result.isAuthError || result.isHtml) {
        clearAdminSession();
        const redirectFrom = `${location.pathname}${location.search}`;
        navigate('/admin/login', { replace: true, state: { from: redirectFrom } });
        return;
      }
      setError(result.error || 'Unable to load leads.');
      setIsLoading(false);
      return;
    }
    setLeads(Array.isArray(result.data?.leads) ? result.data?.leads || [] : []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    setLeadDrafts(prev => {
      const next = { ...prev };
      leads.forEach(lead => {
        if (!lead.lead_id) {
          return;
        }
        if (!next[lead.lead_id]) {
          next[lead.lead_id] = {
            status: (lead.status || 'new').toString(),
            notes: lead.notes || '',
            assigned_to: lead.assigned_to || '',
          };
        }
      });
      return next;
    });
  }, [leads]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!statusMenuRef.current) return;
      if (statusMenuRef.current.contains(event.target as Node)) {
        return;
      }
      setStatusMenuOpen(false);
    };
    if (statusMenuOpen) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('touchstart', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [statusMenuOpen]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!leadMenuRef.current) return;
      if (leadMenuRef.current.contains(event.target as Node)) {
        return;
      }
      setActiveLeadStatusMenu(null);
    };
    if (activeLeadStatusMenu) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('touchstart', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [activeLeadStatusMenu]);

  const filteredLeads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return leads.filter(lead => {
      if (statusFilter !== 'all' && (lead.status || 'new') !== statusFilter) {
        return false;
      }
      if (!query) return true;
      const haystack = [
        lead.full_name,
        lead.store_name,
        lead.brand_name,
        lead.email,
        lead.phone,
        lead.business_type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [leads, searchQuery, statusFilter]);

  const updateLead = async (lead: LeadRecord, updates: Partial<LeadRecord>) => {
    if (!lead.lead_id || !lead.created_at) {
      return;
    }
    setSavingId(lead.lead_id);
    const result = await fetchAdminJson<{ lead?: LeadRecord }>(
      `/api/admin/leads/${encodeURIComponent(lead.lead_id)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...updates, created_at: lead.created_at }),
      }
    );
    if (!result.ok) {
      if (result.isAuthError || result.isHtml) {
        clearAdminSession();
        const redirectFrom = `${location.pathname}${location.search}`;
        navigate('/admin/login', { replace: true, state: { from: redirectFrom } });
        return;
      }
      setError(result.error || 'Unable to update lead.');
      setSavingId(null);
      return;
    }
    const updated = result.data?.lead;
    if (updated) {
      setLeads(prev =>
        prev.map(item => (item.lead_id === updated.lead_id ? { ...item, ...updated } : item))
      );
    }
    setSavingId(null);
  };

  const updateDraft = (leadId: string, updates: Partial<LeadDraft>) => {
    setLeadDrafts(prev => ({
      ...prev,
      [leadId]: {
        status: prev[leadId]?.status ?? 'new',
        notes: prev[leadId]?.notes ?? '',
        assigned_to: prev[leadId]?.assigned_to ?? '',
        ...updates,
      },
    }));
  };

  const isDraftDirty = (lead: LeadRecord, draft?: LeadDraft) => {
    if (!draft) return false;
    const currentStatus = (lead.status || 'new').toString();
    return (
      draft.status !== currentStatus ||
      draft.notes !== (lead.notes || '') ||
      draft.assigned_to !== (lead.assigned_to || '')
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
            Operations
          </p>
          <h1 className="text-2xl font-semibold text-white">Lead Signups</h1>
          <p className="mt-1 text-sm text-white/60">
            Review new signups and contact them directly.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <input
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search name, phone, email…"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none sm:w-64"
          />
          <div className="flex items-center gap-2">
            <div className="relative w-full" ref={statusMenuRef}>
              <button
                type="button"
                onClick={() => setStatusMenuOpen(prev => !prev)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 focus:border-cyan-300/50 focus:outline-none"
                aria-haspopup="listbox"
                aria-expanded={statusMenuOpen}
              >
                <span>{statusFilter === 'all' ? 'All statuses' : statusFilter}</span>
                <ChevronDown className="h-4 w-4 text-white/60" />
              </button>
              {statusMenuOpen && (
                <div
                  className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-white/10 bg-[#050816] p-2 shadow-[0_20px_50px_rgba(2,6,23,0.6)]"
                  role="listbox"
                >
                  {['all', ...STATUS_OPTIONS].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setStatusFilter(status);
                        setStatusMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                        statusFilter === status
                          ? 'bg-white/10 text-white'
                          : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      {status === 'all' ? 'All statuses' : status}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={loadLeads}
              className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-white/15 text-white/80 hover:bg-white/10"
              aria-label="Refresh leads"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.65)] sm:p-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading leads…
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-sm text-white/60">No leads found.</div>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map(lead => {
              const phoneDigits = normalizePhone(lead.phone);
              return (
                <div
                  key={`${lead.lead_id}-${lead.created_at}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {lead.full_name || 'Unnamed lead'}
                      </p>
                      <p className="text-xs text-white/50">
                        {lead.store_name || 'Store name pending'} •{' '}
                        {lead.business_type || 'Type pending'}
                      </p>
                      <p className="mt-2 text-xs text-white/50">
                        Submitted: {formatDate(lead.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {lead.phone && (
                        <a
                          href={`tel:${phoneDigits}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 sm:w-auto"
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </a>
                      )}
                      {lead.phone && (
                        <a
                          href={`https://wa.me/${phoneDigits}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-400/40 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10 sm:w-auto"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 sm:w-auto"
                        >
                          <Mail className="h-4 w-4" />
                          Email
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                        Phone
                      </p>
                      <p className="mt-1 text-sm text-white/90">{lead.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                        Email
                      </p>
                      <p className="mt-1 text-sm text-white/90">{lead.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                        Status
                      </p>
                      <div
                        className="relative mt-1"
                        ref={activeLeadStatusMenu === lead.lead_id ? leadMenuRef : null}
                      >
                        <button
                          type="button"
                          disabled={savingId === lead.lead_id}
                          onClick={() =>
                            setActiveLeadStatusMenu(prev =>
                              prev === lead.lead_id ? null : lead.lead_id
                            )
                          }
                          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/50 focus:outline-none"
                          aria-haspopup="listbox"
                          aria-expanded={activeLeadStatusMenu === lead.lead_id}
                        >
                          <span className="capitalize">
                            {leadDrafts[lead.lead_id]?.status || lead.status || 'new'}
                          </span>
                          <ChevronDown className="h-4 w-4 text-white/60" />
                        </button>
                        {activeLeadStatusMenu === lead.lead_id && (
                          <div
                            className="absolute left-0 right-0 top-full z-40 mt-2 rounded-xl border border-white/10 bg-[#050816] p-2 shadow-[0_20px_50px_rgba(2,6,23,0.6)]"
                            role="listbox"
                          >
                            {STATUS_OPTIONS.map(status => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => {
                                  updateDraft(lead.lead_id, { status });
                                  setActiveLeadStatusMenu(null);
                                }}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                                  (leadDrafts[lead.lead_id]?.status || lead.status || 'new') ===
                                  status
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/70 hover:bg-white/5'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                        Assigned to
                      </p>
                      <select
                        value={leadDrafts[lead.lead_id]?.assigned_to ?? lead.assigned_to ?? ''}
                        onChange={event =>
                          updateDraft(lead.lead_id, { assigned_to: event.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-300/50 focus:outline-none"
                      >
                        <option value="" className="bg-[#050816] text-white">
                          Select a person
                        </option>
                        {ASSIGNED_TO_OPTIONS.map(name => (
                          <option key={name} value={name} className="bg-[#050816] text-white">
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                        Notes
                      </p>
                      <input
                        value={leadDrafts[lead.lead_id]?.notes ?? lead.notes ?? ''}
                        onChange={event => updateDraft(lead.lead_id, { notes: event.target.value })}
                        placeholder="Add notes for the team"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-300/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const draft = leadDrafts[lead.lead_id];
                        if (!draft) return;
                        updateLead(lead, {
                          status: draft.status,
                          notes: draft.notes,
                          assigned_to: draft.assigned_to,
                        });
                      }}
                      disabled={
                        savingId === lead.lead_id || !isDraftDirty(lead, leadDrafts[lead.lead_id])
                      }
                      className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingId === lead.lead_id ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeadsPage;
