import React, { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import dayjs from 'dayjs';
import { Doughnut, Bar } from 'react-chartjs-2';
import type { Plugin, ChartDataset, ChartType, Chart, Point, ChartOptions } from 'chart.js';
import { Button } from '@/components/ui/button';
import { maskPhoneNumber } from '@/lib/maskPhone';
import { loadCustomerTypeConfig, type CustomerTypeLabel } from '@/lib/customerTypes';
import type {
  CustomerDetail,
  CustomerKPIs,
  DateRangeFilter,
  CustomerLifecycleRow,
} from './analyticsTypes';

type LifecycleSegment = 'new' | 'returning' | 'anonymous';
type EnrichedCustomerDetail = CustomerDetail & { lifecycleSegment?: LifecycleSegment };

type CampaignRecipient = {
  phone: string;
  name: string;
  totalSpent: number;
  lifecycleSegment: LifecycleSegment;
};

type ValueLabelChartType = 'bar' | 'doughnut';

type ValueFormatterContext = {
  chart: Chart<ValueLabelChartType>;
  datasetIndex: number;
  dataIndex: number;
  datasetLabel?: string;
};

type DatasetWithFormatter<TType extends ChartType> = ChartDataset<TType> & {
  valueFormatter?: (value: number, context: ValueFormatterContext) => string;
};

const valueLabelPlugin: Plugin<ValueLabelChartType> = {
  id: 'valueLabelPlugin',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();

    const resolveChartType = (): ValueLabelChartType | undefined => {
      if ('type' in chart.config) {
        const configType = chart.config.type;
        if (configType === 'bar' || configType === 'doughnut') {
          return configType;
        }
      }

      const datasetTypes =
        chart.config.data?.datasets?.map(dataset => dataset?.type).filter(
          (datasetType): datasetType is ChartType =>
            typeof datasetType === 'string'
        ) ?? [];

      for (const candidate of datasetTypes) {
        if (candidate === 'bar' || candidate === 'doughnut') {
          return candidate;
        }
      }

      return undefined;
    };

    const chartType = resolveChartType();

    if (!chartType) {
      ctx.restore();
      return;
    }

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (!chart.isDatasetVisible(datasetIndex)) {
        return;
      }

      const datasetWithFormatter = dataset as DatasetWithFormatter<ValueLabelChartType>;

      meta.data.forEach((element, dataIndex) => {
        const rawValue = dataset.data?.[dataIndex];
        const numericValue =
          typeof rawValue === 'number' ? rawValue : rawValue ? Number(rawValue) : 0;

        if (!Number.isFinite(numericValue) || numericValue === 0) {
          return;
        }

        const typedElement = element as unknown as {
          tooltipPosition?: (useFinalPosition?: boolean) => Point;
          x?: number;
          y?: number;
        };

        const position = (() => {
          if (typeof typedElement.tooltipPosition === 'function') {
            const point = typedElement.tooltipPosition(true);
            return { x: point.x, y: point.y };
          }

          if (typeof typedElement.x === 'number' && typeof typedElement.y === 'number') {
            return { x: typedElement.x, y: typedElement.y };
          }

          return null;
        })();

        if (!position) {
          return;
        }

        const formatter = datasetWithFormatter.valueFormatter;
        const label =
          typeof formatter === 'function'
            ? formatter(numericValue, {
                chart,
                datasetIndex,
                dataIndex,
                datasetLabel: dataset.label,
              })
            : numericValue.toLocaleString();

        if (!label) {
          return;
        }

        ctx.font =
          "600 12px 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif";
        ctx.textAlign = 'center';

        let drawX = position.x;
        let drawY = position.y;
        let baseline: CanvasTextBaseline = 'middle';
        const textColor = '#000000';
        if (chartType === 'bar') {
          const bar = typedElement as unknown as { base?: number; y?: number; x?: number; width?: number };
          const base = typeof bar.base === 'number' ? bar.base : position.y;
          const top = typeof bar.y === 'number' ? bar.y : position.y;
          drawX = typeof bar.x === 'number' ? bar.x : position.x;
          const height = Math.abs(base - top);

          drawY = top + height / 2;
          baseline = 'middle';
          if (height < 28) {
            drawY = top - 10;
            baseline = 'bottom';
          }
        }

        ctx.textBaseline = baseline;
        ctx.fillStyle = textColor;
        ctx.fillText(label, drawX, drawY);
      });
    });

    ctx.restore();
  },
};

