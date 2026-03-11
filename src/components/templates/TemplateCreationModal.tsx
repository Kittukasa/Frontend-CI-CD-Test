import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { CreateTemplateRequest } from '@/services/templateService';
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, Bold as BoldIcon, Check, ChevronDown, ExternalLink, Italic as ItalicIcon, Loader2, Plus, Smile, Trash2, X } from 'lucide-react';
import {
  TEMPLATE_BUTTON_TYPE_OPTIONS,
  TemplateButtonTypeValue,
  TEMPLATE_CATEGORY_OPTIONS,
  TemplateCategoryValue,
  TemplateEditFormData
} from '@/types/templateEditor';
type TemplateHeaderType = 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
type TemplateButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
type TemplateButtonSubType = 'COUPON_CODE' | 'WEBSITE_URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
type CarouselMediaType = 'IMAGE' | 'VIDEO';
type CarouselButtonLayout = 'URL' | 'PHONE' | 'URL_PHONE' | 'QUICK_REPLY' | 'QUICK_REPLY_2';

interface TemplateButtonDraft {
  id: string;
  type: TemplateButtonType;
  subType?: TemplateButtonSubType;
  text: string;
  url?: string;
  urlMode?: 'Static';
  phoneNumber?: string;
  countryCode?: string;
  example?: string;
}

interface CarouselButtonDraft {
  id: string;
  type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
  text: string;
  url?: string;
  urlType?: 'Static' | 'Dynamic';
  phoneNumber?: string;
  countryCode?: string;
  showUtmBuilder?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

interface CarouselCardDraft {
  id: string;
  mediaHandle: string;
  mediaPreviewUrl: string;
  bodyText: string;
  buttons: CarouselButtonDraft[];
}

interface TemplateFormState {
  name: string;
  category: TemplateCategoryValue | '';
  buttonType: string;
  sendProductsMode: 'specific' | 'catalog';
  language: string;
  headerType: TemplateHeaderType;
  headerText: string;
  headerMediaHandle: string;
  headerExampleText: string;
  bodyText: string;
  bodyExampleMap: Record<string, string>;
  footerText: string;
  footerExample: string;
  buttons: TemplateButtonDraft[];
  ltoOfferHeading: string;
  ltoOfferCode: string;
  ltoUrlType: 'Static' | 'Dynamic';
  ltoUrl: string;
  ltoButtonLabel: string;
  ltoShowUtmBuilder: boolean;
  ltoUtmSource: string;
  ltoUtmMedium: string;
  ltoUtmCampaign: string;
  ltoUtmTerm: string;
  ltoUtmContent: string;
  carouselMediaType: CarouselMediaType;
  carouselButtonLayout: CarouselButtonLayout;
  carouselCards: CarouselCardDraft[];
}

interface TemplateCreationModalProps {
  open: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  initialTemplate?: TemplateEditFormData;
  editContext?: 'predefined' | 'custom' | null;
  onSubmit?: (templateData: TemplateEditFormData) => Promise<void> | void;
  isBusy?: boolean;
  onMetaTemplateCreated?: () => Promise<void> | void;
  onStoreTemplateDraft?: (request: CreateTemplateRequest) => Promise<void> | void;
}

const buildAuthHeaders = (includeJson = false) => {
  const token = localStorage.getItem('bb_token');
  if (!token) {
    throw new Error('Missing authentication token. Please log in again.');
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`
  };
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const LTO_OFFER_HEADING_MAX_LENGTH = 60;
const LTO_OFFER_CODE_MAX_LENGTH = 15;
const LTO_URL_MAX_LENGTH = 2000;
const LTO_BUTTON_LABEL_MAX_LENGTH = 25;
const CAROUSEL_CARD_BODY_MAX_LENGTH = 160;
const CAROUSEL_MIN_CARDS = 2;
const CAROUSEL_MAX_CARDS = 10;
const CAROUSEL_URL_MAX_LENGTH = 2000;
const CAROUSEL_BUTTON_LABEL_MAX_LENGTH = 25;
const CAROUSEL_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const CAROUSEL_VIDEO_MAX_BYTES = 16 * 1024 * 1024;

const createCarouselButtonDraft = (
  type: CarouselButtonDraft['type'],
  seed?: Partial<CarouselButtonDraft>
): CarouselButtonDraft => ({
  id:
    seed?.id ||
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `carousel_btn_${Date.now()}_${Math.random().toString(16).slice(2)}`),
  type,
  text: seed?.text || '',
  url: seed?.url || '',
  urlType: seed?.urlType || 'Static',
  phoneNumber: seed?.phoneNumber || '',
  countryCode: seed?.countryCode || '+91',
  showUtmBuilder: Boolean(seed?.showUtmBuilder),
  utmSource: seed?.utmSource || '',
  utmMedium: seed?.utmMedium || '',
  utmCampaign: seed?.utmCampaign || '',
  utmTerm: seed?.utmTerm || '',
  utmContent: seed?.utmContent || ''
});

const createCarouselCardDraft = (seed?: Partial<CarouselCardDraft>): CarouselCardDraft => ({
  id:
    seed?.id ||
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `carousel_card_${Date.now()}_${Math.random().toString(16).slice(2)}`),
  mediaHandle: seed?.mediaHandle || '',
  mediaPreviewUrl: seed?.mediaPreviewUrl || '',
  bodyText: seed?.bodyText || '',
  buttons:
    seed?.buttons?.length
      ? seed.buttons.map(button => createCarouselButtonDraft(button.type, button))
      : []
});

const deriveCarouselButtonLayout = (cards: CarouselCardDraft[]): CarouselButtonLayout => {
  const firstCard = cards[0];
  const signature = (firstCard?.buttons || []).map(button => button.type).join('|');
  switch (signature) {
    case 'URL':
      return 'URL';
    case 'PHONE_NUMBER':
      return 'PHONE';
    case 'URL|PHONE_NUMBER':
      return 'URL_PHONE';
    case 'QUICK_REPLY':
      return 'QUICK_REPLY';
    case 'QUICK_REPLY|QUICK_REPLY':
      return 'QUICK_REPLY_2';
    default:
      return 'URL';
  }
};

const createEmptyFormState = (): TemplateFormState => ({
  name: '',
  category: '',
  buttonType: 'None',
  sendProductsMode: 'specific',
  language: 'en_US',
  headerType: 'TEXT',
  headerText: '',
  headerMediaHandle: '',
  headerExampleText: '',
  bodyText: '',
  bodyExampleMap: {},
  footerText: '',
  footerExample: '',
  buttons: [],
  ltoOfferHeading: '',
  ltoOfferCode: '',
  ltoUrlType: 'Static',
  ltoUrl: '',
  ltoButtonLabel: '',
  ltoShowUtmBuilder: false,
  ltoUtmSource: '',
  ltoUtmMedium: '',
  ltoUtmCampaign: '',
  ltoUtmTerm: '',
  ltoUtmContent: '',
  carouselMediaType: 'IMAGE',
  carouselButtonLayout: 'URL',
  carouselCards: [
    createCarouselCardDraft(),
    createCarouselCardDraft()
  ]
});

const buildUrlWithUtmParameters = (
  rawUrl: string,
  utmValues: {
    source: string;
    medium: string;
    campaign: string;
    term: string;
    content: string;
  }
) => {
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) {
    return '';
  }

  try {
    const absolute = /^https?:\/\//i.test(trimmedUrl)
      ? trimmedUrl
      : `https://${trimmedUrl.replace(/^\/+/, '')}`;
    const parsed = new URL(absolute);
    const entries: Array<[string, string]> = [
      ['utm_source', utmValues.source],
      ['utm_medium', utmValues.medium],
      ['utm_campaign', utmValues.campaign],
      ['utm_term', utmValues.term],
      ['utm_content', utmValues.content]
    ];
    entries.forEach(([key, value]) => {
      const nextValue = value.trim();
      if (nextValue) {
        parsed.searchParams.set(key, nextValue);
      } else {
        parsed.searchParams.delete(key);
      }
    });
    return parsed.toString();
  } catch {
    return trimmedUrl;
  }
};

const coerceTemplateTextValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    const firstString = value.find(item => typeof item === 'string' && item.trim().length > 0);
    return typeof firstString === 'string' ? firstString : '';
  }
  if (value && typeof value === 'object') {
    if (typeof (value as { text?: unknown }).text === 'string') {
      return (value as { text: string }).text;
    }
    if (typeof (value as { example?: unknown }).example === 'string') {
      return (value as { example: string }).example;
    }
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

const normalizePlaceholders = (input: string) => {
  if (!input) {
    return {
      text: input,
      order: [] as string[]
    };
  }

  const nameToIndex = new Map<string, number>();
  const indexToName = new Map<number, string>();
  let maxIndex = 0;

  const processed = input.replace(/{{\s*([\w.-]+)\s*}}/g, (_, rawToken: string) => {
    if (!rawToken) {
      return '{{}}';
    }

    if (/^\d+$/.test(rawToken)) {
      const numericIndex = Number(rawToken);
      if (numericIndex > maxIndex) {
        maxIndex = numericIndex;
      }
      if (!indexToName.has(numericIndex)) {
        indexToName.set(numericIndex, rawToken);
      }
      return `{{${numericIndex}}}`;
    }

    let assignedIndex = nameToIndex.get(rawToken);
    if (!assignedIndex) {
      assignedIndex = maxIndex + 1;
      maxIndex = assignedIndex;
      nameToIndex.set(rawToken, assignedIndex);
      indexToName.set(assignedIndex, rawToken);
    }

    return `{{${assignedIndex}}}`;
  });

  const order: string[] = [];
  for (let index = 1; index <= maxIndex; index += 1) {
    const name = indexToName.get(index);
    if (name) {
      order.push(name);
    } else {
      order.push(String(index));
    }
  }

  return {
    text: processed,
    order
  };
};

const reorderVariables = (order: string[], variables: string[]) => {
  if (!order.length) {
    return variables;
  }
  const normalizedOrder = order.map(token => token.trim());
  const trimmedVariables = variables.map(variable => variable.trim());
  const variableSet = new Set(trimmedVariables);
  const ordered = normalizedOrder.map(token => (variableSet.has(token) ? token : token));

  const leftovers = trimmedVariables.filter(variable => !normalizedOrder.includes(variable));
  return ordered.concat(leftovers);
};

const createButtonDraft = (
  type: TemplateButtonType = 'QUICK_REPLY',
  seed?: Partial<TemplateButtonDraft>
): TemplateButtonDraft => ({
  id:
    seed?.id ||
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `btn_${Date.now()}_${Math.random().toString(16).slice(2)}`),
  type: seed?.type || type,
  subType: seed?.subType,
  text: seed?.text || '',
  url: seed?.url || '',
  urlMode: seed?.urlMode || 'Static',
  phoneNumber: seed?.phoneNumber || '',
  countryCode: seed?.countryCode || '+91',
  example: seed?.example || ''
});

