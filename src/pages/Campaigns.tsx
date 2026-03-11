import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import { maskPhoneNumber } from '@/lib/maskPhone';
import { getStoredWhatsAppConfig } from '@/lib/whatsappConfig';
import {
  determineCustomerType as resolveCustomerType,
  loadCustomerTypeConfig,
  type CustomerTypeConfig,
} from '@/lib/customerTypes';
import dayjs, {
  parseInvoiceDate as parseInvoiceDateDayjs,
  parseDateInputLocal as parseDateInputLocalDayjs,
  toDateOrNull,
} from '@/lib/date';
import type { LucideIcon } from 'lucide-react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mic,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Type,
  Video,
  Loader2,
  Info,
  Ban,
  CheckCheck,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type CampaignRecipient = {
  phone: string;
  name: string;
  status?: string;
  sentDate?: string;
  messageId?: string;
  lastStatusUpdate?: string;
  error?: string | null;
  errorCode?: string | number | null;
};

type RecipientStatusFilter = 'all' | 'sent' | 'delivered' | 'seen' | 'failed' | 'limited';

type ActiveCampaignSummary = {
  campaignId: string;
  campaignName: string;
  status: string;
  totalRecipients: number;
  completedCount: number;
  failedCount: number;
  updatedAt: string;
};
type ResendAttemptSummary = {
  resendAttemptId: string;
  scheduledAt: string | null;
  createdAt: string | null;
  delayOption: string | null;
  status: string | null;
  eligibleCount: number;
  attemptedCount: number;
  sentCount?: number;
  deliveredCount?: number;
  successCount: number;
  failedCount: number;
  limitedByMetaCount: number;
  lastError?: string | null;
};

type CampaignQuotaInfo = {
  limit: number;
  used: number;
  remaining: number;
  requested: number;
  allowed: number;
};

type CampaignIdentifierPayload = {
  campaignId?: string | null;
  campaignName: string;
  templateName?: string | null;
  start?: string | null;
  end?: string | null;
};

export type Campaign = {
  id: string;
  campaignName: string;
  message: string;
  recipients: CampaignRecipient[];
  sentDate: string;
  status: string;
  totalRecipients: number;
  seenCount: number;
  mediaId?: string;
  templateName?: string | null;
  deliveredCount?: number;
  timeWindowStart?: string | null;
  timeWindowEnd?: string | null;
  campaignId?: string | null;
  resendSettings?: {
    enabled: boolean;
    delayOption?: string | null;
    maxAttempts?: number | null;
    stopped?: boolean;
  };
  latestResendAttempt?: {
    status?: string | null;
    scheduledAt?: string | null;
    attemptedCount?: number;
    successCount?: number;
    failedCount?: number;
    limitedByMetaCount?: number;
    maxAttempts?: number | null;
  } | null;
  overallCampaignStatus?: string | null;
};

type CampaignDetails = Campaign & {
  source?: 'completed' | 'ongoing';
  mockRecipients?: CampaignRecipient[];
};

type OngoingCampaign = {
  id: string;
  campaignName: string;
  template: string;
  sentDate: string;
  status: 'In Progress' | 'Completed';
  deliveredPct: number;
  processingPct: number;
};

const MOCK_ONGOING_CAMPAIGNS: OngoingCampaign[] = [
  {
    id: 'ongoing-001',
    campaignName: 'Weekend Flash Sale',
    template: 'flash_sale',
    sentDate: '2026-01-10T09:30:00Z',
    status: 'In Progress',
    deliveredPct: 62,
    processingPct: 24,
  },
  {
    id: 'ongoing-002',
    campaignName: 'New Arrivals Teaser',
    template: 'new_arrivals_teaser',
    sentDate: '2026-01-11T14:15:00Z',
    status: 'In Progress',
    deliveredPct: 48,
    processingPct: 38,
  },
  {
    id: 'ongoing-003',
    campaignName: 'Member Exclusive Drop',
    template: 'member_exclusive',
    sentDate: '2026-01-12T08:05:00Z',
    status: 'Completed',
    deliveredPct: 100,
    processingPct: 0,
  },
];

const MOCK_ONGOING_RECIPIENTS: Record<string, CampaignRecipient[]> = {
  'ongoing-001': [
    { phone: '+91 98765 43210', name: 'Aarav Patel', status: 'sent' },
    { phone: '+91 98765 43211', name: 'Meera Singh', status: 'delivered' },
    { phone: '+91 98765 43212', name: 'Riya Sharma', status: 'seen' },
    { phone: '+91 98765 43213', name: 'Kabir Jain', status: 'sent' },
  ],
  'ongoing-002': [
    { phone: '+91 98765 43221', name: 'Anaya Gupta', status: 'delivered' },
    { phone: '+91 98765 43222', name: 'Vivaan Iyer', status: 'seen' },
    { phone: '+91 98765 43223', name: 'Isha Mehta', status: 'sent' },
  ],
  'ongoing-003': [
    { phone: '+91 98765 43231', name: 'Arjun Rao', status: 'delivered' },
    { phone: '+91 98765 43232', name: 'Tara Nair', status: 'seen' },
  ],
};

type Customer = {
  phone: string;
  name: string;
  totalSpent?: number;
  customerType?: CustomerType;
  lastPurchase?: string | null;
  lifecycleSegment?: 'new' | 'returning' | 'anonymous';
  imported?: boolean;
};

type CustomerDetail = {
  phone?: string;
  totalSpent?: number;
  name?: string;
  lastPurchase?: string | null;
  customerType?: string;
  lifecycleSegment?: 'new' | 'returning' | 'anonymous';
};

type CustomerType = 'Premium' | 'Standard' | 'Basic';
type LifecycleSegmentFilter = 'new' | 'returning';

type ContactRecord = {
  contact_id: string;
  phone: string | null;
  display_name: string | null;
  normalized_phone: string | null;
  updated_at: string | null;
};

type CampaignInvoice = {
  customer_phone?: string | null;
  customer_number?: string | null;
  phone?: string | null;
  is_excluded?: boolean;
  processed_timestamp_ist?: string | null;
  invoice_date?: string | null;
  total_amount?: number | string | null;
  totalAmount?: number | string | null;
  total?: number | string | null;
  customer_name?: string | null;
};

interface CampaignsProps {
  selectedStore: string | null;
  customerDetails: CustomerDetail[];
  recentCampaigns: Campaign[];
  onRecentCampaignsChange: React.Dispatch<React.SetStateAction<Campaign[]>>;
  preselectedRecipients?: Array<{
    phone: string;
    name?: string;
    totalSpent?: number;
    lifecycleSegment?: 'new' | 'returning' | 'anonymous';
  }>;
  onRecipientsConsumed?: () => void;
}

type TemplatePlaceholder = {
  key: string;
  type: 'positional' | 'named';
  component: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTON';
  buttonIndex?: number;
  subType?: string | null;
};

type TemplateParameterPayload = {
  header?: any[];
  body?: any[];
  footer?: any[];
  buttons?: Array<{
    index: number;
    subType?: string | null;
    parameters: string[];
  }>;
  components?: any[];
};

type TemplateButtonDefault = {
  index: number;
  subType?: string | null;
  parameters: string[];
};

interface QuickTemplate {
  id: string;
  name: string;
  language: string;
  body: string;
  preview: string;
  updatedAt: string;
  isDefault?: boolean;
  headerType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  headerMediaUrl?: string | null;
  headerText?: string | null;
  placeholders?: TemplatePlaceholder[];
  buttonDefaults?: TemplateButtonDefault[];
  rawComponents?: any[];
  templateKind?: 'standard' | 'carousel';
  requiresMedia?: boolean;
  carouselCards?: Array<{
    id: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    mediaRef?: string | null;
    body: string;
    bodyPlaceholderKeys?: string[];
    buttons: Array<{
      index?: number;
      type: string;
      subType?: string | null;
      text: string;
      example?: string;
      placeholderKeys?: string[];
    }>;
  }>;
}

type CarouselCardRuntimeInput = {
  mediaRef: string;
  mediaPreviewUrl?: string;
  bodyValues: Record<string, string>;
  buttonValues: Record<number, string>;
};

const HEADER_TYPE_META: Record<
  Exclude<QuickTemplate['headerType'], undefined>,
  { label: string }
> = {
  TEXT: { label: 'Text' },
  IMAGE: { label: 'Image' },
  VIDEO: { label: 'Video' },
  DOCUMENT: { label: 'Document' },
};

const ALLOWED_HEADER_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_HEADER_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_CAROUSEL_VIDEO_EXTENSIONS = ['mp4'];
const ALLOWED_CAROUSEL_VIDEO_MIME_TYPES = ['video/mp4'];
const RESEND_DELAY_LABELS: Record<string, string> = {
  '2m': '2 minutes',
  '5m': '5 minutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '1d': '1 day',
  '2d': '2 days',
};
const RESEND_DELAY_SECONDS: Record<string, number> = {
  '2m': 2 * 60,
  '5m': 5 * 60,
  '1h': 60 * 60,
  '2h': 2 * 60 * 60,
  '1d': 24 * 60 * 60,
  '2d': 2 * 24 * 60 * 60,
};

