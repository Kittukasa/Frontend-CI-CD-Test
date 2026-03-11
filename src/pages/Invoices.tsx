import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { maskPhoneNumber } from '@/lib/maskPhone';
import dayjs, {
  parseInvoiceDate as parseInvoiceDateDayjs,
  parseDateInputLocal as parseDateInputLocalDayjs,
  toDateOrNull
} from '@/lib/date';
import { Loader2, MessageCircle, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

type Invoice = {
  customer_phone: string;
  invoice_id?: string | number | null;
  invoice_no?: string | number | null;
  invoice_date?: string | null;
  processed_timestamp_ist?: string | null;
  total_amount: number;
  customer_name?: string;
  is_excluded?: boolean;
  fingerprint?: string | null;
  is_daily_end_report?: boolean;
};

export type FiltersState = {
  searchTerm: string;
  searchColumn: 'customer_phone' | 'bill_id' | 'invoice_timestamp' | 'total_amount';
};

type KPIData = {
  totalCustomers: number;
  repeatCustomerRate: number;
  avgTransactionValue: number;
  newCustomersThisMonth: number;
};

type DateRangePreset = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

type StoredInvoiceDateFilter = {
  dateRange: { start: string; end: string };
  preset: DateRangePreset;
};

const INVOICES_DATE_FILTER_STORAGE_KEY = 'bb_invoices_date_filter';

const readStoredInvoiceDateFilter = (): StoredInvoiceDateFilter | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(INVOICES_DATE_FILTER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const { dateRange, preset } = parsed as {
      dateRange?: { start?: unknown; end?: unknown };
      preset?: unknown;
    };

    if (
      !dateRange ||
      typeof dateRange.start !== 'string' ||
      typeof dateRange.end !== 'string'
    ) {
      return null;
    }

    const allowedPresets: DateRangePreset[] = ['today', 'week', 'month', 'year', 'all', 'custom'];
    const presetString = typeof preset === 'string' ? preset : 'custom';
    const safePreset: DateRangePreset = allowedPresets.includes(presetString as DateRangePreset)
      ? (presetString as DateRangePreset)
      : 'custom';

    return {
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      preset: safePreset
    };
  } catch {
    return null;
  }
};

interface InvoicesProps {
  selectedStore: string | null;
  onLoadInvoices?: () => void;
  loading: boolean;
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  dailyEndInvoices: Invoice[];
  dailyEndFilteredInvoices: Invoice[];
  dailyEndReportsLoading: boolean;
  filters: FiltersState;
  onFiltersChange: (next: FiltersState) => void;
  onClearFilters: () => void;
  kpiData: KPIData | null;
  revenueUnlocked: boolean;
  onRequestRevenueUnlock: () => void;
}

const formatDateInput = (date: Date) => dayjs(date).format('YYYY-MM-DD');

const toDateAtStartOfDay = (value?: string | null) =>
  toDateOrNull(parseDateInputLocalDayjs(value)?.startOf('day'));

const toDateAtEndOfDay = (value?: string | null) =>
  toDateOrNull(parseDateInputLocalDayjs(value)?.endOf('day'));

const parseInvoiceTimestamp = (value?: string | null) =>
  toDateOrNull(parseInvoiceDateDayjs(value ?? null));

const formatInvoiceTimestampDisplay = (value?: string | null) => {
  const parsed = parseInvoiceDateDayjs(value ?? null);
  if (!parsed) {
    return value || 'No Date';
  }
  return parsed.format('DD MMM YYYY, hh:mm A');
};

const digitsOnly = (value?: string | null) => (value ?? '').toString().replace(/\D/g, '');
const DAILY_END_HISTORY_STORAGE_PREFIX = 'bb:daily-end-history';
const getHistoryStorageKey = (storeId?: string | null) =>
  `${DAILY_END_HISTORY_STORAGE_PREFIX}:${storeId && storeId.toString().trim() ? storeId.toString().trim() : 'default'}`;
const dismissedNoticeKey = (storeId: string | null) =>
  `bb:invoices:lastDismissedExcludedCount:${storeId && storeId.trim() ? storeId.trim() : 'default'}`;

const readDismissedExcludedCount = (storeId: string | null) => {
  if (typeof window === 'undefined') {
    return 0;
  }
  const key = dismissedNoticeKey(storeId);
  const raw = window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  const parsed = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

const readDailyEndHistory = (storeId?: string | null): Record<string, string> => {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(getHistoryStorageKey(storeId));
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, string>;
    }
  } catch (error) {
    console.error('Failed to read daily end invoice history', error);
  }
  return {};
};

const writeDailyEndHistory = (storeId: string | null | undefined, history: Record<string, string>) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(getHistoryStorageKey(storeId), JSON.stringify(history));
  } catch (error) {
    console.error('Failed to persist daily end invoice history', error);
  }
};

