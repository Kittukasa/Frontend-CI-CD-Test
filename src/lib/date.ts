import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const INVOICE_DATE_FORMATS = [
  'DD-MM-YYYY HH:mm:ss',
  'DD/MM/YYYY HH:mm:ss',
  'DD-MM-YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY/MM/DD HH:mm:ss',
  'YYYY-MM-DD',
  'YYYY/MM/DD'
];

const DATE_ONLY_FORMATS = ['YYYY-MM-DD', 'YYYY/MM/DD'];

const parseWithFormats = (value: string, formats: string[]): Dayjs | null => {
  for (const format of formats) {
    const parsed = dayjs(value, format, true);
    if (parsed.isValid()) {
      return parsed;
    }
  }
  return null;
};

export const parseInvoiceDate = (raw?: string | null): Dayjs | null => {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  const parsed = parseWithFormats(value, INVOICE_DATE_FORMATS);
  if (parsed) {
    return parsed;
  }

  const fallback = dayjs(value);
  return fallback.isValid() ? fallback : null;
};

export const parseDateInputLocal = (raw?: string | null): Dayjs | null => {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  const parsed = parseWithFormats(value, DATE_ONLY_FORMATS);
  if (parsed) {
    return parsed;
  }

  const fallback = dayjs(value);
  return fallback.isValid() ? fallback : null;
};

export const toDateOrNull = (value: Dayjs | null): Date | null =>
  value && value.isValid() ? value.toDate() : null;

export default dayjs;