const buildUniqueCampaignName = (templateName: string) => {
  const base = templateName.replace(/_/g, ' ').trim() || 'Campaign';
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours()
  )}${pad(now.getMinutes())}`;
  return `${base} ${stamp}`;
};

const getHeaderTypeMeta = (type?: QuickTemplate['headerType']) => {
  if (!type) return null;
  return HEADER_TYPE_META[type] ?? null;
};

type CampaignDateRangePreset = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

type StoredCampaignDateFilter = {
  dateRange: { start: string; end: string };
  preset: CampaignDateRangePreset;
};

const CAMPAIGNS_DATE_FILTER_STORAGE_KEY = 'bb_campaigns_date_filter';

const WHATSAPP_CHAT_WALLPAPER =
  'url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27240%27%20height%3D%27240%27%20viewBox%3D%270%200%20240%20240%27%3E%3Crect%20fill%3D%27%23e5ddd5%27%20width%3D%27240%27%20height%3D%27240%27/%3E%3Cg%20fill%3D%27none%27%20stroke%3D%27%23d5c4b5%27%20stroke-width%3D%272%27%20opacity%3D%270.35%27%3E%3Cpath%20d%3D%27M0%2040h240M0%20120h240M0%20200h240M40%200v240M120%200v240M200%200v240%27/%3E%3C/g%3E%3Cg%20fill%3D%27%23d5c4b5%27%20opacity%3D%270.5%27%3E%3Ccircle%20cx%3D%2730%27%20cy%3D%2730%27%20r%3D%274%27/%3E%3Ccircle%20cx%3D%27150%27%20cy%3D%2790%27%20r%3D%274%27/%3E%3Ccircle%20cx%3D%27210%27%20cy%3D%27150%27%20r%3D%274%27/%3E%3Ccircle%20cx%3D%2790%27%20cy%3D%27180%27%20r%3D%274%27/%3E%3C/g%3E%3C/svg%3E")';

const shouldIgnoreStoredCampaignDateFilter = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const navEntries = performance.getEntriesByType?.('navigation');
  if (navEntries && navEntries.length > 0) {
    const entry = navEntries[0] as PerformanceNavigationTiming;
    return entry.type === 'reload';
  }

  const legacyNav = (performance as Performance & { navigation?: { type?: number } }).navigation;
  return legacyNav?.type === 1;
};

const readStoredCampaignDateFilter = (): StoredCampaignDateFilter | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (shouldIgnoreStoredCampaignDateFilter()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CAMPAIGNS_DATE_FILTER_STORAGE_KEY);
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

    if (!dateRange || typeof dateRange.start !== 'string' || typeof dateRange.end !== 'string') {
      return null;
    }

    const allowedPresets: CampaignDateRangePreset[] = [
      'today',
      'week',
      'month',
      'year',
      'all',
      'custom',
    ];
    const presetString = typeof preset === 'string' ? preset : 'custom';
    const safePreset: CampaignDateRangePreset = allowedPresets.includes(
      presetString as CampaignDateRangePreset
    )
      ? (presetString as CampaignDateRangePreset)
      : 'custom';

    return {
      dateRange: {
        start: dateRange.start,
        end: dateRange.end,
      },
      preset: safePreset,
    };
  } catch {
    return null;
  }
};

const formatDateInput = (date: Date) => dayjs(date).format('YYYY-MM-DD');

const getDefaultCampaignDateRange = () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    start: formatDateInput(startOfMonth),
    end: formatDateInput(today),
  };
};

const toDateAtStartOfDay = (value?: string | null) =>
  toDateOrNull(parseDateInputLocalDayjs(value)?.startOf('day'));

const toDateAtEndOfDay = (value?: string | null) =>
  toDateOrNull(parseDateInputLocalDayjs(value)?.endOf('day'));

const parseTemplatePlaceholders = (
  body: string,
  component: TemplatePlaceholder['component']
): TemplatePlaceholder[] => {
  if (!body) {
    return [];
  }

  const placeholders: TemplatePlaceholder[] = [];
  const seen = new Set<string>();
  const regex = /{{\s*([\w.-]+)\s*}}/g;
  let result: RegExpExecArray | null;

  while ((result = regex.exec(body)) !== null) {
    const token = result[1];
    if (seen.has(token)) {
      continue;
    }
    seen.add(token);

    const numericValue = Number(token);
    const isPositional = Number.isFinite(numericValue);

    placeholders.push({
      key: token,
      type: isPositional ? 'positional' : 'named',
      component,
    });
  }

  return placeholders;
};

const extractTemplateButtonDefaults = (components: any[]): TemplateButtonDefault[] => {
  if (!Array.isArray(components)) {
    return [];
  }

  const buttonsComponent = components.find(
    (component: any) =>
      (component?.type || component?.Type || '').toString().toUpperCase() === 'BUTTONS'
  );
  const buttons = Array.isArray(buttonsComponent?.buttons) ? buttonsComponent.buttons : [];

  return buttons
    .map((button: any, index: number) => {
      const subType = (button?.type || button?.sub_type || '').toString().trim().toLowerCase();
      if (subType !== 'copy_code') {
        return null;
      }

      const exampleValue = Array.isArray(button?.example)
        ? button.example.find(
            (value: unknown) => typeof value === 'string' && value.trim().length > 0
          )
        : typeof button?.example === 'string'
        ? button.example
        : '';
      const fallbackText = typeof button?.text === 'string' ? button.text.trim() : '';
      const couponCode = String(exampleValue || fallbackText || '').trim();
      if (!couponCode) {
        return null;
      }

      return {
        index,
        subType: 'copy_code',
        parameters: [couponCode],
      };
    })
    .filter((button): button is TemplateButtonDefault => Boolean(button));
};

const extractTemplateMediaReference = (component: any): string | null => {
  if (!component || typeof component !== 'object') {
    return null;
  }

  const sampleUrl =
    component.sample_url ||
    component.sampleUrl ||
    (Array.isArray(component.example?.header_url) ? component.example.header_url[0] : null) ||
    component.example?.header_url ||
    (Array.isArray(component.example?.header_handle) ? component.example.header_handle[0] : null) ||
    component.example?.header_handle ||
    null;

  if (typeof sampleUrl === 'string' && sampleUrl.trim()) {
    return sampleUrl.trim();
  }

  return null;
};

const buildTemplateMediaParameter = (format: string, mediaRef: string) => {
  const normalizedFormat = format.toLowerCase();
  const key =
    normalizedFormat === 'image' ? 'image' : normalizedFormat === 'video' ? 'video' : 'document';
  const normalizedRef = String(mediaRef || '').trim();
  const isHttpRef = /^https?:\/\//i.test(normalizedRef);
  const isNumericId = /^\d+$/.test(normalizedRef);
  return {
    type: key,
    [key]: isHttpRef
      ? { link: normalizedRef }
      : { id: isNumericId ? Number(normalizedRef) : normalizedRef },
  };
};

const buildDefaultTemplateComponents = (
  template: QuickTemplate | null,
  carouselRuntimeInputs: Record<string, CarouselCardRuntimeInput> = {}
): any[] => {
  if (!template?.rawComponents?.length) {
    return [];
  }

  const defaults: any[] = [];

  template.rawComponents.forEach(component => {
    const type = (component?.type || component?.Type || '').toString().toUpperCase();

    if (type === 'CAROUSEL') {
      const cards = Array.isArray(component?.cards) ? component.cards : [];
      const normalizedCards = cards
        .map((card: any, cardIndex: number) => {
          const cardComponents = Array.isArray(card?.components) ? card.components : [];
          const normalizedCardComponents: any[] = [];

          cardComponents.forEach((cardComponent: any) => {
            const cardType = (cardComponent?.type || '').toString().toUpperCase();
            const runtimeCardId = `card_${cardIndex + 1}`;
            const runtimeInput = carouselRuntimeInputs[runtimeCardId];

            if (cardType === 'HEADER') {
              const format = (cardComponent?.format || '').toString().toUpperCase();
              const mediaRef = runtimeInput?.mediaRef?.trim() || '';
              if (!format || !mediaRef) {
                return;
              }
              normalizedCardComponents.push({
                type: 'header',
                parameters: [buildTemplateMediaParameter(format, mediaRef)],
              });
              return;
            }

            if (cardType === 'BODY') {
              const bodyText = typeof cardComponent?.text === 'string' ? cardComponent.text : '';
              const bodyPlaceholderKeys = parseTemplatePlaceholders(bodyText, 'BODY').map(
                placeholder => placeholder.key
              );
              const parameters = bodyPlaceholderKeys
                .map(key => runtimeInput?.bodyValues?.[key] || '')
                .map(value => value.trim())
                .filter(Boolean)
                .map(value => ({ type: 'text', text: value }));
              if (parameters.length) {
                normalizedCardComponents.push({
                  type: 'body',
                  parameters,
                });
              }
              return;
            }

            if (cardType === 'BUTTONS') {
              const buttons = Array.isArray(cardComponent?.buttons) ? cardComponent.buttons : [];
              buttons.forEach((button: any, buttonIndex: number) => {
                const buttonType = (button?.type || '').toString().toUpperCase();
                if (buttonType === 'COPY_CODE') {
                  const couponCode =
                    runtimeInput?.buttonValues?.[buttonIndex] ||
                    (Array.isArray(button?.example) ? button.example[0] : button?.example) ||
                    button?.text ||
                    '';
                  const normalizedCode = typeof couponCode === 'string' ? couponCode.trim() : '';
                  if (!normalizedCode) {
                    return;
                  }
                  normalizedCardComponents.push({
                    type: 'button',
                    sub_type: 'copy_code',
                    index: String(buttonIndex),
                    parameters: [
                      {
                        type: 'coupon_code',
                        coupon_code: normalizedCode,
                      },
                    ],
                  });
                  return;
                }

                if (buttonType === 'URL') {
                  const example =
                    runtimeInput?.buttonValues?.[buttonIndex] ||
                    (Array.isArray(button?.example) ? button.example[0] : button?.example) ||
                    '';
                  const normalizedExample = typeof example === 'string' ? example.trim() : '';
                  if (!normalizedExample) {
                    return;
                  }
                  normalizedCardComponents.push({
                    type: 'button',
                    sub_type: 'url',
                    index: String(buttonIndex),
                    parameters: [
                      {
                        type: 'text',
                        text: normalizedExample,
                      },
                    ],
                  });
                }
              });
            }
          });

          if (!normalizedCardComponents.length) {
            return null;
          }

          return {
            card_index: String(cardIndex),
            components: normalizedCardComponents,
          };
        })
        .filter(Boolean);

      if (normalizedCards.length) {
        defaults.push({
          type: 'carousel',
          cards: normalizedCards,
        });
      }
    }
  });

  return defaults;
};

const buildDefaultHeaderParameters = (template: QuickTemplate | null): any[] => {
  if (!template?.rawComponents?.length) {
    return [];
  }

  const headerComponent = template.rawComponents.find(
    component => (component?.type || component?.Type || '').toString().toUpperCase() === 'HEADER'
  );
  if (!headerComponent) {
    return [];
  }

  const format = (headerComponent?.format || headerComponent?.Format || '')
    .toString()
    .toUpperCase();
  if (!format || format === 'TEXT') {
    return [];
  }

  const mediaRef = extractTemplateMediaReference(headerComponent);
  if (!mediaRef) {
    return [];
  }

  return [buildTemplateMediaParameter(format, mediaRef)];
};

const extractCarouselCardsFromComponents = (components: any[]): QuickTemplate['carouselCards'] => {
  if (!Array.isArray(components)) {
    return [];
  }

  const carouselComponent = components.find(
    component => (component?.type || component?.Type || '').toString().toUpperCase() === 'CAROUSEL'
  );
  const cards = Array.isArray(carouselComponent?.cards) ? carouselComponent.cards : [];
  if (!cards.length) {
    return [];
  }

  return cards.map((card: any, index: number) => {
    const cardComponents = Array.isArray(card?.components) ? card.components : [];
    const header = cardComponents.find(
      (component: any) => (component?.type || '').toString().toUpperCase() === 'HEADER'
    );
    const body = cardComponents.find(
      (component: any) => (component?.type || '').toString().toUpperCase() === 'BODY'
    );
    const buttonsComponent = cardComponents.find(
      (component: any) => (component?.type || '').toString().toUpperCase() === 'BUTTONS'
    );
    const buttons = Array.isArray(buttonsComponent?.buttons) ? buttonsComponent.buttons : [];
    const mediaType = ((header?.format || 'IMAGE').toString().toUpperCase() || 'IMAGE') as
      | 'IMAGE'
      | 'VIDEO'
      | 'DOCUMENT';

    return {
      id: `card_${index + 1}`,
      mediaType,
      mediaRef: extractTemplateMediaReference(header),
      body: typeof body?.text === 'string' ? body.text : '',
      bodyPlaceholderKeys: parseTemplatePlaceholders(
        typeof body?.text === 'string' ? body.text : '',
        'BODY'
      ).map(placeholder => placeholder.key),
      buttons: buttons.map((button: any, buttonIndex: number) => ({
        index: buttonIndex,
        type: (button?.type || '').toString().toUpperCase(),
        subType: (button?.sub_type || button?.type || '').toString().toLowerCase() || null,
        text: typeof button?.text === 'string' ? button.text : '',
        example: (Array.isArray(button?.example) ? button.example[0] : button?.example) || '',
        placeholderKeys:
          (button?.type || '').toString().toUpperCase() === 'URL'
            ? parseTemplatePlaceholders(
                typeof button?.url === 'string' ? button.url : '',
                'BUTTON'
              ).map(placeholder => placeholder.key)
            : [],
      })),
    };
  });
};

const extractTemplatePlaceholdersFromComponents = (components: any[]): TemplatePlaceholder[] => {
  if (!Array.isArray(components)) {
    return [];
  }

  const placeholders: TemplatePlaceholder[] = [];
  components.forEach((component: any) => {
    const componentType = (component?.type || component?.Type || '').toString().toUpperCase();
    if (componentType === 'FOOTER' && typeof component?.text === 'string') {
      placeholders.push(...parseTemplatePlaceholders(component.text, 'FOOTER'));
      return;
    }
    if (componentType !== 'BUTTONS') {
      return;
    }
    const buttons = Array.isArray(component?.buttons) ? component.buttons : [];
    buttons.forEach((button: any, index: number) => {
      const buttonType = (button?.type || '').toString().toUpperCase();
      if (buttonType === 'URL' && typeof button?.url === 'string') {
        parseTemplatePlaceholders(button.url, 'BUTTON').forEach(placeholder => {
          placeholders.push({
            ...placeholder,
            component: 'BUTTON',
            buttonIndex: index,
            subType: 'url',
          });
        });
      }
    });
  });

  return placeholders;
};

const getRecipientDisplayName = (rawName: string | null | undefined, phone: string): string => {
  const trimmed = (rawName || '').trim();
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

const isInvalidContactName = (value?: string | null) => {
  const name = (value || '').trim().toLowerCase();
  return !name || name === 'nill' || name === 'nil';
};

const normalizePhoneDigits = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const digits = value.toString().replace(/[^\d]/g, '');
  if (!digits) {
    return '';
  }
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const dedupeContacts = (records: ContactRecord[]) => {
  const map = new Map<string, ContactRecord>();
  records.forEach(record => {
    const key = normalizePhoneDigits(record.normalized_phone || record.phone) || record.contact_id;
    if (!key) {
      map.set(record.contact_id, record);
      return;
    }
    const existing = map.get(key);
    if (!existing) {
      map.set(key, record);
      return;
    }
    const existingUpdated = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
    const candidateUpdated = record.updated_at ? new Date(record.updated_at).getTime() : 0;
    if (candidateUpdated >= existingUpdated) {
      map.set(key, record);
    }
  });
  return Array.from(map.values());
};

const normalizePhoneNumber = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  const digits = value.toString().replace(/[^\d]/g, '');
  if (!digits) {
    return null;
  }
  const trimmed = digits.length > 10 ? digits.slice(-10) : digits;
  if (/^0+$/.test(trimmed)) {
    return null;
  }
  return trimmed;
};

const parseProcessedTimestampValue = (value?: string | null): Date | null =>
  toDateOrNull(parseInvoiceDateDayjs(value ?? null));

const parseInvoiceDateValue = (input?: string | null): Date | null =>
  toDateOrNull(parseInvoiceDateDayjs(input ?? null));

const getInvoiceTimestamp = (invoice: CampaignInvoice): Date | null => {
  return (
    parseProcessedTimestampValue(invoice.processed_timestamp_ist) ||
    parseInvoiceDateValue(invoice.invoice_date)
  );
};

const determineCustomerType = (total: number, config?: CustomerTypeConfig): CustomerType => {
  const resolvedConfig = config || loadCustomerTypeConfig();
  return resolveCustomerType(total, resolvedConfig) as CustomerType;
};

const CUSTOMER_TYPE_OPTIONS: CustomerType[] = ['Premium', 'Standard', 'Basic'];

const buildCampaignIdentifier = (payload: CampaignIdentifierPayload): string => {
  try {
    const normalized = {
      campaignId: payload.campaignId ?? null,
      campaignName: payload.campaignName,
      templateName: payload.templateName ?? null,
      start: payload.start ?? null,
      end: payload.end ?? null,
    };
    return JSON.stringify(normalized);
  } catch {
    return String(payload?.campaignId || payload?.campaignName || 'campaign');
  }
};

const buildCustomersForDateRange = (
  invoices: CampaignInvoice[],
  startDate: Date | null,
  endDate: Date | null,
  fallbackDetails: CustomerDetail[],
  customerTypeConfig: CustomerTypeConfig
): Customer[] => {
  if (!invoices.length && !fallbackDetails.length) {
    return [];
  }

  const fallbackMap = new Map<
    string,
    {
      name?: string;
      phone?: string;
      lastPurchase?: string | null;
      totalSpent?: number;
      customerType?: CustomerType;
      lifecycleSegment?: 'new' | 'returning' | 'anonymous';
    }
  >();
  fallbackDetails.forEach(detail => {
    if (!detail?.phone) {
      return;
    }
    const key = normalizePhoneNumber(detail.phone) || detail.phone;
    if (!key) {
      return;
    }
    if (!fallbackMap.has(key)) {
      fallbackMap.set(key, {
        name: detail.name,
        phone: detail.phone,
        lastPurchase: detail.lastPurchase ?? null,
        totalSpent: detail.totalSpent,
        customerType: detail.customerType as CustomerType | undefined,
      });
    }
  });

  const aggregated = new Map<
    string,
    {
      phone: string | null;
      name?: string;
      isAnonymous: boolean;
      totalSpentInRange: number;
      lastPurchaseInRange?: Date | null;
      invoiceCountInRange: number;
    }
  >();

  invoices.forEach(invoice => {
    if (invoice.is_excluded) {
      return;
    }
    const rawPhone = invoice.customer_phone || invoice.customer_number || invoice.phone || null;
    if (!rawPhone) {
      return;
    }
    const normalizedDigits = rawPhone.toString().replace(/\D/g, '');
    const isAnonymous = normalizedDigits === '0000000000';

    const key = normalizePhoneNumber(rawPhone) || rawPhone;
    if (!key) {
      return;
    }

    const timestamp = getInvoiceTimestamp(invoice);
    const amountRaw = invoice.total_amount ?? invoice.totalAmount ?? invoice.total;
    const parsedAmount = Number(amountRaw ?? 0);
    const amount = Number.isFinite(parsedAmount) ? parsedAmount : 0;

    let entry = aggregated.get(key);
    if (!entry) {
      entry = {
        phone: rawPhone,
        name: invoice.customer_name?.trim() || undefined,
        isAnonymous,
        totalSpentInRange: 0,
        lastPurchaseInRange: null,
        invoiceCountInRange: 0,
      };
      aggregated.set(key, entry);
    } else {
      if (rawPhone && (!entry.phone || rawPhone.length > entry.phone.length)) {
        entry.phone = rawPhone;
      }
      if (!entry.name && invoice.customer_name) {
        entry.name = invoice.customer_name.trim();
      }
    }

    const withinRange =
      !timestamp || ((!startDate || timestamp >= startDate) && (!endDate || timestamp <= endDate));
    if (withinRange) {
      entry.totalSpentInRange += amount;
      entry.invoiceCountInRange += 1;
      if (timestamp && (!entry.lastPurchaseInRange || timestamp > entry.lastPurchaseInRange)) {
        entry.lastPurchaseInRange = timestamp;
      }
    }
  });

  fallbackMap.forEach((value, key) => {
    const fallbackName = value.name?.trim() || undefined;
    const fallbackPhone = value.phone ?? null;
    const fallbackDate =
      parseProcessedTimestampValue(value.lastPurchase) || parseInvoiceDateValue(value.lastPurchase);

    let entry = aggregated.get(key);
    if (!entry) {
      entry = {
        phone: fallbackPhone || key,
        name: fallbackName,
        isAnonymous: (fallbackPhone || key).replace(/\D/g, '') === '0000000000',
        totalSpentInRange: Number(value.totalSpent ?? 0),
        lastPurchaseInRange: fallbackDate ?? null,
        invoiceCountInRange: 1,
      };
      aggregated.set(key, entry);
      return;
    }

    if (!entry.name && fallbackName) {
      entry.name = fallbackName;
    }
    if (fallbackPhone && (!entry.phone || fallbackPhone.length > entry.phone.length)) {
      entry.phone = fallbackPhone;
    }
    if (fallbackDate && (!entry.lastPurchaseInRange || fallbackDate > entry.lastPurchaseInRange)) {
      entry.lastPurchaseInRange = fallbackDate;
    }
  });

  const customers = Array.from(aggregated.entries()).map(([key, entry]) => {
    const fallback = fallbackMap.get(key);
    const phone = entry.phone || key;
    const total = Number.isFinite(entry.totalSpentInRange) ? entry.totalSpentInRange : 0;
    const name = entry.name?.trim() || (phone ? `Customer ${maskPhoneNumber(phone)}` : 'Customer');
    const lastPurchase = entry.lastPurchaseInRange ? entry.lastPurchaseInRange.toISOString() : null;
    const totalForType = total || Number(fallback?.totalSpent ?? 0);
    const resolvedType =
      fallback?.customerType ?? determineCustomerType(totalForType, customerTypeConfig);
    const resolvedLifecycleSegment = entry.isAnonymous
      ? 'anonymous'
      : entry.invoiceCountInRange <= 1
      ? 'new'
      : 'returning';

    return {
      phone,
      name,
      totalSpent: total,
      customerType: resolvedType,
      lastPurchase,
      lifecycleSegment: resolvedLifecycleSegment,
    } as Customer;
  });

  return customers
    .filter(customer => {
      if (!customer.phone) return false;
      const original = aggregated.get(normalizePhoneNumber(customer.phone) || customer.phone);
      return (original?.invoiceCountInRange ?? 0) > 0;
    })
    .sort((a, b) => {
      if ((b.totalSpent || 0) !== (a.totalSpent || 0)) {
        return (b.totalSpent || 0) - (a.totalSpent || 0);
      }
      return a.name.localeCompare(b.name);
    });
};

const Campaigns: React.FC<CampaignsProps> = ({
  selectedStore,
  customerDetails,
  recentCampaigns,
  onRecentCampaignsChange,
  preselectedRecipients,
  onRecipientsConsumed,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoToCustomersTab = () => {
    const params = new URLSearchParams(location.search);
    params.set('tab', 'customers');
    const searchString = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: searchString ? `?${searchString}` : '',
        hash: '#customer-type-section',
      },
      { replace: false }
    );
  };
  const handleViewContacts = () => navigate('/contacts');
  const handleImportContacts = () => navigate('/contacts?import=1');
  const handleToggleImported = async () => {
    if (includeImported) {
      setIncludeImported(false);
      setSelectedRecipients(prev => prev.filter(recipient => !recipient.imported));
      return;
    }
    const contacts = await loadImportedRecipients();
    if (!contacts || contacts.length === 0) {
      toast({
        title: 'No imported contacts found',
        description: 'Import contacts first, then try again.',
        variant: 'destructive',
      });
      return;
    }
    setIncludeImported(true);
    setSelectedRecipients(prev => {
      const map = new Map(prev.map(item => [normalizePhoneNumber(item.phone) || item.phone, item]));
      contacts.forEach(contact => {
        const key = normalizePhoneNumber(contact.phone) || contact.phone;
        if (key && !map.has(key)) {
          map.set(key, contact);
        }
      });
      return Array.from(map.values());
    });
  };

  const [campaignName, setCampaignName] = useState('');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [quotaChecking, setQuotaChecking] = useState(false);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<CampaignQuotaInfo | null>(null);
  const [quotaWithinLimit, setQuotaWithinLimit] = useState(true);
  const [quotaPreview, setQuotaPreview] = useState<CampaignQuotaInfo | null>(null);
  const [quotaPreviewLoading, setQuotaPreviewLoading] = useState(false);
  const quotaExceededRef = useRef(false);
  const [campaignHistory, setCampaignHistory] = useState<Campaign[]>([]);
  const [selectedCampaignDetails, setSelectedCampaignDetails] = useState<CampaignDetails | null>(
    null
  );
  const [campaignsTableTab, setCampaignsTableTab] = useState<'completed' | 'ongoing'>('completed');
  const [modalRecipients, setModalRecipients] = useState<CampaignRecipient[]>([]);
  const [modalRecipientsLoading, setModalRecipientsLoading] = useState(false);
  const [modalRecipientsError, setModalRecipientsError] = useState<string | null>(null);
  const [resendHistory, setResendHistory] = useState<ResendAttemptSummary[]>([]);
  const [resendHistoryLoading, setResendHistoryLoading] = useState(false);
  const [resendHistoryError, setResendHistoryError] = useState<string | null>(null);
  const [stopCampaignLoading, setStopCampaignLoading] = useState<Record<string, boolean>>({});

  const [activeCampaignProgress, setActiveCampaignProgress] = useState<
    Record<string, ActiveCampaignSummary>
  >({});

  const storedCampaignDateFilterRef = useRef<StoredCampaignDateFilter | null>(null);
  if (storedCampaignDateFilterRef.current === null) {
    storedCampaignDateFilterRef.current = readStoredCampaignDateFilter();
  }

  const [dateRange, setDateRange] = useState(
    () => storedCampaignDateFilterRef.current?.dateRange ?? getDefaultCampaignDateRange()
  );
  const [selectedRangePreset, setSelectedRangePreset] = useState<CampaignDateRangePreset>(
    () => storedCampaignDateFilterRef.current?.preset ?? 'month'
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const payload: StoredCampaignDateFilter = {
      dateRange,
      preset: selectedRangePreset,
    };
    window.localStorage.setItem(CAMPAIGNS_DATE_FILTER_STORAGE_KEY, JSON.stringify(payload));
  }, [dateRange, selectedRangePreset]);

  const shouldPollCampaignProgress = useMemo(() => {
    return campaignsTableTab === 'ongoing';
  }, [campaignsTableTab]);

  useEffect(() => {
    if (!selectedStore || !shouldPollCampaignProgress) {
      setActiveCampaignProgress({});
      return;
    }

    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchActiveProgress = async () => {
      try {
        const token = localStorage.getItem('bb_token');
        if (!token) {
          return;
        }
        const response = await fetch('/api/whatsapp/campaigns/active/progress', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 404) {
          if (isMounted) {
            setActiveCampaignProgress({});
          }
          return;
        }
        if (!response.ok) {
          throw new Error(data?.error || 'Unable to fetch campaign progress');
        }
        if (!isMounted) {
          return;
        }
        const map: Record<string, ActiveCampaignSummary> = {};
        const campaigns: ActiveCampaignSummary[] = Array.isArray(data?.campaigns)
          ? data.campaigns
          : [];
        campaigns.forEach(item => {
          if (item?.campaignId) {
            map[item.campaignId] = item;
          }
        });
        setActiveCampaignProgress(map);
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch campaign progress', error);
        }
      }
    };

    fetchActiveProgress();
    intervalId = setInterval(fetchActiveProgress, 5000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedStore, shouldPollCampaignProgress]);

  const [customerInvoices, setCustomerInvoices] = useState<CampaignInvoice[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [importedContactsLoading, setImportedContactsLoading] = useState(false);
  const [totalContactsCount, setTotalContactsCount] = useState<number | null>(null);
  const [totalContactsCountLoading, setTotalContactsCountLoading] = useState(false);
  const customerTypeConfig = useMemo(() => loadCustomerTypeConfig(), []);
  const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>([]);
  const [quickTemplatesLoading, setQuickTemplatesLoading] = useState(false);
  const [quickTemplatesError, setQuickTemplatesError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<QuickTemplate | null>(null);
  const [sendMode, setSendMode] = useState<'text' | 'image-template'>('text');
  const [templateNameOverride, setTemplateNameOverride] = useState<string>('');
  const [templateLanguage, setTemplateLanguage] = useState<string>('en_US');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageInputKey, setImageInputKey] = useState<number>(0);
  const [carouselRuntimeInputs, setCarouselRuntimeInputs] = useState<
    Record<string, CarouselCardRuntimeInput>
  >({});
  const [carouselUploadBusyCardId, setCarouselUploadBusyCardId] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<'android' | 'ios'>('android');
  const [previewCarouselIndex, setPreviewCarouselIndex] = useState(0);
  const [draftCampaignId, setDraftCampaignId] = useState(() => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `campaign_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  });
  const [resendSettingsEnabled, setResendSettingsEnabled] = useState(true);
  const [resendSettingsDelay, setResendSettingsDelay] = useState<'1d' | '2d'>('1d');
  const storedWhatsAppConfig = useMemo(() => getStoredWhatsAppConfig(), []);
  const [selectedRecipients, setSelectedRecipients] = useState<Customer[]>([]);
  const [selectedCustomerTypes, setSelectedCustomerTypes] = useState<CustomerType[]>([]);
  const [selectedLifecycleSegments, setSelectedLifecycleSegments] = useState<
    LifecycleSegmentFilter[]
  >([]);
  const [importedContacts, setImportedContacts] = useState<Customer[]>([]);
  const [includeImported, setIncludeImported] = useState(false);
  const selectedTemplateIsCarousel = selectedTemplate?.templateKind === 'carousel';
  const selectedTemplateRequiresMedia = Boolean(selectedTemplate?.requiresMedia);

  const effectiveFilteredCustomers = useMemo(() => {
    if (!includeImported) {
      return filteredCustomers.filter(customer => !customer.imported);
    }
    const map = new Map<string, Customer>();
    filteredCustomers.forEach(customer => {
      const key = normalizePhoneNumber(customer.phone) || customer.phone;
      if (key) {
        map.set(key, customer);
      }
    });
    importedContacts.forEach(customer => {
      const key = normalizePhoneNumber(customer.phone) || customer.phone;
      if (key && !map.has(key)) {
        map.set(key, customer);
      }
    });
    return Array.from(map.values());
  }, [filteredCustomers, importedContacts, includeImported]);

  useEffect(() => {
    if (!selectedStore || selectedRecipients.length === 0) {
      setQuotaPreview(null);
      quotaExceededRef.current = false;
      return;
    }

    setQuotaPreviewLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/whatsapp/campaigns/quota-check', {
          method: 'POST',
          headers: buildAuthHeaders(true),
          body: JSON.stringify({ requested: selectedRecipients.length }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || 'Unable to check campaign quota.');
        }
        const preview: CampaignQuotaInfo = {
          limit: Number(payload.limit ?? 1000),
          used: Number(payload.used ?? 0),
          remaining: Number(payload.remaining ?? 0),
          requested: Number(payload.requested ?? selectedRecipients.length),
          allowed: Number(payload.allowed ?? 0),
        };
        setQuotaPreview(preview);
      } catch (error) {
        setQuotaPreview(null);
      } finally {
        setQuotaPreviewLoading(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [selectedRecipients.length, selectedStore]);

  useEffect(() => {
    const exceeded = Boolean(quotaPreview && quotaPreview.remaining < quotaPreview.requested);
    if (exceeded && !quotaModalOpen && !quotaExceededRef.current) {
      setQuotaInfo(quotaPreview);
      setQuotaWithinLimit(false);
      setQuotaModalOpen(true);
    }
    quotaExceededRef.current = exceeded;
  }, [quotaPreview, quotaModalOpen]);
  const customerTypeLabels = useMemo<Record<CustomerType, string>>(
    () => ({
      Premium: `â‚¹${customerTypeConfig.premium.min.toLocaleString()}+`,
      Standard: `â‚¹${customerTypeConfig.standard.min.toLocaleString()} - â‚¹${customerTypeConfig.standard.max.toLocaleString()}`,
      Basic: `Below â‚¹${customerTypeConfig.basic.max.toLocaleString()}`,
    }),
    [customerTypeConfig]
  );
  const customerTypeCounts = useMemo(() => {
    const counts: Record<CustomerType, number> = {
      Premium: 0,
      Standard: 0,
      Basic: 0,
    };
    const source =
      selectedLifecycleSegments.length > 0
        ? effectiveFilteredCustomers.filter(customer => {
            const segment = customer.lifecycleSegment;
            return (
              (segment === 'new' && selectedLifecycleSegments.includes('new')) ||
              (segment === 'returning' && selectedLifecycleSegments.includes('returning'))
            );
          })
        : effectiveFilteredCustomers;
    source.forEach(customer => {
      const resolvedType =
        (customer.customerType as CustomerType | undefined) ??
        determineCustomerType(customer.totalSpent || 0, customerTypeConfig);
      if (resolvedType && counts[resolvedType] !== undefined) {
        counts[resolvedType] += 1;
      }
    });
    return counts;
  }, [effectiveFilteredCustomers, customerTypeConfig, selectedLifecycleSegments]);

  const lifecycleCategoryCounts = useMemo(() => {
    const counts: Record<'new' | 'returning', number> = {
      new: 0,
      returning: 0,
    };
    const source =
      selectedCustomerTypes.length > 0
        ? effectiveFilteredCustomers.filter(customer => {
            const resolvedType =
              (customer.customerType as CustomerType | undefined) ??
              determineCustomerType(customer.totalSpent || 0, customerTypeConfig);
            return selectedCustomerTypes.includes(resolvedType);
          })
        : effectiveFilteredCustomers;
    source.forEach(customer => {
      const segment = customer.lifecycleSegment;
      if (segment && counts[segment] !== undefined) {
        counts[segment] += 1;
      }
    });
    return counts;
  }, [effectiveFilteredCustomers, selectedCustomerTypes, customerTypeConfig]);

  const skipNextRecipientsPruneRef = useRef(false);
  const [showRecipientsDropdown, setShowRecipientsDropdown] = useState(false);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const recipientsDropdownRef = useRef<HTMLDivElement | null>(null);
  const createCampaignRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('focusCreateCampaign') !== '1') {
      return;
    }

    createCampaignRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    params.delete('focusCreateCampaign');
    const search = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: search ? `?${search}` : '',
      },
      { replace: true }
    );
  }, [location.pathname, location.search, navigate]);
  const [templateVariableValues, setTemplateVariableValues] = useState<Record<string, string>>({});
  const [recipientStatusFilter, setRecipientStatusFilter] = useState<RecipientStatusFilter>('all');
  const campaignHistoryRef = useRef<Campaign[]>([]);
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const messageTokens = useMemo(() => {
    const tokens: Array<{ type: 'text'; value: string } | { type: 'placeholder'; value: string }> =
      [];
    if (!campaignMessage) {
      return tokens;
    }

    const regex = /{{\s*([\w.-]+)\s*}}/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(campaignMessage)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ type: 'text', value: campaignMessage.slice(lastIndex, match.index) });
      }

      tokens.push({ type: 'placeholder', value: match[1] });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < campaignMessage.length) {
      tokens.push({ type: 'text', value: campaignMessage.slice(lastIndex) });
    }

    return tokens;
  }, [campaignMessage]);

  const templatePlaceholders = useMemo<TemplatePlaceholder[]>(() => {
    if (selectedTemplate && selectedTemplate.placeholders) {
      return selectedTemplate.placeholders;
    }
    if (!campaignMessage) {
      return [];
    }
    return parseTemplatePlaceholders(campaignMessage, 'BODY');
  }, [campaignMessage, selectedTemplate]);

  const footerTemplatePlaceholders = useMemo(
    () => templatePlaceholders.filter(placeholder => placeholder.component === 'FOOTER'),
    [templatePlaceholders]
  );

  const buttonTemplatePlaceholders = useMemo(
    () => templatePlaceholders.filter(placeholder => placeholder.component === 'BUTTON'),
    [templatePlaceholders]
  );

  const bodyPlaceholderOrder = useMemo(() => {
    return messageTokens.filter(token => token.type === 'placeholder').map(token => token.value);
  }, [messageTokens]);

  const previewMessage = useMemo(() => {
    if (messageTokens.length === 0) {
      return '';
    }
    return messageTokens
      .map(token =>
        token.type === 'text'
          ? token.value
          : templateVariableValues[token.value]?.trim() || token.value
      )
      .join('');
  }, [messageTokens, templateVariableValues]);

  const previewHeaderImage = useMemo(() => {
    if (sendMode !== 'image-template') {
      return null;
    }
    if (imagePreviewUrl) {
      return imagePreviewUrl;
    }
    return selectedTemplate?.headerMediaUrl || null;
  }, [sendMode, imagePreviewUrl, selectedTemplate?.headerMediaUrl]);

  const previewHeaderText = useMemo(() => {
    if (!selectedTemplate?.headerText) {
      return null;
    }
    let text = selectedTemplate.headerText;
    const regex = /{{\s*([\w.-]+)\s*}}/g;
    text = text.replace(regex, (_, key) => templateVariableValues[key]?.trim() || key);
    return text;
  }, [selectedTemplate, templateVariableValues]);

  const carouselPreviewCards = useMemo(() => {
    if (!selectedTemplateIsCarousel || !selectedTemplate?.carouselCards?.length) {
      return [];
    }

    const replaceTemplateVariables = (input: string, values: Record<string, string>) =>
      input.replace(
        /{{\s*([\w.-]+)\s*}}/g,
        (_, key: string) => values[key]?.trim() || `{{${key}}}`
      );

    return selectedTemplate.carouselCards.map(card => {
      const runtime = carouselRuntimeInputs[card.id];
      const bodyValueMap = runtime?.bodyValues || {};
      const bodyText = replaceTemplateVariables(card.body || '', {
        ...templateVariableValues,
        ...bodyValueMap,
      });
      const approvedMediaPreviewUrl =
        typeof card.mediaRef === 'string' && /^https?:\/\//i.test(card.mediaRef.trim())
          ? card.mediaRef.trim()
          : '';
      const mediaPreviewUrl = (runtime?.mediaPreviewUrl || '').trim() || approvedMediaPreviewUrl;

      return {
        id: card.id,
        mediaType: card.mediaType,
        mediaRef: runtime?.mediaRef || '',
        mediaPreviewUrl,
        bodyText: bodyText.trim(),
        buttons: (card.buttons || []).map(button => {
          const dynamicValue =
            typeof button.index === 'number' ? runtime?.buttonValues?.[button.index] || '' : '';
          return {
            label: button.text || button.type,
            value: dynamicValue,
          };
        }),
      };
    });
  }, [
    selectedTemplateIsCarousel,
    selectedTemplate?.carouselCards,
    carouselRuntimeInputs,
    templateVariableValues,
  ]);

  useEffect(() => {
    if (carouselPreviewCards.length === 0) {
      setPreviewCarouselIndex(0);
      return;
    }
    setPreviewCarouselIndex(prev => Math.min(prev, carouselPreviewCards.length - 1));
  }, [carouselPreviewCards.length]);

  const activeCarouselPreviewCard = carouselPreviewCards[previewCarouselIndex] || null;
  const previewThemeConfig = useMemo(
    () =>
      previewTheme === 'android'
        ? {
            headerColor: '#075E54',
            fontFamily: 'Roboto, "Segoe UI", sans-serif',
            bubbleRadius: 'rounded-2xl rounded-tl-none',
          }
        : {
            headerColor: '#128C7E',
            fontFamily:
              '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
            bubbleRadius: 'rounded-[22px]',
          },
    [previewTheme]
  );

  const previewDisplayName = useMemo(() => {
    const baseName =
      storedWhatsAppConfig.verifiedName?.trim() ||
      storedWhatsAppConfig.vendorName?.trim() ||
      storedWhatsAppConfig.storeName?.trim();

    const fallback = (selectedTemplate?.name || campaignName || 'Campaign Preview')
      .toString()
      .replace(/_/g, ' ')
      .trim();

    return (baseName && baseName.length > 0 ? baseName : fallback) || 'Campaign Preview';
  }, [
    storedWhatsAppConfig.verifiedName,
    storedWhatsAppConfig.vendorName,
    storedWhatsAppConfig.storeName,
    selectedTemplate?.name,
    campaignName,
  ]);

  const previewInitials = useMemo(() => {
    const normalized = previewDisplayName.replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    if (!normalized) {
      return 'WA';
    }
    const parts = normalized.split(' ').filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase().padEnd(2, 'A');
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [previewDisplayName]);

  const templateVariablesMissing = useMemo(() => {
    if (!templatePlaceholders.length) {
      return false;
    }
    return templatePlaceholders.some(placeholder => {
      const key = placeholder.key;
      return !(templateVariableValues[key] || '').trim();
    });
  }, [templatePlaceholders, templateVariableValues]);

  const carouselMediaMissing = useMemo(() => {
    if (!selectedTemplateIsCarousel || !selectedTemplate?.carouselCards?.length) {
      return false;
    }
    return selectedTemplate.carouselCards.some(card => {
      const runtimeRef = (carouselRuntimeInputs[card.id]?.mediaRef || '').trim();
      return !runtimeRef;
    });
  }, [selectedTemplateIsCarousel, selectedTemplate?.carouselCards, carouselRuntimeInputs]);

  const templateParameterPayload = useMemo<TemplateParameterPayload | undefined>(() => {
    const buttonDefaults = selectedTemplate?.buttonDefaults || [];
    const defaultComponents = buildDefaultTemplateComponents(
      selectedTemplate,
      carouselRuntimeInputs
    );
    const defaultHeaderParameters = buildDefaultHeaderParameters(selectedTemplate);
    if (
      !templatePlaceholders.length &&
      buttonDefaults.length === 0 &&
      defaultComponents.length === 0
    ) {
      return defaultHeaderParameters.length > 0 ? { header: defaultHeaderParameters } : undefined;
    }

    const grouped: TemplateParameterPayload = {};

    templatePlaceholders.forEach(placeholder => {
      const rawValue = templateVariableValues[placeholder.key];
      const value = (rawValue || '').trim();
      if (!value) {
        return;
      }

      const component = placeholder.component?.toUpperCase?.() ?? 'BODY';
      if (component === 'HEADER') {
        (grouped.header ||= []).push(value);
      } else if (component === 'FOOTER') {
        (grouped.footer ||= []).push(value);
      } else if (component === 'BUTTON') {
        const buttonIndex =
          typeof placeholder.buttonIndex === 'number' && placeholder.buttonIndex >= 0
            ? placeholder.buttonIndex
            : 0;
        const subType = placeholder.subType || null;

        if (!grouped.buttons) {
          grouped.buttons = [];
        }

        let entry = grouped.buttons.find(button => button.index === buttonIndex);
        if (!entry) {
          entry = { index: buttonIndex, subType, parameters: [] };
          grouped.buttons.push(entry);
        }

        entry.parameters.push(value);
      } else {
        (grouped.body ||= []).push(value);
      }
    });

    buttonDefaults.forEach(buttonDefault => {
      const couponCode = buttonDefault.parameters.find(value => (value || '').trim().length > 0);
      if (!couponCode) {
        return;
      }

      if (!grouped.buttons) {
        grouped.buttons = [];
      }

      const existing = grouped.buttons.find(button => button.index === buttonDefault.index);
      if (existing) {
        if (!existing.subType) {
          existing.subType = buttonDefault.subType || null;
        }
        if (!existing.parameters.length) {
          existing.parameters = [couponCode];
        }
        return;
      }

      grouped.buttons.push({
        index: buttonDefault.index,
        subType: buttonDefault.subType || null,
        parameters: [couponCode],
      });
    });

    if (defaultHeaderParameters.length > 0) {
      grouped.header = [...defaultHeaderParameters, ...(grouped.header || [])];
    }

    const hasParameters =
      (grouped.header?.length ?? 0) > 0 ||
      (grouped.body?.length ?? 0) > 0 ||
      (grouped.footer?.length ?? 0) > 0 ||
      (grouped.buttons?.some(button => button.parameters.length > 0) ?? false) ||
      defaultComponents.length > 0;

    if (defaultComponents.length > 0) {
      grouped.components = defaultComponents;
    }

    return hasParameters ? grouped : undefined;
  }, [selectedTemplate, templatePlaceholders, templateVariableValues, carouselRuntimeInputs]);

  const resolvedCampaignMessage = useMemo(() => {
    if (!templatePlaceholders.length) {
      return campaignMessage;
    }
    return templatePlaceholders.reduce((text, placeholder) => {
      const value = (templateVariableValues[placeholder.key] || '').trim();
      if (!value) {
        return text;
      }
      const pattern = new RegExp(`{{\\s*${placeholder.key}\\s*}}`, 'g');
      return text.replace(pattern, value);
    }, campaignMessage);
  }, [campaignMessage, templatePlaceholders, templateVariableValues]);

  useEffect(() => {
    setCampaignHistory(recentCampaigns);
  }, [recentCampaigns]);

  useEffect(() => {
    campaignHistoryRef.current = campaignHistory;
  }, [campaignHistory]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current);
        statusPollRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedStore) {
      setCampaignHistory([]);
      setSelectedRecipients([]);
      resetResendSettingsDraft();
      setQuickTemplates([]);
      setQuickTemplatesError(null);
      setCustomerInvoices([]);
      setAllCustomers([]);
      setSelectedCampaignDetails(null);
      setModalRecipients([]);
      setModalRecipientsError(null);
      setModalRecipientsLoading(false);
      setTotalContactsCount(null);
      return;
    }

    setCustomerInvoices([]);
    setAllCustomers([]);
    loadCampaignCustomers();
    loadRecentCampaigns();
    loadQuickTemplates();
    loadTotalContactsCount();
    loadImportedRecipients(true);
  }, [selectedStore]);

  useEffect(() => {
    if (!selectedStore) {
      setAllCustomers([]);
      return;
    }
    const rangeStart = toDateAtStartOfDay(dateRange.start);
    const rangeEnd = toDateAtEndOfDay(dateRange.end);
    const computedCustomers = buildCustomersForDateRange(
      customerInvoices,
      rangeStart,
      rangeEnd,
      customerDetails,
      customerTypeConfig
    );
    setAllCustomers(computedCustomers);
  }, [
    selectedStore,
    customerInvoices,
    customerDetails,
    customerTypeConfig,
    dateRange.start,
    dateRange.end,
  ]);

  useEffect(() => {
    setFilteredCustomers(allCustomers);
  }, [allCustomers]);

  useEffect(() => {
    if (!preselectedRecipients || preselectedRecipients.length === 0) {
      return;
    }
    const uniqueMap = new Map<string, Customer>();
    preselectedRecipients.forEach(prefill => {
      const normalized = normalizePhoneNumber(prefill.phone) || prefill.phone;
      if (!normalized) {
        return;
      }
      const match =
        allCustomers.find(candidate => {
          const candidateKey = normalizePhoneNumber(candidate.phone) || candidate.phone;
          return candidateKey === normalized;
        }) ||
        filteredCustomers.find(candidate => {
          const candidateKey = normalizePhoneNumber(candidate.phone) || candidate.phone;
          return candidateKey === normalized;
        });
      const record: Customer = match
        ? { ...match }
        : {
            phone: prefill.phone,
            name: prefill.name || `Customer ${maskPhoneNumber(prefill.phone)}`,
            totalSpent: prefill.totalSpent ?? 0,
            customerType: determineCustomerType(prefill.totalSpent ?? 0, customerTypeConfig),
            lastPurchase: null,
          };
      if (prefill.lifecycleSegment) {
        record.lifecycleSegment = prefill.lifecycleSegment;
      }
      uniqueMap.set(normalized, record);
    });

    const resolved = Array.from(uniqueMap.values());
    if (resolved.length === 0) {
      onRecipientsConsumed?.();
      return;
    }
    setSelectedRecipients(resolved);
    createCampaignRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    skipNextRecipientsPruneRef.current = true;
    onRecipientsConsumed?.();
  }, [
    preselectedRecipients,
    allCustomers,
    filteredCustomers,
    customerTypeConfig,
    onRecipientsConsumed,
  ]);

  useEffect(() => {
    if (skipNextRecipientsPruneRef.current) {
      skipNextRecipientsPruneRef.current = false;
      return;
    }
    if (effectiveFilteredCustomers.length === 0) {
      return;
    }
    const allowed = new Set(
      effectiveFilteredCustomers.map(
        customer => normalizePhoneNumber(customer.phone) || customer.phone
      )
    );
    setSelectedRecipients(prev =>
      prev.filter(
        recipient =>
          allowed.has(normalizePhoneNumber(recipient.phone) || recipient.phone) ||
          recipient.imported
      )
    );
  }, [effectiveFilteredCustomers]);

  useEffect(() => {
    setTemplateVariableValues(prev => {
      const next: Record<string, string> = {};
      templatePlaceholders.forEach(placeholder => {
        next[placeholder.key] = prev[placeholder.key] ?? '';
      });
      return next;
    });
  }, [templatePlaceholders]);

  useEffect(() => {
    if (selectedTemplate) {
      setTemplateNameOverride(selectedTemplate.name);
      setTemplateLanguage(selectedTemplate.language || 'en_US');
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (sendMode === 'text') {
    }
  }, [sendMode]);

  useEffect(() => {
    setRecipientStatusFilter('all');
  }, [selectedCampaignDetails?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showRecipientsDropdown) return;
      const target = event.target as Node;
      if (recipientsDropdownRef.current && !recipientsDropdownRef.current.contains(target)) {
        setShowRecipientsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRecipientsDropdown]);

  const buildAuthHeaders = (includeJson = false) => {
    const token = localStorage.getItem('bb_token');
    if (!token) {
      throw new Error('Missing authentication token. Please log in again.');
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  };

  const appendPendingCampaign = (
    campaignIdValue: string | null,
    templateLabel: string | null,
    sentDate: string
  ) => {
    const campaignIdentifier = buildCampaignIdentifier({
      campaignId: campaignIdValue,
      campaignName,
      templateName: templateLabel,
      start: sentDate,
      end: sentDate,
    });

    const pendingRecipients = selectedRecipients.map(recipient => ({
      phone: recipient.phone,
      name: recipient.name,
      status: 'processing',
      sentDate,
    }));

    const pendingCampaign: Campaign = {
      id: campaignIdentifier,
      campaignName,
      message: campaignMessage,
      recipients: pendingRecipients,
      sentDate,
      status: 'processing',
      totalRecipients: selectedRecipients.length,
      seenCount: 0,
      templateName: templateLabel,
      campaignId: campaignIdValue,
      overallCampaignStatus: 'ONGOING',
      resendSettings: {
        enabled: resendSettingsEnabled,
        delayOption: resendSettingsDelay,
      },
    };

    setCampaignHistory(prev => {
      const updated = [pendingCampaign, ...prev];
      onRecentCampaignsChange(updated);
      return updated;
    });
  };

  const applyPresetRange = (preset: CampaignDateRangePreset) => {
    const today = new Date();
    let start = new Date(today);

    switch (preset) {
      case 'today':
        start = new Date(today);
        break;
      case 'week': {
        const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
        const difference = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        start = new Date(today.getFullYear(), today.getMonth(), difference);
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
      end: formatDateInput(today),
    });
  };

  const handleRangePresetChange = (value: CampaignDateRangePreset) => {
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
    const defaults = getDefaultCampaignDateRange();
    setDateRange(defaults);
    setSelectedRangePreset('month');
  };

  const openCampaignDetails = (campaign: CampaignDetails) => {
    setSelectedCampaignDetails(campaign);
    setRecipientStatusFilter('all');
    setResendHistory([]);
    setResendHistoryError(null);
    setResendHistoryLoading(false);
  };

  const closeCampaignDetails = () => {
    setSelectedCampaignDetails(null);
    setModalRecipients([]);
    setModalRecipientsError(null);
    setModalRecipientsLoading(false);
    setResendHistory([]);
    setResendHistoryError(null);
    setResendHistoryLoading(false);
  };

  const handleStopCampaign = async (campaign: Campaign) => {
    const campaignId = campaign.campaignId || campaign.id;
    if (!campaignId) {
      toast({
        title: 'Unable to stop',
        description: 'Campaign id is missing.',
        variant: 'destructive',
      });
      return;
    }
    if (!window.confirm('Stop auto-retry for this campaign?')) {
      return;
    }
    setStopCampaignLoading(prev => ({ ...prev, [campaignId]: true }));
    try {
      const response = await fetch(`/api/whatsapp/campaigns/${campaignId}/stop`, {
        method: 'POST',
        headers: buildAuthHeaders(),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to stop campaign.');
      }
      setCampaignHistory(prev =>
        prev.map(item => {
          const itemId = item.campaignId || item.id;
          if (itemId !== campaignId) {
            return item;
          }
          return {
            ...item,
            overallCampaignStatus: 'COMPLETED',
            resendSettings: {
              ...(item.resendSettings || { enabled: false }),
              enabled: false,
              stopped: true,
            },
          };
        })
      );
      toast({ title: 'Campaign stopped', description: 'Auto-retry has been stopped.' });
    } catch (error) {
      toast({
        title: 'Unable to stop',
        description: error instanceof Error ? error.message : 'Unable to stop campaign.',
        variant: 'destructive',
      });
    } finally {
      setStopCampaignLoading(prev => ({ ...prev, [campaignId]: false }));
    }
  };
  const resolveResendCampaignId = (details: CampaignDetails | null) => {
    if (!details) {
      return null;
    }
    if (details.campaignId) {
      return details.campaignId;
    }
    const rawId = details.id;
    if (!rawId) {
      return null;
    }
    try {
      const parsed = JSON.parse(rawId) as Partial<CampaignIdentifierPayload>;
      return parsed.campaignId || null;
    } catch {
      return null;
    }
  };

  const loadResendHistory = async (campaignId: string) => {
    setResendHistoryLoading(true);
    setResendHistoryError(null);

    try {
      const response = await fetch(
        `/api/whatsapp/campaigns/${encodeURIComponent(campaignId)}/resend`,
        { headers: buildAuthHeaders() }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load resend history.');
      }
      const attempts = Array.isArray(data.attempts) ? data.attempts : [];
      attempts.sort((a, b) => {
        const aDate = new Date(a.createdAt || a.scheduledAt || 0).getTime();
        const bDate = new Date(b.createdAt || b.scheduledAt || 0).getTime();
        return bDate - aDate;
      });
      setResendHistory(attempts);
    } catch (error) {
      setResendHistory([]);
      setResendHistoryError(
        error instanceof Error ? error.message : 'Failed to load resend history.'
      );
    } finally {
      setResendHistoryLoading(false);
    }
  };

  const updateStatusesFromEvents = (events: any[]) => {
    if (!events || events.length === 0) return;

    const statusEvents = events.filter(event => event?.type === 'status');
    if (statusEvents.length === 0) return;

    setCampaignHistory(prev => {
      if (!prev.length) return prev;

      const updatedCampaigns = prev.map(campaign => {
        let hasChanges = false;
        const updatedRecipients = campaign.recipients.map(recipient => {
          const match = statusEvents.find(event => {
            if (recipient.messageId && event.id) {
              return event.id === recipient.messageId;
            }
            if (event.recipient) {
              const normalizedEventRecipient = event.recipient.toString().replace(/^[+]/, '');
              const normalizedPhone = recipient.phone.toString().replace(/^[+]/, '');
              return normalizedEventRecipient.endsWith(normalizedPhone);
            }
            return false;
          });

          if (match && match.status && match.status !== recipient.status) {
            hasChanges = true;
            return {
              ...recipient,
              status: match.status,
              lastStatusUpdate: match.timestamp,
            };
          }

          return recipient;
        });

        if (!hasChanges) {
          return campaign;
        }

        const normalizedStatuses = updatedRecipients.map(recipient =>
          (recipient.status || '').toLowerCase()
        );
        const deliveredCount = normalizedStatuses.filter(status =>
          ['delivered', 'read', 'seen'].includes(status)
        ).length;
        const seenCount = normalizedStatuses.filter(status =>
          ['read', 'seen'].includes(status)
        ).length;
        const hasFailure = normalizedStatuses.includes('failed');
        const campaignStatus = hasFailure
          ? 'failed'
          : deliveredCount === updatedRecipients.length && updatedRecipients.length > 0
          ? 'delivered'
          : campaign.status;

        return {
          ...campaign,
          recipients: updatedRecipients,
          deliveredCount,
          seenCount,
          status: campaignStatus,
        };
      });

      onRecentCampaignsChange(updatedCampaigns);
      if (selectedCampaignDetails) {
        const refreshed = updatedCampaigns.find(
          campaign => campaign.id === selectedCampaignDetails.id
        );
        if (refreshed) {
          setSelectedCampaignDetails(refreshed);
        }
      }
      return updatedCampaigns;
    });
  };

  useEffect(() => {
    if (!selectedStore) {
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current);
        statusPollRef.current = null;
      }
      return;
    }

    const syncStatuses = async () => {
      if (!campaignHistoryRef.current.length) return;
      try {
        const response = await fetch('/api/whatsapp/events?format=json', {
          headers: buildAuthHeaders(),
        });
        if (!response.ok) return;
        const payload = await response.json();
        const events = Array.isArray(payload) ? payload : payload?.data || [];
        updateStatusesFromEvents(events);
      } catch (error) {
        console.error('Failed to refresh campaign statuses from webhook events:', error);
      }
    };

    syncStatuses();
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
    }
    statusPollRef.current = setInterval(syncStatuses, 15000);

    return () => {
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current);
        statusPollRef.current = null;
      }
    };
  }, [selectedStore]);

  const loadCampaignCustomers = async () => {
    if (!selectedStore) return;

    setRecipientsLoading(true);
    try {
      const response = await fetch(`/api/analytics/invoices?storeId=${selectedStore}`, {
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        console.error('Failed to load invoices for campaigns');
        setCustomerInvoices([]);
        setAllCustomers([]);
        return;
      }

      const result = await response.json();
      const invoices: CampaignInvoice[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
      setCustomerInvoices(invoices);
    } catch (error) {
      console.error('Error loading invoices for campaigns:', error);
      setCustomerInvoices([]);
      setAllCustomers([]);
    } finally {
      setRecipientsLoading(false);
    }
  };

  const loadImportedRecipients = async (force = false) => {
    if (!force && importedContacts.length > 0) {
      return importedContacts;
    }

    setImportedContactsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/contacts', {
        headers: buildAuthHeaders(),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to load imported contacts.');
      }

      const contacts = Array.isArray(result?.contacts) ? result.contacts : [];
      const unique = new Map<string, Customer>();
      contacts.forEach((contact: any) => {
        const source = (contact?.source || '').toString().toLowerCase();
        if (source !== 'import') {
          return;
        }
        const rawPhone = contact?.phone || contact?.normalized_phone || null;
        const normalized = normalizePhoneNumber(rawPhone);
        if (!normalized) {
          return;
        }
        if (unique.has(normalized)) {
          return;
        }
        const rawName = (contact?.display_name || contact?.customer_name || contact?.name || '')
          .toString()
          .trim();
        const safeName =
          rawName || `Customer ${maskPhoneNumber(contact?.phone || rawPhone || normalized)}`;
        unique.set(normalized, {
          phone: normalized,
          name: safeName,
          totalSpent: 0,
          customerType: determineCustomerType(0, customerTypeConfig),
          lastPurchase: null,
          lifecycleSegment: 'anonymous',
          imported: true,
        });
      });

      const recipients = Array.from(unique.values());
      setImportedContacts(recipients);
      return recipients;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load imported contacts.';
      toast({
        title: 'Failed to load imported contacts',
        description: message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setImportedContactsLoading(false);
    }
  };

  const loadTotalContactsCount = async () => {
    setTotalContactsCountLoading(true);
    try {
      const response = await fetch(`/api/whatsapp/contacts?ts=${Date.now()}`, {
        headers: buildAuthHeaders(),
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to load contacts.');
      }
      const records = Array.isArray(result?.contacts) ? (result.contacts as ContactRecord[]) : [];
      const deduped = dedupeContacts(records);
      const filtered = deduped.filter(contact => !isInvalidContactName(contact.display_name));
      setTotalContactsCount(filtered.length);
    } catch (error) {
      console.error('Unable to load contacts count', error);
      setTotalContactsCount(null);
    } finally {
      setTotalContactsCountLoading(false);
    }
  };

  const loadRecentCampaigns = async () => {
    if (!selectedStore) return;

    setCampaignLoading(true);
    try {
      const response = await fetch(`/api/analytics/campaign-history?storeId=${selectedStore}`, {
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        console.error('Failed to load campaign history');
        setCampaignHistory([]);
        onRecentCampaignsChange([]);
        setCampaignLoading(false);
        return;
      }

      const result = await response.json();
      const rawCampaigns = result.data || result || [];
      const campaignMap = new Map<string, Campaign>();

      const normalizeSentDate = (campaign: any) =>
        campaign.sentDate ||
        campaign.sent_at ||
        campaign.sentAt ||
        campaign.createdAt ||
        campaign.created_at ||
        null;

      const normalizeMessage = (campaign: any) =>
        campaign.message ||
        campaign.body ||
        campaign.templateBody ||
        (campaign.template && campaign.template.body) ||
        'No message content';

      const appendRecipient = (
        target: Campaign,
        recipient: {
          phone?: string | null;
          name?: string | null;
          status?: string | null;
          sentDate?: string | null;
          messageId?: string | null;
          lastStatusUpdate?: string | null;
          error?: string | null;
          errorCode?: string | number | null;
        }
      ) => {
        const rawPhone = recipient.phone;
        if (!rawPhone) {
          return;
        }
        const phone =
          typeof rawPhone === 'string'
            ? rawPhone.trim()
            : typeof rawPhone === 'number'
            ? String(rawPhone)
            : String(rawPhone || '').trim();
        if (!phone) {
          return;
        }

        const status = (recipient.status || target.status || 'unknown') as string;
        target.recipients.push({
          phone,
          name: getRecipientDisplayName(recipient.name, phone),
          status,
          sentDate: recipient.sentDate || target.sentDate,
          messageId: recipient.messageId || null,
          lastStatusUpdate: recipient.lastStatusUpdate || target.sentDate,
          error: recipient.error ?? null,
          errorCode: recipient.errorCode ?? null,
        });
        target.totalRecipients += 1;
        if (['delivered', 'read', 'seen'].includes(status.toLowerCase())) {
          target.seenCount += 1;
        }

        const recipientTimestamp = recipient.sentDate || target.sentDate || null;
        if (recipientTimestamp) {
          if (!target.timeWindowStart || recipientTimestamp < target.timeWindowStart) {
            target.timeWindowStart = recipientTimestamp;
          }
          if (!target.timeWindowEnd || recipientTimestamp > target.timeWindowEnd) {
            target.timeWindowEnd = recipientTimestamp;
          }
        }
      };

      rawCampaigns.forEach((campaign: any) => {
        const sentDateValue = normalizeSentDate(campaign);
        const campaignDate = sentDateValue ? new Date(sentDateValue).toDateString() : 'unknown';
        const campaignName = campaign.campaignName || campaign.campaign_name || 'Campaign';
        const templateNameValue =
          campaign.templateName ||
          campaign.template_name ||
          (campaign.template && campaign.template.name) ||
          null;
        const canonicalCampaignId = campaign.campaignId || campaign.campaign_id || null;
        const campaignKey = `${campaignName}-${campaignDate}`;
        const groupingKey = canonicalCampaignId || campaignKey;

        if (!campaignMap.has(groupingKey)) {
          campaignMap.set(groupingKey, {
            id: groupingKey,
            campaignName,
            message: normalizeMessage(campaign),
            recipients: [],
            sentDate: sentDateValue || new Date().toISOString(),
            status: campaign.status || 'unknown',
            totalRecipients: 0,
            seenCount: 0,
            templateName: templateNameValue,
            timeWindowStart: sentDateValue || null,
            timeWindowEnd: sentDateValue || null,
            campaignId: canonicalCampaignId,
            resendSettings: campaign.resendSettings ||
              campaign.resend_settings || {
                enabled: Boolean(campaign.resendEnabled ?? campaign.resend_enabled ?? false),
                delayOption: campaign.resendDelayOption || campaign.resend_delay_option || null,
                maxAttempts: campaign.resendMaxAttempts || campaign.resend_max_attempts || null,
                stopped:
                  campaign.resendStopped ??
                  campaign.resend_stopped ??
                  campaign.resendSettings?.stopped ??
                  false,
              },
            latestResendAttempt:
              campaign.latestResendAttempt || campaign.latest_resend_attempt || null,
            overallCampaignStatus:
              campaign.overallCampaignStatus || campaign.overall_campaign_status || null,
          });
        }

        const existing = campaignMap.get(groupingKey)!;
        if (!existing.campaignId && canonicalCampaignId) {
          existing.campaignId = canonicalCampaignId;
        }
        if (!existing.templateName && templateNameValue) {
          existing.templateName = templateNameValue;
        }
        if (!existing.resendSettings) {
          existing.resendSettings = campaign.resendSettings ||
            campaign.resend_settings || {
              enabled: Boolean(campaign.resendEnabled ?? campaign.resend_enabled ?? false),
              delayOption: campaign.resendDelayOption || campaign.resend_delay_option || null,
              maxAttempts: campaign.resendMaxAttempts || campaign.resend_max_attempts || null,
              stopped:
                campaign.resendStopped ??
                campaign.resend_stopped ??
                campaign.resendSettings?.stopped ??
                false,
            };
        } else if (!existing.resendSettings.maxAttempts) {
          existing.resendSettings.maxAttempts =
            campaign.resendSettings?.maxAttempts ||
            campaign.resend_settings?.maxAttempts ||
            campaign.resendMaxAttempts ||
            campaign.resend_max_attempts ||
            null;
        } else if (existing.resendSettings.stopped === undefined) {
          existing.resendSettings.stopped =
            campaign.resendSettings?.stopped ??
            campaign.resend_settings?.stopped ??
            campaign.resendStopped ??
            campaign.resend_stopped ??
            false;
        }
        if (!existing.latestResendAttempt) {
          existing.latestResendAttempt =
            campaign.latestResendAttempt || campaign.latest_resend_attempt || null;
        }
        if (!existing.overallCampaignStatus) {
          existing.overallCampaignStatus =
            campaign.overallCampaignStatus || campaign.overall_campaign_status || null;
        }
        const messageId = (campaign as any).messageId || (campaign as any).message_id || null;
        const lastStatusUpdate =
          (campaign as any).lastStatusUpdate ||
          (campaign as any).last_status_update ||
          sentDateValue ||
          existing.sentDate;

        if (Array.isArray(campaign.recipients) && campaign.recipients.length > 0) {
          campaign.recipients.forEach((recipient: any) =>
            appendRecipient(existing, {
              phone:
                recipient.phone ||
                recipient.recipient ||
                recipient.customerPhone ||
                recipient.customer_phone ||
                recipient.normalizedPhone ||
                recipient.normalized_phone ||
                null,
              name: recipient.name || recipient.customerName || recipient.customer_name || null,
              status: recipient.status || recipient.deliveryStatus,
              sentDate: recipient.sentDate || recipient.sent_at || sentDateValue,
              messageId: recipient.messageId || recipient.message_id || messageId,
              lastStatusUpdate:
                recipient.lastStatusUpdate || recipient.last_status_update || lastStatusUpdate,
              error: recipient.error || recipient.errorReason || recipient.error_reason || null,
              errorCode: recipient.errorCode ?? recipient.error_code ?? null,
            })
          );
        } else {
          const rawPhoneValue =
            campaign.customerPhone ||
            campaign.customer_phone ||
            campaign.customer_number ||
            campaign.normalizedCustomerPhone ||
            campaign.normalized_customer_phone ||
            (campaign.customer && (campaign.customer.phone || campaign.customer.mobile)) ||
            null;

          const customerNameValue =
            campaign.customerName ||
            campaign.customer_name ||
            (campaign.customer && campaign.customer.name) ||
            null;

          const phone =
            rawPhoneValue === null || rawPhoneValue === undefined
              ? null
              : typeof rawPhoneValue === 'string'
              ? rawPhoneValue.trim()
              : String(rawPhoneValue).trim();

          if (phone) {
            appendRecipient(existing, {
              phone,
              name: customerNameValue,
              status: campaign.status || 'unknown',
              sentDate: sentDateValue,
              messageId,
              lastStatusUpdate,
              error: campaign.errorReason || campaign.error_reason || campaign.error || null,
              errorCode: campaign.errorCode ?? campaign.error_code ?? null,
            });
          }
        }

        if (campaign.status === 'failed') {
          existing.status = 'failed';
        }
      });

      const campaigns = Array.from(campaignMap.values()).map(entry => {
        const identifierPayload: CampaignIdentifierPayload = {
          campaignId: entry.campaignId || null,
          campaignName: entry.campaignName,
          templateName: entry.templateName || null,
          start: entry.timeWindowStart || entry.sentDate || null,
          end: entry.timeWindowEnd || entry.sentDate || null,
        };
        return {
          ...entry,
          id: buildCampaignIdentifier(identifierPayload),
        };
      });
      campaigns.sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime());

      setCampaignHistory(campaigns);
      onRecentCampaignsChange(campaigns);
      if (selectedCampaignDetails) {
        const refreshed = campaigns.find(campaign => campaign.id === selectedCampaignDetails.id);
        if (refreshed) {
          setSelectedCampaignDetails(refreshed);
        }
      }
    } catch (error) {
      console.error('Error loading campaign history:', error);
      setCampaignHistory([]);
      onRecentCampaignsChange([]);
    } finally {
      setCampaignLoading(false);
    }
  };

  const loadQuickTemplates = async () => {
    if (!selectedStore) {
      setQuickTemplates([]);
      setQuickTemplatesError(null);
      return;
    }

    setQuickTemplatesLoading(true);
    setQuickTemplatesError(null);
    try {
      const response = await fetch('/api/whatsapp/templates?limit=50', {
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load templates');
      }

      const payload = await response.json();
      const rawTemplates = Array.isArray(payload) ? payload : payload?.templates || [];
      const approved = rawTemplates.filter(
        (template: any) =>
          (template.status || template.Status || '').toString().toLowerCase() === 'approved'
      );

      const parseDate = (value: any) => {
        if (!value) return 0;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
      };

      approved.sort(
        (a: any, b: any) =>
          parseDate(b.last_updated_time || b.updatedAt || b.updated_at) -
          parseDate(a.last_updated_time || a.updatedAt || a.updated_at)
      );

      const preferredTemplate = (localStorage.getItem('bb_template_name') || '').toLowerCase();

      const mapped: QuickTemplate[] = approved.map((template: any) => {
        const components = template.components || [];
        const headerComponent = components.find(
          (component: any) =>
            (component.type || component.Type || '').toString().toUpperCase() === 'HEADER'
        );
        const bodyComponent = components.find(
          (component: any) =>
            (component.type || component.Type || '').toString().toUpperCase() === 'BODY'
        );
        const bodyText = bodyComponent?.text || '';
        const preview = bodyText
          ? bodyText.length > 120
            ? `${bodyText.slice(0, 117)}...`
            : bodyText
          : 'Template body unavailable';
        const name: string = template.name || template.TemplateName || 'Template';
        const headerFormat = (headerComponent?.format || headerComponent?.Format || '')
          .toString()
          .toUpperCase();
        const headerText = headerComponent?.text || null;
        const headerMedia = headerComponent?.example?.header_handle?.[0] || null;
        const carouselCards = extractCarouselCardsFromComponents(components) || [];
        const hasCarousel = carouselCards.length > 0;
        const requiresMedia = hasCarousel || ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat);
        const placeholders = parseTemplatePlaceholders(bodyText || '', 'BODY')
          .concat(
            headerFormat === 'TEXT' && headerComponent?.text
              ? parseTemplatePlaceholders(headerComponent.text, 'HEADER')
              : []
          )
          .concat(extractTemplatePlaceholdersFromComponents(components));
        const buttonDefaults = extractTemplateButtonDefaults(components);
        return {
          id: template.id || name,
          name,
          language: template.language || template.Language || 'en_US',
          body: bodyText || name.replace(/_/g, ' '),
          preview,
          updatedAt: template.last_updated_time || template.updatedAt || template.updated_at || '',
          isDefault: preferredTemplate ? name.toLowerCase() === preferredTemplate : false,
          headerType: headerFormat || undefined,
          headerMediaUrl: headerMedia,
          headerText,
          placeholders,
          buttonDefaults,
          rawComponents: components,
          templateKind: hasCarousel ? 'carousel' : 'standard',
          requiresMedia,
          carouselCards,
        };
      });

      setQuickTemplates(mapped);
    } catch (error) {
      console.error('Error loading quick templates:', error);
      setQuickTemplates([]);
      setQuickTemplatesError('Unable to load templates');
    } finally {
      setQuickTemplatesLoading(false);
    }
  };

  const selectAllFilteredCustomers = (customers: Customer[] = effectiveFilteredCustomers) => {
    setSelectedCustomerTypes([]);
    setSelectedLifecycleSegments([]);
    setSelectedRecipients(customers);
    setShowRecipientsDropdown(false);
    setRecipientSearch('');
  };

  const toggleRecipientsDropdown = () => {
    setShowRecipientsDropdown(prev => {
      const next = !prev;
      if (!next) {
        setRecipientSearch('');
      }
      return next;
    });
  };

  const toggleCustomerSelection = (customer: Customer) => {
    setSelectedCustomerTypes([]);
    setSelectedLifecycleSegments([]);
    setSelectedRecipients(prev => {
      const exists = prev.some(c => c.phone === customer.phone);
      return exists ? prev.filter(c => c.phone !== customer.phone) : [...prev, customer];
    });
  };

  const clearSelectedRecipients = () => {
    setSelectedCustomerTypes([]);
    setSelectedLifecycleSegments([]);
    setSelectedRecipients([]);
  };

  const applyPillSelections = (types: CustomerType[], segments: LifecycleSegmentFilter[]) => {
    const typeSet = new Set<CustomerType>(types);
    const segmentSet = new Set<LifecycleSegmentFilter>(segments);
    const recipients = effectiveFilteredCustomers.filter(customer => {
      const resolvedType =
        (customer.customerType as CustomerType | undefined) ??
        determineCustomerType(customer.totalSpent || 0, customerTypeConfig);
      const resolvedSegment = customer.lifecycleSegment;
      const typeMatch = typeSet.size === 0 || typeSet.has(resolvedType);
      const segmentMatch =
        segmentSet.size === 0 ||
        (resolvedSegment === 'new' && segmentSet.has('new')) ||
        (resolvedSegment === 'returning' && segmentSet.has('returning'));
      return typeMatch && segmentMatch;
    });
    setSelectedCustomerTypes(types);
    setSelectedLifecycleSegments(segments);
    setSelectedRecipients(recipients);
    setShowRecipientsDropdown(false);
    setRecipientSearch('');
  };

  const toggleCustomerTypeSelection = (type: CustomerType) => {
    const nextTypes = selectedCustomerTypes.includes(type)
      ? selectedCustomerTypes.filter(item => item !== type)
      : [...selectedCustomerTypes, type];
    applyPillSelections(nextTypes, selectedLifecycleSegments);
  };

  const toggleLifecycleSegmentSelection = (segment: LifecycleSegmentFilter) => {
    const nextSegments = selectedLifecycleSegments.includes(segment)
      ? selectedLifecycleSegments.filter(item => item !== segment)
      : [...selectedLifecycleSegments, segment];
    applyPillSelections(selectedCustomerTypes, nextSegments);
  };

  useEffect(() => {
    if (selectedCustomerTypes.length === 0 && selectedLifecycleSegments.length === 0) {
      return;
    }
    applyPillSelections(selectedCustomerTypes, selectedLifecycleSegments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveFilteredCustomers, customerTypeConfig]);

  const META_LIMIT_ERROR_CODES = new Set(['131047', '131048', '80007', '88']);
  const isMetaLimitedStatus = (recipient: CampaignRecipient) => {
    const status = (recipient.status || '').toString().toLowerCase();
    if (status.includes('limit')) {
      return true;
    }
    const code = recipient.errorCode ?? (recipient as any).error_code ?? null;
    if (code !== null && META_LIMIT_ERROR_CODES.has(String(code))) {
      return true;
    }
    const errorMessage = (recipient.error || '').toString().toLowerCase();
    return errorMessage.includes('limit');
  };

  const recipientStatusSummary = useMemo(() => {
    const recipients = modalRecipients;
    const totals = {
      sent: 0,
      delivered: 0,
      seen: 0,
      failed: 0,
      limited: 0,
    };

    recipients.forEach(recipient => {
      const status = (recipient.status || 'sent').toString().toLowerCase();
      if (status === 'failed') {
        if (isMetaLimitedStatus(recipient)) {
          totals.limited += 1;
        } else {
          totals.failed += 1;
        }
      } else if (status === 'delivered') {
        totals.delivered += 1;
      } else if (status === 'read' || status === 'seen') {
        totals.seen += 1;
      } else if (isMetaLimitedStatus(recipient)) {
        totals.limited += 1;
      } else {
        totals.sent += 1;
      }
    });

    const summary: Array<{ key: RecipientStatusFilter; label: string; count: number }> = [
      { key: 'all', label: 'All', count: recipients.length },
      { key: 'sent', label: 'Sent', count: totals.sent },
      { key: 'delivered', label: 'Delivered', count: totals.delivered },
      { key: 'seen', label: 'Seen', count: totals.seen },
    ];

    if (totals.failed > 0) {
      summary.push({ key: 'failed', label: 'Failed', count: totals.failed });
    }

    if (totals.limited > 0) {
      summary.push({ key: 'limited', label: 'Limited by Meta', count: totals.limited });
    }

    return summary;
  }, [modalRecipients]);

  const resendCampaignId = useMemo(
    () => resolveResendCampaignId(selectedCampaignDetails),
    [selectedCampaignDetails]
  );

  const visibleRecipients = useMemo(() => {
    if (showOnlySelected) {
      return selectedRecipients;
    }
    const searchValue = recipientSearch.trim().toLowerCase();
    const digitsQuery = recipientSearch.replace(/\D/g, '');
    const base = effectiveFilteredCustomers;
    if (!searchValue && !digitsQuery) {
      return base;
    }
    return base.filter(customer => {
      const normalizedName = (customer.name || '').toLowerCase();
      const normalizedPhoneText = customer.phone.toLowerCase();
      const phoneDigits = customer.phone.replace(/\D/g, '');
      const nameMatch = normalizedName.includes(searchValue);
      const phoneMatch = digitsQuery
        ? phoneDigits.includes(digitsQuery)
        : normalizedPhoneText.includes(searchValue);
      return nameMatch || phoneMatch;
    });
  }, [showOnlySelected, selectedRecipients, effectiveFilteredCustomers, recipientSearch]);

  const filteredRecipients = useMemo(() => {
    const recipients = modalRecipients;
    if (recipientStatusFilter === 'all') {
      return recipients;
    }

    return recipients.filter(recipient => {
      const status = (recipient.status || 'sent').toString().toLowerCase();
      if (recipientStatusFilter === 'limited') {
        return isMetaLimitedStatus(recipient) || status === 'limited';
      }
      if (recipientStatusFilter === 'failed') {
        return status === 'failed' && !isMetaLimitedStatus(recipient);
      }
      if (recipientStatusFilter === 'sent') {
        return (
          !['delivered', 'failed', 'read', 'seen', 'limited'].includes(status) &&
          !isMetaLimitedStatus(recipient)
        );
      }
      if (recipientStatusFilter === 'seen') {
        return status === 'read' || status === 'seen';
      }
      return status === recipientStatusFilter;
    });
  }, [modalRecipients, recipientStatusFilter]);

  useEffect(() => {
    if (!recipientStatusSummary.some(item => item.key === recipientStatusFilter)) {
      setRecipientStatusFilter('all');
    }
  }, [recipientStatusSummary, recipientStatusFilter]);

  useEffect(() => {
    if (!selectedCampaignDetails || !selectedCampaignDetails.id) {
      setModalRecipients([]);
      setModalRecipientsError(null);
      setModalRecipientsLoading(false);
      return;
    }

    if (selectedCampaignDetails.source === 'ongoing') {
      const mockRecipients =
        selectedCampaignDetails.mockRecipients ||
        selectedCampaignDetails.recipients ||
        MOCK_ONGOING_RECIPIENTS[selectedCampaignDetails.id] ||
        [];
      setModalRecipients(mockRecipients);
      setModalRecipientsError(null);
      setModalRecipientsLoading(false);
      return;
    }

    if (!selectedStore) {
      setModalRecipients([]);
      setModalRecipientsError(null);
      setModalRecipientsLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    setModalRecipients([]);
    setModalRecipientsError(null);
    setModalRecipientsLoading(true);

    const fetchRecipients = async () => {
      try {
        const sentDateValue = selectedCampaignDetails.sentDate;
        const parsedSentDate = sentDateValue ? new Date(sentDateValue) : null;
        const hasCampaignId = Boolean(selectedCampaignDetails.campaignId);
        const startOfDayIso = (() => {
          if (!parsedSentDate || Number.isNaN(parsedSentDate.getTime())) return null;
          const start = new Date(parsedSentDate);
          start.setHours(0, 0, 0, 0);
          return start.toISOString();
        })();
        const endOfDayIso = (() => {
          if (!parsedSentDate || Number.isNaN(parsedSentDate.getTime())) return null;
          const end = new Date(parsedSentDate);
          end.setHours(23, 59, 59, 999);
          return end.toISOString();
        })();
        let legacyCriteria: Partial<CampaignIdentifierPayload> = {};
        try {
          const parsedId = JSON.parse(
            selectedCampaignDetails.id || '{}'
          ) as Partial<CampaignIdentifierPayload>;
          if (parsedId && typeof parsedId === 'object') {
            legacyCriteria = parsedId;
          }
        } catch {
          legacyCriteria = {};
        }
        const legacySentDate =
          legacyCriteria.start || legacyCriteria.end || (legacyCriteria as any).sentDate || null;
        const criteria = {
          ...legacyCriteria,
          campaignId: selectedCampaignDetails.campaignId || legacyCriteria.campaignId || null,
          campaignName: selectedCampaignDetails.campaignName || legacyCriteria.campaignName || null,
          templateName: selectedCampaignDetails.templateName || legacyCriteria.templateName || null,
          start: hasCampaignId ? null : startOfDayIso || legacyCriteria.start || legacySentDate,
          end: hasCampaignId ? null : endOfDayIso || legacyCriteria.end || legacySentDate,
        };
        const recipientLookupId = encodeURIComponent(JSON.stringify(criteria));
        const response = await fetch(
          `/api/analytics/campaign-history/${recipientLookupId}/recipients?storeId=${encodeURIComponent(
            selectedStore
          )}`,
          {
            headers: buildAuthHeaders(),
            signal: controller.signal,
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load campaign recipients.');
        }

        if (!isMounted) {
          return;
        }

        const normalizedRecipients: CampaignRecipient[] = Array.isArray(data.recipients)
          ? data.recipients.map((recipient: any) => {
              const phone =
                recipient.phone ||
                recipient.customerPhone ||
                recipient.customer_phone ||
                recipient.normalizedPhone ||
                '';

              return {
                phone,
                name: getRecipientDisplayName(
                  recipient.name || recipient.customerName || null,
                  phone
                ),
                status: recipient.status || 'sent',
                sentDate: recipient.sentDate || recipient.sent_at || data.sentDate || null,
                messageId: recipient.messageId || recipient.message_id || null,
                lastStatusUpdate:
                  recipient.lastStatusUpdate ||
                  recipient.last_status_update ||
                  recipient.sentDate ||
                  data.sentDate ||
                  null,
                error: recipient.error || recipient.errorReason || recipient.error_reason || null,
                errorCode: recipient.errorCode ?? recipient.error_code ?? null,
              };
            })
          : [];

        setModalRecipients(normalizedRecipients);
      } catch (error) {
        if (!isMounted || (error as any)?.name === 'AbortError') {
          return;
        }
        setModalRecipientsError(
          error instanceof Error ? error.message : 'Unable to load campaign recipients.'
        );
      } finally {
        if (isMounted) {
          setModalRecipientsLoading(false);
        }
      }
    };

    fetchRecipients();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectedCampaignDetails?.id, selectedCampaignDetails?.source, selectedStore]);

  useEffect(() => {
    if (!selectedCampaignDetails) {
      setResendHistory([]);
      setResendHistoryError(null);
      setResendHistoryLoading(false);
      return;
    }
    if (selectedCampaignDetails.source === 'ongoing') {
      setResendHistory([]);
      setResendHistoryError(null);
      setResendHistoryLoading(false);
      return;
    }
    const campaignId = resolveResendCampaignId(selectedCampaignDetails);
    if (!campaignId) {
      setResendHistory([]);
      setResendHistoryError(null);
      setResendHistoryLoading(false);
      return;
    }
    loadResendHistory(campaignId);
  }, [
    selectedCampaignDetails?.id,
    selectedCampaignDetails?.campaignId,
    selectedCampaignDetails?.source,
  ]);

  const livePreviewLines = useMemo(() => {
    if (!previewMessage) {
      return [];
    }
    return previewMessage.split(/\r?\n/).filter(line => line.trim().length > 0);
  }, [previewMessage]);

  const previewTimeLabel = useMemo(
    () => dayjs().format('hh:mm a'),
    [campaignMessage, previewHeaderImage, previewHeaderText, livePreviewLines.length]
  );
  const previewDateLabel = 'Today';

  const formatWhatsappSegments = React.useCallback((line: string) => {
    const segments: React.ReactNode[] = [];
    const pattern = /(\*[^*]+\*|_[^_]+_|~[^~]+~|`[^`]+`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(line)) !== null) {
      if (match.index > lastIndex) {
        segments.push(line.slice(lastIndex, match.index));
      }

      const token = match[0];
      const core = token.slice(1, -1);
      if (token.startsWith('*')) {
        segments.push(<strong className="font-semibold">{core}</strong>);
      } else if (token.startsWith('_')) {
        segments.push(<em className="italic">{core}</em>);
      } else if (token.startsWith('~')) {
        segments.push(<span className="line-through text-gray-500">{core}</span>);
      } else if (token.startsWith('`')) {
        segments.push(
          <code className="rounded bg-gray-200 px-1 py-0.5 text-[0.75rem] text-gray-700">
            {core}
          </code>
        );
      }

      lastIndex = match.index + token.length;
    }

    if (lastIndex < line.length) {
      segments.push(line.slice(lastIndex));
    }

    return segments;
  }, []);

  const handleTemplateVariableChange = (id: string, value: string) => {
    setTemplateVariableValues(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  const initializeCarouselRuntimeInputs = (template: QuickTemplate | null) => {
    if (!template?.carouselCards?.length) {
      setCarouselRuntimeInputs({});
      return;
    }

    const nextState: Record<string, CarouselCardRuntimeInput> = {};
    template.carouselCards.forEach(card => {
      const initialButtonValues: Record<number, string> = {};
      (card.buttons || []).forEach(button => {
        if (typeof button.index !== 'number') {
          return;
        }
        if (button.type === 'COPY_CODE' || button.type === 'URL') {
          initialButtonValues[button.index] = (button.example || '').trim();
        }
      });

      nextState[card.id] = {
        mediaRef: '',
        mediaPreviewUrl: '',
        bodyValues: {},
        buttonValues: initialButtonValues,
      };
    });

    setCarouselRuntimeInputs(nextState);
  };

  const updateCarouselRuntimeCard = (
    cardId: string,
    updater: (current: CarouselCardRuntimeInput) => CarouselCardRuntimeInput
  ) => {
    setCarouselRuntimeInputs(prev => {
      const current = prev[cardId] || {
        mediaRef: '',
        mediaPreviewUrl: '',
        bodyValues: {},
        buttonValues: {},
      };
      return {
        ...prev,
        [cardId]: updater(current),
      };
    });
  };

  const insertTemplate = (template: QuickTemplate) => {
    setCampaignMessage(template.body);
    setSelectedTemplate(template);
    setTemplateNameOverride(template.name);
    setTemplateLanguage(template.language || 'en_US');
    setCampaignName(buildUniqueCampaignName(template.name));
    initializeCarouselRuntimeInputs(template);

    if (template.requiresMedia) {
      setSendMode('image-template');
    } else {
      setSendMode('text');
      clearImageSelection();
    }
  };

  const handleSendModeChange = (mode: 'text' | 'image-template') => {
    if (selectedTemplateRequiresMedia && mode === 'text') {
      toast({
        variant: 'destructive',
        title: 'Media template selected',
        description:
          'This approved template requires media, so Campaign Content Type must stay on Image Template.',
      });
      return;
    }
    setSendMode(mode);
    if (mode === 'text') {
      clearImageSelection();
    }
  };

  const handleCampaignMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (sendMode === 'text') {
      setCampaignMessage(event.target.value);
    }
  };

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageUploadError(null);
    const file = event.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setImagePreviewUrl(null);
      setImageInputKey(prev => prev + 1);
      return;
    }

    const fileExtension = file.name?.split('.').pop()?.toLowerCase() || '';
    const mimeAllowed = file.type ? ALLOWED_HEADER_IMAGE_MIME_TYPES.includes(file.type) : false;
    const extensionAllowed = ALLOWED_HEADER_IMAGE_EXTENSIONS.includes(fileExtension);

    if (!mimeAllowed && !extensionAllowed) {
      setImageUploadError('Only JPG, PNG or WEBP images can be used in the template header.');
      setImageFile(null);
      setImageInputKey(prev => prev + 1);
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setImageUploadError('Please choose an image that is 5MB or smaller.');
      setImageFile(null);
      setImagePreviewUrl(null);
      setImageInputKey(prev => prev + 1);
      return;
    }

    setImageFile(file);
    setImagePreviewUrl(null);
  };

  const handleCarouselCardMediaUpload = async (
    cardId: string,
    mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT',
    file: File
  ) => {
    const fileName = file.name.toLowerCase();
    if (mediaType === 'IMAGE') {
      const mimeAllowed = file.type ? ALLOWED_HEADER_IMAGE_MIME_TYPES.includes(file.type) : false;
      const extensionAllowed = ALLOWED_HEADER_IMAGE_EXTENSIONS.some(ext =>
        fileName.endsWith(`.${ext}`)
      );
      if (!mimeAllowed && !extensionAllowed) {
        toast({
          variant: 'destructive',
          title: 'Unsupported media type',
          description: 'Carousel image headers support JPG, PNG, or WEBP files.',
        });
        return;
      }
    } else if (mediaType === 'VIDEO') {
      const mimeAllowed = file.type ? ALLOWED_CAROUSEL_VIDEO_MIME_TYPES.includes(file.type) : false;
      const extensionAllowed = ALLOWED_CAROUSEL_VIDEO_EXTENSIONS.some(ext =>
        fileName.endsWith(`.${ext}`)
      );
      if (!mimeAllowed && !extensionAllowed) {
        toast({
          variant: 'destructive',
          title: 'Unsupported media type',
          description: 'Carousel video headers support MP4 files.',
        });
        return;
      }
    }

    setCarouselUploadBusyCardId(cardId);
    try {
      const headers = buildAuthHeaders();
      if ('Content-Type' in headers) {
        delete headers['Content-Type'];
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('media_type', mediaType);

      const response = await fetch('/api/whatsapp/media/upload-message', {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Unable to upload media');
      }

      const previewUrl = URL.createObjectURL(file);
      updateCarouselRuntimeCard(cardId, current => ({
        ...current,
        mediaPreviewUrl: previewUrl,
        mediaRef:
          result.mediaId !== undefined && result.mediaId !== null
            ? String(result.mediaId).trim()
            : '',
      }));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Carousel media upload failed',
        description: error?.message || 'Unable to upload carousel media.',
      });
    } finally {
      setCarouselUploadBusyCardId(null);
    }
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setImageUploadError(null);
    setImagePreviewUrl(null);
    setImageUploading(false);
    setImageInputKey(prev => prev + 1);
  };

  const resetResendSettingsDraft = () => {
    setResendSettingsEnabled(true);
    setResendSettingsDelay('1d');
    clearImageSelection();
    setDraftCampaignId(() => {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
      }
      return `campaign_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    });
  };

  const sendCampaign = async (
    recipientsToSend: Customer[] | React.MouseEvent = selectedRecipients,
    options: { clearAfterSend?: boolean; remainingRecipients?: Customer[] } = {}
  ) => {
    const { clearAfterSend = true, remainingRecipients = [] } = options;
    const resolvedRecipients = Array.isArray(recipientsToSend)
      ? recipientsToSend
      : selectedRecipients;
    if (
      !campaignName.trim() ||
      !campaignMessage.trim() ||
      !selectedStore ||
      resolvedRecipients.length === 0 ||
      templateVariablesMissing ||
      carouselMediaMissing
    ) {
      if (carouselMediaMissing) {
        toast({
          variant: 'destructive',
          title: 'Carousel media required',
          description: 'Upload card header media for every carousel card before sending.',
        });
      }
      return;
    }

    const templateParameters = templateParameterPayload;
    const hasTemplateParameters =
      !!templateParameters &&
      ((templateParameters.body?.length ?? 0) > 0 ||
        (templateParameters.header?.length ?? 0) > 0 ||
        (templateParameters.footer?.length ?? 0) > 0 ||
        (templateParameters.buttons?.some(button => button.parameters.length > 0) ?? false) ||
        (templateParameters.components?.length ?? 0) > 0);
    const templateNameValue = (templateNameOverride || selectedTemplate?.name || '').trim();
    const isUploadDrivenImageTemplate =
      sendMode === 'image-template' && !selectedTemplateIsCarousel;

    if (isUploadDrivenImageTemplate) {
      if (!imageFile) {
        setImageUploadError(prev => prev ?? 'Please upload an image before sending.');
        return;
      }
      if (!templateNameValue) {
        toast({
          variant: 'destructive',
          title: 'Template missing',
          description: 'Template name is required to send image template campaigns.',
        });
        return;
      }
      if (!templateLanguage.trim()) {
        toast({
          variant: 'destructive',
          title: 'Template language missing',
          description: 'Select a template language before sending the campaign.',
        });
        return;
      }

      const formData = new FormData();
      formData.append('name', campaignName);
      formData.append('storeId', selectedStore);
      formData.append('message', resolvedCampaignMessage);
      formData.append('campaignId', draftCampaignId);
      formData.append(
        'resendSettings',
        JSON.stringify({
          enabled: resendSettingsEnabled,
          delayOption: resendSettingsDelay,
        })
      );
      formData.append('templateName', templateNameValue);
      formData.append('templateLanguage', templateLanguage.trim());
      formData.append(
        'recipients',
        JSON.stringify(
          resolvedRecipients.map(recipient => ({
            phone: recipient.phone,
            name: recipient.name,
          }))
        )
      );
      if (hasTemplateParameters && templateParameters) {
        formData.append('templateParameters', JSON.stringify(templateParameters));
      }
      formData.append('image', imageFile);

      setCampaignLoading(true);
      try {
        const response = await fetch('/api/whatsapp/campaigns/send-image-template', {
          method: 'POST',
          headers: buildAuthHeaders(),
          body: formData,
        });
        const responseBody = await response.json().catch(() => ({}));

        if (!response.ok || !responseBody?.success) {
          const errorMessage =
            responseBody?.error ||
            responseBody?.details ||
            responseBody?.message ||
            'Unknown error';
          console.error('Failed to send image template campaign:', responseBody);
          toast({
            variant: 'destructive',
            title: 'Failed to send campaign',
            description: errorMessage,
          });
          return;
        }

        const sentDate = new Date().toISOString();
        const responseCampaignId =
          typeof responseBody.campaignId === 'string' ? responseBody.campaignId : null;

        appendPendingCampaign(
          responseCampaignId,
          templateNameValue || selectedTemplate?.name || null,
          sentDate
        );

        toast({
          title: 'Campaign initiated',
          description: `We started sending ${resolvedRecipients.length} messages. Track progress from the campaign progress page.`,
        });

        if (clearAfterSend) {
          setCampaignName('');
          setCampaignMessage('');
          setSelectedRecipients([]);
          resetResendSettingsDraft();
        } else {
          setSelectedRecipients(remainingRecipients);
          setDraftCampaignId(() => {
            if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
              return crypto.randomUUID();
            }
            return `campaign_${Date.now()}_${Math.random().toString(16).slice(2)}`;
          });
        }
      } catch (error) {
        console.error('Error sending campaign:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to send campaign',
          description: 'Check the console for more details.',
        });
      } finally {
        setCampaignLoading(false);
      }
      return;
    }

    setCampaignLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name: campaignName,
        message: resolvedCampaignMessage,
        storeId: selectedStore,
        campaignId: draftCampaignId,
        resendSettings: {
          enabled: resendSettingsEnabled,
          delayOption: resendSettingsDelay,
        },
        recipients: resolvedRecipients.map(recipient => ({
          phone: recipient.phone,
          name: recipient.name,
        })),
      };

      if (hasTemplateParameters && templateParameters) {
        payload.templateParameters = templateParameters;
      }

      if (templateNameValue) {
        payload.templateName = templateNameValue;
      }

      const response = await fetch('/api/whatsapp/campaigns/send', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      const responseBody = await response.json().catch(() => ({}));

      if (!response.ok || !responseBody?.success) {
        const errorMessage =
          responseBody?.error || responseBody?.details || responseBody?.message || 'Unknown error';
        console.error('Failed to send campaign:', responseBody);
        toast({
          variant: 'destructive',
          title: 'Failed to send campaign',
          description: errorMessage,
        });
        return;
      }

      const sentDate = new Date().toISOString();
      const responseCampaignId =
        typeof responseBody.campaignId === 'string' ? responseBody.campaignId : null;

      appendPendingCampaign(responseCampaignId, templateNameValue || null, sentDate);

      toast({
        title: 'Campaign initiated',
        description: `We started sending ${resolvedRecipients.length} messages. Track progress from the campaign progress page.`,
      });

      if (clearAfterSend) {
        setCampaignName('');
        setCampaignMessage('');
        setSelectedRecipients([]);
        resetResendSettingsDraft();
      } else {
        setSelectedRecipients(remainingRecipients);
        setDraftCampaignId(() => {
          if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
            return crypto.randomUUID();
          }
          return `campaign_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        });
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to send campaign',
        description: 'Check the console for more details.',
      });
    } finally {
      setCampaignLoading(false);
    }
  };

  const handleSendCampaignClick = async () => {
    if (
      !campaignName.trim() ||
      !campaignMessage.trim() ||
      !selectedStore ||
      selectedRecipients.length === 0 ||
      templateVariablesMissing ||
      carouselMediaMissing
    ) {
      if (carouselMediaMissing) {
        toast({
          variant: 'destructive',
          title: 'Carousel media required',
          description: 'Upload card header media for every carousel card before sending.',
        });
      }
      return;
    }

    const templateNameValue = (templateNameOverride || selectedTemplate?.name || '').trim();
    const isUploadDrivenImageTemplate =
      sendMode === 'image-template' && !selectedTemplateIsCarousel;

    if (isUploadDrivenImageTemplate) {
      if (!imageFile) {
        setImageUploadError(prev => prev ?? 'Please upload an image before sending.');
        return;
      }
      if (!templateNameValue) {
        toast({
          variant: 'destructive',
          title: 'Template missing',
          description: 'Template name is required to send image template campaigns.',
        });
        return;
      }
      if (!templateLanguage.trim()) {
        toast({
          variant: 'destructive',
          title: 'Template language missing',
          description: 'Select a template language before sending the campaign.',
        });
        return;
      }
    }

    if (quotaChecking || campaignLoading) {
      return;
    }

    setQuotaChecking(true);
    try {
      const response = await fetch('/api/whatsapp/campaigns/quota-check', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        body: JSON.stringify({ requested: selectedRecipients.length }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to check campaign quota.');
      }
      const quota: CampaignQuotaInfo = {
        limit: Number(payload.limit ?? 1000),
        used: Number(payload.used ?? 0),
        remaining: Number(payload.remaining ?? 0),
        requested: Number(payload.requested ?? selectedRecipients.length),
        allowed: Number(payload.allowed ?? 0),
      };

      setQuotaWithinLimit(quota.remaining >= quota.requested);
      setQuotaInfo(quota);
      setQuotaModalOpen(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Unable to send campaign',
        description: error instanceof Error ? error.message : 'Unable to check campaign quota.',
      });
    } finally {
      setQuotaChecking(false);
    }
  };

  const handleQuotaConfirmSend = async () => {
    if (!quotaInfo) {
      setQuotaModalOpen(false);
      return;
    }
    if (quotaInfo.remaining < quotaInfo.requested) {
      setQuotaModalOpen(false);
      return;
    }
    setQuotaModalOpen(false);
    await sendCampaign(selectedRecipients);
  };

  const campaignsToDisplay = useMemo(() => {
    const startDate = toDateAtStartOfDay(dateRange.start);
    const endDate = toDateAtEndOfDay(dateRange.end);

    if (!startDate && !endDate) {
      return campaignHistory;
    }

    return campaignHistory.filter(campaign => {
      if (!campaign.sentDate) {
        return true;
      }
      const sent = new Date(campaign.sentDate);
      if (Number.isNaN(sent.getTime())) {
        return true;
      }
      if (startDate && sent < startDate) {
        return false;
      }
      if (endDate && sent > endDate) {
        return false;
      }
      return true;
    });
  }, [campaignHistory, dateRange]);

  const isPastResendWindow = (campaign: Campaign) => {
    const resendSettings = campaign.resendSettings;
    if (!resendSettings?.enabled) {
      return false;
    }
    const delaySeconds =
      (resendSettings.delayOption && RESEND_DELAY_SECONDS[resendSettings.delayOption]) || 0;
    const maxAttempts =
      resendSettings.maxAttempts ?? campaign.latestResendAttempt?.maxAttempts ?? null;
    if (!delaySeconds || !maxAttempts) {
      return false;
    }
    const startTimeValue = campaign.timeWindowStart || campaign.sentDate || null;
    if (!startTimeValue) {
      return false;
    }
    const startMs = new Date(startTimeValue).getTime();
    if (Number.isNaN(startMs)) {
      return false;
    }
    const endMs = startMs + delaySeconds * 1000 * maxAttempts;
    return Date.now() >= endMs;
  };

  const ongoingCampaigns = useMemo(() => {
    return campaignsToDisplay.filter(campaign => {
      const overallStatus = (campaign.overallCampaignStatus || '').toString().toLowerCase();
      if (overallStatus) {
        return overallStatus === 'ongoing';
      }
      if (campaign.resendSettings?.stopped) {
        return false;
      }
      if (isPastResendWindow(campaign)) {
        return false;
      }
      const resendStatus = campaign.latestResendAttempt?.status || null;
      if (resendStatus) {
        return ['SCHEDULED', 'RUNNING'].includes(resendStatus.toString().toUpperCase());
      }
      const campaignStatus = (campaign.status || '').toString().toLowerCase();
      return ['processing', 'queued', 'running'].includes(campaignStatus);
    });
  }, [campaignsToDisplay]);

  const completedCampaigns = useMemo(() => {
    const ongoingIds = new Set(
      ongoingCampaigns.map(campaign => campaign.campaignId || campaign.id)
    );
    return campaignsToDisplay.filter(
      campaign => !ongoingIds.has(campaign.campaignId || campaign.id)
    );
  }, [campaignsToDisplay, ongoingCampaigns]);

  const templateNameToUse = (templateNameOverride || selectedTemplate?.name || '').trim();
  const isTemplateMode = sendMode === 'image-template';
  const isUploadDrivenImageTemplate = isTemplateMode && !selectedTemplateIsCarousel;
  const isSendDisabled =
    !campaignName.trim() ||
    !campaignMessage.trim() ||
    selectedRecipients.length === 0 ||
    campaignLoading ||
    quotaChecking ||
    templateVariablesMissing ||
    carouselMediaMissing ||
    (isUploadDrivenImageTemplate &&
      (!imageFile || !templateNameToUse || !templateLanguage.trim() || imageUploading)) ||
    !selectedTemplate;

  const getCampaignTemplateLabel = (campaign: Campaign) => {
    const rawTemplateName =
      campaign.templateName ||
      (campaign as any).templateName ||
      (campaign as any).template_name ||
      (campaign as any).template?.name ||
      (campaign as any).template?.TemplateName ||
      '';
    return rawTemplateName ? rawTemplateName.replace(/_/g, ' ') : 'â€”';
  };

  const getCampaignDeliveryStats = (campaign: Campaign) => {
    const recipients = Array.isArray(campaign.recipients) ? campaign.recipients : [];
    let total = campaign.totalRecipients || recipients.length || 0;

    const computedDelivered = recipients.filter(recipient => {
      const status = (recipient.status || '').toLowerCase();
      return status === 'delivered' || status === 'read' || status === 'seen';
    }).length;

    const computedSeen = recipients.filter(recipient => {
      const status = (recipient.status || '').toLowerCase();
      return status === 'read' || status === 'seen';
    }).length;

    const deliveredCount =
      typeof campaign.deliveredCount === 'number'
        ? campaign.deliveredCount
        : recipients.length > 0
        ? computedDelivered
        : typeof campaign.seenCount === 'number'
        ? campaign.seenCount
        : computedDelivered;
    const seenCount = typeof campaign.seenCount === 'number' ? campaign.seenCount : computedSeen;

    const derivedTotal = Math.max(total, recipients.length, deliveredCount, seenCount);
    total = derivedTotal;

    return {
      total,
      delivered: Math.min(deliveredCount, total),
      seen: Math.min(seenCount, total),
    };
  };

  const formatDeliveredPercentage = (delivered: number, total: number) => {
    if (total <= 0) {
      return 'â€”';
    }
    const raw = (delivered / total) * 100;
    const rounded = Math.round(raw * 10) / 10;
    const formatted = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
    return `${formatted}%`;
  };

  const getMetaLimitedCount = (campaign: Campaign) => {
    const metaLimited =
      (campaign as any).metaLimitedCount ??
      (campaign as any).meta_limit_count ??
      (campaign as any).metaLimited ??
      null;
    return typeof metaLimited === 'number' ? metaLimited : null;
  };

  const formatCountWithPercentage = (count: number, total: number) => {
    if (total <= 0) {
      return 'â€”';
    }
    const safeCount = Math.min(count, total);
    const percentage = Math.round((safeCount / total) * 100);
    return `${safeCount} (${percentage}%)`;
  };

  const formatSentDateTime = (value?: string | null) => {
    if (!value) {
      return 'â€”';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const datePart = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timePart = date
      .toLocaleTimeString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      .toUpperCase();
    return `${datePart}, ${timePart}`;
  };

  const formatStatusDisplay = (status?: string | null) => {
    if (!status) {
      return 'â„¹ï¸ Unknown';
    }
    const normalized = status.toLowerCase();
    const iconMap: Record<string, string> = {
      delivered: 'âœ…',
      sent: 'ðŸ“¤',
      failed: 'âš ï¸',
      partial: 'âš ï¸',
      scheduled: 'ðŸ•’',
      processing: 'â³',
      queued: 'ðŸ•’',
      draft: 'ðŸ“',
    };
    const icon = iconMap[normalized] ?? 'â„¹ï¸';
    const label = normalized
      .split(/[\s_-]+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    return `${icon} ${label}`;
  };

  const customersReached = useMemo(() => {
    const phoneSet = new Set<string>();
    campaignsToDisplay.forEach(campaign => {
      campaign.recipients?.forEach(recipient => {
        if (recipient.phone) {
          phoneSet.add(recipient.phone);
        }
      });
    });
    return phoneSet.size;
  }, [campaignsToDisplay]);

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-40 rounded-lg border border-gray-200 bg-white shadow-sm px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Campaigns Analytics</h1>
          <div className="flex flex-wrap items-end gap-3">
            <select
              aria-label="Date range"
              value={selectedRangePreset}
              onChange={event =>
                handleRangePresetChange(event.target.value as typeof selectedRangePreset)
              }
              className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
              <option value="custom">Custom</option>
            </select>
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
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </>
            )}
            <Button type="button" variant="outline" className="h-10" onClick={resetDateRange}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">
                {(() => {
                  const unique = new Set(
                    campaignsToDisplay.map(
                      campaign => `${campaign.campaignName}-${campaign.sentDate?.split('T')[0]}`
                    )
                  );
                  return unique.size;
                })()}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Messages Sent</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaignsToDisplay.reduce(
                  (total, campaign) =>
                    total + (campaign.totalRecipients || campaign.recipients?.length || 0),
                  0
                )}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Customers Reached</p>
              <p className="text-2xl font-bold text-gray-900">
                {customersReached.toLocaleString()}
              </p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M12 11a4 4 0 100-8 4 4 0 000 8zm7 3a4 4 0 00-7 0m-3 0a4 4 0 00-7 0"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4 text-[#343a40]">
          <span className="inline-block px-2.5 py-1 rounded-md bg-[#e8f0fe] text-[#3b86d1] shadow-sm">
            Approved Templates
          </span>
        </h3>
        <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 pr-1">
          {quickTemplatesLoading ? (
            <div className="text-sm text-gray-500">Loading templates...</div>
          ) : quickTemplatesError ? (
            <div className="text-sm text-red-500">{quickTemplatesError}</div>
          ) : quickTemplates.length === 0 ? (
            <div className="text-sm text-gray-500">
              No approved templates found. Create or approve templates to access quick sends.
            </div>
          ) : (
            quickTemplates.map(template => {
              const formattedName = template.name.replace(/_/g, ' ');
              const isActive =
                selectedTemplate?.id === template.id || (!selectedTemplate && template.isDefault);
              const headerMeta = getHeaderTypeMeta(template.headerType);
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => insertTemplate(template)}
                  className={`relative text-left p-3 border rounded-md hover:bg-gray-50 transition-colors min-w-[240px] max-w-[260px] flex-shrink-0 ${
                    isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  {headerMeta && (
                    <span
                      className="absolute right-3 top-3 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 uppercase tracking-wide"
                      title={`${headerMeta.label} header`}
                    >
                      {headerMeta.label}
                    </span>
                  )}
                  <h4 className="font-medium text-sm text-gray-900 mb-1 truncate pr-16">
                    <span title={formattedName}>{formattedName}</span>
                    {template.isDefault && (
                      <span className="ml-2 text-xs text-blue-600">(Default)</span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{template.preview}</p>
                  <div className="mt-1 text-[10px] text-gray-400">{template.language}</div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div
          ref={createCampaignRef}
          className="bg-white rounded-lg shadow p-6 min-w-0 lg:col-span-3"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#343a40]">Create Campaign</h2>
              <p className="text-sm text-gray-600">
                Craft targeted WhatsApp campaigns to engage your customers instantly.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="px-3 py-1.5 border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                onClick={handleGoToCustomersTab}
              >
                Go to Customers
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-400"
                      aria-label="How to select customers"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[280px]">
                    Select customer categories in the Customers tab (New/Returning +
                    Premium/Standard/Basic), then click â€œUse in Campaignâ€ to bring them here.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input
                type="text"
                value={campaignName}
                onChange={event => setCampaignName(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Enter campaign name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Types</label>
              <p className="mt-1 text-xs text-gray-500">
                {selectedRecipients.length > 0
                  ? `Based on ${selectedRecipients.length.toLocaleString()} selected customers.`
                  : `Based on the current customer list.`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {CUSTOMER_TYPE_OPTIONS.map(type => {
                  const count = customerTypeCounts[type] || 0;
                  const isSelected = selectedCustomerTypes.includes(type);
                  const typeStyles =
                    type === 'Premium'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : type === 'Standard'
                      ? 'bg-slate-100 text-slate-800 border-slate-300'
                      : 'bg-orange-100 text-orange-900 border-orange-300';
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleCustomerTypeSelection(type)}
                      disabled={count === 0}
                      className={`inline-flex items-center space-x-2 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${typeStyles} ${
                        count > 0
                          ? 'hover:brightness-95 cursor-pointer'
                          : 'opacity-60 cursor-not-allowed'
                      } ${isSelected ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                    >
                      <span>{type}</span>
                      <span className="text-xs font-semibold text-gray-700">
                        ({count.toLocaleString()})
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Lifecycle Segments
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(['new', 'returning'] as const).map(segment => {
                    const count = lifecycleCategoryCounts[segment];
                    const label = segment === 'new' ? 'New Customers' : 'Returinging Customers';
                    const style =
                      segment === 'new'
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-green-100 text-green-800 border-green-300';
                    const isSelected = selectedLifecycleSegments.includes(segment);
                    return (
                      <button
                        key={segment}
                        type="button"
                        onClick={() => toggleLifecycleSegmentSelection(segment)}
                        className={`inline-flex items-center space-x-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${style} ${
                          count > 0
                            ? 'hover:brightness-95 cursor-pointer'
                            : 'opacity-60 cursor-pointer'
                        } ${isSelected ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                      >
                        <span>{label}</span>
                        <span>({count.toLocaleString()})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Import Contacts</label>
                <p className="mt-1 text-xs text-gray-500">
                  Include imported contacts in this campaign.
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleImportContacts}
                  className="inline-flex items-center space-x-2 rounded-full border px-4 py-1.5 text-sm font-semibold border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <span>Import Contacts</span>
                </button>
                <button
                  type="button"
                  onClick={handleViewContacts}
                  className="inline-flex items-center space-x-2 rounded-full border px-4 py-1.5 text-sm font-semibold border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <span>View contacts</span>
                  <span className="text-xs font-semibold text-blue-700">
                    (
                    {totalContactsCountLoading || totalContactsCount === null
                      ? '...'
                      : totalContactsCount.toLocaleString()}
                    )
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleImported}
                  className={`inline-flex items-center space-x-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                    includeImported
                      ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <span>Select Imported</span>
                  <span
                    className={`text-xs font-semibold ${
                      includeImported ? 'text-white' : 'text-blue-700'
                    }`}
                  >
                    ({importedContacts.length.toLocaleString()})
                  </span>
                </button>
              </div>
            </div>

            <div className="relative" ref={recipientsDropdownRef}>
              <div className="flex items-center justify-between mb-1 gap-2">
                <label className="block text-sm font-medium text-gray-700">
                  Send To ({selectedRecipients.length.toLocaleString()}{' '}
                  {selectedRecipients.length === 1 ? 'customer' : 'customers'})
                </label>
              </div>
              {quotaPreview && quotaPreview.remaining < quotaPreview.requested && (
                <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  Free trial limit exceeded. Remaining {quotaPreview.remaining.toLocaleString()}{' '}
                  messages, selected {quotaPreview.requested.toLocaleString()}.
                </div>
              )}
              <button
                type="button"
                onClick={toggleRecipientsDropdown}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left bg-white text-gray-900"
              >
                {selectedRecipients.length === 0
                  ? 'Select recipients...'
                  : selectedRecipients.length === effectiveFilteredCustomers.length
                  ? `All Filtered Customers (${effectiveFilteredCustomers.length})`
                  : `${selectedRecipients.length} customers selected`}
              </button>

              {showRecipientsDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {recipientsLoading ? (
                    <div className="p-4 text-center text-gray-500 bg-white">
                      Loading customers...
                    </div>
                  ) : effectiveFilteredCustomers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 bg-white">
                      No customers match selected filters
                    </div>
                  ) : (
                    <>
                      <div className="p-2 border-b border-gray-200 flex flex-col gap-2 bg-white">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-gray-500 flex-1">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              <input
                                type="text"
                                value={recipientSearch}
                                onChange={event => setRecipientSearch(event.target.value)}
                                placeholder="Search name or number"
                                className="w-full rounded-lg border border-gray-200 pl-8 pr-3 h-9 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowOnlySelected(prev => !prev)}
                              className="px-2 py-1 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                            >
                              {showOnlySelected ? 'Show all' : 'Show selected only'}
                            </button>
                            <button
                              type="button"
                              onClick={() => selectAllFilteredCustomers(visibleRecipients)}
                              className="flex-1 text-left px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded bg-white border border-blue-100"
                              disabled={visibleRecipients.length === 0}
                            >
                              Select All Matching Customers ({visibleRecipients.length})
                            </button>
                            {selectedRecipients.length > 0 && (
                              <button
                                type="button"
                                onClick={clearSelectedRecipients}
                                className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-200 bg-white"
                              >
                                Clear selection
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {visibleRecipients.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 bg-white">
                          No customers match this search
                        </div>
                      ) : (
                        visibleRecipients.map(customer => {
                          const checkboxId = `campaign-recipient-${customer.phone}`;
                          const isSelected = selectedRecipients.some(
                            c => c.phone === customer.phone
                          );
                          return (
                            <div
                              key={customer.phone}
                              className="p-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <label htmlFor={checkboxId} className="flex items-center gap-3">
                                <input
                                  id={checkboxId}
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleCustomerSelection(customer)}
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {customer.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {maskPhoneNumber(customer.phone)}
                                  </p>
                                </div>
                              </label>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Content Type
              </label>
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => handleSendModeChange('text')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    sendMode === 'text'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  } ${selectedTemplateRequiresMedia ? 'cursor-not-allowed opacity-60' : ''}`}
                  disabled={selectedTemplateRequiresMedia}
                >
                  Text Template
                </button>
                <button
                  type="button"
                  onClick={() => handleSendModeChange('image-template')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    sendMode === 'image-template'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Image Template
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {selectedTemplateIsCarousel
                  ? 'Carousel templates use approved card media and card structure from the template definition.'
                  : sendMode === 'image-template'
                  ? 'Send an approved template that includes a header image. Upload the image and we will attach it automatically.'
                  : 'Send a text-based template message without media attachments.'}
              </p>
            </div>

            <div>
              {selectedTemplate &&
                selectedTemplate.placeholders?.some(ph => ph.component === 'HEADER') && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">Header values</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {selectedTemplate.placeholders
                        ?.filter(ph => ph.component === 'HEADER')
                        .map(ph => (
                          <input
                            key={`header-${ph.key}`}
                            type="text"
                            value={templateVariableValues[ph.key] || ''}
                            onChange={event =>
                              handleTemplateVariableChange(ph.key, event.target.value)
                            }
                            placeholder={ph.key}
                            className="inline-flex min-w-[72px] rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                        ))}
                    </div>
                  </div>
                )}

              {selectedTemplate && footerTemplatePlaceholders.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">Footer values</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {footerTemplatePlaceholders.map(ph => (
                      <input
                        key={`footer-${ph.key}`}
                        type="text"
                        value={templateVariableValues[ph.key] || ''}
                        onChange={event => handleTemplateVariableChange(ph.key, event.target.value)}
                        placeholder={ph.key}
                        className="inline-flex min-w-[72px] rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedTemplate && buttonTemplatePlaceholders.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">Button values</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {buttonTemplatePlaceholders.map((ph, index) => (
                      <input
                        key={`button-${ph.buttonIndex ?? 0}-${ph.key}-${index}`}
                        type="text"
                        value={templateVariableValues[ph.key] || ''}
                        onChange={event => handleTemplateVariableChange(ph.key, event.target.value)}
                        placeholder={`Button ${
                          typeof ph.buttonIndex === 'number' ? ph.buttonIndex + 1 : 1
                        }: ${ph.key}`}
                        className="inline-flex min-w-[180px] rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    ))}
                  </div>
                </div>
              )}

              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              {selectedTemplate ? (
                <div className="relative">
                  <textarea value={campaignMessage} readOnly className="sr-only" />
                  <div className="min-h-[120px] whitespace-pre-wrap rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 shadow-sm">
                    {messageTokens.length === 0 ? (
                      <span className="text-gray-400">Message body will appear here.</span>
                    ) : (
                      messageTokens.map((token, index) =>
                        token.type === 'text' ? (
                          <React.Fragment key={`text-${index}`}>{token.value}</React.Fragment>
                        ) : (
                          <input
                            key={`placeholder-${index}-${token.value}`}
                            type="text"
                            value={templateVariableValues[token.value] || ''}
                            onChange={event =>
                              handleTemplateVariableChange(token.value, event.target.value)
                            }
                            placeholder={token.value}
                            className="mx-1 inline-block min-w-[72px] rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                        )
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    value={campaignMessage}
                    readOnly
                    onChange={handleCampaignMessageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    rows={4}
                    maxLength={1000}
                  />
                  {campaignMessage.trim().length === 0 && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
                      <span className="rounded-md bg-gray-200 px-3 py-2 text-sm text-gray-600 shadow-sm">
                        Select approved templates from the left panel
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-500">{campaignMessage.length}/1000</span>
              </div>
            </div>

            {sendMode === 'image-template' && (
              <div className="space-y-4 rounded-md border border-blue-100 bg-blue-50/40 p-4">
                <h3 className="text-sm font-semibold text-blue-700">
                  Template &amp; Media Details
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-blue-900">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={templateNameOverride}
                      readOnly
                      className="mt-1 w-full rounded-md border border-blue-200 bg-blue-100 px-3 py-2 text-sm text-blue-900 opacity-90"
                      placeholder="e.g. verified_tempt1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-blue-900">
                      Template Language
                    </label>
                    <input
                      type="text"
                      value={templateLanguage}
                      readOnly
                      className="mt-1 w-full rounded-md border border-blue-200 bg-blue-100 px-3 py-2 text-sm text-blue-900 opacity-90"
                      placeholder="en_US"
                    />
                  </div>
                </div>

                {selectedTemplateIsCarousel ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-blue-900">
                      Carousel Cards
                    </label>
                    <div className="mt-1 rounded-md border border-dashed border-blue-200 bg-white p-4">
                      <p className="text-xs text-blue-500">
                        Upload card header media where needed. Body/button fields appear when the
                        selected template card needs runtime values.
                      </p>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {(selectedTemplate.carouselCards || []).map((card, index) => (
                          <div
                            key={card.id}
                            className="rounded-md border border-blue-100 bg-blue-50 p-3"
                          >
                            <p className="text-sm font-semibold text-blue-900">Card {index + 1}</p>
                            <p className="mt-1 text-xs text-blue-600">Media: {card.mediaType}</p>
                            <div className="mt-2 flex flex-col gap-2">
                              <label
                                className={`inline-flex w-fit cursor-pointer items-center justify-center rounded-md border border-blue-300 px-3 py-2 text-xs font-semibold text-blue-700 ${
                                  carouselUploadBusyCardId === card.id
                                    ? 'cursor-not-allowed opacity-60'
                                    : 'hover:bg-blue-100'
                                }`}
                              >
                                <input
                                  type="file"
                                  disabled={carouselUploadBusyCardId === card.id}
                                  accept={
                                    card.mediaType === 'IMAGE'
                                      ? '.jpg,.jpeg,.png,.webp'
                                      : card.mediaType === 'VIDEO'
                                      ? '.mp4'
                                      : '.pdf,.doc,.docx'
                                  }
                                  onChange={event => {
                                    const file = event.target.files?.[0];
                                    if (!file) {
                                      return;
                                    }
                                    handleCarouselCardMediaUpload(card.id, card.mediaType, file);
                                    event.currentTarget.value = '';
                                  }}
                                  className="hidden"
                                />
                                {carouselUploadBusyCardId === card.id ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Uploading...
                                  </span>
                                ) : (
                                  'Upload Card Header'
                                )}
                              </label>
                              <p className="break-all text-[11px] text-blue-600">
                                Media ref: {carouselRuntimeInputs[card.id]?.mediaRef || 'Not set'}
                              </p>
                            </div>
                            <p className="mt-2 text-sm text-blue-900">
                              {card.body || 'No card body text'}
                            </p>
                            {(card.bodyPlaceholderKeys || []).length > 0 && (
                              <div className="mt-2 space-y-2">
                                {(card.bodyPlaceholderKeys || []).map(placeholderKey => (
                                  <input
                                    key={`${card.id}-body-${placeholderKey}`}
                                    type="text"
                                    value={
                                      carouselRuntimeInputs[card.id]?.bodyValues?.[
                                        placeholderKey
                                      ] || ''
                                    }
                                    onChange={event =>
                                      updateCarouselRuntimeCard(card.id, current => ({
                                        ...current,
                                        bodyValues: {
                                          ...current.bodyValues,
                                          [placeholderKey]: event.target.value,
                                        },
                                      }))
                                    }
                                    placeholder={`Body variable ${placeholderKey}`}
                                    className="w-full rounded border border-blue-200 bg-white px-2 py-1 text-xs text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                  />
                                ))}
                              </div>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {card.buttons.map((button, buttonIndex) => (
                                <div key={`${card.id}-${buttonIndex}`} className="space-y-1">
                                  <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                                    {button.text || button.type}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-blue-900">
                      Header Image
                    </label>
                    <div className="mt-1 flex flex-col gap-3 rounded-md border border-dashed border-blue-200 bg-white p-4 text-sm text-blue-900">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">Upload an image</p>
                          <p className="text-xs text-blue-500">
                            Maximum size 5MB. Accepted formats: JPG, PNG, WEBP.
                          </p>
                        </div>
                        <label
                          className={`inline-flex items-center justify-center rounded-md border border-blue-500 px-4 py-2 text-sm font-medium text-blue-600 transition-colors ${
                            imageUploading
                              ? 'cursor-not-allowed opacity-60'
                              : 'cursor-pointer hover:bg-blue-50'
                          }`}
                        >
                          <input
                            key={imageInputKey}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={handleImageFileChange}
                            disabled={imageUploading}
                            className="hidden"
                          />
                          {imageUploading ? 'Uploading...' : 'Choose File'}
                        </label>
                      </div>
                      {imageUploadError && (
                        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
                          {imageUploadError}
                        </div>
                      )}
                      {imagePreviewUrl ? (
                        <div className="flex items-center justify-between gap-3 rounded-md border border-blue-100 bg-blue-50 p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={imagePreviewUrl}
                              alt="Selected template header"
                              className="h-16 w-16 rounded-md object-cover"
                            />
                            <div>
                              <p className="text-sm font-medium text-blue-900">{imageFile?.name}</p>
                              <p className="text-xs text-blue-500">
                                {imageFile && imageFile.size > 0
                                  ? `${(imageFile.size / 1024).toFixed(0)} KB`
                                  : 'Size unavailable'}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearImageSelection}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-blue-500">
                          No image selected yet. Attach the image you want to send with the
                          template.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-800">Re-send Settings</h3>
              <p className="text-sm text-gray-700">
                Auto re-send is always enabled for failed/limited recipients.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Re-send After</span>
                <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                  24 hours (1 day)
                </span>
              </div>
            </div>

            <Button onClick={handleSendCampaignClick} disabled={isSendDisabled} className="w-full">
              {campaignLoading
                ? 'Sending...'
                : isTemplateMode
                ? 'Send Image Template'
                : 'Send Campaign'}
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 min-w-0 lg:col-span-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-[#343a40]">
              <span className="inline-block px-2.5 py-1 rounded-md bg-[#e8f0fe] text-[#3b86d1] shadow-sm">
                Live Preview
              </span>
            </h3>
            <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setPreviewTheme('android')}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  previewTheme === 'android' ? 'bg-[#075E54] text-white' : 'text-gray-600'
                }`}
              >
                Android
              </button>
              <button
                type="button"
                onClick={() => setPreviewTheme('ios')}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  previewTheme === 'ios' ? 'bg-[#128C7E] text-white' : 'text-gray-600'
                }`}
              >
                iOS
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Message preview updates automatically as you edit your campaign.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-[340px]">
              <div className="relative mx-auto overflow-hidden rounded-[2.75rem] border-[10px] border-[#0c1115] bg-[#0c1115] shadow-2xl">
                <div className="absolute left-1/2 top-3 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-[#1a1d1f]" />
                <div className="absolute right-2 top-28 z-20 h-20 w-1 rounded-l-full bg-[#1a1d1f]" />
                <div className="absolute left-2 top-52 z-20 h-16 w-1 rounded-r-full bg-[#1a1d1f]" />
                <div
                  className="relative h-[660px] overflow-hidden rounded-[2.25rem] bg-[#ece5dd]"
                  style={{
                    backgroundImage: WHATSAPP_CHAT_WALLPAPER,
                    fontFamily: previewThemeConfig.fontFamily,
                  }}
                >
                  <div
                    className="pb-2 text-white shadow"
                    style={{ backgroundColor: previewThemeConfig.headerColor }}
                  >
                    <div className="flex items-center justify-between px-5 pt-3 text-[0.7rem] text-white/70">
                      <span>{dayjs().format('h:mm')}</span>
                      <div className="flex items-center gap-1">
                        <span className="h-1 w-4 rounded bg-white/70" />
                        <span className="h-1 w-3 rounded bg-white/70" />
                        <span className="h-1 w-2 rounded bg-white/70" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4">
                      <div className="flex items-center gap-3 py-2">
                        <ChevronLeft className="h-5 w-5 opacity-80" />
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-semibold uppercase">
                          {previewInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{previewDisplayName}</p>
                          <p className="text-[0.65rem] text-white/70">online</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-white/80">
                        <Video className="h-5 w-5" />
                        <Phone className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex h-[calc(100%-82px)] flex-col justify-between">
                    <div className="relative flex-1 overflow-y-auto px-4 py-5">
                      <div className="mx-auto mb-4 w-fit rounded-full bg-[#dcf8c6] px-4 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-[#3c5d45] shadow-sm">
                        {previewDateLabel}
                      </div>
                      <div className="flex flex-col gap-4">
                        {previewHeaderImage ||
                        previewHeaderText ||
                        livePreviewLines.length > 0 ||
                        carouselPreviewCards.length > 0 ? (
                          <div className="flex justify-start">
                            <div
                              className={`relative max-w-[85%] ${previewThemeConfig.bubbleRadius} bg-white/95 px-4 py-3 text-[0.95rem] leading-relaxed text-[#263238] shadow-md`}
                            >
                              {previewTheme === 'android' && (
                                <span className="absolute -left-1 top-3 h-4 w-4 -translate-x-1/2 rotate-45 rounded-sm bg-white/95 shadow-sm" />
                              )}
                              {previewHeaderImage && (
                                <div className="mb-3 overflow-hidden rounded-xl">
                                  <img
                                    src={previewHeaderImage}
                                    alt="Header media preview"
                                    className="h-auto w-full rounded-xl object-cover"
                                  />
                                </div>
                              )}
                              {previewHeaderText && (
                                <p className="mb-3 text-sm font-semibold text-gray-800">
                                  {previewHeaderText}
                                </p>
                              )}
                              {livePreviewLines.map((line, index) => (
                                <p
                                  key={index}
                                  className={`whitespace-pre-wrap break-words text-[0.94rem] ${
                                    index > 0 ? 'mt-2' : ''
                                  }`}
                                >
                                  {formatWhatsappSegments(line).map((segment, segmentIndex) => (
                                    <React.Fragment key={segmentIndex}>{segment}</React.Fragment>
                                  ))}
                                </p>
                              ))}
                              {carouselPreviewCards.length > 0 && (
                                <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-2">
                                  {activeCarouselPreviewCard && (
                                    <div className="rounded-xl">
                                      <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-200">
                                        {activeCarouselPreviewCard.mediaPreviewUrl ? (
                                          activeCarouselPreviewCard.mediaType === 'VIDEO' ? (
                                            <video
                                              src={activeCarouselPreviewCard.mediaPreviewUrl}
                                              className="h-full w-full object-cover"
                                              muted
                                              playsInline
                                              preload="metadata"
                                            />
                                          ) : (
                                            <img
                                              src={activeCarouselPreviewCard.mediaPreviewUrl}
                                              alt="Carousel preview"
                                              className="h-full w-full object-cover"
                                            />
                                          )
                                        ) : (
                                          <div className="flex h-full items-center justify-center text-[10px] text-gray-500">
                                            {activeCarouselPreviewCard.mediaType} pending
                                          </div>
                                        )}
                                      </div>
                                      <p className="mt-2 line-clamp-3 text-[11px] text-gray-700">
                                        {activeCarouselPreviewCard.bodyText || 'Card body preview'}
                                      </p>
                                      <div className="mt-2 space-y-1">
                                        {activeCarouselPreviewCard.buttons.map((button, idx) => (
                                          <div
                                            key={`${activeCarouselPreviewCard.id}-${idx}`}
                                            className="rounded-full border border-[#25d366] px-2 py-1 text-center text-[10px] font-semibold text-[#128c7e]"
                                          >
                                            {button.label}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div className="mt-2 flex items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewCarouselIndex(prev => Math.max(prev - 1, 0))
                                      }
                                      disabled={previewCarouselIndex <= 0}
                                      className="rounded-full border border-gray-300 p-1 text-gray-500 disabled:opacity-40"
                                    >
                                      <ChevronLeft className="h-3 w-3" />
                                    </button>
                                    <div className="flex items-center gap-1">
                                      {carouselPreviewCards.map((_, dotIndex) => (
                                        <button
                                          key={`dot-${dotIndex}`}
                                          type="button"
                                          onClick={() => setPreviewCarouselIndex(dotIndex)}
                                          className={`h-1.5 rounded-full ${
                                            dotIndex === previewCarouselIndex
                                              ? 'w-4 bg-gray-700'
                                              : 'w-1.5 bg-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewCarouselIndex(prev =>
                                          Math.min(prev + 1, carouselPreviewCards.length - 1)
                                        )
                                      }
                                      disabled={
                                        previewCarouselIndex >= carouselPreviewCards.length - 1
                                      }
                                      className="rounded-full border border-gray-300 p-1 text-gray-500 disabled:opacity-40"
                                    >
                                      <ChevronRight className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="mt-3 text-[11px] font-medium text-gray-500">
                                by billbox
                              </div>
                              <div className="mt-1 flex items-center justify-end gap-1 text-[11px] uppercase tracking-wide text-gray-400">
                                {previewTimeLabel}
                                <CheckCheck className="h-3 w-3 text-[#4fc3f7]" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-start">
                            <div
                              className={`max-w-[85%] ${previewThemeConfig.bubbleRadius} bg-white/80 px-4 py-4 text-sm text-gray-500 shadow`}
                            >
                              Your WhatsApp message preview will appear here.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="border-t border-black/10 bg-[#f0f2f5] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">
                          <Smile className="h-5 w-5 text-gray-400" />
                          <span className="flex-1 text-[0.85rem] text-gray-500">
                            Type a message
                          </span>
                          <Paperclip className="h-5 w-5 text-gray-400" />
                          <Camera className="h-5 w-5 text-gray-400" />
                          <Mic className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25d366] shadow-sm">
                          <Send className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setCampaignsTableTab('completed')}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  campaignsTableTab === 'completed'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed Campaigns
              </button>
              <button
                type="button"
                onClick={() => setCampaignsTableTab('ongoing')}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  campaignsTableTab === 'ongoing'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ongoing Campaigns
              </button>
            </div>
            {campaignsTableTab === 'ongoing' && (
              <p className="text-xs text-gray-500">
                Delivered/Processing percentages update after 24 hours.
              </p>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          {campaignsTableTab === 'completed' ? (
            campaignLoading ? (
              <div className="p-6 text-center">Loading campaigns...</div>
            ) : completedCampaigns.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No campaigns found</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivered Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Limited by Meta
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedCampaigns.map((campaign, index) => {
                    const templateLabel = getCampaignTemplateLabel(campaign);
                    const stats = getCampaignDeliveryStats(campaign);
                    const remainingCount = Math.max(stats.total - stats.delivered, 0);
                    return (
                      <tr
                        key={campaign.id || index}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => openCampaignDetails({ ...campaign, source: 'completed' })}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="block max-w-[220px] truncate">
                            {campaign.campaignName || 'Unnamed Campaign'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="block max-w-[200px] truncate">{templateLabel}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatSentDateTime(campaign.sentDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDeliveredPercentage(stats.delivered, stats.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDeliveredPercentage(remainingCount, stats.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : ongoingCampaigns.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No ongoing campaigns yet</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ongoingCampaigns.map(campaign => {
                  const templateLabel = getCampaignTemplateLabel(campaign);
                  const stats = getCampaignDeliveryStats(campaign);
                  const campaignId = campaign.campaignId || null;
                  const activeProgress = campaignId ? activeCampaignProgress[campaignId] : null;
                  const resendStatus = campaign.latestResendAttempt?.status || null;
                  const overallStatus = (campaign.overallCampaignStatus || '')
                    .toString()
                    .toLowerCase();
                  const statusLabel = overallStatus
                    ? overallStatus === 'ongoing'
                      ? 'In Progress'
                      : 'Completed'
                    : 'In Progress';
                  const deliveredDisplay = activeProgress
                    ? formatDeliveredPercentage(
                        activeProgress.completedCount,
                        activeProgress.totalRecipients
                      )
                    : stats.total
                    ? formatDeliveredPercentage(stats.delivered, stats.total)
                    : '--';
                  const processingDisplay = resendStatus
                    ? resendStatus.toString().toUpperCase()
                    : '--';
                  const details: CampaignDetails = {
                    ...campaign,
                    source: 'completed',
                  };
                  const stopDisabled =
                    !campaignId ||
                    stopCampaignLoading[campaignId] ||
                    campaign.resendSettings?.stopped;
                  return (
                    <tr
                      key={campaign.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => openCampaignDetails(details)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className="block max-w-[220px] truncate">
                          {campaign.campaignName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="block max-w-[200px] truncate">{templateLabel}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatSentDateTime(campaign.sentDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{statusLabel}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          Delivered: {deliveredDisplay} / Processing: {processingDisplay}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={event => {
                                  event.stopPropagation();
                                  handleStopCampaign(campaign);
                                }}
                                disabled={stopDisabled}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                                  stopDisabled
                                    ? 'cursor-not-allowed border-gray-200 text-gray-300'
                                    : 'border-red-200 text-red-600 hover:border-red-300'
                                }`}
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {campaign.resendSettings?.stopped
                                ? 'Campaign stopped'
                                : 'Stop campaign'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedCampaignDetails && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={event => {
            if (event.target === event.currentTarget) {
              closeCampaignDetails();
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={event => event.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Campaign Details</h3>
              <button
                onClick={() => closeCampaignDetails()}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Campaign Name</h4>
                <p className="text-lg text-gray-900">{selectedCampaignDetails.campaignName}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700">Sent Date</h4>
                <p className="text-gray-900">
                  {new Date(
                    selectedCampaignDetails.sentDate || (selectedCampaignDetails as any).createdAt
                  ).toLocaleString()}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700">
                  Recipients ({modalRecipients.length})
                </h4>

                <div className="mt-3 flex flex-wrap gap-2">
                  {recipientStatusSummary.map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setRecipientStatusFilter(item.key)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        recipientStatusFilter === item.key
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-600'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-gray-100 px-1 text-[11px] text-gray-700">
                        {item.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900">Re-send Settings</h5>
                      <p className="text-xs text-gray-500">
                        Enabled: {selectedCampaignDetails.resendSettings?.enabled ? 'Yes' : 'No'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Re-send After:{' '}
                        {selectedCampaignDetails.resendSettings?.delayOption
                          ? RESEND_DELAY_LABELS[
                              selectedCampaignDetails.resendSettings.delayOption
                            ] || selectedCampaignDetails.resendSettings.delayOption
                          : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <h6 className="text-xs font-semibold text-gray-700">Re-send History</h6>
                      {resendHistoryLoading && (
                        <span className="text-xs text-gray-400">Loading...</span>
                      )}
                    </div>
                    {resendHistoryError ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-red-600">
                        <span>{resendHistoryError}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (resendCampaignId) {
                              loadResendHistory(resendCampaignId);
                            }
                          }}
                          className="rounded-md border border-red-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"
                        >
                          Retry
                        </button>
                      </div>
                    ) : resendHistory.length === 0 ? (
                      <p className="mt-2 text-xs text-gray-500">No re-send attempts yet.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {resendHistory.map((attempt, index) => (
                          <div
                            key={attempt.resendAttemptId || `attempt-${index}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-800">
                                {attempt.status || 'Scheduled'}
                              </span>
                              <span>
                                {attempt.scheduledAt
                                  ? new Date(attempt.scheduledAt).toLocaleString()
                                  : 'Pending schedule'}
                              </span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span>Eligible: {attempt.eligibleCount ?? 0}</span>
                              <span>
                                Sent: {attempt.sentCount ?? attempt.attemptedCount ?? 0} /
                                Delivered: {attempt.deliveredCount ?? attempt.successCount ?? 0} /
                                Failed: {attempt.failedCount ?? 0}
                              </span>
                              {attempt.limitedByMetaCount ? (
                                <span>Limited: {attempt.limitedByMetaCount}</span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {modalRecipientsLoading ? (
                    <div className="rounded-md border border-dashed border-blue-200 bg-blue-50 px-3 py-4 text-center text-sm text-blue-700">
                      Loading recipients...
                    </div>
                  ) : modalRecipientsError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-4 text-center text-sm text-red-600">
                      {modalRecipientsError}
                    </div>
                  ) : filteredRecipients.length === 0 ? (
                    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
                      No recipients match the selected status filter.
                    </div>
                  ) : (
                    filteredRecipients.map((recipient, index) => {
                      const rawStatus = (recipient.status || 'sent').toString();
                      const status = rawStatus.toLowerCase();
                      const isLimited = isMetaLimitedStatus(recipient) || status === 'limited';
                      const statusClass = isLimited
                        ? 'bg-amber-100 text-amber-800'
                        : status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : status === 'read' || status === 'seen'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600';

                      const statusLabelBase = isLimited
                        ? 'limited'
                        : status === 'seen'
                        ? 'seen'
                        : rawStatus.trim()
                        ? rawStatus.toLowerCase()
                        : 'sent';
                      const statusLabel =
                        statusLabelBase.charAt(0).toUpperCase() + statusLabelBase.slice(1);

                      return (
                        <div
                          key={`${recipient.phone}-${index}`}
                          className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{recipient.name}</p>
                            <p className="text-xs text-gray-500">
                              {maskPhoneNumber(recipient.phone)}
                            </p>
                            {recipient.error && (
                              <p className="mt-1 text-xs text-red-600">
                                Reason: {recipient.error}
                                {recipient.errorCode ? ` (code ${recipient.errorCode})` : ''}
                              </p>
                            )}
                          </div>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}
                          >
                            {statusLabel || 'sent'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {quotaModalOpen && quotaInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              {quotaWithinLimit ? 'Confirm campaign send' : 'Campaign limit reached'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Campaign messages are limited for this store.
            </p>
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Total allowed</span>
                <span className="font-semibold">{quotaInfo.limit}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Selected</span>
                <span className="font-semibold">{quotaInfo.requested}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Remaining</span>
                <span className="font-semibold">{quotaInfo.remaining}</span>
              </div>
            </div>
            {quotaWithinLimit ? (
              <p className="mt-4 text-sm text-gray-600">
                You are about to send {quotaInfo.requested} messages.
              </p>
            ) : (
              <p className="mt-4 text-sm text-gray-600">
                Not enough remaining messages to send this campaign.
              </p>
            )}
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              For any queries contact our team via{' '}
              <span className="font-semibold">sales@billbox.co.in</span>.
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setQuotaModalOpen(false)}>
                Close
              </Button>
              {quotaWithinLimit && (
                <Button type="button" onClick={handleQuotaConfirmSend}>
                  Confirm send
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
