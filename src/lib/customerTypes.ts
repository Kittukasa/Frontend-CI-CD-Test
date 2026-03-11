export type CustomerTypeLabel = 'Premium' | 'Standard' | 'Basic';

export type CustomerTypeConfig = {
  premium: { min: number };
  standard: { min: number; max: number };
  basic: { max: number };
};

export const DEFAULT_CUSTOMER_TYPE_CONFIG: CustomerTypeConfig = {
  premium: { min: 10000 },
  standard: { min: 5000, max: 9999 },
  basic: { max: 4999 }
};

export const CUSTOMER_TYPE_STORAGE_KEY = 'bb_customer_type_config';

const clampNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const sanitizeCustomerTypeConfig = (
  input?: Partial<CustomerTypeConfig>
): CustomerTypeConfig => {
  const fallback = DEFAULT_CUSTOMER_TYPE_CONFIG;
  const premiumMin =
    clampNumber(input?.premium?.min) !== null && clampNumber(input?.premium?.min)! > 0
      ? clampNumber(input?.premium?.min)!
      : fallback.premium.min;

  let standardMin =
    clampNumber(input?.standard?.min) !== null && clampNumber(input?.standard?.min)! >= 0
      ? clampNumber(input?.standard?.min)!
      : fallback.standard.min;
  if (standardMin >= premiumMin) {
    standardMin = Math.max(0, premiumMin - 1);
  }

  let standardMax =
    clampNumber(input?.standard?.max) !== null &&
    clampNumber(input?.standard?.max)! >= standardMin
      ? clampNumber(input?.standard?.max)!
      : premiumMin - 1;
  if (standardMax >= premiumMin) {
    standardMax = premiumMin - 1;
  }
  if (standardMax < standardMin) {
    standardMax = standardMin;
  }

  let basicMax =
    clampNumber(input?.basic?.max) !== null && clampNumber(input?.basic?.max)! < standardMin
      ? clampNumber(input?.basic?.max)!
      : standardMin - 1;
  if (basicMax < 0) {
    basicMax = 0;
  }

  return {
    premium: { min: premiumMin },
    standard: { min: standardMin, max: standardMax },
    basic: { max: basicMax }
  };
};

const readFromStorage = (): Partial<CustomerTypeConfig> | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(CUSTOMER_TYPE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const loadCustomerTypeConfig = (): CustomerTypeConfig => {
  const stored = readFromStorage();
  if (!stored) {
    return DEFAULT_CUSTOMER_TYPE_CONFIG;
  }
  return sanitizeCustomerTypeConfig(stored);
};

export const persistCustomerTypeConfig = (config?: Partial<CustomerTypeConfig>) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!config) {
    localStorage.removeItem(CUSTOMER_TYPE_STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    CUSTOMER_TYPE_STORAGE_KEY,
    JSON.stringify(sanitizeCustomerTypeConfig(config))
  );
};

export const determineCustomerType = (
  totalSpent: number,
  config?: CustomerTypeConfig
): CustomerTypeLabel => {
  const resolved = sanitizeCustomerTypeConfig(config || loadCustomerTypeConfig());
  if (totalSpent >= resolved.premium.min) {
    return 'Premium';
  }
  if (totalSpent >= resolved.standard.min && totalSpent <= resolved.standard.max) {
    return 'Standard';
  }
  return 'Basic';
};