const getSafeCustomerName = (name: string | null | undefined, phone: string): string => {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return `Customer ${maskPhoneNumber(phone)}`;
  }

  const digitsInName = trimmed.replace(/\D/g, '');
  const digitsInPhone = phone.replace(/\D/g, '');

  if (digitsInName.length >= 6 && digitsInName === digitsInPhone) {
    return `Customer ${maskPhoneNumber(phone)}`;
  }

  return trimmed;
};

const formatLastVisited = (lastPurchase: string | null | undefined): string => {
  if (!lastPurchase) {
    return '—';
  }
  const parsed = dayjs(lastPurchase);
  if (!parsed.isValid()) {
    return '—';
  }
  return parsed.format('DD MMM YYYY');
};

const normalizePhoneKey = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const digits = value.toString().replace(/[^0-9]/g, '');
  if (!digits) {
    return '';
  }
  return digits.length > 10 ? digits.slice(-10) : digits;
};

interface CustomersProps {
  dateRangeFilter: DateRangeFilter;
  setDateRangeFilter: Dispatch<SetStateAction<DateRangeFilter>>;
  customStartDate: string;
  setCustomStartDate: Dispatch<SetStateAction<string>>;
  customEndDate: string;
  setCustomEndDate: Dispatch<SetStateAction<string>>;
  customerAnalyticsLoading: boolean;
  customerKPIs: CustomerKPIs | null;
  customerDetails: CustomerDetail[];
  customerLifecycleTables: {
    newCustomers: CustomerLifecycleRow[];
    returningCustomers: CustomerLifecycleRow[];
    anonymousCustomers: CustomerLifecycleRow[];
  };
  customerSpendOverTime: {
    labels: string[];
    newSpend: number[];
    returningSpend: number[];
    anonymousSpend: number[];
    totals: number[];
  };
  lifecycleSummary: {
    newCount: number;
    returningCount: number;
    anonymousCount: number;
    newSpend: number;
    returningSpend: number;
    anonymousSpend: number;
  };
  getCustomerType: (totalSpent: number) => string;
  getCustomerTypeStyle: (customerType: string) => string;
  customerCurrentPage: number;
  setCustomerCurrentPage: Dispatch<SetStateAction<number>>;
  customerPageSize: number;
  revenueUnlocked: boolean;
  onRequestRevenueUnlock: () => void;
  onLaunchCampaign?: (
    recipients: Array<{ phone: string; name?: string; totalSpent?: number; lifecycleSegment?: LifecycleSegment }>
  ) => void;
}

