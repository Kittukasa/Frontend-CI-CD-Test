import { useMemo, useState } from "react";
import type { DateRangeFilter } from "@/pages/analyticsTypes";

const NORMALIZE_MAP: Record<DateRangeFilter, DateRangeFilter> = {
  all: "alltime",
  alltime: "alltime",
  today: "today",
  thisWeek: "thisWeek",
  last7d: "thisWeek",
  thisMonth: "thisMonth",
  thisYear: "thisYear",
  custom: "custom",
};

export const useAdminDateRange = (initial: DateRangeFilter = "today") => {
  const normalizedInitial = NORMALIZE_MAP[initial] || "today";
  const [dateRange, setDateRange] = useState<DateRangeFilter>(normalizedInitial);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ range: NORMALIZE_MAP[dateRange] || "today" });
    if ((NORMALIZE_MAP[dateRange] || dateRange) === "custom") {
      if (customStart) {
        params.set("start", customStart);
      }
      if (customEnd) {
        params.set("end", customEnd);
      }
    }
    return params.toString();
  }, [dateRange, customStart, customEnd]);

  const handleRangeChange = (value: DateRangeFilter) => {
    const normalized = NORMALIZE_MAP[value] || "today";
    setDateRange(normalized);
    if (normalized !== "custom") {
      setCustomStart("");
      setCustomEnd("");
    }
  };

  const resetRange = () => {
    setDateRange("today");
    setCustomStart("");
    setCustomEnd("");
  };

  return {
    dateRange,
    setDateRange: handleRangeChange,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    queryString,
    resetRange,
  };
};
