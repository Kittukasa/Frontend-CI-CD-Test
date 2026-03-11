import { ChevronDown } from 'lucide-react';
import type { FC } from 'react';
import type { DateRangeFilter } from '@/pages/analyticsTypes';

export const ADMIN_DATE_RANGE_OPTIONS: Array<{ value: DateRangeFilter; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'alltime', label: 'All Time' },
  { value: 'custom', label: 'Custom' },
];

export const getAdminDateRangeLabel = (value: DateRangeFilter): string => {
  const match = ADMIN_DATE_RANGE_OPTIONS.find(option => option.value === value);
  if (match) {
    return match.label;
  }
  return 'Today';
};

interface AdminDateRangeControlProps {
  value: DateRangeFilter;
  customStart: string;
  customEnd: string;
  onRangeChange: (value: DateRangeFilter) => void;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
}

const AdminDateRangeControl: FC<AdminDateRangeControlProps> = ({
  value,
  customStart,
  customEnd,
  onRangeChange,
  onCustomStartChange,
  onCustomEndChange,
}) => (
  <>
    <div className="relative">
      <select
        value={value}
        onChange={event => onRangeChange(event.target.value as DateRangeFilter)}
        className="appearance-none rounded-full border border-white/10 bg-white/5 px-4 py-2 pr-10 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_10px_40px_rgba(2,6,23,0.5)]"
      >
        {ADMIN_DATE_RANGE_OPTIONS.map(option => (
          <option key={option.value} value={option.value} className="bg-[#050816] text-white">
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/70">
        <ChevronDown className="h-3 w-3" />
      </span>
    </div>
    {value === 'custom' && (
      <>
        <input
          type="date"
          value={customStart}
          onChange={event => onCustomStartChange(event.target.value)}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_10px_40px_rgba(2,6,23,0.5)]"
        />
        <span className="text-white/60">to</span>
        <input
          type="date"
          value={customEnd}
          onChange={event => onCustomEndChange(event.target.value)}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_10px_40px_rgba(2,6,23,0.5)]"
        />
      </>
    )}
  </>
);

export default AdminDateRangeControl;