function Customers({
  dateRangeFilter,
  setDateRangeFilter,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  customerAnalyticsLoading,
  customerKPIs,
  customerDetails,
  customerLifecycleTables,
  customerSpendOverTime,
  lifecycleSummary,
  getCustomerType,
  getCustomerTypeStyle,
  customerCurrentPage,
  setCustomerCurrentPage,
  customerPageSize,
  revenueUnlocked,
  onRequestRevenueUnlock,
  onLaunchCampaign
}: CustomersProps) {
  const [customerTypeFilters, setCustomerTypeFilters] = useState<CustomerTypeLabel[]>([]);
  const [lifecycleFilters, setLifecycleFilters] = useState<Array<'new' | 'returning'>>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchColumn, setCustomerSearchColumn] = useState<'name' | 'phone' | 'customerType' | 'lastPurchase' | 'totalSpent'>('name');
  const [customerSortColumn, setCustomerSortColumn] = useState<'name' | 'phone' | 'lastPurchase' | 'totalSpent'>('name');
  const [customerSortDirection, setCustomerSortDirection] = useState<'asc' | 'desc'>('asc');
  const customerTypeConfig = useMemo(() => loadCustomerTypeConfig(), []);
  const premiumSpendLabel = useMemo(
    () => `₹${customerTypeConfig.premium.min.toLocaleString()}+ spent`,
    [customerTypeConfig]
  );
  const standardSpendLabel = useMemo(
    () =>
      `₹${customerTypeConfig.standard.min.toLocaleString()} - ₹${customerTypeConfig.standard.max.toLocaleString()} spent`,
    [customerTypeConfig]
  );
  const basicSpendLabel = useMemo(
    () => `Below ₹${customerTypeConfig.basic.max.toLocaleString()} spent`,
    [customerTypeConfig]
  );
  const anonymousCustomers = customerKPIs?.anonymousCustomers ?? 0;
  const lifecycleCounts: Record<'new' | 'returning', number> = {
    new: lifecycleSummary.newCount,
    returning: lifecycleSummary.returningCount
  };
  const lifecycleSpends = {
    new: lifecycleSummary.newSpend,
    returning: lifecycleSummary.returningSpend,
    anonymous: lifecycleSummary.anonymousSpend
  };
  const lifecycleFilterLabelMap: Record<'new' | 'returning', string> = {
    new: 'New Customers',
    returning: 'Returning Customers'
  };
  const baseTotalSales = customerKPIs?.totalSales ?? 0;
  const baseTotalCustomers = customerKPIs?.totalCustomers ?? 0;

  const hasLifecycleFilter = lifecycleFilters.length > 0;
  const includeNewCustomers = lifecycleFilters.includes('new');
  const includeReturningCustomers = lifecycleFilters.includes('returning');

  const filteredTotalSales = (() => {
    if (!hasLifecycleFilter) return baseTotalSales;
    if (includeNewCustomers && includeReturningCustomers) {
      return lifecycleSpends.new + lifecycleSpends.returning;
    }
    if (includeNewCustomers) return lifecycleSpends.new;
    if (includeReturningCustomers) return lifecycleSpends.returning;
    return baseTotalSales;
  })();

  const filteredTotalCustomers = (() => {
    if (!hasLifecycleFilter) return baseTotalCustomers;
    if (includeNewCustomers && includeReturningCustomers) {
      return lifecycleCounts.new + lifecycleCounts.returning;
    }
    if (includeNewCustomers) return lifecycleCounts.new;
    if (includeReturningCustomers) return lifecycleCounts.returning;
    return baseTotalCustomers;
  })();

  const filteredAnonymousCustomers = hasLifecycleFilter ? 0 : anonymousCustomers;
  const filteredEbillCustomers = hasLifecycleFilter
    ? filteredTotalCustomers
    : baseTotalCustomers - anonymousCustomers;
  const formatCurrency = useCallback(
    (value: number) => `₹${Number.isFinite(value) ? Math.round(value).toLocaleString() : '0'}`,
    []
  );
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
  const RevenueChartGuard: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    revenueUnlocked ? (
      <>{children}</>
    ) : (
      <div className="relative w-full">
        <div className="select-none pointer-events-none opacity-60">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center rounded-2xl bg-white/95 backdrop-blur-sm px-4">
          <p className="text-sm text-gray-700 mb-3">Revenue insights are hidden for staff.</p>
          <Button size="sm" onClick={onRequestRevenueUnlock}>
            Unlock with PIN
          </Button>
        </div>
      </div>
    );
  const customerCountTotal = lifecycleCounts.new + lifecycleCounts.returning;
  const totalCount = customerCountTotal || 1;
  const hasCountData = customerCountTotal > 0;
  const rangeLabel = useMemo(() => {
    const formatDate = (value: string) => {
      if (!value) return '';
      const parsed = dayjs(value);
      return parsed.isValid() ? parsed.format('DD MMM YYYY') : value;
    };

    switch (dateRangeFilter) {
      case 'today':
        return 'Today';
      case 'thisWeek':
        return 'This Week';
      case 'thisMonth':
        return 'This Month';
      case 'thisYear':
        return 'This Year';
      case 'alltime':
      case 'all':
        return 'All Time';
      case 'custom': {
        const start = customStartDate ? formatDate(customStartDate) : '';
        const end = customEndDate ? formatDate(customEndDate) : '';
        if (start && end) {
          return `${start} – ${end}`;
        }
        if (start) return start;
        if (end) return end;
        return 'Custom Range';
      }
      default:
        return 'Selected Range';
    }
  }, [dateRangeFilter, customStartDate, customEndDate]);

  const chartPlugins = useMemo(() => [valueLabelPlugin], []);

  const donutData = useMemo(
    () => ({
      labels: ['New Customers', 'Returning Customers', 'Anonymous Customers'],
      datasets: [
        {
          data: [
            lifecycleSummary.newCount,
            lifecycleSummary.returningCount,
            lifecycleSummary.anonymousCount
          ],
          backgroundColor: [
            'rgba(59,130,246,0.8)',
            'rgba(34,197,94,0.8)',
            'rgba(239,68,68,0.8)'
          ],
          borderColor: ['rgba(59,130,246,1)', 'rgba(34,197,94,1)', 'rgba(239,68,68,1)'],
          borderWidth: 1,
          valueFormatter: (value: number) => value.toLocaleString()
        } satisfies DatasetWithFormatter<'doughnut'>
      ]
    }),
    [lifecycleSummary.newCount, lifecycleSummary.returningCount, lifecycleSummary.anonymousCount]
  );

  const lifecyclePhoneMap = useMemo(() => {
    const map = new Map<string, 'new' | 'returning'>();
    customerLifecycleTables.newCustomers.forEach(entry => {
      const key = normalizePhoneKey(entry.phone) || entry.phone || '';
      if (key) {
        map.set(key, 'new');
      }
    });
    customerLifecycleTables.returningCustomers.forEach(entry => {
      const key = normalizePhoneKey(entry.phone) || entry.phone || '';
      if (key) {
        map.set(key, 'returning');
      }
    });
    return map;
  }, [customerLifecycleTables.newCustomers, customerLifecycleTables.returningCustomers]);

  const lifecycleCountsForButtons = useMemo(() => {
    if (customerTypeFilters.length === 0) {
      return lifecycleCounts;
    }

    const counts: Record<'new' | 'returning', number> = { new: 0, returning: 0 };

    customerDetails.forEach(customer => {
      const normalizedPhone = normalizePhoneKey(customer.phone);
      if (!normalizedPhone) {
        return;
      }

      const segment = lifecyclePhoneMap.get(normalizedPhone);
      if (!segment) {
        return;
      }

      const type = getCustomerType(customer.totalSpent) as CustomerTypeLabel;
      if (!customerTypeFilters.includes(type)) {
        return;
      }

      counts[segment] += 1;
    });

    return counts;
  }, [customerDetails, customerTypeFilters, getCustomerType, lifecycleCounts, lifecyclePhoneMap]);

  const filteredCustomerDetails = useMemo<EnrichedCustomerDetail[]>(() => {
    return customerDetails
      .map(customer => {
        const normalizedPhone = normalizePhoneKey(customer.phone);
        const lifecycleSegment = (() => {
          if (!normalizedPhone) return 'anonymous' as const;
          return lifecyclePhoneMap.get(normalizedPhone);
        })();

        return {
          ...customer,
          lifecycleSegment
        };
      })
      .filter(customer => {
        if (customerTypeFilters.length > 0) {
          const type = getCustomerType(customer.totalSpent) as CustomerTypeLabel;
          if (!customerTypeFilters.includes(type)) {
            return false;
          }
        }

        if (lifecycleFilters.length > 0) {
          const segment = customer.lifecycleSegment;
          if (segment === 'anonymous' || !segment) {
            return false;
          }
          return lifecycleFilters.includes(segment);
        }

        return true;
      });
  }, [customerDetails, customerTypeFilters, lifecycleFilters, lifecyclePhoneMap, getCustomerType]);

  const searchableSortedCustomers = useMemo<EnrichedCustomerDetail[]>(() => {
    const term = customerSearchTerm.trim().toLowerCase();
    const digitTerm = term.replace(/\D/g, '');
    const hasDigitTerm = digitTerm.length > 0;
    let list = filteredCustomerDetails.filter(customer => {
      if (!term) return true;
      const safeName = getSafeCustomerName(customer.name, customer.phone).toLowerCase();
      const phoneDigits = customer.phone.replace(/\D/g, '');
      const lastVisitedLabel = formatLastVisited(customer.lastPurchase).toLowerCase();
      const lastVisitedRaw = (customer.lastPurchase || '').toLowerCase();
      const lastVisitedDigits = (customer.lastPurchase || '').replace(/\D/g, '');
      const totalSpentRounded = Number.isFinite(customer.totalSpent) ? Math.round(customer.totalSpent) : 0;
      const totalSpentPlain = totalSpentRounded.toString();
      const totalSpentFormatted = totalSpentRounded.toLocaleString();
      const totalSpentDigits = totalSpentFormatted.replace(/\D/g, '');
      const customerTypeValue = getCustomerType(customer.totalSpent).toLowerCase();

      switch (customerSearchColumn) {
        case 'phone':
          return hasDigitTerm ? phoneDigits.includes(digitTerm) : phoneDigits.includes(term);
        case 'customerType':
          return customerTypeValue.includes(term);
        case 'lastPurchase':
          return (
            lastVisitedLabel.includes(term) ||
            lastVisitedRaw.includes(term) ||
            (hasDigitTerm ? lastVisitedDigits.includes(digitTerm) : false)
          );
        case 'totalSpent':
          return hasDigitTerm
            ? totalSpentPlain.includes(digitTerm) || totalSpentDigits.includes(digitTerm)
            : totalSpentFormatted.toLowerCase().includes(term);
        case 'name':
        default:
          return safeName.includes(term);
      }
    });

    const getSortValue = (customer: EnrichedCustomerDetail) => {
      switch (customerSortColumn) {
        case 'phone':
          return customer.phone || '';
        case 'lastPurchase': {
          const parsed = customer.lastPurchase ? dayjs(customer.lastPurchase) : null;
          return parsed && parsed.isValid() ? parsed.valueOf() : 0;
        }
        case 'totalSpent':
          return customer.totalSpent || 0;
        case 'name':
        default:
          return getSafeCustomerName(customer.name, customer.phone).toLowerCase();
      }
    };

    list.sort((a, b) => {
      const aVal = getSortValue(a);
      const bVal = getSortValue(b);
      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal ?? '').localeCompare(String(bVal ?? ''), undefined, {
          sensitivity: 'base',
          numeric: true
        });
      }
      return customerSortDirection === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [customerSearchTerm, customerSortColumn, customerSortDirection, filteredCustomerDetails]);

  const barData = useMemo(
    () => ({
      labels: ['New Customers', 'Returning Customers', 'Anonymous Customers'],
      datasets: [
        {
          label: 'Total Spend',
          data: [
            lifecycleSummary.newSpend,
            lifecycleSummary.returningSpend,
            lifecycleSummary.anonymousSpend
          ],
          backgroundColor: [
            'rgba(59,130,246,0.8)',
            'rgba(34,197,94,0.8)',
            'rgba(239,68,68,0.8)'
          ],
          borderColor: ['rgba(59,130,246,1)', 'rgba(34,197,94,1)', 'rgba(239,68,68,1)'],
          borderWidth: 1,
          valueFormatter: (value: number) => formatCurrency(value)
        } satisfies DatasetWithFormatter<'bar'>
      ]
    }),
    [
      formatCurrency,
      lifecycleSummary.newSpend,
      lifecycleSummary.returningSpend,
      lifecycleSummary.anonymousSpend
    ]
  );

  useEffect(() => {
    setCustomerCurrentPage(0);
  }, [customerTypeFilters, lifecycleFilters, setCustomerCurrentPage]);

  useEffect(() => {
    setCustomerCurrentPage(0);
  }, [customerSearchTerm, customerSortColumn, customerSortDirection, setCustomerCurrentPage]);

  const spendOverTimeData = useMemo(
    () => ({
      labels: customerSpendOverTime.labels,
      datasets: [
        {
          label: 'New Customers',
          data: customerSpendOverTime.newSpend,
          backgroundColor: 'rgba(59,130,246,0.8)',
          borderColor: 'rgba(59,130,246,1)',
          borderWidth: 1,
          valueFormatter: (value: number) => formatCurrency(value)
        } satisfies DatasetWithFormatter<'bar'>,
        {
          label: 'Returning Customers',
          data: customerSpendOverTime.returningSpend,
          backgroundColor: 'rgba(34,197,94,0.8)',
          borderColor: 'rgba(34,197,94,1)',
          borderWidth: 1,
          valueFormatter: (value: number) => formatCurrency(value)
        } satisfies DatasetWithFormatter<'bar'>,
        {
          label: 'Anonymous Customers',
          data: customerSpendOverTime.anonymousSpend,
          backgroundColor: 'rgba(239,68,68,0.8)',
          borderColor: 'rgba(239,68,68,1)',
          borderWidth: 1,
          valueFormatter: (value: number) => formatCurrency(value)
        } satisfies DatasetWithFormatter<'bar'>
      ]
    }),
    [
      customerSpendOverTime.labels,
      customerSpendOverTime.newSpend,
      customerSpendOverTime.returningSpend,
      customerSpendOverTime.anonymousSpend,
      formatCurrency
    ]
  );

  const paginatedCustomers = useMemo(() => {
    return searchableSortedCustomers.slice(
      customerCurrentPage * customerPageSize,
      (customerCurrentPage + 1) * customerPageSize
    );
  }, [searchableSortedCustomers, customerCurrentPage, customerPageSize]);
  const totalFilteredCustomers = searchableSortedCustomers.length;
  const campaignRecipients = useMemo(
    () =>
      filteredCustomerDetails
        .map(customer => {
          const normalizedPhone = normalizePhoneKey(customer.phone);
          if (!normalizedPhone) {
            return null;
          }
          return {
            phone: normalizedPhone,
            name: getSafeCustomerName(customer.name, customer.phone),
            totalSpent: customer.totalSpent,
            lifecycleSegment: customer.lifecycleSegment ?? 'anonymous'
          };
        })
        .filter((candidate): candidate is CampaignRecipient => candidate !== null),
    [filteredCustomerDetails]
  );
  const handleCustomerTypeSelect = (type: CustomerTypeLabel) => {
    setCustomerTypeFilters(prev =>
      prev.includes(type) ? prev.filter(entry => entry !== type) : [...prev, type]
    );
  };

  const handleLifecycleFilterSelect = (type: 'new' | 'returning') => {
    setLifecycleFilters(prev =>
      prev.includes(type) ? prev.filter(entry => entry !== type) : [...prev, type]
    );
  };

  const customerTypeFilterLabel =
    customerTypeFilters.length > 0
      ? customerTypeFilters.map(type => type.toLowerCase()).join(', ')
      : '';
  const showingRangeStart =
    totalFilteredCustomers === 0 ? 0 : customerCurrentPage * customerPageSize + 1;
  const showingRangeEnd = Math.min(
    (customerCurrentPage + 1) * customerPageSize,
    totalFilteredCustomers
  );

  const handleDateFilterReset = () => {
    setDateRangeFilter('today');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const hasSpendData =
    lifecycleSummary.newSpend + lifecycleSummary.returningSpend + lifecycleSummary.anonymousSpend > 0;
  const hasSpendOverTime =
    spendOverTimeData.labels.length > 0 &&
    (customerSpendOverTime.newSpend.some(value => value > 0) ||
      customerSpendOverTime.returningSpend.some(value => value > 0) ||
      customerSpendOverTime.anonymousSpend.some(value => value > 0));

  const donutChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context: any) {
              const label = context.label || '';
              const value = Number(context.parsed) || 0;
              const total = customerCountTotal || 0;
              return [
                `${label}: ${value.toLocaleString()}`,
                `Total: ${total.toLocaleString()}`
              ];
            }
          }
        }
      }
    }),
    [customerCountTotal]
  );

  const lifecycleBarOptions = useMemo<ChartOptions<'bar'>>(() => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.08)' },
          ticks: {
            callback(value: any) {
              return '₹' + Number(value).toLocaleString();
            }
          },
          title: { display: true, text: 'Spend (₹)' }
        },
        x: {
          grid: { display: false },
          title: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context: any) {
              const value =
                Number(
                  typeof context.parsed === 'object' ? context.parsed.y : context.parsed
                ) || 0;
              const total =
                lifecycleSummary.newSpend +
                  lifecycleSummary.returningSpend +
                  lifecycleSummary.anonymousSpend || 0;
              return [
                `Spend: ₹${value.toLocaleString()}`,
                `Total: ₹${total.toLocaleString()}`
              ];
            },
            title(context: any[]) {
              return context[0]?.label || '';
            }
          }
        }
      }
    }),
    [
      lifecycleSummary.newSpend,
      lifecycleSummary.returningSpend,
      lifecycleSummary.anonymousSpend
    ]
  );

  const spendOverTimeOptions = useMemo<ChartOptions<'bar'>>(() => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      scales: {
        x: {
          grid: { display: false },
          title: { display: true, text: 'Date' },
          stacked: false
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.08)' },
          ticks: {
            callback(value: any) {
              return '₹' + Number(value).toLocaleString();
            }
          },
          title: { display: true, text: 'Spend (₹)' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context: any) {
              const value = Number(
                typeof context.parsed === 'object' ? context.parsed.y : context.parsed
              ) || 0;
              return `${context.dataset.label}: ₹${value.toLocaleString()}`;
            },
            footer(items: any[]) {
              if (!items.length) {
                return '';
              }
              const index = items[0].dataIndex ?? 0;
              const fallbackTotal =
                customerSpendOverTime.totals[index] ??
                ((customerSpendOverTime.newSpend[index] || 0) +
                  (customerSpendOverTime.returningSpend[index] || 0) +
                  (customerSpendOverTime.anonymousSpend[index] || 0));
              return `Total: ₹${fallbackTotal.toLocaleString()}`;
            }
          }
        }
      }
    }),
    [
      customerSpendOverTime.totals,
      customerSpendOverTime.newSpend,
      customerSpendOverTime.returningSpend,
      customerSpendOverTime.anonymousSpend
    ]
  );

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-40 bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <p className="text-gray-600">Overview of your customer data and insights</p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Date Range:</label>
              <select
                value={dateRangeFilter}
                onChange={(e) => {
                  const value = e.target.value as DateRangeFilter;
                  setDateRangeFilter(value);
                  if (value !== 'custom') {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="thisYear">This Year</option>
                <option value="alltime">All Time</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {dateRangeFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  placeholder="Start Date"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  placeholder="End Date"
                />
              </div>
            )}
            <Button
              type="button"
              onClick={handleDateFilterReset}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 text-sm"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {customerAnalyticsLoading ? (
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : customerKPIs ? (
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Customers</h3>
            <p className="text-3xl font-bold text-purple-600">
              {customerKPIs.totalCustomers.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">{rangeLabel}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-indigo-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">E-bill Customers</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {(customerKPIs.totalCustomers - anonymousCustomers).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">Provided phone numbers</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-red-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Anonymous Customers</h3>
            <p className="text-3xl font-bold text-red-600">
              {anonymousCustomers.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">Invoices without a customer phone number</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Sales</h3>
            <p className="text-3xl font-bold text-green-600">
              {renderRevenueValue(formatCurrency(customerKPIs.totalSales))}
            </p>
            <p className="text-sm text-gray-500 mt-1">{rangeLabel}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="text-center text-gray-500">No data available</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New vs Returning Customers</h3>
          {hasCountData ? (
            <div className="h-64 flex flex-col">
              <div className="flex-1">
                <Doughnut
                  data={donutData}
                  options={donutChartOptions}
                  plugins={chartPlugins}
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: 'rgba(59,130,246,0.8)' }}
                    aria-hidden="true"
                  />
                  New Customers
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: 'rgba(34,197,94,0.8)' }}
                    aria-hidden="true"
                  />
                  Returning Customers
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: 'rgba(239,68,68,0.8)' }}
                    aria-hidden="true"
                  />
                  Anonymous Customers
                </span>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 text-sm border border-dashed border-gray-300 rounded-md">
              {customerAnalyticsLoading ? 'Loading customer mix…' : 'No customers in this range.'}
            </div>
          )}
        </div>

        <RevenueChartGuard>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Spend by Lifecycle</h3>
              <span className="text-sm text-gray-500">Filtered Range</span>
            </div>
            {hasSpendData ? (
              <div className="h-64">
                <Bar
                  data={barData}
                  options={lifecycleBarOptions}
                  plugins={chartPlugins}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 text-sm border border-dashed border-gray-300 rounded-md">
                {customerAnalyticsLoading ? 'Calculating spend…' : 'No spend data in this range.'}
              </div>
            )}
          </div>
        </RevenueChartGuard>

        <div className="lg:col-span-2">
          <RevenueChartGuard>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Spend by New vs Returning Customers (Over Time)
                </h3>
                <span className="text-sm text-gray-500">Filtered Range</span>
            </div>
            {hasSpendOverTime ? (
              <div className="h-80 flex flex-col">
                <div className="flex-1">
                  <Bar
                    data={spendOverTimeData}
                    options={spendOverTimeOptions}
                    plugins={chartPlugins}
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: 'rgba(59,130,246,0.8)' }}
                      aria-hidden="true"
                    />
                    New Customers
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: 'rgba(34,197,94,0.8)' }}
                      aria-hidden="true"
                    />
                    Returning Customers
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: 'rgba(239,68,68,0.8)' }}
                      aria-hidden="true"
                    />
                    Anonymous Customers
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500 text-sm border border-dashed border-gray-300 rounded-md">
                {customerAnalyticsLoading ? 'Building spend timeline…' : 'No spend data in this range.'}
              </div>
            )}
            </div>
          </RevenueChartGuard>
        </div>
      </div>

      <div id="customer-type-section" className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Customer Type</h3>
              <p className="text-sm text-gray-600 mt-1">Customers categorized by total spending</p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setCustomerTypeFilters([])}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Reset
            </Button>
          </div>
        </div>
        <div className="p-6">
          {customerDetails.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const premiumCount = customerDetails.filter(
                  (customer) => getCustomerType(customer.totalSpent) === 'Premium',
                ).length;
                const standardCount = customerDetails.filter(
                  (customer) => getCustomerType(customer.totalSpent) === 'Standard',
                ).length;
                const basicCount = customerDetails.filter(
                  (customer) => getCustomerType(customer.totalSpent) === 'Basic',
                ).length;
                const total = customerDetails.length;

                return (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCustomerTypeSelect('Premium')}
                      className={`text-left w-full rounded-lg p-4 border transition hover:border-purple-300 ${
                        customerTypeFilters.includes('Premium')
                          ? 'border-purple-500 bg-purple-200'
                          : 'border-purple-200 bg-purple-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Premium Customers</p>
                          <p className="text-xs text-purple-500">{premiumSpendLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-800">{premiumCount}</p>
                          <p className="text-xs text-purple-600">Customers in this tier</p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCustomerTypeSelect('Standard')}
                      className={`text-left w-full rounded-lg p-4 border transition hover:border-blue-300 ${
                        customerTypeFilters.includes('Standard')
                          ? 'border-blue-500 bg-blue-200'
                          : 'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Standard Customers</p>
                          <p className="text-xs text-blue-500">{standardSpendLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-800">{standardCount}</p>
                          <p className="text-xs text-blue-600">Customers in this tier</p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCustomerTypeSelect('Basic')}
                      className={`text-left w-full rounded-lg p-4 border transition hover:border-green-300 ${
                        customerTypeFilters.includes('Basic')
                          ? 'border-green-500 bg-green-200'
                          : 'border-green-200 bg-green-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Basic Customers</p>
                          <p className="text-xs text-green-500">{basicSpendLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-800">{basicCount}</p>
                          <p className="text-xs text-green-600">Customers in this tier</p>
                        </div>
                      </div>
                    </button>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No customer data available</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 flex-1 min-w-[240px]">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
              <p className="text-sm text-gray-600 mt-1">
                Detailed customer information with dynamic type categorization
              </p>
              <p className="text-xs text-gray-500">Showing customers for: {rangeLabel}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={customerSearchTerm}
                onChange={event => setCustomerSearchTerm(event.target.value)}
                placeholder="Search value"
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={customerSearchColumn}
                onChange={event => setCustomerSearchColumn(event.target.value as typeof customerSearchColumn)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Name</option>
                <option value="phone">Phone</option>
                <option value="customerType">Type</option>
                <option value="lastPurchase">Last Visited</option>
                <option value="totalSpent">Total Spend</option>
              </select>
              <select
                value={customerSortColumn}
                onChange={event => setCustomerSortColumn(event.target.value as typeof customerSortColumn)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Sort: Name</option>
                <option value="phone">Sort: Phone</option>
                <option value="lastPurchase">Sort: Last Visited</option>
                <option value="totalSpent">Sort: Total Spend</option>
              </select>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCustomerSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                className="text-sm"
              >
                {customerSortDirection === 'asc' ? 'Sort ↑' : 'Sort ↓'}
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 min-w-[240px]">
            <div className="flex flex-wrap items-center gap-3 justify-end">
              {(['new', 'returning'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleLifecycleFilterSelect(type)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    lifecycleFilters.includes(type)
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-600 hover:border-indigo-300'
                  }`}
                >
                  {lifecycleFilterLabelMap[type]} ({lifecycleCountsForButtons[type].toLocaleString()})
                </button>
              ))}
              <Button
                type="button"
                size="sm"
                onClick={() => setLifecycleFilters([])}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                Reset
              </Button>
            </div>
            {onLaunchCampaign && (
              <Button
                type="button"
                size="sm"
                onClick={() => onLaunchCampaign(campaignRecipients)}
                className="text-base font-semibold w-full"
              >
                Use in Campaign
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredCustomerDetails.length > 0 ? (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Visited
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spend
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCustomers.map((customer, index) => (
                      <tr
                        key={`${customer.phone}-${index}`}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getSafeCustomerName(customer.name, customer.phone)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {maskPhoneNumber(customer.phone)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatLastVisited(customer.lastPurchase)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{customer.totalSpent.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const dynamicCustomerType = getCustomerType(customer.totalSpent);
                            return (
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCustomerTypeStyle(
                                  dynamicCustomerType,
                                )}`}
                              >
                                {dynamicCustomerType}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {showingRangeStart} to {showingRangeEnd} of {totalFilteredCustomers}{' '}
                  {customerTypeFilterLabel ? `${customerTypeFilterLabel} ` : ''}customers
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCustomerCurrentPage((prev) => Math.max(0, prev - 1))}
                    disabled={customerCurrentPage === 0}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCustomerCurrentPage((prev) => prev + 1)}
                    disabled={(customerCurrentPage + 1) * customerPageSize >= totalFilteredCustomers}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              {customerAnalyticsLoading
                ? 'Loading customer data...'
                : customerTypeFilters.length > 0
                ? 'No matching customers in this range'
                : 'No customer data available'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Customers;
