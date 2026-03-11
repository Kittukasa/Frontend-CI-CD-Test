import dayjs from "dayjs";
import type { DateRangeFilter } from "@/pages/analyticsTypes";

export const formatLocalDateKey = (date: Date): string => dayjs(date).format("YYYY-MM-DD");

export interface ResolvedDateRange {
  startDate: string;
  endDate: string;
}

export const getDateRange = (
  filter: DateRangeFilter,
  customStart: string,
  customEnd: string
): ResolvedDateRange => {
  const now = new Date();
  let startDate = new Date(now);
  let endDate = new Date(now);

  switch (filter as string) {
    case "all":
    case "alltime": {
      startDate = new Date("1970-01-01T00:00:00.000Z");
      endDate = new Date(now);
      break;
    }
    case "today": {
      startDate = new Date(now);
      endDate = new Date(now);
      break;
    }
    case "thisWeek": {
      const weekStart = new Date(now);
      const day = weekStart.getDay(); // 0 (Sun) - 6 (Sat)
      const diff = day === 0 ? 6 : day - 1; // start week on Monday
      weekStart.setDate(weekStart.getDate() - diff);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      startDate = weekStart;
      endDate = weekEnd;
      break;
    }
    case "thisMonth": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startDate = startOfMonth;
      endDate = endOfMonth;
      break;
    }
    case "thisYear": {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    }
    case "custom": {
      const parsedStart = customStart ? new Date(customStart) : null;
      const parsedEnd = customEnd ? new Date(customEnd) : null;

      if (parsedStart && !Number.isNaN(parsedStart.getTime())) {
        startDate = parsedStart;
      } else {
        const fallback = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = fallback;
      }

      if (parsedEnd && !Number.isNaN(parsedEnd.getTime())) {
        endDate = parsedEnd;
      } else {
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
      break;
    }
    case "last7d": {
      const trailingStart = new Date(now);
      trailingStart.setDate(trailingStart.getDate() - 6);
      trailingStart.setHours(0, 0, 0, 0);
      const trailingEnd = new Date(now);
      trailingEnd.setHours(23, 59, 59, 999);
      startDate = trailingStart;
      endDate = trailingEnd;
      break;
    }
    default: {
      const fallbackStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const fallbackEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startDate = fallbackStart;
      endDate = fallbackEnd;
    }
  }

  const normalizedStart = new Date(startDate);
  normalizedStart.setHours(0, 0, 0, 0);

  const normalizedEnd = new Date(endDate);
  normalizedEnd.setHours(23, 59, 59, 999);

  return {
    startDate: formatLocalDateKey(normalizedStart),
    endDate: formatLocalDateKey(normalizedEnd),
  };
};

export const getDateRangeLabel = (
  filter: DateRangeFilter,
  startKey: string,
  endKey: string
): string => {
  if (filter === "custom") {
    return `Custom (${startKey} - ${endKey})`;
  }
  switch (filter) {
    case "today":
      return "Today";
    case "thisWeek":
      return "This Week";
    case "last7d":
      return "Last 7 Days";
    case "thisMonth":
      return "This Month";
    case "thisYear":
      return "This Year";
    case "all":
    case "alltime":
      return "All Time";
    default:
      return "Custom";
  }
};