const getInvoiceFingerprintKey = (invoice: Invoice, fallback = ''): string | null => {
  if (invoice.fingerprint) {
    return invoice.fingerprint;
  }
  if (invoice.invoice_id) {
    return invoice.invoice_id.toString();
  }
  if (fallback) {
    return fallback;
  }
  return null;
};

const formatDailyEndTimestamp = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return value;
  }
  return parsed.format('DD MMM YYYY, hh:mm A');
};
const ANONYMOUS_PHONE_DIGITS = '0000000000';
const isAnonymousInvoicePhone = (value?: string | null) => digitsOnly(value) === ANONYMOUS_PHONE_DIGITS;

const Invoices: React.FC<InvoicesProps> = ({
  selectedStore,
  onLoadInvoices,
  loading,
  invoices,
  filteredInvoices,
  dailyEndInvoices,
  dailyEndFilteredInvoices,
  dailyEndReportsLoading,
  filters,
  onFiltersChange,
  onClearFilters,
  kpiData,
  revenueUnlocked,
  onRequestRevenueUnlock
}) => {
  const renderRevenueValue = (content: React.ReactNode) => {
    if (revenueUnlocked) {
      return <>{content}</>;
    }
    const placeholder =
      typeof content === 'string' && content.trim().startsWith('₹') ? '₹••••' : '••••';
    return (
      <span className="flex flex-col gap-1">
        <span className="select-none text-gray-400">{placeholder}</span>
        <button
          type="button"
          onClick={onRequestRevenueUnlock}
          className="text-xs text-indigo-600 hover:text-indigo-500 underline decoration-dotted"
        >
          Unlock with PIN
        </button>
      </span>
    );
  };
  const handleFilterChange = <K extends keyof FiltersState>(field: K, value: FiltersState[K]) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const getDefaultInvoiceDateRange = () => {
    const today = new Date();
    return {
      start: formatDateInput(today),
      end: formatDateInput(today)
    };
  };

  const storedInvoiceFilterRef = useRef<StoredInvoiceDateFilter | null>(null);
  if (storedInvoiceFilterRef.current === null) {
    storedInvoiceFilterRef.current = readStoredInvoiceDateFilter();
  }

  const [sortColumn, setSortColumn] = useState<'invoice_timestamp' | 'bill_id' | 'total_amount' | 'customer_phone'>('invoice_timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState(() => storedInvoiceFilterRef.current?.dateRange ?? getDefaultInvoiceDateRange());
  const [selectedRangePreset, setSelectedRangePreset] = useState<DateRangePreset>(() => storedInvoiceFilterRef.current?.preset ?? 'today');
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [updatingExclusionId, setUpdatingExclusionId] = useState<string | null>(null);
  const [exclusionDialog, setExclusionDialog] = useState<{ invoice: Invoice; rowKey: string; mode: 'regular' | 'dailyRestore' } | null>(null);
  const [dailyEndReportLoading, setDailyEndReportLoading] = useState(false);
  const [invoicePage, setInvoicePage] = useState(0);
  const [invoiceView, setInvoiceView] = useState<'regular' | 'daily'>('regular');
  const [dailyEndHistory, setDailyEndHistory] = useState<Record<string, string>>(() => readDailyEndHistory(selectedStore));
  const [showExcludedNotice, setShowExcludedNotice] = useState(false);
  const [lastDismissedExcludedCount, setLastDismissedExcludedCount] = useState(() => readDismissedExcludedCount(selectedStore));
  const [showExcludedOnly, setShowExcludedOnly] = useState(false);
  const INVOICE_PAGE_SIZE = 20;

  useEffect(() => {
    setDailyEndHistory(readDailyEndHistory(selectedStore));
  }, [selectedStore]);

  useEffect(() => {
    setLastDismissedExcludedCount(readDismissedExcludedCount(selectedStore));
  }, [selectedStore]);

  const persistDailyEndHistory = useCallback(
    (updater: (prev: Record<string, string>) => Record<string, string>) => {
      setDailyEndHistory(prev => {
        const next = updater(prev);
        if (next === prev) {
          return prev;
        }
        writeDailyEndHistory(selectedStore, next);
        return next;
      });
    },
    [selectedStore]
  );

  const recordDailyEndMove = useCallback(
    (fingerprint?: string | null) => {
      if (!fingerprint) {
        return;
      }
      const timestamp = new Date().toISOString();
      persistDailyEndHistory(prev => ({ ...prev, [fingerprint]: timestamp }));
    },
    [persistDailyEndHistory]
  );

  const clearDailyEndMove = useCallback(
    (fingerprint?: string | null) => {
      if (!fingerprint) {
        return;
      }
      persistDailyEndHistory(prev => {
        if (!prev || !prev[fingerprint]) {
          return prev;
        }
        const next = { ...prev };
        delete next[fingerprint];
        return next;
      });
    },
    [persistDailyEndHistory]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const payload: StoredInvoiceDateFilter = {
      dateRange,
      preset: selectedRangePreset
    };
    window.localStorage.setItem(INVOICES_DATE_FILTER_STORAGE_KEY, JSON.stringify(payload));
  }, [dateRange, selectedRangePreset]);

  const applyPresetRange = (preset: DateRangePreset) => {
    const today = new Date();
    let start = new Date(today);

    switch (preset) {
      case 'today':
        start = new Date(today);
        break;
      case 'week': {
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        start = new Date(today.getFullYear(), today.getMonth(), diff);
        break;
      }
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'all':
        setDateRange({ start: '', end: '' });
        return;
      case 'custom':
      default:
        return;
    }

    setDateRange({
      start: formatDateInput(start),
      end: formatDateInput(today)
    });
  };

  const handleRangePresetChange = (value: DateRangePreset) => {
    setSelectedRangePreset(value);
    if (value !== 'custom') {
      applyPresetRange(value);
    }
  };

  const handleDateRangeChange = (key: 'start' | 'end', value: string) => {
    const sanitized = value;
    setDateRange(prev => {
      const next = { ...prev, [key]: sanitized };
      if (key === 'start' && next.end && sanitized && sanitized > next.end) {
        next.end = sanitized;
      }
      if (key === 'end' && next.start && sanitized && sanitized < next.start) {
        next.start = sanitized;
      }
      return next;
    });
    setSelectedRangePreset('custom');
  };

  const resetDateRange = () => {
    setDateRange(getDefaultInvoiceDateRange());
    setSelectedRangePreset('today');
  };

  const buildInvoiceRequestBody = (invoice: Invoice) => ({
    invoice_id: invoice.invoice_id ?? null,
    invoice_no: invoice.invoice_no ?? null,
    invoice_date: invoice.invoice_date ?? null,
    processed_timestamp_ist: invoice.processed_timestamp_ist ?? null,
    customer_phone: invoice.customer_phone,
    total_amount: invoice.total_amount,
    fingerprint: invoice.fingerprint ?? null,
    is_daily_end_report: Boolean(invoice.is_daily_end_report)
  });

  const promptPhoneNumber = (defaultDigits: string) =>
    new Promise<string | null>(resolve => {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.backgroundColor = 'rgba(0,0,0,0.45)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '9999';

      const modal = document.createElement('div');
      modal.style.background = '#fff';
      modal.style.borderRadius = '12px';
      modal.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.25)';
      modal.style.padding = '24px';
      modal.style.width = 'min(90vw, 360px)';
      modal.style.fontFamily = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      overlay.appendChild(modal);

      const title = document.createElement('h3');
      title.textContent = 'Send e-bill via WhatsApp';
      title.style.margin = '0 0 6px 0';
      title.style.fontSize = '18px';
      title.style.fontWeight = '600';
      title.style.color = '#0f172a';
      modal.appendChild(title);

      const subtitle = document.createElement('p');
      subtitle.textContent = 'Enter a 10-digit mobile number';
      subtitle.style.margin = '0 0 16px 0';
      subtitle.style.fontSize = '13px';
      subtitle.style.color = '#475569';
      modal.appendChild(subtitle);

      const input = document.createElement('input');
      input.type = 'tel';
      input.value = defaultDigits.slice(-10);
      input.style.width = '100%';
      input.style.padding = '10px 12px';
      input.style.borderRadius = '8px';
      input.style.border = '1px solid #cbd5f5';
      input.style.fontSize = '16px';
      input.style.boxSizing = 'border-box';
      input.style.outline = 'none';
      input.maxLength = 10;
      input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, '').slice(0, 10);
        error.textContent = '';
      });
      modal.appendChild(input);

      const error = document.createElement('p');
      error.style.margin = '6px 0 0 0';
      error.style.fontSize = '12px';
      error.style.color = '#dc2626';
      modal.appendChild(error);

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.justifyContent = 'flex-end';
      actions.style.gap = '10px';
      actions.style.marginTop = '18px';
      modal.appendChild(actions);

      const cleanup = () => {
        document.body.removeChild(overlay);
      };

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.background = '#2563eb';
      cancelBtn.style.color = '#fff';
      cancelBtn.style.border = 'none';
      cancelBtn.style.borderRadius = '8px';
      cancelBtn.style.padding = '8px 14px';
      cancelBtn.style.fontWeight = '500';
      cancelBtn.style.cursor = 'pointer';
      cancelBtn.onclick = () => {
        cleanup();
        resolve(null);
      };
      actions.appendChild(cancelBtn);

      const submitBtn = document.createElement('button');
      submitBtn.type = 'button';
      submitBtn.textContent = 'Send';
      submitBtn.style.background = '#2563eb';
      submitBtn.style.color = '#fff';
      submitBtn.style.border = 'none';
      submitBtn.style.borderRadius = '8px';
      submitBtn.style.padding = '8px 16px';
      submitBtn.style.fontWeight = '600';
      submitBtn.style.cursor = 'pointer';
      submitBtn.onclick = () => {
        const digits = input.value.replace(/\D/g, '');
        if (digits.length !== 10) {
          error.textContent = 'Enter exactly 10 digits.';
          return;
        }
        cleanup();
        resolve(digits);
      };
      actions.appendChild(submitBtn);

      document.body.appendChild(overlay);
      input.focus();
    });

  const invoiceViewOptions: { key: 'regular' | 'daily'; label: string }[] = [
    { key: 'regular', label: 'Invoices' },
    { key: 'daily', label: 'Daily End Reports' }
  ];

  const invoiceDataset =
    invoiceView === 'daily'
      ? {
          label: 'Daily End Reports',
          invoices: dailyEndInvoices,
          filtered: dailyEndFilteredInvoices,
          loading: dailyEndReportsLoading
        }
      : {
          label: 'Invoices',
          invoices,
          filtered: filteredInvoices,
          loading
        };
  const baseInvoices = invoiceDataset.invoices;
  const searchFilteredInvoices = invoiceDataset.filtered;
  const datasetLabel = invoiceDataset.label;
  const currentLoading = invoiceDataset.loading;

  const handleSendEbillClick = async (invoice: Invoice, rowKey: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    const originalPhoneRaw =
      invoice.customer_phone && invoice.customer_phone !== 'N/A'
        ? invoice.customer_phone.toString()
        : '';
    const existingDigits = digitsOnly(originalPhoneRaw);
    const lastTenDigits = existingDigits.slice(-10);
    const hasStoredNonZeroNumber =
      existingDigits.length >= 10 && !/^0+$/.test(lastTenDigits);
    const isZeroPlaceholder =
      existingDigits.length >= 10 && /^0+$/.test(lastTenDigits);
    const promptDefault = hasStoredNonZeroNumber ? lastTenDigits : '';

    const numericDigits = await promptPhoneNumber(promptDefault);
    if (!numericDigits) {
      return;
    }

    const formattedPhone = `91${numericDigits}`;

    const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please log in again to send WhatsApp messages.',
        variant: 'destructive'
      });
      return;
    }

    const payload = {
      storeId: selectedStore ?? undefined,
      invoiceNo: invoice.invoice_no ?? null,
      invoiceId: invoice.invoice_id ?? null,
      phoneNumber: formattedPhone,
      originalCustomerPhone: originalPhoneRaw || null
    };

    setSendingInvoiceId(rowKey);
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 25000);
      const response = await fetch('/api/whatsapp/invoices/send-ebill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      window.clearTimeout(timeoutId);

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          result?.error ||
          'Failed to trigger WhatsApp message. Please try again after checking the invoice link.';
        toast({
          title: 'Unable to send e-bill',
          description: message,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'E-bill sent',
        description: `WhatsApp template dispatched to ${formattedPhone}.`,
        variant: 'default'
      });

      if (isZeroPlaceholder) {
        invoice.customer_phone = formattedPhone;
        if (onLoadInvoices) {
          try {
            await Promise.resolve(onLoadInvoices());
          } catch (error) {
            console.error('Failed to refresh invoices after updating phone number', error);
          }
        }
      }
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        toast({
          title: 'Request timed out',
          description: 'The send request took too long. Please try again.',
          variant: 'destructive'
        });
        return;
      }
      toast({
        title: 'Network error',
        description: 'We could not send the e-bill. Please check your connection and try again.',
        variant: 'destructive'
      });
    } finally {
      setSendingInvoiceId(null);
    }
  };


  const handleToggleExclusion = async (invoice: Invoice, shouldExclude: boolean, rowKey: string, options?: { skipConfirm?: boolean }) => {
    if (!selectedStore) {
      toast({
        title: 'Select a store first',
        description: 'Choose a store to manage invoice exclusions.',
        variant: 'destructive'
      });
      return;
    }
    const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please log in again to manage invoices.',
        variant: 'destructive'
      });
      return;
    }
    const fingerprintKey = getInvoiceFingerprintKey(invoice, rowKey);
    const action: 'exclude' | 'include' = invoiceView === 'daily' ? 'include' : shouldExclude ? 'exclude' : 'include';

    if (action === 'exclude' && !options?.skipConfirm) {
      setExclusionDialog({ invoice, rowKey, mode: 'regular' });
      return;
    }

    if (action === 'include' && invoiceView === 'daily' && !options?.skipConfirm) {
      setExclusionDialog({ invoice, rowKey, mode: 'dailyRestore' });
      return;
    }

    const endpoint = action === 'exclude'
      ? '/api/analytics/invoices/exclude'
      : '/api/analytics/invoices/include';
    const payload = {
      storeId: selectedStore,
      invoice: buildInvoiceRequestBody(invoice)
    };
    setUpdatingExclusionId(rowKey);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to update invoice exclusion.');
      }
      toast({
        title: action === 'exclude' ? 'Invoice excluded' : 'Invoice restored',
        description: action === 'exclude'
          ? 'This invoice will no longer impact KPIs.'
          : 'The invoice will be counted in analytics again.',
        variant: 'default'
      });
      if (action === 'include' && fingerprintKey) {
        clearDailyEndMove(fingerprintKey);
      }
      if (onLoadInvoices) {
        await Promise.resolve(onLoadInvoices());
      }
    } catch (error) {
      toast({
        title: 'Update failed',
        description:
          error instanceof Error
            ? error.message
            : 'We could not update this invoice. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingExclusionId(null);
    }
  };

  const handleCloseExclusionDialog = () => {
    if (dailyEndReportLoading) {
      return;
    }
    setExclusionDialog(null);
  };

  const handleConfirmExclude = async () => {
    if (!exclusionDialog) {
      return;
    }
    await handleToggleExclusion(exclusionDialog.invoice, true, exclusionDialog.rowKey, { skipConfirm: true });
    setExclusionDialog(null);
  };

  const handleRestoreToInvoices = async () => {
    if (!exclusionDialog) {
      return;
    }
    await handleToggleExclusion(exclusionDialog.invoice, false, exclusionDialog.rowKey, { skipConfirm: true });
    setExclusionDialog(null);
  };

  const handleSendToDailyEndReport = async () => {
    if (!exclusionDialog) {
      return;
    }
    if (!selectedStore) {
      toast({
        title: 'Select a store first',
        description: 'Choose a store to manage invoices.',
        variant: 'destructive'
      });
      return;
    }
    const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please log in again to manage invoices.',
        variant: 'destructive'
      });
      return;
    }
    const payload = {
      storeId: selectedStore,
      invoice: buildInvoiceRequestBody(exclusionDialog.invoice)
    };
    setDailyEndReportLoading(true);
    setUpdatingExclusionId(exclusionDialog.rowKey);
    try {
      const response = await fetch('/api/analytics/invoices/daily-end-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to send invoice to Daily End Reports.');
      }
      toast({
        title: 'Invoice moved to Daily End Reports',
        description: 'This invoice will now appear under the Daily End Reports tab.',
        variant: 'default'
      });
      const fingerprintKey = getInvoiceFingerprintKey(exclusionDialog.invoice, exclusionDialog.rowKey);
      recordDailyEndMove(fingerprintKey);
      setExclusionDialog(null);
      if (onLoadInvoices) {
        await Promise.resolve(onLoadInvoices());
      }
    } catch (error) {
      toast({
        title: 'Update failed',
        description:
          error instanceof Error
            ? error.message
            : 'We could not update this invoice. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setDailyEndReportLoading(false);
      setUpdatingExclusionId(null);
    }
  };

  const dateFilteredInvoices = useMemo(() => {
    const start = toDateAtStartOfDay(dateRange.start);
    const end = toDateAtEndOfDay(dateRange.end);

    if (!start && !end) {
      return searchFilteredInvoices;
    }

    return searchFilteredInvoices.filter(invoice => {
      const timestamp =
        invoice.processed_timestamp_ist ||
        invoice.invoice_date ||
        '';

      if (!timestamp) return false;
      const parsed = parseInvoiceTimestamp(timestamp);
      if (!parsed) return true;
      if (start && parsed < start) return false;
      if (end && parsed > end) return false;
      return true;
    });
  }, [searchFilteredInvoices, dateRange]);

  const activeInvoices = useMemo(() => dateFilteredInvoices.filter(inv => !inv.is_excluded), [dateFilteredInvoices]);
  const excludedInvoiceCount = dateFilteredInvoices.length - activeInvoices.length;

  useEffect(() => {
    if (excludedInvoiceCount === 0) {
      setShowExcludedNotice(false);
      setLastDismissedExcludedCount(0);
      return;
    }
    if (excludedInvoiceCount < lastDismissedExcludedCount) {
      setLastDismissedExcludedCount(excludedInvoiceCount);
      return;
    }
    if (excludedInvoiceCount > lastDismissedExcludedCount) {
      setShowExcludedNotice(true);
    }
  }, [excludedInvoiceCount, lastDismissedExcludedCount]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const key = dismissedNoticeKey(selectedStore);
    const value = String(lastDismissedExcludedCount || 0);
    window.sessionStorage.setItem(key, value);
    window.localStorage.setItem(key, value);
  }, [lastDismissedExcludedCount, selectedStore]);

  const totalRevenue = useMemo(
    () => activeInvoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    [activeInvoices]
  );

  const ebillInvoiceCount = useMemo(() => {
    return activeInvoices.filter(invoice => !isAnonymousInvoicePhone(invoice.customer_phone)).length;
  }, [activeInvoices]);

  const averageOrder = useMemo(
    () =>
      activeInvoices.length > 0 ? Math.round(totalRevenue / activeInvoices.length) : 0,
    [activeInvoices, totalRevenue]
  );

  const uniqueCustomers = useMemo(
    () => new Set(activeInvoices.map(inv => inv.customer_phone)).size,
    [activeInvoices]
  );

  const viewInvoices = useMemo(
    () =>
      invoiceView === 'regular' && showExcludedOnly
        ? dateFilteredInvoices.filter(inv => inv.is_excluded)
        : dateFilteredInvoices,
    [dateFilteredInvoices, showExcludedOnly, invoiceView]
  );
  const showingCount =
    invoiceView === 'daily'
      ? viewInvoices.length
      : showExcludedOnly
      ? viewInvoices.length
      : activeInvoices.length;

  const sortedInvoices = useMemo(() => {
    const data = [...viewInvoices];

    const getSortValue = (invoice: Invoice) => {
      switch (sortColumn) {
        case 'invoice_timestamp': {
          const parsed = parseInvoiceTimestamp(invoice.processed_timestamp_ist || invoice.invoice_date || '');
          return parsed ? parsed.getTime() : 0;
        }
        case 'bill_id':
          return (invoice.invoice_no ?? invoice.invoice_id ?? '').toString();
        case 'customer_phone':
          return invoice.customer_phone.toString();
        case 'total_amount':
        default:
          return invoice.total_amount;
      }
    };

    data.sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);

      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue ?? '').localeCompare(String(bValue ?? ''), undefined, {
          numeric: true,
          sensitivity: 'base'
        });
      }

      return sortDirection === 'asc' ? -comparison : comparison;
    });

    return data;
  }, [viewInvoices, sortColumn, sortDirection]);

  useEffect(() => {
    setInvoicePage(0);
  }, [filters.searchTerm, filters.searchColumn, dateRange.start, dateRange.end, selectedRangePreset, invoiceView, showExcludedOnly]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(sortedInvoices.length / INVOICE_PAGE_SIZE) - 1);
    setInvoicePage(prev => Math.min(prev, maxPage));
  }, [sortedInvoices.length]);

  const paginatedInvoices = useMemo(() => {
    const start = invoicePage * INVOICE_PAGE_SIZE;
    return sortedInvoices.slice(start, start + INVOICE_PAGE_SIZE);
  }, [sortedInvoices, invoicePage]);

  const invoicePageStart = sortedInvoices.length === 0 ? 0 : invoicePage * INVOICE_PAGE_SIZE + 1;
  const invoicePageEnd = Math.min(sortedInvoices.length, (invoicePage + 1) * INVOICE_PAGE_SIZE);
  const totalInvoicePages = Math.max(1, Math.ceil(sortedInvoices.length / INVOICE_PAGE_SIZE));

  const rangeLabel = useMemo(() => {
    const formatRangeDate = (value?: string | null) => {
      if (!value) return '';
      const parsed = parseDateInputLocalDayjs(value);
      return parsed ? parsed.format('DD MMM YYYY') : value;
    };

    switch (selectedRangePreset) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      case 'all':
        return 'All Time';
      case 'custom': {
        const start = formatRangeDate(dateRange.start);
        const end = formatRangeDate(dateRange.end);
        if (start && end) {
          return `${start} – ${end}`;
        }
        if (start) return start;
        if (end) return end;
        return 'Custom Range';
      }
      default: {
        const start = formatRangeDate(dateRange.start);
        const end = formatRangeDate(dateRange.end);
        return start && end ? `${start} – ${end}` : 'Selected Range';
      }
    }
  }, [selectedRangePreset, dateRange.start, dateRange.end]);

  const searchPlaceholder =
    filters.searchColumn === 'customer_phone'
      ? 'Enter customer phone…'
      : filters.searchColumn === 'bill_id'
      ? 'Enter bill ID…'
      : filters.searchColumn === 'invoice_timestamp'
      ? 'Enter invoice date…'
      : filters.searchColumn === 'total_amount'
      ? 'Enter amount…'
      : 'Enter search value…';
  const isRestoreDialog = exclusionDialog?.mode === 'dailyRestore';
  const exclusionDialogBusy = Boolean(exclusionDialog && updatingExclusionId === exclusionDialog.rowKey);

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-40 bg-white rounded-lg shadow p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3 w-full lg:w-auto">
          <div className="flex flex-wrap gap-2">
            {invoiceViewOptions.map(option => (
              <button
                key={option.key}
                type="button"
                onClick={() => setInvoiceView(option.key)}
                aria-pressed={invoiceView === option.key}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
                  invoiceView === option.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500">
            Showing {showingCount.toLocaleString()} of {baseInvoices.length.toLocaleString()} {datasetLabel.toLowerCase()} ({rangeLabel})
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4 w-full lg:w-auto">
          <div className="flex flex-col">
            <select
              value={selectedRangePreset}
              onChange={event =>
                handleRangePresetChange(event.target.value as typeof selectedRangePreset)
              }
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {selectedRangePreset === 'custom' && (
            <>
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={event => handleDateRangeChange('start', event.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={event => handleDateRangeChange('end', event.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </>
          )}
          <Button onClick={resetDateRange} variant="outline" className="px-4 py-2">
            Reset
          </Button>
        </div>
      </div>

      {kpiData && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Invoices</h3>
              <p className="text-3xl font-bold text-blue-600">{activeInvoices.length.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">{rangeLabel}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-teal-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">E-bill Invoices</h3>
              <p className="text-3xl font-bold text-teal-600">{ebillInvoiceCount.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Captured customer numbers</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-600">
                {renderRevenueValue(`₹${Math.round(totalRevenue).toLocaleString()}`)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{rangeLabel}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Order</h3>
              <p className="text-3xl font-bold text-purple-600">₹{averageOrder.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">{rangeLabel}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="invoice-search-column" className="text-sm font-medium text-gray-700">
              Search by:
            </label>
            <select
              id="invoice-search-column"
              value={filters.searchColumn}
              onChange={event =>
                handleFilterChange('searchColumn', event.target.value as FiltersState['searchColumn'])
              }
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="customer_phone">Customer Phone</option>
              <option value="bill_id">Bill ID</option>
              <option value="invoice_timestamp">Date</option>
              <option value="total_amount">Total Amount</option>
            </select>
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={filters.searchTerm}
            onChange={event => handleFilterChange('searchTerm', event.target.value)}
            className="flex-1 min-w-[220px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          />
          <Button onClick={onClearFilters} variant="outline" className="px-4 py-2">
            Clear Filters
          </Button>
        </div>
        <div className="space-y-2 text-sm text-gray-600 max-w-full">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="invoice-sort-column">
              Sort by:
            </label>
            <select
              id="invoice-sort-column"
              value={sortColumn}
              onChange={event => setSortColumn(event.target.value as typeof sortColumn)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="invoice_timestamp">Date</option>
              <option value="customer_phone">Customer Phone</option>
              <option value="bill_id">Bill ID</option>
              <option value="total_amount">Total Amount</option>
            </select>
            <Button
              type="button"
              variant="default"
              onClick={() => setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="text-sm bg-black text-white hover:bg-black/90 hover:text-white"
            >
              {sortDirection === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
            </Button>
            {invoiceView === 'regular' && (
              <Button
                type="button"
                variant={showExcludedOnly ? 'default' : 'outline'}
                onClick={() => setShowExcludedOnly(prev => !prev)}
                className={`text-sm ${showExcludedOnly ? 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white' : 'border border-gray-300 bg-slate-900 text-white hover:bg-slate-800 hover:text-white'}`}
              >
                {showExcludedOnly ? 'Show All' : 'Show Excluded'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {excludedInvoiceCount > 0 && showExcludedNotice && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>
            {excludedInvoiceCount} invoice{excludedInvoiceCount === 1 ? '' : 's'} currently excluded.
            {' '}Enable them to include these bills in KPIs.
          </span>
          <button
            type="button"
            onClick={() => {
              setShowExcludedNotice(false);
              setLastDismissedExcludedCount(excludedInvoiceCount);
            }}
            className="text-amber-600 hover:text-amber-800 transition"
            aria-label="Dismiss excluded invoice notice"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bill Id
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Send E-Bill
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {`Loading ${datasetLabel.toLowerCase()}...`}
                </td>
              </tr>
            ) : dateFilteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {baseInvoices.length === 0
                    ? `No ${datasetLabel.toLowerCase()} found.`
                    : `No ${datasetLabel.toLowerCase()} match the current filters.`}
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((invoice, index) => {
                const invoiceNumber = (invoice.invoice_id || '').toString();
                const billId = (invoice.invoice_no || '').toString();
                const rowKey = invoice.fingerprint || invoiceNumber || billId || `invoice-${index}`;
                const isExcluded = Boolean(invoice.is_excluded);
                const fingerprintKey = getInvoiceFingerprintKey(invoice, rowKey);
                const movedAt = invoiceView === 'daily' && fingerprintKey ? dailyEndHistory[fingerprintKey] : undefined;
                const rowClasses = [
                  (invoicePage * INVOICE_PAGE_SIZE + index) % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                  isExcluded ? 'opacity-70' : ''
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <tr key={rowKey} className={rowClasses}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {maskPhoneNumber(invoice.customer_phone)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {billId || invoiceNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatInvoiceTimestampDisplay(
                        invoice.processed_timestamp_ist || invoice.invoice_date
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{invoice.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      <button
                        type="button"
                        onClick={() => handleSendEbillClick(invoice, rowKey)}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          sendingInvoiceId === rowKey
                            ? 'border-green-500/40 bg-green-50 text-green-600 focus:ring-green-500'
                            : 'border-green-500/40 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 focus:ring-green-500'
                        } ${isExcluded ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title={isExcluded ? 'Enable invoice to send e-bills' : 'Send e-bill via WhatsApp'}
                        disabled={sendingInvoiceId === rowKey || isExcluded}
                        aria-disabled={false}
                      >
                        {sendingInvoiceId === rowKey ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        ) : (
                          <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        )}
                        <span className="sr-only">Send e-bill via WhatsApp</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      <div className="flex flex-col items-center gap-2">
                        <span className={`text-xs font-semibold ${isExcluded ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {isExcluded ? 'Excluded' : 'Active'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleExclusion(invoice, !isExcluded, rowKey)}
                          disabled={updatingExclusionId === rowKey}
                          className={`relative inline-flex h-8 ${invoiceView === 'daily' ? 'w-16' : 'w-28'} items-center rounded-full border px-1 text-[10px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isExcluded
                              ? 'border-rose-200 bg-rose-50 text-rose-500 focus:ring-rose-200'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-500 focus:ring-emerald-200'
                          }`}
                          aria-label={isExcluded ? 'Include this invoice back in KPIs' : 'Exclude this invoice'}
                          aria-pressed={isExcluded}
                        >
                          {invoiceView === 'daily' ? (
                            <span className="flex w-full items-center justify-center text-[11px] font-semibold text-rose-700">Ex</span>
                          ) : (
                            <div className="relative grid h-full w-full grid-cols-2 text-center text-[10px]">
                              <span className={`z-10 flex items-center justify-center transition ${isExcluded ? 'text-rose-700' : 'text-gray-400'}`}>Ex</span>
                              <span className={`z-10 flex items-center justify-center transition ${!isExcluded ? 'text-emerald-700' : 'text-gray-400'}`}>In</span>
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none absolute inset-y-1 left-1 rounded-full shadow transition duration-200 transform ${
                                  isExcluded ? 'bg-rose-100 translate-x-full' : 'bg-emerald-100 translate-x-0'
                                }`}
                                style={{ width: 'calc(50% - 0.35rem)' }}
                              />
                            </div>
                          )}
                        </button>
                        {updatingExclusionId === rowKey && (
                          <span className="text-xs text-gray-500">Updating…</span>
                        )}
                        {invoiceView === 'daily' && movedAt && (
                          <span className="text-[11px] text-gray-500">
                            Moved on {formatDailyEndTimestamp(movedAt)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col gap-3 text-sm text-gray-600 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {sortedInvoices.length === 0
              ? `No ${datasetLabel.toLowerCase()} to display.`
              : `Showing ${invoicePageStart.toLocaleString()} – ${invoicePageEnd.toLocaleString()} of ${sortedInvoices.length.toLocaleString()} ${datasetLabel.toLowerCase()}`}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              size="sm"
              className="bg-[#0f172a] hover:bg-[#0f172a]/90 text-white disabled:bg-[#475569] disabled:text-white"
              onClick={() => setInvoicePage(prev => Math.max(0, prev - 1))}
              disabled={invoicePage === 0}
            >
              Previous
            </Button>
            <span className="text-xs text-gray-500">
              Page {Math.min(invoicePage + 1, totalInvoicePages)} of {totalInvoicePages}
            </span>
            <Button
              variant="default"
              size="sm"
              className="bg-[#0f172a] hover:bg-[#0f172a]/90 text-white disabled:bg-[#475569] disabled:text-white"
              onClick={() => setInvoicePage(prev => Math.min(totalInvoicePages - 1, prev + 1))}
              disabled={invoicePage >= totalInvoicePages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={Boolean(exclusionDialog)} onOpenChange={open => (!open ? handleCloseExclusionDialog() : null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isRestoreDialog ? 'Restore this invoice?' : 'Exclude this invoice?'}</DialogTitle>
            <DialogDescription>
              {isRestoreDialog
                ? 'Move this invoice back to the Invoices tab so it counts toward KPIs again.'
                : 'Sending this invoice to Daily End Reports will remove it from KPIs and other analytics until it is restored. Choose an option below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isRestoreDialog ? (
              <>
                <Button
                  type="button"
                  className="w-full bg-indigo-600 hover:bg-indigo-600/90 text-white"
                  onClick={handleRestoreToInvoices}
                  disabled={exclusionDialogBusy}
                >
                  {exclusionDialogBusy ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Restoring…
                    </span>
                  ) : (
                    'Return to Invoices'
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  className="w-full bg-indigo-600 hover:bg-indigo-600/90 text-white"
                  onClick={handleSendToDailyEndReport}
                  disabled={dailyEndReportLoading}
                >
                  {dailyEndReportLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </span>
                  ) : (
                    'Send to Daily End Report'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleConfirmExclude}
                  disabled={exclusionDialogBusy}
                >
                  Exclude only
                </Button>
              </>
            )}
            <DialogFooter className="flex flex-col gap-2">
              <Button type="button" variant="ghost" onClick={handleCloseExclusionDialog} disabled={dailyEndReportLoading || exclusionDialogBusy}>
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