const buildFormStateFromTemplate = (template: TemplateEditFormData | undefined | null): TemplateFormState => {
  if (!template) {
    return createEmptyFormState();
  }

  const headerType = (template.headerType as TemplateHeaderType) || 'NONE';
  const bodyExampleMap: Record<string, string> = {};
  if (template.bodyExampleText) {
    template.bodyExampleText
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
      .forEach((value, index) => {
        bodyExampleMap[String(index + 1)] = value;
      });
  } else if (Array.isArray(template.variables) && template.variables.length > 0) {
    template.variables.forEach((_, index) => {
      bodyExampleMap[String(index + 1)] = '';
    });
  }
  const buttons =
    template.buttons?.map(button =>
      createButtonDraft(
        button.type,
        button.type === 'URL'
          ? {
              subType: 'WEBSITE_URL',
              text: button.text || '',
              url: button.url || '',
              example: Array.isArray((button as any).example) ? (button as any).example[0] : ''
            }
          : button.type === 'PHONE_NUMBER'
          ? {
              subType: 'PHONE_NUMBER',
              text: button.text || '',
              phoneNumber: button.phone_number || ''
            }
          : {
              subType: 'QUICK_REPLY',
              text: button.text || ''
            }
      )
    ) || [];

  const headerMediaHandle =
    headerType === 'IMAGE'
      ? template.headerImageUrl || template.previewImageUrl || ''
      : headerType === 'VIDEO'
      ? template.headerVideoUrl || ''
      : headerType === 'DOCUMENT'
      ? template.headerDocumentUrl || ''
      : '';

  return {
    name: template.name || '',
    category: template.category || 'MARKETING',
    buttonType:
      typeof template.buttonType === 'string' && template.buttonType.trim()
        ? template.buttonType.trim()
        : template.carousel?.cards?.length
          ? 'Carousel'
        : buttons.length > 0
          ? 'Copy Code, URL, Quick Replies etc'
          : 'None',
    sendProductsMode: 'specific',
    language: template.language || 'en_US',
    headerType: headerType === 'NONE' ? 'NONE' : headerType,
    headerText: template.headerText || '',
    headerMediaHandle: headerMediaHandle,
    headerExampleText: template.headerExampleText || '',
    bodyText: template.bodyText || '',
    bodyExampleMap,
    footerText: template.footerText || '',
    footerExample: template.footerExampleText || '',
    buttons,
    ltoOfferHeading: coerceTemplateTextValue(template.limitedTimeOffer?.offerHeading),
    ltoOfferCode: coerceTemplateTextValue(template.limitedTimeOffer?.offerCode),
    ltoUrlType: template.limitedTimeOffer?.urlType || 'Static',
    ltoUrl: coerceTemplateTextValue(template.limitedTimeOffer?.url),
    ltoButtonLabel: coerceTemplateTextValue(template.limitedTimeOffer?.buttonLabel),
    ltoShowUtmBuilder: Boolean(
      template.limitedTimeOffer?.utmSource ||
      template.limitedTimeOffer?.utmMedium ||
      template.limitedTimeOffer?.utmCampaign ||
      template.limitedTimeOffer?.utmTerm ||
      template.limitedTimeOffer?.utmContent
    ),
    ltoUtmSource: coerceTemplateTextValue(template.limitedTimeOffer?.utmSource),
    ltoUtmMedium: coerceTemplateTextValue(template.limitedTimeOffer?.utmMedium),
    ltoUtmCampaign: coerceTemplateTextValue(template.limitedTimeOffer?.utmCampaign),
    ltoUtmTerm: coerceTemplateTextValue(template.limitedTimeOffer?.utmTerm),
    ltoUtmContent: coerceTemplateTextValue(template.limitedTimeOffer?.utmContent),
    carouselMediaType: template.carousel?.mediaType || 'IMAGE',
    carouselButtonLayout: template.carousel?.buttonLayout || 'URL',
    carouselCards:
      template.carousel?.cards?.length
        ? template.carousel.cards.map(card =>
            createCarouselCardDraft({
              id: card.id,
              mediaHandle: coerceTemplateTextValue(card.mediaHandle),
              mediaPreviewUrl: coerceTemplateTextValue(card.mediaUrl),
              bodyText: coerceTemplateTextValue(card.bodyText),
              buttons:
                card.buttons?.map(button =>
                  createCarouselButtonDraft(button.type, {
                    text: coerceTemplateTextValue(button.text),
                    url: coerceTemplateTextValue(button.url),
                    urlType: button.urlType || 'Static',
                    phoneNumber: coerceTemplateTextValue(button.phone_number),
                    showUtmBuilder: Boolean(
                      button.utmSource || button.utmMedium || button.utmCampaign || button.utmTerm || button.utmContent
                    ),
                    utmSource: coerceTemplateTextValue(button.utmSource),
                    utmMedium: coerceTemplateTextValue(button.utmMedium),
                    utmCampaign: coerceTemplateTextValue(button.utmCampaign),
                    utmTerm: coerceTemplateTextValue(button.utmTerm),
                    utmContent: coerceTemplateTextValue(button.utmContent)
                  })
                ) || []
            })
          )
        : [createCarouselCardDraft(), createCarouselCardDraft()]
  };
};

export const TemplateCreationModal: React.FC<TemplateCreationModalProps> = ({
  open,
  onClose,
  mode = 'create',
  initialTemplate,
  editContext = null,
  onSubmit,
  isBusy = false,
  onMetaTemplateCreated,
  onStoreTemplateDraft
}) => {
  const [form, setForm] = useState<TemplateFormState>(() => createEmptyFormState());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [headerUploadLoading, setHeaderUploadLoading] = useState(false);
  const [headerUploadError, setHeaderUploadError] = useState<string | null>(null);
  const [headerUploadSuccess, setHeaderUploadSuccess] = useState<string | null>(null);
  const [headerSelectedFileName, setHeaderSelectedFileName] = useState('No file chosen');
  const [headerPreviewUrl, setHeaderPreviewUrl] = useState<string | null>(null);
  const headerPreviewObjectUrlRef = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const buttonTypeDropdownRef = useRef<HTMLDivElement | null>(null);
  const [buttonTypeDropdownOpen, setButtonTypeDropdownOpen] = useState(false);
  const [buttonRuleWarning, setButtonRuleWarning] = useState<string | null>(null);
  const [draggedCarouselCardId, setDraggedCarouselCardId] = useState<string | null>(null);
  const [carouselButtonPickerCardId, setCarouselButtonPickerCardId] = useState<string | null>(null);
  const clearHeaderPreview = useCallback(() => {
    if (headerPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(headerPreviewObjectUrlRef.current);
      headerPreviewObjectUrlRef.current = null;
    }
    setHeaderPreviewUrl(null);
  }, []);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const humanizeErrorMessage = (rawMessage: string): string => {
    if (!rawMessage) {
      return 'We couldn\'t submit this template. Please try again later.';
    }

    const normalized = rawMessage.trim();

    if (
      normalized.includes("New English (US) content can't be added") ||
      normalized.includes('content is being deleted')
    ) {
      return (
        'Meta is still deleting the previous English version of this template. ' +
        'Wait a few weeks or create it with a different name so you can continue.'
      );
    }

    if (normalized.includes('There is already English (US) content for this template')) {
      return 'A template with this name already exists on WhatsApp. Please pick a different name and try again.';
    }

    return normalized;
  };

  const detectedPlaceholders = useMemo(() => {
    const matches = form.bodyText.match(/{{\s*([\w.-]+)\s*}}/g) || [];
    return Array.from(
      new Set(
        matches
          .map(token => token.replace(/[{}]/g, '').trim())
          .filter(Boolean)
      )
    );
  }, [form.bodyText]);

  const placeholderNumberKeys = useMemo(
    () => detectedPlaceholders.map((_, index) => String(index + 1)),
    [detectedPlaceholders]
  );

  useEffect(() => {
    setForm(prev => {
      const desiredKeys = placeholderNumberKeys;
      const previousKeys = Object.keys(prev.bodyExampleMap);

      if (desiredKeys.length === 0) {
        if (previousKeys.length === 0) {
          return prev;
        }
        return {
          ...prev,
          bodyExampleMap: {}
        };
      }

      const nextMap: Record<string, string> = {};
      let changed = previousKeys.length !== desiredKeys.length;

      desiredKeys.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(prev.bodyExampleMap, key)) {
          nextMap[key] = prev.bodyExampleMap[key];
        } else {
          nextMap[key] = '';
          changed = true;
        }
      });

      if (!changed) {
        for (let index = 0; index < desiredKeys.length; index += 1) {
          const key = desiredKeys[index];
          if (!Object.prototype.hasOwnProperty.call(nextMap, key)) {
            changed = true;
            break;
          }
        }
      }

      if (!changed) {
        return prev;
      }

      return {
        ...prev,
        bodyExampleMap: nextMap
      };
    });
  }, [placeholderNumberKeys]);

  const isEditMode = mode === 'edit';

  useEffect(() => {
    if (!open) return;

    clearHeaderPreview();
    setHeaderUploadError(null);
    setHeaderUploadSuccess(null);
    setSubmissionError(null);
    setButtonRuleWarning(null);
    setButtonTypeDropdownOpen(false);

    if (isEditMode && initialTemplate) {
      const nextFormState = buildFormStateFromTemplate(initialTemplate);
      setForm(nextFormState);
      if (nextFormState.headerType === 'IMAGE') {
        const previewSource =
          nextFormState.headerMediaHandle ||
          initialTemplate.previewImageUrl ||
          initialTemplate.headerImageUrl ||
          null;
        if (previewSource) {
          setHeaderPreviewUrl(previewSource);
        }
      } else {
        setHeaderPreviewUrl(null);
      }
      return;
    }

    setForm(createEmptyFormState());
  }, [open, isEditMode, initialTemplate, clearHeaderPreview]);

  useEffect(() => {
    if (!buttonTypeDropdownOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        buttonTypeDropdownRef.current &&
        !buttonTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setButtonTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [buttonTypeDropdownOpen]);

  useEffect(() => {
    if (form.headerType !== 'IMAGE') {
      clearHeaderPreview();
    }
  }, [form.headerType, clearHeaderPreview]);

  useEffect(() => {
    if (!form.headerMediaHandle.trim()) {
      clearHeaderPreview();
    }
  }, [form.headerMediaHandle, clearHeaderPreview]);

  useEffect(() => {
    return () => {
      clearHeaderPreview();
    };
  }, [clearHeaderPreview]);

  const handleChange = useCallback(
    <K extends keyof TemplateFormState>(
      field: K,
      value: TemplateFormState[K],
      options: { preservePreview?: boolean } = {}
    ) => {
      setForm(prev => ({
        ...prev,
        [field]: value
      }));
      if (field === 'headerType') {
        setHeaderUploadError(null);
        if (value === 'NONE' || value === 'TEXT') {
          setHeaderUploadSuccess(null);
          setHeaderSelectedFileName('No file chosen');
        }
      }
      if (field === 'headerMediaHandle') {
        setHeaderUploadError(null);
        const trimmed = typeof value === 'string' ? value.trim() : '';
        if (trimmed.length === 0) {
          setHeaderUploadSuccess(null);
          clearHeaderPreview();
          return;
        }

        if (options.preservePreview) {
          setHeaderUploadSuccess('saved');
        } else {
          setHeaderUploadSuccess(null);
          clearHeaderPreview();
        }
      }
    },
    [clearHeaderPreview]
  );

  const MAX_STANDARD_BUTTONS = 10;
  const MAX_QUICK_REPLY_BUTTONS = 3;
  const MAX_CTA_BUTTONS = 2;
  const MAX_COPY_CODE_BUTTONS = 1;
  const getButtonsBySubType = useCallback(
    (subType: TemplateButtonSubType) => form.buttons.filter(button => button.subType === subType),
    [form.buttons]
  );

  const upsertButton = useCallback(
    (id: string, updates: Partial<TemplateButtonDraft>) => {
      handleChange(
        'buttons',
        form.buttons.map(button => (button.id === id ? { ...button, ...updates } : button))
      );
    },
    [form.buttons, handleChange]
  );

  const removeButtonById = useCallback(
    (id: string) => {
      handleChange(
        'buttons',
        form.buttons.filter(button => button.id !== id)
      );
    },
    [form.buttons, handleChange]
  );

  const addButtonBySubType = useCallback(
    (subType: TemplateButtonSubType) => {
      if (form.buttons.length >= MAX_STANDARD_BUTTONS) return;
      const seedBySubType: Record<TemplateButtonSubType, Partial<TemplateButtonDraft>> = {
        COUPON_CODE: { type: 'QUICK_REPLY', subType: 'COUPON_CODE', text: 'Copy Code' },
        WEBSITE_URL: {
          type: 'URL',
          subType: 'WEBSITE_URL',
          text: '',
          url: '',
          urlMode: 'Static'
        },
        PHONE_NUMBER: {
          type: 'PHONE_NUMBER',
          subType: 'PHONE_NUMBER',
          text: '',
          phoneNumber: '',
          countryCode: '+91'
        },
        QUICK_REPLY: { type: 'QUICK_REPLY', subType: 'QUICK_REPLY', text: '' }
      };
      const seed = seedBySubType[subType];
      handleChange('buttons', [...form.buttons, createButtonDraft(seed.type || 'QUICK_REPLY', seed)]);
    },
    [form.buttons, handleChange]
  );

  const ensureSingleButtonSubType = useCallback(
    (subType: TemplateButtonSubType) => {
      if (getButtonsBySubType(subType).length > 0) return;
      addButtonBySubType(subType);
    },
    [addButtonBySubType, getButtonsBySubType]
  );

  const updateBodyExampleValue = (key: string, value: string) => {
    setForm(prev => ({
      ...prev,
      bodyExampleMap: {
        ...prev.bodyExampleMap,
        [key]: value
      }
    }));
  };

  const updateCarouselCards = useCallback((updater: (cards: CarouselCardDraft[]) => CarouselCardDraft[]) => {
    setForm(prev => ({
      ...prev,
      carouselCards: updater(prev.carouselCards)
    }));
  }, []);

  const updateCarouselCard = useCallback(
    (cardId: string, updates: Partial<CarouselCardDraft>) => {
      updateCarouselCards(cards =>
        cards.map(card => (card.id === cardId ? { ...card, ...updates } : card))
      );
    },
    [updateCarouselCards]
  );

  const updateCarouselCardButton = useCallback(
    (cardId: string, buttonId: string, updates: Partial<CarouselButtonDraft>) => {
      updateCarouselCards(cards =>
        cards.map(card =>
          card.id === cardId
            ? {
                ...card,
                buttons: card.buttons.map(button =>
                  button.id === buttonId ? { ...button, ...updates } : button
                )
              }
            : card
        )
      );
    },
    [updateCarouselCards]
  );

  const addCarouselCardButton = useCallback(
    (cardId: string, type: CarouselButtonDraft['type']) => {
      setForm(prev => ({
        ...prev,
        carouselCards: prev.carouselCards.map(card => {
          if (card.id !== cardId) {
            return card;
          }
          if (card.buttons.length >= 2) {
            return card;
          }
          return {
            ...card,
            buttons: [...card.buttons, createCarouselButtonDraft(type)]
          };
        })
      }));
    },
    []
  );

  const removeCarouselCardButton = useCallback((cardId: string, buttonId: string) => {
    setForm(prev => ({
      ...prev,
      carouselCards: prev.carouselCards.map(card =>
        card.id === cardId
          ? { ...card, buttons: card.buttons.filter(button => button.id !== buttonId) }
          : card
      )
    }));
  }, []);

  const addCarouselCard = useCallback(() => {
    setForm(prev => {
      if (prev.carouselCards.length >= CAROUSEL_MAX_CARDS) {
        return prev;
      }
      return {
        ...prev,
        carouselCards: [...prev.carouselCards, createCarouselCardDraft()]
      };
    });
  }, []);

  const removeCarouselCard = useCallback((cardId: string) => {
    setCarouselButtonPickerCardId(prev => (prev === cardId ? null : prev));
    setForm(prev => ({
      ...prev,
      carouselCards:
        prev.carouselCards.length <= CAROUSEL_MIN_CARDS
          ? prev.carouselCards
          : prev.carouselCards.filter(card => card.id !== cardId)
    }));
  }, []);

  const moveCarouselCard = useCallback((cardId: string, direction: -1 | 1) => {
    setForm(prev => {
      const index = prev.carouselCards.findIndex(card => card.id === cardId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.carouselCards.length) {
        return prev;
      }
      const nextCards = [...prev.carouselCards];
      const [card] = nextCards.splice(index, 1);
      nextCards.splice(nextIndex, 0, card);
      return {
        ...prev,
        carouselCards: nextCards
      };
    });
  }, []);

  const reorderCarouselCard = useCallback((sourceId: string, targetId: string) => {
    setForm(prev => {
      const sourceIndex = prev.carouselCards.findIndex(card => card.id === sourceId);
      const targetIndex = prev.carouselCards.findIndex(card => card.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return prev;
      }
      const nextCards = [...prev.carouselCards];
      const [movedCard] = nextCards.splice(sourceIndex, 1);
      nextCards.splice(targetIndex, 0, movedCard);
      return {
        ...prev,
        carouselCards: nextCards
      };
    });
  }, []);

  const uploadCarouselMediaFile = useCallback(
    async (cardId: string, file: File) => {
      const headers = buildAuthHeaders();
      if ('Content-Type' in headers) {
        delete headers['Content-Type'];
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('media_type', form.carouselMediaType);

      const response = await fetch('/api/whatsapp/media/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to upload carousel media');
      }

      updateCarouselCard(cardId, {
        mediaHandle: result.mediaHandle || '',
        mediaPreviewUrl: URL.createObjectURL(file)
      });
    },
    [form.carouselMediaType, updateCarouselCard]
  );

  const handleInsertNamePlaceholder = () => {
    const tokens = Array.from(form.bodyText.matchAll(/{{\s*([\w.-]+)\s*}}/g)).map(match => match[1]?.trim());
    const numericTokens = tokens
      .filter((token): token is string => Boolean(token) && /^\d+$/.test(token))
      .map(token => Number(token));
    const maxNumeric = numericTokens.length > 0 ? Math.max(...numericTokens) : 0;
    const nextIndex = Math.max(maxNumeric + 1, detectedPlaceholders.length + 1);
    const placeholder = `{{${nextIndex}}}`;

    const needsSpace = form.bodyText.trim().length > 0 && !form.bodyText.endsWith(' ');
    const updatedBody = `${form.bodyText}${needsSpace ? ' ' : ''}${placeholder}`;
    handleChange('bodyText', updatedBody);
  };

  const handleInsertCarouselCardVariable = useCallback((cardId: string) => {
    const card = form.carouselCards.find(item => item.id === cardId);
    if (!card) return;

    const tokens = Array.from(card.bodyText.matchAll(/{{\s*(\d+)\s*}}/g)).map(match =>
      Number(match[1])
    );
    const maxNumeric = tokens.length > 0 ? Math.max(...tokens) : 0;
    const nextPlaceholder = `{{${maxNumeric + 1}}}`;
    const needsSpace = card.bodyText.trim().length > 0 && !card.bodyText.endsWith(' ');

    updateCarouselCard(cardId, {
      bodyText: `${card.bodyText}${needsSpace ? ' ' : ''}${nextPlaceholder}`.slice(
        0,
        CAROUSEL_CARD_BODY_MAX_LENGTH
      )
    });
  }, [form.carouselCards, updateCarouselCard]);

  const bodyPreview = useMemo(() => {
    return form.bodyText.trim();
  }, [form.bodyText]);

  const uploadHeaderMediaFile = useCallback(
    async (
      file: File,
      options: { previewUrl?: string; silent?: boolean } = {}
    ): Promise<string | null> => {
      if (form.headerType === 'NONE' || form.headerType === 'TEXT') {
        const message = 'Select the image header type before uploading media.';
        setHeaderUploadError(message);
        if (!options.silent) {
          toast({
            title: 'Upload failed',
            description: message,
            variant: 'destructive'
          });
        }
        return null;
      }

      setHeaderUploadLoading(true);
      setHeaderUploadError(null);
      setHeaderUploadSuccess(null);

      try {
        const headers = buildAuthHeaders();
        if ('Content-Type' in headers) {
          delete headers['Content-Type'];
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('media_type', form.headerType);

        const response = await fetch('/api/whatsapp/media/upload', {
          method: 'POST',
          headers,
          body: formData
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || 'Failed to upload media');
        }

        const mediaHandle: string = result.mediaHandle || '';
        const apiPreviewUrl: string | undefined =
          typeof result.previewUrl === 'string'
            ? result.previewUrl
            : typeof result.preview_url === 'string'
            ? result.preview_url
            : undefined;

        handleChange('headerMediaHandle', mediaHandle, { preservePreview: true });
        setHeaderUploadSuccess(options.silent ? 'default' : 'saved');

        if (headerPreviewObjectUrlRef.current) {
          URL.revokeObjectURL(headerPreviewObjectUrlRef.current);
          headerPreviewObjectUrlRef.current = null;
        }

        let nextPreview: string | null = null;
        if (options.previewUrl) {
          nextPreview = options.previewUrl;
        } else if (apiPreviewUrl && apiPreviewUrl.trim()) {
          nextPreview = apiPreviewUrl.trim();
        } else {
          const objectUrl = URL.createObjectURL(file);
          headerPreviewObjectUrlRef.current = objectUrl;
          nextPreview = objectUrl;
        }

        setHeaderPreviewUrl(nextPreview);

        if (!options.silent) {
          toast({
            title: 'Header media uploaded',
            description: 'Media handle inserted into the template automatically.'
          });
        }
        setHeaderSelectedFileName(file.name || 'Selected file');

        return mediaHandle;
      } catch (error: any) {
        const message = error?.message || 'Failed to upload media';
        setHeaderUploadError(message);
        if (!options.silent) {
          toast({
            title: 'Upload failed',
            description: message,
            variant: 'destructive'
          });
        }
        return null;
      } finally {
        setHeaderUploadLoading(false);
      }
    },
    [form.headerType, handleChange]
  );

  const headerPreviewLabel = useMemo(() => {
    switch (form.headerType) {
      case 'TEXT':
        return form.headerText.trim() || 'Header text';
      case 'IMAGE':
        return headerPreviewUrl ? 'Image preview' : 'Image header';
      case 'VIDEO':
        return 'Video header';
      case 'DOCUMENT':
        return 'Document header';
      default:
        return '';
    }
  }, [form.headerType, form.headerText, headerPreviewUrl]);

  const showImagePreview = form.headerType === 'IMAGE' && Boolean(headerPreviewUrl);
  const isStandardButtonType = form.buttonType === 'Copy Code, URL, Quick Replies etc';
  const isSendProductsButtonType = form.buttonType === 'Send Products';
  const isLimitedTimeOfferButtonType = form.buttonType === 'Limited Time Offer';
  const isCarouselButtonType = form.buttonType === 'Carousel';
  const isNoButtonType = form.buttonType === 'None';
  const isAdvancedButtonType =
    !isStandardButtonType &&
    !isNoButtonType &&
    !isSendProductsButtonType &&
    !isLimitedTimeOfferButtonType &&
    !isCarouselButtonType;
  const bodyCharacterCount = form.bodyText.length;
  const footerCharacterCount = form.footerText.length;
  const couponButtons = getButtonsBySubType('COUPON_CODE');
  const websiteButtons = getButtonsBySubType('WEBSITE_URL');
  const phoneButtons = getButtonsBySubType('PHONE_NUMBER');
  const quickReplyButtons = getButtonsBySubType('QUICK_REPLY');
  const totalStandardButtons = couponButtons.length + websiteButtons.length + phoneButtons.length + quickReplyButtons.length;
  const ctaButtonsCount = websiteButtons.length + phoneButtons.length;
  const hasCopyCodeButton = couponButtons.length > 0;
  const hasQuickReplyButtons = quickReplyButtons.length > 0;
  const hasCtaButtons = ctaButtonsCount > 0;
  const canAddCopyCodeButton = !hasQuickReplyButtons && phoneButtons.length === 0 && couponButtons.length < MAX_COPY_CODE_BUTTONS;
  const canAddUrlButton =
    !hasQuickReplyButtons &&
    (hasCopyCodeButton ? websiteButtons.length < 1 : ctaButtonsCount < MAX_CTA_BUTTONS);
  const canAddPhoneButton = !hasQuickReplyButtons && !hasCopyCodeButton && ctaButtonsCount < MAX_CTA_BUTTONS;
  const canAddQuickReplyButton =
    !hasCopyCodeButton && !hasCtaButtons && quickReplyButtons.length < MAX_QUICK_REPLY_BUTTONS;
  const disableNameField = isEditMode && editContext === 'custom';
  const disableLanguageField = !isEditMode || editContext !== null;
  const isSaving = isSubmitting || isBusy;
  const actionDisabled = isSaving || headerUploadLoading;
  const ltoUrlWithUtm = useMemo(
    () =>
      buildUrlWithUtmParameters(form.ltoUrl, {
        source: form.ltoUtmSource,
        medium: form.ltoUtmMedium,
        campaign: form.ltoUtmCampaign,
        term: form.ltoUtmTerm,
        content: form.ltoUtmContent
      }),
    [
      form.ltoUrl,
      form.ltoUtmSource,
      form.ltoUtmMedium,
      form.ltoUtmCampaign,
      form.ltoUtmTerm,
      form.ltoUtmContent
    ]
  );
  const modalTitle = isEditMode ? 'Edit Template' : 'Create Template Draft';
  const modalSubtitle = isEditMode
    ? 'Update your template content and keep Meta in sync.'
    : 'Provide the required fields and preview content before submitting to Meta.';
  const submitLabel = isEditMode
    ? isSaving
      ? 'Saving…'
      : 'Save Changes'
    : isSaving
    ? 'Submitting…'
    : 'Create Template Draft';

  const validateCarouselCards = useCallback(() => {
    if (form.carouselCards.length < CAROUSEL_MIN_CARDS || form.carouselCards.length > CAROUSEL_MAX_CARDS) {
      return `Carousel templates require between ${CAROUSEL_MIN_CARDS} and ${CAROUSEL_MAX_CARDS} cards.`;
    }
    const baseSignature = form.carouselCards[0]?.buttons?.map(button => button.type).join('|') || '';

    for (const [index, card] of form.carouselCards.entries()) {
      if (!card.mediaHandle.trim()) {
        return `Card ${index + 1} is missing header media.`;
      }
      if (!card.bodyText.trim()) {
        return `Card ${index + 1} is missing body text.`;
      }
      if (card.bodyText.trim().length > CAROUSEL_CARD_BODY_MAX_LENGTH) {
        return `Card ${index + 1} body text cannot exceed ${CAROUSEL_CARD_BODY_MAX_LENGTH} characters.`;
      }
      if (!Array.isArray(card.buttons) || card.buttons.length < 1) {
        return `Card ${index + 1} must include at least one button.`;
      }
      if (card.buttons.length > 2) {
        return `Card ${index + 1} cannot have more than 2 buttons.`;
      }
      const cardSignature = card.buttons.map(button => button.type).join('|');
      if (baseSignature && cardSignature !== baseSignature) {
        return `Card ${index + 1} must match button type and order across all cards.`;
      }

      for (const [buttonIndex, button] of card.buttons.entries()) {
        if (!button.text.trim()) {
          return `Card ${index + 1}, button ${buttonIndex + 1} is missing label text.`;
        }
        if (button.text.trim().length > CAROUSEL_BUTTON_LABEL_MAX_LENGTH) {
          return `Card ${index + 1}, button ${buttonIndex + 1} label cannot exceed ${CAROUSEL_BUTTON_LABEL_MAX_LENGTH} characters.`;
        }
        if (button.type === 'URL' && !button.url?.trim()) {
          return `Card ${index + 1}, button ${buttonIndex + 1} is missing a URL.`;
        }
        if (button.type === 'PHONE_NUMBER' && !button.phoneNumber?.trim()) {
          return `Card ${index + 1}, button ${buttonIndex + 1} is missing a phone number.`;
        }
      }
    }

    return null;
  }, [form.carouselCards]);

  const getStandardButtonValidationError = useCallback(() => {
    if (totalStandardButtons > MAX_STANDARD_BUTTONS) {
      return 'You can add up to 10 buttons in total.';
    }
    if (couponButtons.length > MAX_COPY_CODE_BUTTONS) {
      return 'Only one Copy Code button is allowed.';
    }
    if (quickReplyButtons.length > MAX_QUICK_REPLY_BUTTONS) {
      return 'You can add up to 3 Quick Replies.';
    }
    if (ctaButtonsCount > MAX_CTA_BUTTONS) {
      return 'You can add up to 2 CTA buttons across URL and Phone.';
    }
    if (hasCopyCodeButton && phoneButtons.length > 0) {
      return 'Copy Code cannot be combined with Phone buttons.';
    }
    if (hasCopyCodeButton && quickReplyButtons.length > 0) {
      return 'Copy Code cannot be combined with Quick Replies.';
    }
    if (hasCopyCodeButton && websiteButtons.length > 1) {
      return 'Only one URL button is allowed when Copy Code is selected.';
    }
    if (hasQuickReplyButtons && (hasCopyCodeButton || ctaButtonsCount > 0)) {
      return 'Quick Replies cannot be combined with Copy Code, URL, or Phone buttons.';
    }
    return null;
  }, [
    ctaButtonsCount,
    couponButtons.length,
    hasCopyCodeButton,
    hasQuickReplyButtons,
    phoneButtons.length,
    quickReplyButtons.length,
    totalStandardButtons,
    websiteButtons.length
  ]);

  const showButtonValidationWarning = useCallback((message: string) => {
    setButtonRuleWarning(message);
    toast({
      title: 'Invalid button combination',
      description: message,
      variant: 'destructive'
    });
  }, []);

  const tryAddButtonBySubType = useCallback(
    (subType: TemplateButtonSubType) => {
      if (totalStandardButtons >= MAX_STANDARD_BUTTONS) {
        showButtonValidationWarning('You can add up to 10 buttons in total.');
        return;
      }

      if (subType === 'COUPON_CODE') {
        if (hasQuickReplyButtons) {
          showButtonValidationWarning('Copy Code cannot be combined with Quick Replies.');
          return;
        }
        if (phoneButtons.length > 0) {
          showButtonValidationWarning('Copy Code cannot be combined with Phone buttons.');
          return;
        }
        if (couponButtons.length >= MAX_COPY_CODE_BUTTONS) {
          showButtonValidationWarning('Only one Copy Code button is allowed.');
          return;
        }
      }

      if (subType === 'WEBSITE_URL') {
        if (hasQuickReplyButtons) {
          showButtonValidationWarning('URL buttons cannot be combined with Quick Replies.');
          return;
        }
        if (hasCopyCodeButton && websiteButtons.length >= 1) {
          showButtonValidationWarning('Only one URL button is allowed when Copy Code is selected.');
          return;
        }
        if (!hasCopyCodeButton && ctaButtonsCount >= MAX_CTA_BUTTONS) {
          showButtonValidationWarning('You can add up to 2 CTA buttons across URL and Phone.');
          return;
        }
      }

      if (subType === 'PHONE_NUMBER') {
        if (hasQuickReplyButtons) {
          showButtonValidationWarning('Phone buttons cannot be combined with Quick Replies.');
          return;
        }
        if (hasCopyCodeButton) {
          showButtonValidationWarning('Phone buttons cannot be combined with Copy Code.');
          return;
        }
        if (ctaButtonsCount >= MAX_CTA_BUTTONS) {
          showButtonValidationWarning('You can add up to 2 CTA buttons across URL and Phone.');
          return;
        }
      }

      if (subType === 'QUICK_REPLY') {
        if (hasCopyCodeButton || hasCtaButtons) {
          showButtonValidationWarning('Quick Replies cannot be combined with Copy Code, URL, or Phone buttons.');
          return;
        }
        if (quickReplyButtons.length >= MAX_QUICK_REPLY_BUTTONS) {
          showButtonValidationWarning('You can add up to 3 Quick Replies.');
          return;
        }
      }

      setButtonRuleWarning(null);
      addButtonBySubType(subType);
    },
    [
      addButtonBySubType,
      ctaButtonsCount,
      couponButtons.length,
      hasCopyCodeButton,
      hasCtaButtons,
      hasQuickReplyButtons,
      phoneButtons.length,
      quickReplyButtons.length,
      showButtonValidationWarning,
      totalStandardButtons,
      websiteButtons.length
    ]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || isBusy) return;

    if (!form.name.trim() || !form.bodyText.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Template name and body are required.',
        variant: 'destructive'
      });
      return;
    }

    if (!form.category) {
      toast({
        title: 'Category required',
        description: 'Please choose a template category.',
        variant: 'destructive'
      });
      return;
    }

    if ((isLimitedTimeOfferButtonType || isCarouselButtonType) && form.category !== 'MARKETING') {
      toast({
        title: 'Marketing category required',
        description: `${isCarouselButtonType ? 'Carousel' : 'Limited Time Offer'} templates must use the MARKETING category.`,
        variant: 'destructive'
      });
      return;
    }

    if (form.headerType === 'TEXT' && !form.headerText.trim()) {
      toast({
        title: 'Header text required',
        description: 'Provide header text or switch the header type to image.',
        variant: 'destructive'
      });
      return;
    }

    if (
      (form.headerType === 'IMAGE' || form.headerType === 'VIDEO' || form.headerType === 'DOCUMENT') &&
      !form.headerMediaHandle.trim()
    ) {
      toast({
        title: 'Header media handle required',
        description: 'Provide the uploaded media handle for the header.',
        variant: 'destructive'
      });
      return;
    }

    if (isStandardButtonType) {
      const buttonValidationError = getStandardButtonValidationError();
      if (buttonValidationError) {
        toast({
          title: 'Invalid button combination',
          description: buttonValidationError,
          variant: 'destructive'
        });
        return;
      }

      const invalidButton = form.buttons.find(button => {
        if (!button.text.trim()) return true;
        if (button.type === 'URL' && !button.url?.trim()) return true;
        if (button.type === 'PHONE_NUMBER' && !button.phoneNumber?.trim()) return true;
        return false;
      });

      if (invalidButton) {
        toast({
          title: 'Incomplete button details',
          description: 'Each button needs text and any required URL or phone number.',
          variant: 'destructive'
        });
        return;
      }
    }

    if (isLimitedTimeOfferButtonType) {
      if (!form.ltoOfferHeading.trim()) {
        toast({
          title: 'Offer heading required',
          description: 'Add the Limited Time Offer heading text.',
          variant: 'destructive'
        });
        return;
      }

      if (!form.ltoOfferCode.trim()) {
        toast({
          title: 'Offer code required',
          description: 'Add the Limited Time Offer code.',
          variant: 'destructive'
        });
        return;
      }

      if (!form.ltoUrl.trim()) {
        toast({
          title: 'Offer URL required',
          description: 'Add the destination URL for the Limited Time Offer button.',
          variant: 'destructive'
        });
        return;
      }

      if (!form.ltoButtonLabel.trim()) {
        toast({
          title: 'Button label required',
          description: 'Add the CTA label for the Limited Time Offer button.',
          variant: 'destructive'
        });
        return;
      }
    }

    if (isCarouselButtonType) {
      const carouselValidationError = validateCarouselCards();
      if (carouselValidationError) {
        toast({
          title: 'Carousel validation failed',
          description: carouselValidationError,
          variant: 'destructive'
        });
        return;
      }
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const components: any[] = [];
      const mediaPreviewUrl = form.headerType === 'IMAGE' ? headerPreviewUrl || undefined : undefined;
      const placeholderKeys = placeholderNumberKeys;
      const orderedBodyExampleValues = placeholderKeys.map(
        key => (form.bodyExampleMap[key] || '').trim()
      );
      const sanitizedBodyExampleValues = orderedBodyExampleValues.filter(value => value.length > 0);
      const bodyExampleTextValue =
        sanitizedBodyExampleValues.length > 0 ? sanitizedBodyExampleValues.join(', ') : undefined;

      if (!isCarouselButtonType && form.headerType !== 'NONE') {
        const headerComponent: any = {
          type: 'HEADER',
          format: form.headerType
        };

        if (form.headerType === 'TEXT') {
          headerComponent.text = form.headerText.trim();
          if (form.headerExampleText.trim()) {
            headerComponent.example = {
              header_text: [form.headerExampleText.trim()]
            };
          }
        } else if (form.headerMediaHandle.trim()) {
          headerComponent.example = {
            header_handle: [form.headerMediaHandle.trim()]
          };
        }

        components.push(headerComponent);
      }

      const normalizedBody = normalizePlaceholders(form.bodyText.trim());
      const variableValuesInput =
        detectedPlaceholders.length > 0
          ? detectedPlaceholders.map(v => `{{${v}}}`)
          : normalizedBody.order;
      const orderedVariables = reorderVariables(
        normalizedBody.order.length ? normalizedBody.order : variableValuesInput,
        variableValuesInput
      );

      const bodyComponent: any = {
        type: 'BODY',
        text: normalizedBody.text
      };

      if (sanitizedBodyExampleValues.length > 0) {
        bodyComponent.example = {
          body_text: [sanitizedBodyExampleValues]
        };
      }

      components.push(bodyComponent);

      if (!isLimitedTimeOfferButtonType && !isCarouselButtonType && form.footerText.trim()) {
        const footerComponent: any = {
          type: 'FOOTER',
          text: form.footerText.trim()
        };
        if (form.footerExample.trim()) {
          footerComponent.example = {
            footer_text: [form.footerExample.trim()]
          };
        }
        components.push(footerComponent);
      }

      if (isStandardButtonType && form.buttons.length > 0) {
        const buttonsForApi = form.buttons.map(button => {
          const base = {
            type: button.type,
            text: button.text.trim()
          } as any;

          if (button.type === 'URL') {
            base.url = button.url?.trim();
            if (button.example?.trim()) {
              base.example = [button.example.trim()];
            }
          }

          if (button.type === 'PHONE_NUMBER') {
            const rawPhone = button.phoneNumber?.trim() || '';
            const cc = (button.countryCode || '').trim();
            base.phone_number = rawPhone && cc ? `${cc}${rawPhone}` : rawPhone;
          }

          return base;
        });

        components.push({
          type: 'BUTTONS',
          buttons: buttonsForApi
        });
      }

      if (isLimitedTimeOfferButtonType) {
        const offerHeading = form.ltoOfferHeading.trim();
        const offerCode = form.ltoOfferCode.trim();
        const buttonLabel = form.ltoButtonLabel.trim();
        const destinationUrl = ltoUrlWithUtm.trim() || form.ltoUrl.trim();

        components.push({
          type: 'LIMITED_TIME_OFFER',
          limited_time_offer: {
            text: offerHeading,
            has_expiration: false
          }
        });
        components.push({
          type: 'BUTTONS',
          buttons: [
            {
              type: 'copy_code',
              example: offerCode
            },
            {
              type: 'URL',
              text: buttonLabel,
              url: destinationUrl
            }
          ]
        });
      }

      if (isCarouselButtonType) {
        components.push({
          type: 'CAROUSEL',
          cards: form.carouselCards.map(card => ({
            components: [
              {
                type: 'HEADER',
                format: form.carouselMediaType,
                example: {
                  header_handle: [card.mediaHandle.trim()]
                }
              },
              {
                type: 'BODY',
                text: card.bodyText.trim()
              },
              {
                type: 'BUTTONS',
                buttons: card.buttons.map(button => {
                  if (button.type === 'URL') {
                    const urlWithUtm = buildUrlWithUtmParameters(button.url || '', {
                      source: button.utmSource || '',
                      medium: button.utmMedium || '',
                      campaign: button.utmCampaign || '',
                      term: button.utmTerm || '',
                      content: button.utmContent || ''
                    });
                    return {
                      type: 'URL',
                      text: button.text.trim(),
                      url: urlWithUtm.trim() || button.url?.trim() || ''
                    };
                  }
                  if (button.type === 'PHONE_NUMBER') {
                    const rawPhone = button.phoneNumber?.trim() || '';
                    const cc = (button.countryCode || '').trim();
                    return {
                      type: 'PHONE_NUMBER',
                      text: button.text.trim(),
                      phone_number: rawPhone && cc ? `${cc}${rawPhone}` : rawPhone
                    };
                  }
                  return {
                    type: 'QUICK_REPLY',
                    text: button.text.trim()
                  };
                })
              }
            ]
          }))
        });
      }

      const normalizedCategory =
        isLimitedTimeOfferButtonType || isCarouselButtonType ? 'MARKETING' : form.category;
      const headerExamples =
        form.headerType === 'TEXT' && form.headerExampleText.trim()
          ? [form.headerExampleText.trim()]
          : undefined;
      const footerExamples =
        !isLimitedTimeOfferButtonType && form.footerExample.trim()
          ? [form.footerExample.trim()]
          : undefined;
      const examplesPayload =
        headerExamples || footerExamples || bodyExampleTextValue
          ? {
              ...(headerExamples ? { headerText: headerExamples } : {}),
              ...(footerExamples ? { footerText: footerExamples } : {}),
              ...(bodyExampleTextValue ? { body: [bodyExampleTextValue] } : {})
            }
          : undefined;

      const templatePayload: TemplateEditFormData = {
        name: form.name.trim(),
        category: normalizedCategory,
        buttonType: form.buttonType,
        language: form.language.trim() || 'en_US',
        headerType: form.headerType,
        headerText:
          !isCarouselButtonType && form.headerType === 'TEXT' ? form.headerText.trim() : undefined,
        headerImageUrl:
          !isCarouselButtonType && form.headerType === 'IMAGE' ? form.headerMediaHandle.trim() : undefined,
        headerVideoUrl:
          !isCarouselButtonType && form.headerType === 'VIDEO' ? form.headerMediaHandle.trim() : undefined,
        headerDocumentUrl:
          !isCarouselButtonType && form.headerType === 'DOCUMENT' ? form.headerMediaHandle.trim() : undefined,
        bodyText: normalizedBody.text,
        footerText:
          isLimitedTimeOfferButtonType || isCarouselButtonType
            ? undefined
            : form.footerText.trim() || undefined,
        buttons:
          isStandardButtonType && form.buttons.length > 0
            ? form.buttons.map(button => ({
                type: button.type,
                text: button.text.trim(),
                url: button.type === 'URL' ? button.url?.trim() : undefined,
                phone_number:
                  button.type === 'PHONE_NUMBER'
                    ? (() => {
                        const rawPhone = button.phoneNumber?.trim() || '';
                        const cc = (button.countryCode || '').trim();
                        return rawPhone && cc ? `${cc}${rawPhone}` : rawPhone || undefined;
                      })()
                    : undefined
              }))
            : undefined,
        variables: orderedVariables.map(variable => variable.trim()),
        previewImageUrl: mediaPreviewUrl,
        headerExampleText: form.headerExampleText.trim() || undefined,
        footerExampleText:
          isLimitedTimeOfferButtonType || isCarouselButtonType
            ? undefined
            : form.footerExample.trim() || undefined,
        bodyExampleText: bodyExampleTextValue,
        limitedTimeOffer: isLimitedTimeOfferButtonType
          ? {
              offerHeading: form.ltoOfferHeading.trim(),
              offerCode: form.ltoOfferCode.trim(),
              urlType: form.ltoUrlType,
              url: ltoUrlWithUtm.trim() || form.ltoUrl.trim(),
              buttonLabel: form.ltoButtonLabel.trim(),
              addUtmParameters: form.ltoShowUtmBuilder,
              utmSource: form.ltoUtmSource.trim() || undefined,
              utmMedium: form.ltoUtmMedium.trim() || undefined,
              utmCampaign: form.ltoUtmCampaign.trim() || undefined,
              utmTerm: form.ltoUtmTerm.trim() || undefined,
              utmContent: form.ltoUtmContent.trim() || undefined
            }
          : undefined,
        carousel: isCarouselButtonType
          ? {
              mediaType: form.carouselMediaType,
              buttonLayout: deriveCarouselButtonLayout(form.carouselCards),
              cards: form.carouselCards.map(card => ({
                id: card.id,
                mediaHandle: card.mediaHandle.trim(),
                mediaUrl: card.mediaPreviewUrl || undefined,
                bodyText: card.bodyText.trim(),
                buttons: card.buttons.map(button => ({
                  type: button.type,
                  text: button.text.trim(),
                  url: button.type === 'URL' ? button.url?.trim() : undefined,
                  urlType: button.type === 'URL' ? button.urlType || 'Static' : undefined,
                  phone_number:
                    button.type === 'PHONE_NUMBER'
                      ? `${(button.countryCode || '').trim()}${button.phoneNumber?.trim() || ''}` || undefined
                      : undefined,
                  utmSource: button.utmSource?.trim() || undefined,
                  utmMedium: button.utmMedium?.trim() || undefined,
                  utmCampaign: button.utmCampaign?.trim() || undefined,
                  utmTerm: button.utmTerm?.trim() || undefined,
                  utmContent: button.utmContent?.trim() || undefined
                }))
              }))
            }
          : undefined
      };

      if (onSubmit) {
        await onSubmit(templatePayload);
        return;
      }

      const payload = {
        name: form.name.trim(),
        category: normalizedCategory,
        buttonType: form.buttonType,
        language: form.language.trim() || 'en_US',
        components,
        ...(mediaPreviewUrl ? { previewImageUrl: mediaPreviewUrl } : {})
      };

      const response = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create template');
      }

      const createRequest: CreateTemplateRequest = {
        name: form.name.trim(),
        category: normalizedCategory,
        buttonType: form.buttonType,
        language: form.language.trim() || 'en_US',
        headerType: form.headerType === 'NONE' ? undefined : form.headerType,
        headerText:
          !isCarouselButtonType && form.headerType === 'TEXT' ? form.headerText.trim() : undefined,
        headerImageUrl:
          !isCarouselButtonType && form.headerType === 'IMAGE' ? form.headerMediaHandle.trim() : undefined,
        headerVideoUrl:
          !isCarouselButtonType && form.headerType === 'VIDEO' ? form.headerMediaHandle.trim() : undefined,
        headerDocumentUrl:
          !isCarouselButtonType && form.headerType === 'DOCUMENT' ? form.headerMediaHandle.trim() : undefined,
        bodyText: normalizedBody.text,
        footerText:
          isLimitedTimeOfferButtonType || isCarouselButtonType
            ? undefined
            : form.footerText.trim() || undefined,
        buttons: templatePayload.buttons,
        variables: orderedVariables.map(variable => variable.trim()),
        examples: examplesPayload,
        limitedTimeOffer: templatePayload.limitedTimeOffer,
        carousel: templatePayload.carousel
      };

      if (onStoreTemplateDraft) {
        await onStoreTemplateDraft(createRequest);
      }

      if (onMetaTemplateCreated) {
        await onMetaTemplateCreated();
      }

      toast({
        title: 'Template created',
        description: 'Template draft saved successfully.'
      });

      onClose();
    } catch (error: any) {
      const message = error?.message || 'Unable to create template';
      setSubmissionError(humanizeErrorMessage(message));
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

    if (!open) {
    return null;
  }

  return (
    <div className="fixed right-0 left-0 bottom-0 top-16 z-30 bg-[#f4f6f8] lg:left-16" role="presentation">
      <form role="dialog" aria-modal="true" className="flex h-full flex-col overflow-hidden" onSubmit={handleSubmit}>
        <div className="relative flex h-16 shrink-0 items-center border-b border-[#d9dee5] bg-white px-6">
          <div className="flex min-w-0 items-center gap-3 pr-72 text-slate-900">
            <button
              type="button"
              className="rounded p-1 hover:bg-slate-100"
              onClick={onClose}
              disabled={actionDisabled}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-xl font-medium leading-6">Create New Template</span>
            <span className="text-slate-300">|</span>
            <span className="text-lg">WhatsApp</span>
          </div>

          <a
            href="#"
            onClick={event => event.preventDefault()}
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 text-sm font-medium text-[#356ae6] xl:flex"
          >
            Best practices for creating WhatsApp templates
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <div className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={actionDisabled}
              className="rounded-md border border-[#24a37d] bg-white px-6 py-2 text-lg font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionDisabled}
              className="inline-flex min-w-28 items-center justify-center gap-2 rounded-md bg-[#26a87d] px-6 py-2 text-lg font-semibold text-white hover:bg-[#229872] disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSaving ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>

        {submissionError && (
          <div className="mx-6 mt-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-semibold">Submission blocked</p>
              <p>{submissionError}</p>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollContainerRef}>
          <div className="space-y-5 px-6 pb-6 pt-8">
            <div className="grid gap-5 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium leading-5 text-slate-900">Template Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={event => handleChange('name', event.target.value)}
                  placeholder="Enter template name...."
                  className="mt-2 h-11 w-full rounded border border-[#cfd6df] bg-white px-4 text-sm text-slate-900 outline-none focus:border-[#8ea4d7]"
                  required
                  disabled={disableNameField}
                />
              </div>

              <div>
                <label className="block text-sm font-medium leading-5 text-slate-900">Category</label>
                <select
                  value={form.category}
                  onChange={event =>
                    handleChange(
                      'category',
                      event.target.value
                        ? (event.target.value as TemplateCategoryValue)
                        : ''
                    )
                  }
                  className="mt-2 h-11 w-full rounded border border-[#cfd6df] bg-white px-4 text-sm text-slate-900 outline-none focus:border-[#8ea4d7]"
                >
                  <option value="">Choose Category</option>
                  {TEMPLATE_CATEGORY_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

                <div className="relative" ref={buttonTypeDropdownRef}>
                <label className="block text-sm font-medium leading-5 text-slate-900">Button Type(Optional)</label>
                <button
                  type="button"
                  onClick={() => setButtonTypeDropdownOpen(prev => !prev)}
                  className="mt-2 flex h-11 w-full items-center justify-between rounded border border-[#cfd6df] bg-white px-4 text-sm text-slate-900"
                >
                  <span>{form.buttonType}</span>
                  <ChevronDown className="h-4 w-4 text-slate-600" />
                </button>
                {buttonTypeDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded border border-[#cfd6df] bg-white shadow">
                    {TEMPLATE_BUTTON_TYPE_OPTIONS.map(option => {
                      const selected = option === form.buttonType;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            handleChange('buttonType', option as TemplateButtonTypeValue);
                            if (option === 'Limited Time Offer' || option === 'Carousel') {
                              handleChange('category', 'MARKETING');
                            }
                            if (option === 'Carousel') {
                              handleChange('headerType', 'NONE');
                              handleChange('headerText', '');
                              handleChange('headerMediaHandle', '');
                              handleChange('headerExampleText', '');
                            }
                            setButtonTypeDropdownOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-800 opacity-100 hover:bg-[#f6f8fb] hover:text-slate-900',
                            selected && 'bg-[#eef8f3] text-[#248d61]'
                          )}
                        >
                          <span>{option}</span>
                          {selected ? <Check className="h-4 w-4 text-[#248d61]" /> : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-base font-semibold leading-6 text-slate-900">Template(s)</p>
              <div className="mt-3 flex items-center gap-4 border-b border-[#d7dde6] pb-2">
                <button type="button" className="border-b-2 border-[#356ae6] px-5 pb-2 text-sm font-medium text-[#356ae6]">
                  English
                </button>
                <button type="button" className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#55a278] px-4 py-1 text-sm text-[#1f7f50]">
                  <Plus className="h-3 w-3" /> English <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(380px,1fr)]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold leading-8 text-slate-900">Template for English language</h3>
                  <button type="button" className="rounded-md bg-[#2f8f58] px-6 py-2 text-sm font-semibold text-white hover:bg-[#287c4c]">
                    Add Sample
                  </button>
                </div>

                <section className="rounded-md border border-[#d3dae4] bg-white p-4">
                  <h4 className="text-base font-semibold leading-6 text-slate-900">Header (Optional)</h4>
                  <p className="mt-1 text-sm leading-5 text-slate-700">
                    {isCarouselButtonType
                      ? 'Carousel templates use media inside each card, so the standard template header is disabled.'
                      : 'Add a title, or, select the media type you want to get approved for this template&apos;s header'}
                  </p>
                  {isCarouselButtonType ? null : (
                    <>
                      <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-slate-900">
                        {[
                          { value: 'NONE' as TemplateHeaderType, label: 'None' },
                          { value: 'TEXT' as TemplateHeaderType, label: 'Text' },
                          { value: 'IMAGE' as TemplateHeaderType, label: 'Image' }
                        ].map(option => (
                          <label key={option.value} className="inline-flex cursor-pointer items-center gap-2">
                            <input
                              type="radio"
                              checked={form.headerType === option.value}
                              onChange={() => {
                                handleChange('headerType', option.value);
                                if (option.value === 'TEXT') {
                                  handleChange('headerMediaHandle', '');
                                } else if (option.value === 'NONE') {
                                  handleChange('headerMediaHandle', '');
                                  handleChange('headerText', '');
                                  handleChange('headerExampleText', '');
                                } else {
                                  handleChange('headerText', '');
                                  handleChange('headerExampleText', '');
                                }
                              }}
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>

                      {form.headerType === 'TEXT' && (
                        <div className="mt-4">
                          <input
                            type="text"
                            value={form.headerText}
                            onChange={event => handleChange('headerText', event.target.value)}
                            placeholder="Header text"
                            className="h-11 w-full rounded border border-[#cfd6df] px-3 text-sm"
                          />
                        </div>
                      )}

                      {form.headerType === 'IMAGE' && (
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <label className="inline-flex cursor-pointer items-center rounded-md bg-[#2f8f58] px-4 py-2 text-sm font-semibold text-white hover:bg-[#287c4c]">
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                className="hidden"
                                onChange={async event => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;
                                  await uploadHeaderMediaFile(file);
                                  event.currentTarget.value = '';
                                }}
                              />
                              Choose JPG or PNG file
                            </label>
                            <span className="text-sm text-slate-500">{headerSelectedFileName}</span>
                          </div>
                          <p className="text-sm leading-6 text-slate-800">
                            This media file will be sent as a sample to WhatsApp, for approval. At the time of sending the template, you can change the media file, if required. You can also send separate media files for each customer in a campaign.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </section>

                <section className="rounded-md border border-[#d3dae4] bg-white p-4">
                  <h4 className="text-base font-semibold leading-6 text-slate-900">Body</h4>
                  <p className="mt-1 text-sm leading-5 text-slate-700">
                    The Whatsapp message in the language you have selected
                  </p>
                  <textarea
                    value={form.bodyText}
                    onChange={event => handleChange('bodyText', event.target.value)}
                    rows={6}
                    required
                    className="mt-3 w-full rounded border border-[#cfd6df] px-3 py-3 text-sm text-slate-900 outline-none focus:border-[#8ea4d7]"
                  />
                  <div className="mt-2 text-right text-xs text-slate-500">{bodyCharacterCount}/1024</div>
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleInsertNamePlaceholder}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#2f9a69]"
                    >
                      <Plus className="h-4 w-4" />
                      Add variable
                    </button>
                  </div>

                  {placeholderNumberKeys.length > 0 && (
                    <div className="mt-4 space-y-2 rounded border border-dashed border-[#cfd6df] bg-[#fbfcfe] p-3">
                      {placeholderNumberKeys.map((key, index) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-20 text-xs font-semibold text-slate-700">{`{{${index + 1}}}`}</span>
                          <input
                            type="text"
                            value={form.bodyExampleMap[key] || ''}
                            onChange={event => updateBodyExampleValue(key, event.target.value)}
                            className="h-9 flex-1 rounded border border-[#cfd6df] px-3 text-sm"
                            placeholder="Sample value"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-md border border-[#d3dae4] bg-white p-4">
                  <h4 className="text-sm font-semibold leading-5 text-slate-900">
                    {isLimitedTimeOfferButtonType || isCarouselButtonType ? 'Footer unavailable' : 'Footer (Optional)'}
                  </h4>
                  <p className="mt-1 text-sm leading-5 text-slate-700">
                    {isLimitedTimeOfferButtonType || isCarouselButtonType
                      ? `Footer is not supported for ${isCarouselButtonType ? 'Carousel' : 'Limited Time Offer'} templates.`
                      : 'Add a short line of text to the bottom of your message template.'}
                  </p>
                  {!isLimitedTimeOfferButtonType && !isCarouselButtonType ? (
                    <>
                      <input
                        type="text"
                        value={form.footerText}
                        onChange={event => handleChange('footerText', event.target.value)}
                        className="mt-3 h-11 w-full rounded border border-[#cfd6df] px-3 text-sm"
                        placeholder="T&C apply"
                      />
                      <div className="mt-2 text-right text-xs text-slate-500">{footerCharacterCount}/60</div>
                    </>
                  ) : (
                    <div className="mt-2" />
                  )}
                </section>

                {isStandardButtonType && (
                  <section className="rounded-md border border-[#d3dae4] bg-white p-4">
                    <h4 className="text-base font-semibold leading-6 text-slate-900">Copy Code, URL, Quick Replies etc</h4>
                    <p className="mt-1 text-sm text-slate-700">
                      Create buttons that let customers respond to your message or take action.
                    </p>
                    <div className="mt-4 flex items-center justify-between rounded border border-dashed border-[#cfd6df] bg-[#f8fafc] px-4 py-3 text-sm text-slate-700">
                      <span>
                        Total buttons: 10 max. Quick Replies: 3 max. CTA buttons: 2 max. Copy Code: 1 max.
                        <button type="button" className="ml-2 text-[#356ae6]">
                          Learn More
                        </button>
                      </span>
                      <span className="font-medium text-slate-900">{totalStandardButtons}/10</span>
                    </div>
                    {buttonRuleWarning && (
                      <div className="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        {buttonRuleWarning}
                      </div>
                    )}

                    <div className="mt-4 space-y-5">
                      <div>
                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <input
                            type="checkbox"
                            checked={couponButtons.length > 0}
                            disabled={couponButtons.length === 0 && (!canAddCopyCodeButton || totalStandardButtons >= MAX_STANDARD_BUTTONS)}
                            onChange={event => {
                              if (event.target.checked) {
                                tryAddButtonBySubType('COUPON_CODE');
                              } else {
                                setButtonRuleWarning(null);
                                couponButtons.forEach(button => removeButtonById(button.id));
                              }
                            }}
                          />
                          Add Coupon Code
                        </label>
                        {!canAddCopyCodeButton && couponButtons.length === 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            Copy Code disables Phone and Quick Reply buttons.
                          </p>
                        )}
                        {couponButtons.map(button => (
                          <div key={button.id} className="mt-2 grid gap-2 md:grid-cols-[220px_minmax(0,1fr)]">
                            <input
                              value="Copy Code"
                              disabled
                              className="h-10 rounded border border-[#cfd6df] bg-[#eef2f7] px-3 text-sm text-slate-600"
                            />
                            <div className="relative">
                              <input
                                value={button.example || ''}
                                onChange={event => upsertButton(button.id, { example: event.target.value.slice(0, 15) })}
                                placeholder="Enter text for coupon code"
                                className="h-10 w-full rounded border border-[#cfd6df] px-3 pr-12 text-sm"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                                {(button.example || '').length}/15
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <input
                            type="checkbox"
                            checked={websiteButtons.length > 0}
                            disabled={websiteButtons.length === 0 && (!canAddUrlButton || totalStandardButtons >= MAX_STANDARD_BUTTONS)}
                            onChange={event => {
                              if (event.target.checked) {
                                if (websiteButtons.length === 0) tryAddButtonBySubType('WEBSITE_URL');
                              } else {
                                setButtonRuleWarning(null);
                                websiteButtons.forEach(button => removeButtonById(button.id));
                              }
                            }}
                          />
                          Add Website URL
                        </label>
                        {!canAddUrlButton && websiteButtons.length === 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            {hasQuickReplyButtons
                              ? 'URL buttons cannot be combined with Quick Replies.'
                              : 'Only one URL button is allowed when Copy Code is selected.'}
                          </p>
                        )}
                        <div className="mt-2 space-y-3">
                          {websiteButtons.map(button => (
                            <div key={button.id} className="space-y-2 rounded border border-[#d7dde6] p-3">
                              <div className="grid gap-2 md:grid-cols-[160px_minmax(0,1fr)]">
                                <select
                                  value={button.urlMode || 'Static'}
                                  onChange={event => upsertButton(button.id, { urlMode: event.target.value as 'Static' })}
                                  className="h-10 rounded border border-[#cfd6df] px-3 text-sm"
                                >
                                  <option value="Static">Static</option>
                                </select>
                                <div className="relative">
                                  <input
                                    value={button.url || ''}
                                    onChange={event => upsertButton(button.id, { url: event.target.value })}
                                    placeholder="Enter url, example: https://example.com/test"
                                    className="h-10 w-full rounded border border-[#cfd6df] px-3 pr-14 text-sm"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                                    {(button.url || '').length}/2000
                                  </span>
                                </div>
                              </div>
                              <button type="button" className="text-sm font-medium text-[#2f9a69]">
                                + Add UTM Parameters
                              </button>
                              <div className="flex items-center gap-2">
                                <input
                                  value={button.text || ''}
                                  onChange={event => upsertButton(button.id, { text: event.target.value.slice(0, 25) })}
                                  placeholder="Enter text for the button"
                                  className="h-10 flex-1 rounded border border-[#cfd6df] px-3 text-sm"
                                />
                                <span className="text-xs text-slate-500">{(button.text || '').length}/25</span>
                                <button type="button" onClick={() => removeButtonById(button.id)} className="text-red-500">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {websiteButtons.length > 0 && (
                            <button
                              type="button"
                              onClick={() => tryAddButtonBySubType('WEBSITE_URL')}
                              disabled={totalStandardButtons >= MAX_STANDARD_BUTTONS || !canAddUrlButton}
                              className="text-sm font-semibold text-[#2f9a69] disabled:opacity-50"
                            >
                              + Add Another Website URL
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <input
                            type="checkbox"
                            checked={phoneButtons.length > 0}
                            disabled={phoneButtons.length === 0 && (!canAddPhoneButton || totalStandardButtons >= MAX_STANDARD_BUTTONS)}
                            onChange={event => {
                              if (event.target.checked) {
                                if (phoneButtons.length === 0) tryAddButtonBySubType('PHONE_NUMBER');
                              } else {
                                setButtonRuleWarning(null);
                                phoneButtons.forEach(button => removeButtonById(button.id));
                              }
                            }}
                          />
                          Add Phone Number
                        </label>
                        {!canAddPhoneButton && phoneButtons.length === 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            {hasQuickReplyButtons
                              ? 'Phone buttons cannot be combined with Quick Replies.'
                              : 'Phone buttons cannot be used with Copy Code.'}
                          </p>
                        )}
                        <div className="mt-2 space-y-3">
                          {phoneButtons.map(button => (
                            <div key={button.id} className="space-y-2 rounded border border-[#d7dde6] p-3">
                              <div className="grid gap-2 md:grid-cols-[90px_minmax(0,1fr)]">
                                <input
                                  value={button.countryCode || '+91'}
                                  onChange={event => upsertButton(button.id, { countryCode: event.target.value })}
                                  className="h-10 rounded border border-[#cfd6df] px-3 text-sm"
                                />
                                <div className="relative">
                                  <input
                                    value={button.phoneNumber || ''}
                                    onChange={event => upsertButton(button.id, { phoneNumber: event.target.value.slice(0, 20) })}
                                    placeholder="Enter phone number"
                                    className="h-10 w-full rounded border border-[#cfd6df] px-3 pr-12 text-sm"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                                    {(button.phoneNumber || '').length}/20
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  value={button.text || ''}
                                  onChange={event => upsertButton(button.id, { text: event.target.value.slice(0, 25) })}
                                  placeholder="Enter text for the button"
                                  className="h-10 flex-1 rounded border border-[#cfd6df] px-3 text-sm"
                                />
                                <span className="text-xs text-slate-500">{(button.text || '').length}/25</span>
                                <button type="button" onClick={() => removeButtonById(button.id)} className="text-red-500">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {phoneButtons.length > 0 && (
                            <button
                              type="button"
                              onClick={() => tryAddButtonBySubType('PHONE_NUMBER')}
                              disabled={totalStandardButtons >= MAX_STANDARD_BUTTONS || !canAddPhoneButton}
                              className="text-sm font-semibold text-[#2f9a69] disabled:opacity-50"
                            >
                              + Add Another Phone Number
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <input
                            type="checkbox"
                            checked={quickReplyButtons.length > 0}
                            disabled={quickReplyButtons.length === 0 && (!canAddQuickReplyButton || totalStandardButtons >= MAX_STANDARD_BUTTONS)}
                            onChange={event => {
                              if (event.target.checked) {
                                if (quickReplyButtons.length === 0) tryAddButtonBySubType('QUICK_REPLY');
                              } else {
                                setButtonRuleWarning(null);
                                quickReplyButtons.forEach(button => removeButtonById(button.id));
                              }
                            }}
                          />
                          Add Quick Replies
                        </label>
                        {!canAddQuickReplyButton && quickReplyButtons.length === 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            Quick Replies cannot be combined with Copy Code, URL, or Phone buttons.
                          </p>
                        )}
                        <div className="mt-2 space-y-2">
                          {quickReplyButtons.map(button => (
                            <div key={button.id} className="flex items-center gap-2">
                              <input
                                value={button.text || ''}
                                onChange={event => upsertButton(button.id, { text: event.target.value.slice(0, 25) })}
                                placeholder="Enter quick reply text"
                                className="h-10 flex-1 rounded border border-[#cfd6df] px-3 text-sm"
                              />
                              <span className="text-xs text-slate-500">{(button.text || '').length}/25</span>
                              <button type="button" onClick={() => removeButtonById(button.id)} className="text-red-500">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          {quickReplyButtons.length > 0 && (
                            <button
                              type="button"
                              onClick={() => tryAddButtonBySubType('QUICK_REPLY')}
                              disabled={totalStandardButtons >= MAX_STANDARD_BUTTONS || !canAddQuickReplyButton}
                              className="text-sm font-semibold text-[#2f9a69] disabled:opacity-50"
                            >
                              + Add Another Quick Reply
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {isSendProductsButtonType && (
                  <section className="rounded-md border border-[#d3dae4] bg-white p-4">
                    <h4 className="text-base font-semibold leading-6 text-slate-900">Send Products</h4>
                    <p className="mt-1 text-sm text-slate-700">
                      Create buttons that let customers respond to your message or take action.
                    </p>
                    <div className="mt-4 rounded bg-[#eef1f5] p-4">
                      <div className="rounded border border-dashed border-[#cfd6df] bg-white px-4 py-3 text-sm font-medium text-slate-800">
                        Customise your campaign or inbox messages by selecting up to 30 products to showcase.
                      </div>
                      <div className="mt-4 space-y-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="send-products-mode"
                            checked={form.sendProductsMode === 'specific'}
                            onChange={() => handleChange('sendProductsMode', 'specific')}
                            className="h-4 w-4"
                          />
                          <span className="text-sm font-semibold text-slate-900">Send Specific Products</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="send-products-mode"
                            checked={form.sendProductsMode === 'catalog'}
                            onChange={() => handleChange('sendProductsMode', 'catalog')}
                            className="h-4 w-4"
                          />
                          <span className="text-sm font-semibold text-slate-900">Send Entire Catalog</span>
                        </label>
                      </div>
                    </div>
                  </section>
                )}

                {isLimitedTimeOfferButtonType && (
                  <section className="rounded-md border border-[#d3dae4] bg-white p-4">
                    <h4 className="text-base font-semibold leading-6 text-slate-900">Limited Time Offer</h4>
                    <p className="mt-1 text-sm text-slate-700">
                      Configure the offer details shown with your promotional CTA.
                    </p>
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Offer heading text
                          </label>
                          <span className="text-xs text-slate-500">
                            {form.ltoOfferHeading.length}/{LTO_OFFER_HEADING_MAX_LENGTH}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={form.ltoOfferHeading}
                          onChange={event => handleChange('ltoOfferHeading', event.target.value.slice(0, LTO_OFFER_HEADING_MAX_LENGTH))}
                          placeholder="Exclusive offer"
                          className="mt-2 h-11 w-full rounded border border-[#cfd6df] px-3 text-sm"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Offer code
                          </label>
                          <span className="text-xs text-slate-500">
                            {form.ltoOfferCode.length}/{LTO_OFFER_CODE_MAX_LENGTH}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={form.ltoOfferCode}
                          onChange={event => handleChange('ltoOfferCode', event.target.value.slice(0, LTO_OFFER_CODE_MAX_LENGTH).toUpperCase())}
                          placeholder="BB100"
                          className="mt-2 h-11 w-full rounded border border-[#cfd6df] px-3 text-sm uppercase"
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            URL type
                          </label>
                          <select
                            value={form.ltoUrlType}
                            onChange={event => handleChange('ltoUrlType', event.target.value as 'Static' | 'Dynamic')}
                            className="mt-2 h-11 w-full rounded border border-[#cfd6df] bg-white px-3 text-sm"
                          >
                            <option value="Static">Static</option>
                            <option value="Dynamic">Dynamic</option>
                          </select>
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              URL
                            </label>
                            <span className="text-xs text-slate-500">
                              {form.ltoUrl.length}/{LTO_URL_MAX_LENGTH}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={form.ltoUrl}
                            onChange={event => handleChange('ltoUrl', event.target.value.slice(0, LTO_URL_MAX_LENGTH))}
                            placeholder="https://www.billbox.co.in/"
                            className="mt-2 h-11 w-full rounded border border-[#cfd6df] px-3 text-sm"
                          />
                          {form.ltoUrlType === 'Dynamic' && (
                            <p className="mt-1 text-xs text-slate-500">
                              Use a Meta-supported variable in the URL if this CTA needs per-user personalization.
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => handleChange('ltoShowUtmBuilder', !form.ltoShowUtmBuilder)}
                          className="text-sm font-medium text-[#2f9a69]"
                        >
                          {form.ltoShowUtmBuilder ? 'Hide UTM Parameters' : 'Add UTM Parameters'}
                        </button>
                        {form.ltoShowUtmBuilder && (
                          <div className="mt-3 grid gap-3 rounded border border-[#d7dde6] bg-[#fbfcfe] p-3 md:grid-cols-2">
                            <input
                              type="text"
                              value={form.ltoUtmSource}
                              onChange={event => handleChange('ltoUtmSource', event.target.value)}
                              placeholder="utm_source"
                              className="h-10 rounded border border-[#cfd6df] px-3 text-sm"
                            />
                            <input
                              type="text"
                              value={form.ltoUtmMedium}
                              onChange={event => handleChange('ltoUtmMedium', event.target.value)}
                              placeholder="utm_medium"
                              className="h-10 rounded border border-[#cfd6df] px-3 text-sm"
                            />
                            <input
                              type="text"
                              value={form.ltoUtmCampaign}
                              onChange={event => handleChange('ltoUtmCampaign', event.target.value)}
                              placeholder="utm_campaign"
                              className="h-10 rounded border border-[#cfd6df] px-3 text-sm"
                            />
                            <input
                              type="text"
                              value={form.ltoUtmTerm}
                              onChange={event => handleChange('ltoUtmTerm', event.target.value)}
                              placeholder="utm_term"
                              className="h-10 rounded border border-[#cfd6df] px-3 text-sm"
                            />
                            <input
                              type="text"
                              value={form.ltoUtmContent}
                              onChange={event => handleChange('ltoUtmContent', event.target.value)}
                              placeholder="utm_content"
                              className="h-10 rounded border border-[#cfd6df] px-3 text-sm md:col-span-2"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Button label text
                          </label>
                          <span className="text-xs text-slate-500">
                            {form.ltoButtonLabel.length}/{LTO_BUTTON_LABEL_MAX_LENGTH}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={form.ltoButtonLabel}
                          onChange={event => handleChange('ltoButtonLabel', event.target.value.slice(0, LTO_BUTTON_LABEL_MAX_LENGTH))}
                          placeholder="visit"
                          className="mt-2 h-11 w-full rounded border border-[#cfd6df] px-3 text-sm"
                        />
                      </div>
                    </div>
                  </section>
                )}

                {isCarouselButtonType && (
                  <section className="rounded-md border border-[#d3dae4] bg-white p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-3xl font-medium leading-9 text-slate-900">Carousel</h4>
                        <p className="mt-2 text-lg leading-7 text-slate-800">
                          Create buttons that let customers respond to your message or take action.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addCarouselCard}
                        disabled={form.carouselCards.length >= CAROUSEL_MAX_CARDS}
                        className="rounded-md bg-[#2f8f58] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        Add Card
                      </button>
                    </div>

                    <div className="mt-5 rounded border border-dashed border-[#cfd6df] bg-[#f8fafc] px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">
                          The total number of carousel cards cannot exceed 10.
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          {form.carouselCards.length}/{CAROUSEL_MAX_CARDS}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Media type</label>
                        <div className="mt-2 flex gap-4 text-sm">
                          {(['IMAGE', 'VIDEO'] as CarouselMediaType[]).map(option => (
                            <label key={option} className="inline-flex items-center gap-2">
                              <input
                                type="radio"
                                checked={form.carouselMediaType === option}
                                onChange={() => handleChange('carouselMediaType', option)}
                              />
                              {option === 'IMAGE' ? 'Image' : 'Video'}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      {form.carouselCards.map((card, cardIndex) => (
                        <div
                          key={card.id}
                          draggable
                          onDragStart={() => setDraggedCarouselCardId(card.id)}
                          onDragOver={event => event.preventDefault()}
                          onDrop={() => {
                            if (draggedCarouselCardId) {
                              reorderCarouselCard(draggedCarouselCardId, card.id);
                            }
                            setDraggedCarouselCardId(null);
                          }}
                          onDragEnd={() => setDraggedCarouselCardId(null)}
                          className={cn(
                            'rounded border border-[#d7dde6] p-4',
                            draggedCarouselCardId === card.id && 'opacity-60'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-semibold text-slate-900">Card {cardIndex + 1}</h5>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => moveCarouselCard(card.id, -1)}
                                disabled={cardIndex === 0}
                                className="rounded border border-[#cfd6df] p-2 disabled:opacity-50"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveCarouselCard(card.id, 1)}
                                disabled={cardIndex === form.carouselCards.length - 1}
                                className="rounded border border-[#cfd6df] p-2 disabled:opacity-50"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeCarouselCard(card.id)}
                                disabled={form.carouselCards.length <= CAROUSEL_MIN_CARDS}
                                className="rounded border border-red-200 p-2 text-red-600 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                  Upload Card Header
                                </label>
                                <label className="mt-2 inline-flex cursor-pointer items-center rounded border border-dashed border-[#2f8f58] px-3 py-2 text-sm font-medium text-[#0a8f69]">
                                  <input
                                    type="file"
                                    accept={form.carouselMediaType === 'IMAGE' ? '.jpg,.jpeg,.png' : '.mp4'}
                                    onChange={async event => {
                                      const file = event.target.files?.[0];
                                      if (!file) return;
                                      const maxBytes =
                                        form.carouselMediaType === 'IMAGE'
                                          ? CAROUSEL_IMAGE_MAX_BYTES
                                          : CAROUSEL_VIDEO_MAX_BYTES;
                                      if (file.size > maxBytes) {
                                        toast({
                                          title: 'File too large',
                                          description:
                                            form.carouselMediaType === 'IMAGE'
                                              ? 'Image size must be 5MB or less.'
                                              : 'Video size must be 16MB or less.',
                                          variant: 'destructive'
                                        });
                                        event.target.value = '';
                                        return;
                                      }
                                      try {
                                        await uploadCarouselMediaFile(card.id, file);
                                      } catch (error: any) {
                                        toast({
                                          title: 'Media upload failed',
                                          description: error?.message || 'Unable to upload carousel media.',
                                          variant: 'destructive'
                                        });
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  Choose file
                                </label>
                                <p className="mt-2 text-xs text-slate-500">Media will be cropped to a wide ratio.</p>
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Card body text
                                  </label>
                                  <span className="text-xs text-slate-500">
                                    {card.bodyText.length}/{CAROUSEL_CARD_BODY_MAX_LENGTH}
                                  </span>
                                </div>
                                <textarea
                                  value={card.bodyText}
                                  onChange={event =>
                                    updateCarouselCard(card.id, {
                                      bodyText: event.target.value.slice(0, CAROUSEL_CARD_BODY_MAX_LENGTH)
                                    })
                                  }
                                  placeholder="Write the text for card body"
                                  rows={4}
                                  className="mt-2 w-full rounded border border-[#cfd6df] px-3 py-3 text-sm"
                                />
                                <div className="mt-2 flex items-center justify-between">
                                  <button
                                    type="button"
                                    onClick={() => handleInsertCarouselCardVariable(card.id)}
                                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#0a8f69]"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add variable
                                  </button>
                                  <div className="flex items-center gap-2 text-slate-400">
                                    <Smile className="h-4 w-4" />
                                    <BoldIcon className="h-4 w-4" />
                                    <ItalicIcon className="h-4 w-4" />
                                  </div>
                                </div>
                              </div>

                              <div className="relative space-y-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCarouselButtonPickerCardId(prev =>
                                      prev === card.id ? null : card.id
                                    )
                                  }
                                  className="inline-flex items-center gap-1 text-base font-semibold text-[#0a8f69]"
                                >
                                  <Plus className="h-4 w-4" />
                                  Add a Card Button
                                </button>
                                {carouselButtonPickerCardId === card.id && (
                                  <div className="absolute left-0 top-8 z-20 w-44 rounded-md border border-[#d7dde6] bg-white p-1 shadow-lg">
                                    {[
                                      { label: 'CTA', type: 'URL' as const },
                                      { label: 'Quick Reply', type: 'QUICK_REPLY' as const },
                                      { label: 'Phone Number', type: 'PHONE_NUMBER' as const }
                                    ].map(option => (
                                      <button
                                        key={option.label}
                                        type="button"
                                        onClick={() => {
                                          if (card.buttons.length >= 2) {
                                            toast({
                                              title: 'Button limit reached',
                                              description: 'Each card can have at most 2 buttons.',
                                              variant: 'destructive'
                                            });
                                            setCarouselButtonPickerCardId(null);
                                            return;
                                          }
                                          addCarouselCardButton(card.id, option.type);
                                          setCarouselButtonPickerCardId(null);
                                        }}
                                        className="block w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-[#f6f8fb]"
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {card.buttons.map((button, buttonIndex) => (
                                  <div key={button.id} className="rounded border border-[#e2e8f0] p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                      Button {buttonIndex + 1}: {button.type.replace('_', ' ')}
                                    </p>
                                    <div className="mt-2 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => removeCarouselCardButton(card.id, button.id)}
                                        className="text-red-500 hover:text-red-600"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                    <div className="mt-3 space-y-3">
                                      {button.type === 'URL' && (
                                        <>
                                          <select
                                            value={button.urlType || 'Static'}
                                            onChange={event =>
                                              updateCarouselCardButton(card.id, button.id, {
                                                urlType: event.target.value as 'Static' | 'Dynamic'
                                              })
                                            }
                                            className="h-10 w-full rounded border border-[#cfd6df] px-3 text-sm"
                                          >
                                            <option value="Static">Static</option>
                                            <option value="Dynamic">Dynamic</option>
                                          </select>
                                          <input
                                            value={button.url || ''}
                                            onChange={event =>
                                              updateCarouselCardButton(card.id, button.id, {
                                                url: event.target.value.slice(0, CAROUSEL_URL_MAX_LENGTH)
                                              })
                                            }
                                            placeholder="https://www.billbox.co.in/"
                                            className="h-10 w-full rounded border border-[#cfd6df] px-3 text-sm"
                                          />
                                          <button
                                            type="button"
                                            onClick={() =>
                                              updateCarouselCardButton(card.id, button.id, {
                                                showUtmBuilder: !button.showUtmBuilder
                                              })
                                            }
                                            className="text-sm font-medium text-[#2f9a69]"
                                          >
                                            {button.showUtmBuilder ? 'Hide UTM Parameters' : 'Add UTM Parameters'}
                                          </button>
                                          {button.showUtmBuilder && (
                                            <div className="grid gap-2 md:grid-cols-2">
                                              {(['utmSource', 'utmMedium', 'utmCampaign', 'utmTerm', 'utmContent'] as const).map(field => (
                                                <input
                                                  key={field}
                                                  value={button[field] || ''}
                                                  onChange={event =>
                                                    updateCarouselCardButton(card.id, button.id, {
                                                      [field]: event.target.value
                                                    } as Partial<CarouselButtonDraft>)
                                                  }
                                                  placeholder={field}
                                                  className={cn(
                                                    'h-10 rounded border border-[#cfd6df] px-3 text-sm',
                                                    field === 'utmContent' && 'md:col-span-2'
                                                  )}
                                                />
                                              ))}
                                            </div>
                                          )}
                                        </>
                                      )}

                                      {button.type === 'PHONE_NUMBER' && (
                                        <div className="grid gap-2 md:grid-cols-[100px_minmax(0,1fr)]">
                                          <input
                                            value={button.countryCode || '+91'}
                                            onChange={event =>
                                              updateCarouselCardButton(card.id, button.id, {
                                                countryCode: event.target.value
                                              })
                                            }
                                            className="h-10 rounded border border-[#cfd6df] px-3 text-sm"
                                          />
                                          <input
                                            value={button.phoneNumber || ''}
                                            onChange={event =>
                                              updateCarouselCardButton(card.id, button.id, {
                                                phoneNumber: event.target.value.slice(0, 20)
                                              })
                                            }
                                            className="h-10 rounded border border-[#cfd6df] px-3 text-sm"
                                            placeholder="Phone number"
                                          />
                                        </div>
                                      )}

                                      <div className="flex items-center justify-between gap-3">
                                        <input
                                          value={button.text}
                                          onChange={event =>
                                            updateCarouselCardButton(card.id, button.id, {
                                              text: event.target.value.slice(0, CAROUSEL_BUTTON_LABEL_MAX_LENGTH)
                                            })
                                          }
                                          placeholder={button.type === 'QUICK_REPLY' ? 'Quick reply text' : 'Button label text'}
                                          className="h-10 flex-1 rounded border border-[#cfd6df] px-3 text-sm"
                                        />
                                        <span className="text-xs text-slate-500">
                                          {button.text.length}/{CAROUSEL_BUTTON_LABEL_MAX_LENGTH}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-xl border border-[#d7dde6] bg-[#f8fafc] p-4">
                              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-white">
                                {card.mediaPreviewUrl ? (
                                  form.carouselMediaType === 'IMAGE' ? (
                                    <img src={card.mediaPreviewUrl} alt={`Carousel card ${cardIndex + 1}`} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full items-center justify-center bg-slate-900 text-sm text-white">
                                      Video attached
                                    </div>
                                  )
                                ) : (
                                  <div className="flex h-full items-center justify-center bg-slate-200 text-sm text-slate-500">
                                    {form.carouselMediaType === 'IMAGE' ? 'Image placeholder' : 'Video placeholder'}
                                  </div>
                                )}
                              </div>
                              <p className="mt-3 text-sm text-slate-700">
                                {card.bodyText.trim() || 'Card body preview'}
                              </p>
                              <div className="mt-3 space-y-2">
                                {card.buttons.map(button => (
                                  <button
                                    key={button.id}
                                    type="button"
                                    disabled
                                    className="w-full rounded-full border border-[#25d366] bg-white py-2 text-xs font-semibold text-[#128c7e]"
                                  >
                                    {button.text.trim() || 'Button'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addCarouselCard}
                      disabled={form.carouselCards.length >= CAROUSEL_MAX_CARDS}
                      className="mt-4 inline-flex items-center gap-2 text-lg font-semibold text-[#0a8f69] disabled:opacity-50"
                    >
                      <Plus className="h-5 w-5" />
                      Add another Carousel Card
                    </button>
                  </section>
                )}

                {isNoButtonType && <p className="text-sm text-slate-600">No buttons selected.</p>}
                {isAdvancedButtonType && (
                  <p className="text-sm text-slate-600">Advanced button types will be enabled soon.</p>
                )}
              </div>

              <aside className="rounded border border-[#c9d3e2] bg-white">
                <div className="flex items-center justify-between border-b border-[#d6dce6] px-3 py-2">
                  <h4 className="text-base font-semibold leading-6 text-slate-900">Preview</h4>
                  <div className="flex items-center gap-2">
                    <div className="rounded border border-[#356ae6] px-2 py-1 text-xs text-[#356ae6]">android</div>
                    <div className="rounded border border-[#d6dce6] px-2 py-1 text-xs text-slate-400">apple</div>
                  </div>
                </div>
                <div className="flex justify-center p-6">
                  <div className="w-full max-w-[315px] rounded-[2rem] border-[8px] border-[#1f2b2f] bg-[#111] p-1">
                    <div className="h-[620px] rounded-[1.5rem] bg-[#e9e4dc]">
                      <div className="flex items-center justify-between rounded-t-[1.3rem] bg-[#0f675a] px-3 py-2 text-white">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/30 text-xs font-semibold">
                            {(form.name || 'BB').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold">BillBox</span>
                        </div>
                        <div className="text-xs">...</div>
                      </div>

                      <div className="space-y-3 p-3">
                        {form.headerType !== 'NONE' && (
                          <div className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow">
                            {headerPreviewLabel}
                          </div>
                        )}
                        {!isCarouselButtonType && (
                          <div className="rounded-md bg-white px-3 py-2 text-sm text-slate-700 shadow">
                            {bodyPreview || 'Body content will appear here'}
                          </div>
                        )}
                        {!isLimitedTimeOfferButtonType && !isCarouselButtonType && form.footerText.trim() && (
                          <p className="px-1 text-xs text-slate-500">{form.footerText.trim()}</p>
                        )}
                        {isLimitedTimeOfferButtonType && (
                          <div className="rounded-md bg-white px-3 py-3 text-sm text-slate-700 shadow">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">Limited time offer</p>
                                <p className="font-semibold text-slate-900">
                                  {form.ltoOfferHeading.trim() || 'Exclusive offer'}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Code: {form.ltoOfferCode.trim() || 'BB100'}
                                </p>
                              </div>
                              <div className="rounded-md bg-[#eef8f3] px-3 py-1 text-xs font-semibold text-[#248d61]">
                                {form.ltoOfferCode.trim() || 'BB100'}
                              </div>
                            </div>
                          </div>
                        )}
                        {isCarouselButtonType && (
                          <div className="rounded-md bg-white px-2 py-2 shadow">
                            <p className="px-1 pb-2 text-sm text-slate-700">
                              {bodyPreview || 'Body content will appear here'}
                            </p>
                            <div className="overflow-x-auto">
                              <div className="flex gap-3 pb-1">
                                {form.carouselCards.map(card => (
                                  <div key={card.id} className="w-[220px] flex-shrink-0 rounded-xl bg-white p-2">
                                    <div className="aspect-[4/3] overflow-hidden rounded-lg bg-slate-200">
                                      {card.mediaPreviewUrl ? (
                                        form.carouselMediaType === 'IMAGE' ? (
                                          <img src={card.mediaPreviewUrl} alt="Carousel preview" className="h-full w-full object-cover" />
                                        ) : (
                                          <div className="flex h-full items-center justify-center bg-slate-900 text-xs text-white">
                                            Video
                                          </div>
                                        )
                                      ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-slate-500">
                                          {form.carouselMediaType === 'IMAGE' ? 'Image' : 'Video'}
                                        </div>
                                      )}
                                    </div>
                                    <p className="mt-2 text-xs text-slate-700">
                                      {card.bodyText.trim() || 'Carousel card body'}
                                    </p>
                                    <div className="mt-2 space-y-1">
                                      {card.buttons.map(button => (
                                        <div
                                          key={button.id}
                                          className="rounded-full border border-[#25d366] px-3 py-1 text-center text-[11px] font-semibold text-[#128c7e]"
                                        >
                                          {button.text.trim() || 'Button'}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {isSendProductsButtonType && (
                          <div className="rounded-md bg-white shadow">
                            <div className="border-t border-[#e5e7eb] px-3 py-2 text-center text-base font-medium text-[#2f80ed]">
                              View items
                            </div>
                          </div>
                        )}
                        {isStandardButtonType && form.buttons.length > 0 && (
                          <div className="space-y-2">
                            {form.buttons.map(button => (
                              <button
                                key={button.id}
                                type="button"
                                disabled
                                className="w-full rounded-full border border-[#25d366] bg-white py-2 text-xs font-semibold text-[#128c7e]"
                              >
                                {button.text.trim() || 'Button'}
                              </button>
                            ))}
                          </div>
                        )}
                        {isLimitedTimeOfferButtonType && (
                          <div className="space-y-2">
                            <button
                              type="button"
                              disabled
                              className="w-full rounded-full border border-[#25d366] bg-white py-2 text-xs font-semibold text-[#128c7e]"
                            >
                              {form.ltoButtonLabel.trim() || 'visit'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TemplateCreationModal;

