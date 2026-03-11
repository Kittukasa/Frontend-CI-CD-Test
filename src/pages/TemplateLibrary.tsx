import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Search,
  Plus,
  X,
  Image,
  Video,
  Trash2,
  Edit,
  MessageSquare
} from 'lucide-react';
import { templateService, Template, CreateTemplateRequest } from '../services/templateService';
import TemplateCreationModal from '@/components/templates/TemplateCreationModal';
import {
  TEMPLATE_CATEGORY_OPTIONS,
  TemplateCategoryValue,
  TemplateEditFormData
} from '@/types/templateEditor';
import { toast } from '@/components/ui/use-toast';

const ensureAbsoluteUrl = (url: string): string => {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    if (typeof window === 'undefined') {
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      return `${window.location.origin}${trimmed}`;
    }
    return `${window.location.origin}/${trimmed}`;
  }
};

const buildAuthHeaders = (includeJson = false) => {
  const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
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

const extractTemplateVariables = (body: string): string[] => {
  if (!body) {
    return [];
  }
  const matches = new Set<string>();
  const regex = /{{\s*([\w.-]+)\s*}}/g;
  let result;
  while ((result = regex.exec(body)) !== null) {
    matches.add(result[1]);
  }
  const variables = Array.from(matches);
  return variables.sort((a, b) => {
    const aNum = Number(a);
    const bNum = Number(b);
    const aIsNum = Number.isFinite(aNum);
    const bIsNum = Number.isFinite(bNum);
    if (aIsNum && bIsNum) {
      return aNum - bNum;
    }
    if (aIsNum) return -1;
    if (bIsNum) return 1;
    return a.localeCompare(b);
  });
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

const makeTemplateErrorMessage = (message: string) => {
  const normalized = (message || '').trim();
  if (!normalized) {
    return 'Unable to save template. Please try again.';
  }

  if (
    normalized.includes('There is already English (US) content for this template') ||
    normalized.toLowerCase().includes('template already exists')
  ) {
    return 'A template with this name already exists on WhatsApp. Please rename the template and try again.';
  }

  return normalized;
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

const generateSampleValue = (token: string, index: number) => {
  const cleaned = token
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) {
    return `Value ${index + 1}`;
  }
  return cleaned.replace(/\b\w/g, char => char.toUpperCase());
};

const parseExampleValues = (text: string) =>
  text
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

const coerceTemplateTextValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    const firstString = value.find(item => typeof item === 'string' && item.trim().length > 0);
    return typeof firstString === 'string' ? firstString : '';
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

const denormalizePlaceholders = (text: string, order: string[]) => {
  if (!text) {
    return text;
  }
  if (!order || order.length === 0) {
    return text;
  }
  return text.replace(/{{\s*(\d+)\s*}}/g, (_, token: string) => {
    const index = Number(token);
    if (!Number.isFinite(index) || index < 1) {
      return `{{${token}}}`;
    }
    const name = order[index - 1];
    return name ? `{{${name}}}` : `{{${token}}}`;
  });
};

const buildFormDataFromTemplate = (template: Template): TemplateEditFormData => {
  const variables = template.variables || extractTemplateVariables(template.bodyText);
  const examples = template.examples || {};
  const headerExampleText = Array.isArray(examples.headerText)
    ? examples.headerText.join(', ')
    : examples.headerText || '';
  const bodyExampleText = Array.isArray(examples.body) ? examples.body.join(', ') : '';
  const footerExampleText = Array.isArray(examples.footerText)
    ? examples.footerText.join(', ')
    : examples.footerText || '';
  const bodyTextValue = denormalizePlaceholders(template.bodyText, variables);
  return {
    name: template.name,
    category: normalizeTemplateCategory(template.category),
    buttonType: template.buttonType || (template.buttons?.length ? 'Copy Code, URL, Quick Replies etc' : 'None'),
    language: template.language || 'en_US',
    headerType: template.headerType,
    headerText: denormalizePlaceholders(template.headerText || '', variables),
    headerImageUrl: template.headerImageUrl || template.previewImageUrl || '',
    headerVideoUrl: template.headerVideoUrl || '',
    headerDocumentUrl: (template as any).headerDocumentUrl || '',
    bodyText: bodyTextValue,
    footerText: denormalizePlaceholders(template.footerText || '', variables),
    buttons: template.buttons || [],
    variables,
    previewImageUrl: template.previewImageUrl,
    headerExampleText,
    bodyExampleText,
    footerExampleText,
    limitedTimeOffer: template.limitedTimeOffer,
    carousel: template.carousel
  };
};

type WhatsAppTemplateListItem = {
  id: string;
  name: string;
  status: string;
  category: string | null;
  buttonType?: string | null;
  button_type?: string | null;
  industryCategory?: string | null;
  occasionCategory?: string | null;
  language: string | null;
  last_updated_time?: string;
  updatedAt?: string;
  createdAt?: string;
  components?: any[];
  rejected_reason?: string | null;
  sub_category?: string | null;
  quality_score?: { score?: string } | string | null;
  description?: string | null;
  previewImageUrl?: string | null;
  header?: any;
  preview_url?: string | null;
  examples?: any;
};

const normalizeTemplateCategory = (value?: string | null): TemplateCategoryValue => {
  const incoming = (value || '').toString().trim().toUpperCase();
  if (TEMPLATE_CATEGORY_OPTIONS.includes(incoming as TemplateCategoryValue)) {
    return incoming as TemplateCategoryValue;
  }
  return 'MARKETING';
};

const normalizeStatus = (status: string | null | undefined): Template['status'] => {
  const raw = (status || '').toLowerCase();
  if (raw === 'approved') return 'approved';
  if (raw === 'rejected') return 'rejected';
  if (raw === 'submitted' || raw === 'pending' || raw === 'in_review' || raw === 'paused') {
    return 'pending';
  }
  return 'draft';
};

const extractBodyText = (item: WhatsAppTemplateListItem) => {
  if (!Array.isArray(item.components)) return '';
  const body = item.components.find(component => component?.type === 'BODY');
  if (body?.text && typeof body.text === 'string') {
    return body.text;
  }
  if (body?.parameters && Array.isArray(body.parameters) && body.parameters.length > 0) {
    return String(body.parameters[0]);
  }
  return '';
};

const extractFooterText = (item: WhatsAppTemplateListItem) => {
  if (!Array.isArray(item.components)) return '';
  const footer = item.components.find(component => component?.type === 'FOOTER');
  if (footer?.text && typeof footer.text === 'string') {
    return footer.text;
  }
  return '';
};

const extractHeaderData = (item: WhatsAppTemplateListItem) => {
  if (!Array.isArray(item.components)) return {};
  const header = item.components.find(component => component?.type === 'HEADER');
  if (!header) return {};

  const format = typeof header.format === 'string' ? header.format.toUpperCase() : undefined;
  const allowedHeaderTypes = new Set<Template['headerType']>(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']);
  const headerType = format && allowedHeaderTypes.has(format as Template['headerType'])
    ? (format as Template['headerType'])
    : undefined;

  const headerText = headerType === 'TEXT' && typeof header.text === 'string' ? header.text : undefined;
  const mediaUrl =
    headerType === 'IMAGE' ? header.sample_url || header.sampleUrl || headerExampleToUrl(header) :
    headerType === 'VIDEO' ? header.sample_url || header.sampleUrl || headerExampleToUrl(header) :
    headerType === 'DOCUMENT' ? header.sample_url || header.sampleUrl || headerExampleToUrl(header) :
    undefined;

  return {
    headerType,
    headerText,
    headerMediaUrl: mediaUrl
  };
};

const headerExampleToUrl = (headerComponent: any) => {
  if (!headerComponent?.example) return undefined;
  const example = headerComponent.example;
  if (Array.isArray(example.header_handle) && example.header_handle.length > 0) {
    return example.header_handle[0];
  }
  if (typeof example.header_handle === 'string') {
    return example.header_handle;
  }
  if (Array.isArray(example.header_url) && example.header_url.length > 0) {
    return example.header_url[0];
  }
  if (typeof example.header_url === 'string') {
    return example.header_url;
  }
  if (Array.isArray(example.header_file) && example.header_file.length > 0) {
    return example.header_file[0];
  }
  if (typeof example.header_file === 'string') {
    return example.header_file;
  }
  return undefined;
};

const extractButtons = (item: WhatsAppTemplateListItem) => {
  if (!Array.isArray(item.components)) return [];
  const buttonsComponent = item.components.find(component => component?.type === 'BUTTONS');
  if (!buttonsComponent || !Array.isArray(buttonsComponent.buttons)) return [];

  return buttonsComponent.buttons
    .map((button: any) => {
      const type = String(button.type || '').toUpperCase();
      if (type === 'URL') {
        return {
          type: 'URL' as const,
          text: button.text || '',
          url: button.url || button?.example?.[0] || '',
          phone_number: undefined
        };
      }
      if (type === 'PHONE_NUMBER') {
        return {
          type: 'PHONE_NUMBER' as const,
          text: button.text || '',
          url: undefined,
          phone_number: button.phone_number || button.phoneNumber || ''
        };
      }
      return {
        type: 'QUICK_REPLY' as const,
        text: button.text || '',
        url: undefined,
        phone_number: undefined
      };
    })
    .filter(button => button.text);
};

const extractLimitedTimeOffer = (item: WhatsAppTemplateListItem) => {
  if (!Array.isArray(item.components)) {
    return undefined;
  }

  const ltoComponent = item.components.find(component => component?.type === 'LIMITED_TIME_OFFER');
  const buttonComponent = item.components.find(component => component?.type === 'BUTTONS');
  const buttons = Array.isArray(buttonComponent?.buttons) ? buttonComponent.buttons : [];
  const urlButton = buttons.find((button: any) => String(button?.type || '').toUpperCase() === 'URL');
  const copyCodeButton = buttons.find(
    (button: any) => {
      const normalizedType = String(button?.type || '').toUpperCase();
      return normalizedType === 'COPY_CODE' || normalizedType === 'COPY-CODE';
    }
  );

  const offerHeading =
    coerceTemplateTextValue(ltoComponent?.limited_time_offer?.text) ||
    coerceTemplateTextValue(ltoComponent?.text);
  const offerCode =
    coerceTemplateTextValue(copyCodeButton?.example) ||
    coerceTemplateTextValue(copyCodeButton?.text);
  const url = coerceTemplateTextValue(urlButton?.url);
  const buttonLabel = coerceTemplateTextValue(urlButton?.text);

  if (!offerHeading && !offerCode && !url && !buttonLabel) {
    return undefined;
  }

  return {
    offerHeading,
    offerCode,
    urlType: (urlButton?.url_type || 'Static') as 'Static' | 'Dynamic',
    url,
    buttonLabel
  };
};

const extractCarousel = (item: WhatsAppTemplateListItem) => {
  if (!Array.isArray(item.components)) {
    return undefined;
  }

  const carouselComponent = item.components.find(
    component => (component?.type || '').toString().toUpperCase() === 'CAROUSEL'
  );
  const cards = Array.isArray(carouselComponent?.cards) ? carouselComponent.cards : [];
  if (!cards.length) {
    return undefined;
  }

  const firstHeader = cards[0]?.components?.find((component: any) => component?.type === 'HEADER');
  const mediaType = (firstHeader?.format || 'IMAGE').toString().toUpperCase() as 'IMAGE' | 'VIDEO';

  const normalizedCards = cards.map((card: any, index: number) => {
    const components = Array.isArray(card?.components) ? card.components : [];
    const header = components.find((component: any) => component?.type === 'HEADER');
    const body = components.find((component: any) => component?.type === 'BODY');
    const buttonsComponent = components.find((component: any) => component?.type === 'BUTTONS');
    const buttons = Array.isArray(buttonsComponent?.buttons) ? buttonsComponent.buttons : [];

    return {
      id: card?.card_index || `card_${index + 1}`,
      mediaHandle: coerceTemplateTextValue(header?.example?.header_handle),
      mediaUrl: coerceTemplateTextValue(header?.example?.header_handle),
      bodyText: coerceTemplateTextValue(body?.text),
      buttons: buttons.map((button: any) => ({
        type:
          String(button?.type || '').toUpperCase() === 'PHONE_NUMBER'
            ? 'PHONE_NUMBER'
            : String(button?.type || '').toUpperCase() === 'QUICK_REPLY'
            ? 'QUICK_REPLY'
            : 'URL',
        text: coerceTemplateTextValue(button?.text),
        url: coerceTemplateTextValue(button?.url),
        urlType: (button?.url_type || 'Static') as 'Static' | 'Dynamic',
        phone_number: coerceTemplateTextValue(button?.phone_number)
      }))
    };
  });

  const firstCardButtons = normalizedCards[0]?.buttons || [];
  let buttonLayout: 'URL' | 'PHONE' | 'URL_PHONE' | 'QUICK_REPLY' | 'QUICK_REPLY_2' = 'URL';
  if (firstCardButtons.length === 2) {
    const types = firstCardButtons.map(button => button.type);
    if (types[0] === 'URL' && types[1] === 'PHONE_NUMBER') {
      buttonLayout = 'URL_PHONE';
    } else {
      buttonLayout = 'QUICK_REPLY_2';
    }
  } else if (firstCardButtons[0]?.type === 'PHONE_NUMBER') {
    buttonLayout = 'PHONE';
  } else if (firstCardButtons[0]?.type === 'QUICK_REPLY') {
    buttonLayout = 'QUICK_REPLY';
  }

  return {
    mediaType,
    buttonLayout,
    cards: normalizedCards
  };
};

const extractExamples = (item: WhatsAppTemplateListItem) => {
  if (item?.examples && typeof item.examples === 'object') {
    return {
      body: Array.isArray(item.examples.body) ? item.examples.body : undefined,
      headerText: Array.isArray(item.examples.headerText) ? item.examples.headerText : undefined,
      footerText: Array.isArray(item.examples.footerText) ? item.examples.footerText : undefined
    };
  }
  return undefined;
};

const extractPreviewImage = (item: WhatsAppTemplateListItem, headerMediaUrl?: string) => {
  if (item.previewImageUrl) return item.previewImageUrl;
  if (item.preview_url) return item.preview_url;
  if (headerMediaUrl) return headerMediaUrl;
  if (Array.isArray(item.components)) {
    const header = item.components.find(component => component?.type === 'HEADER');
    const headerExample = headerExampleToUrl(header);
    if (headerExample) return headerExample;
  }
  const headerExample = headerExampleToUrl({ example: item.examples });
  if (headerExample) return headerExample;
  return undefined;
};

const collectVariables = (bodyText: string) => {
  if (!bodyText) return [];
  const matches = bodyText.match(/{{\s*([\w.-]+)\s*}}/g) || [];
  return matches
    .map(token => token.replace(/[{}]/g, '').trim())
    .filter(Boolean);
};

const mapToTemplate = (item: WhatsAppTemplateListItem): Template => {
  const id = item.id || item.name || Math.random().toString(36).slice(2);
  const name = item.name || 'Untitled template';
  const status = normalizeStatus(item.status);
  const category = normalizeTemplateCategory(item.category);
  const industryCategoryRaw =
    (item as any).industryCategory ??
    (item as any).industry_category ??
    null;
  const industryCategory =
    typeof industryCategoryRaw === 'string' && industryCategoryRaw.trim()
      ? industryCategoryRaw.trim()
      : null;
  const occasionCategoryRaw =
    (item as any).occasionCategory ??
    (item as any).occasion_category ??
    null;
  const occasionCategory =
    typeof occasionCategoryRaw === 'string' && occasionCategoryRaw.trim()
      ? occasionCategoryRaw.trim()
      : null;
  const language = (item.language || 'en_US').toString();
  const bodyText = extractBodyText(item);
  const footerText = extractFooterText(item);
  const { headerType, headerText, headerMediaUrl } = extractHeaderData(item);
  const buttons = extractButtons(item);
  const limitedTimeOffer = extractLimitedTimeOffer(item);
  const carousel = extractCarousel(item);
  const examples = extractExamples(item);
  const previewImageUrl = extractPreviewImage(item, headerMediaUrl);
  const variables = collectVariables(bodyText);

  const updatedAt =
    item.last_updated_time ||
    item.updatedAt ||
    (item as any).lastUpdatedAt ||
    new Date().toISOString();
  const createdAt =
    item.createdAt ||
    (item as any).created_at ||
    new Date().toISOString();

  return {
    id,
    storeId: (item as any).storeId,
    name,
    category,
    buttonType:
      (item.buttonType || item.button_type || '').toString().trim() ||
      (carousel ? 'Carousel' : '') ||
      (limitedTimeOffer ? 'Limited Time Offer' : '') ||
      (buttons.length > 0 ? 'Copy Code, URL, Quick Replies etc' : 'None'),
    industryCategory,
    occasionCategory,
    language,
    status,
    headerType,
    headerText,
    headerImageUrl: headerType === 'IMAGE' ? headerMediaUrl : undefined,
    headerVideoUrl: headerType === 'VIDEO' ? headerMediaUrl : undefined,
    headerDocumentUrl: headerType === 'DOCUMENT' ? headerMediaUrl : undefined,
    bodyText,
    footerText,
    buttons,
    variables,
    isPredefined: false,
    previewImageUrl,
    description: item.description || bodyText.slice(0, 140),
    limitedTimeOffer,
    carousel,
    createdAt,
    updatedAt,
    createdBy: (item as any).createdBy,
    approvedAt: (item as any).approvedAt,
    approvedBy: (item as any).approvedBy,
    rejectedAt: (item as any).rejectedAt,
    rejectedBy: (item as any).rejectedBy,
    rejectionReason: item.rejected_reason || (item as any).rejectionReason,
    examples
  };
};

const TemplateLibrary: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [predefinedTemplates, setPredefinedTemplates] = useState<Template[]>([]);
  const [predefinedLoading, setPredefinedLoading] = useState(true);
  const [predefinedError, setPredefinedError] = useState<string | null>(null);
  const [predefinedVisible, setPredefinedVisible] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editContext, setEditContext] = useState<'predefined' | 'custom' | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateActionLoading, setTemplateActionLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const categoryOptions = useMemo(() => {
    const categories = new Map<string, string>();
    predefinedTemplates.forEach(template => {
      const rawValue = template.industryCategory;
      if (!rawValue || typeof rawValue !== 'string') {
        return;
      }
      const trimmed = rawValue.trim();
      if (!trimmed) {
        return;
      }
      const normalized = trimmed.toLowerCase();
      if (!categories.has(normalized)) {
        categories.set(normalized, trimmed);
      }
    });

    return Array.from(categories.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [predefinedTemplates]);

  const occasionOptions = useMemo(() => {
    const occasions = new Map<string, string>();
    predefinedTemplates.forEach(template => {
      const rawValue = template.occasionCategory;
      if (!rawValue || typeof rawValue !== 'string') {
        return;
      }
      const trimmed = rawValue.trim();
      if (!trimmed) {
        return;
      }
      const normalized = trimmed.toLowerCase();
      if (!occasions.has(normalized)) {
        occasions.set(normalized, trimmed);
      }
    });

    return Array.from(occasions.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [predefinedTemplates]);

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
    loadPredefinedTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      setTemplatesError(null);

      const params = new URLSearchParams({ limit: '50' });
      const response = await fetch(`/api/whatsapp/templates?${params.toString()}`, {
        headers: buildAuthHeaders()
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to load templates');
      }

      const data = await response.json().catch(() => []);
      const rawTemplates: WhatsAppTemplateListItem[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.templates)
        ? data.templates
        : [];

      const normalized = rawTemplates.map(mapToTemplate);
      setTemplates(normalized);
      setFilteredTemplates(normalized);
    } catch (error) {
      console.error('Error loading templates:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load templates. Please try again.';
      setTemplatesError(message);
      setTemplates([]);
      setFilteredTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleUpdateExistingTemplate = async (templateData: TemplateEditFormData) => {
    if (savingTemplate || !editingTemplate) {
      return;
    }

    try {
      setSavingTemplate(true);

      const { graphPayload } = await prepareTemplatePayload(templateData);

      const response = await fetch(
        `/api/whatsapp/templates/${encodeURIComponent(editingTemplate.id)}`,
        {
          method: 'PUT',
          headers: buildAuthHeaders(true),
          body: JSON.stringify(graphPayload)
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const apiError = result?.details?.error || result?.error;
        const userMessage =
          (typeof apiError?.error_user_msg === 'string' && apiError.error_user_msg.trim()) ||
          (typeof apiError?.message === 'string' && apiError.message.trim()) ||
          (typeof result?.error === 'string' && result.error.trim()) ||
          'Failed to update template.';
        throw new Error(userMessage);
      }

      await loadTemplates();
      closeTemplateModal();
      alert('Template updated successfully.');
    } catch (error) {
      console.error('Error updating template:', error);
      const message = error instanceof Error ? error.message : 'Failed to update template. Please try again.';
      alert(message);
    } finally {
      setSavingTemplate(false);
    }
  };

  const loadPredefinedTemplates = async () => {
    try {
      setPredefinedLoading(true);
      setPredefinedError(null);
      const templatesData = await templateService.getPredefinedTemplates();
      const normalized = templatesData.map(template => ({
        ...template,
        variables: template.variables || [],
        isPredefined: true
      }));
      setPredefinedTemplates(normalized);
    } catch (error) {
      console.error('Error loading predefined templates:', error);
      setPredefinedError('Unable to load predefined templates');
      setPredefinedTemplates([]);
    } finally {
      setPredefinedLoading(false);
    }
  };

  const filteredPredefinedTemplates = useMemo(() => {
    let filtered = predefinedTemplates;

    if (templateSearch) {
      const searchValue = templateSearch.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchValue) ||
        template.bodyText.toLowerCase().includes(searchValue)
      );
    }

    if (selectedCategory !== 'all') {
      const normalizedSelectedCategory = selectedCategory.toLowerCase();
      filtered = filtered.filter(template => {
        if (typeof template.industryCategory !== 'string') {
          return false;
        }
        return template.industryCategory.trim().toLowerCase() === normalizedSelectedCategory;
      });
    }

    if (selectedOccasion !== 'all') {
      const normalizedSelectedOccasion = selectedOccasion.toLowerCase();
      filtered = filtered.filter(template => {
        if (typeof template.occasionCategory !== 'string') {
          return false;
        }
        return template.occasionCategory.trim().toLowerCase() === normalizedSelectedOccasion;
      });
    }

    return filtered;
  }, [predefinedTemplates, templateSearch, selectedCategory, selectedOccasion]);

  // Filter templates based on search and filters
  useEffect(() => {
    let filtered = templates;

    if (templateSearch) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
        template.bodyText.toLowerCase().includes(templateSearch.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, templateSearch]);

  const handleDeleteTemplate = async (template: Template) => {
    if (!template) return;
    if (!window.confirm('Delete this template draft? This action cannot be undone.')) {
      return;
    }

    setTemplateActionLoading(true);
    try {
      const params = new URLSearchParams();
      if (template.name) {
        params.set('name', template.name);
      }
      const response = await fetch(
        `/api/whatsapp/templates/${encodeURIComponent(template.id || template.name || '')}${
          params.toString() ? `?${params.toString()}` : ''
        }`,
        {
          method: 'DELETE',
          headers: buildAuthHeaders()
        }
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete template');
      }

      alert('Template deleted successfully.');
      await loadTemplates();
    } catch (error: any) {
      const message = error?.message || 'Unable to delete template';
      console.error('Error deleting template:', error);
      alert(message);
    } finally {
      setTemplateActionLoading(false);
    }
  };

  const handlePredefinedTemplateClick = (template: Template) => {
    setEditingTemplate(template);
    setEditContext('predefined');
    setShowCreateModal(true);
  };

  const handleOpenCustomTemplateEdit = (template: Template) => {
    setEditingTemplate(template);
    setEditContext('custom');
    setShowCreateModal(true);
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setEditContext(null);
    setShowCreateModal(true);
  };

  const closeTemplateModal = () => {
    setShowCreateModal(false);
    setEditingTemplate(null);
    setEditContext(null);
  };

  const uploadHeaderMediaFromUrl = async (
    url: string,
    mediaType: Extract<Template['headerType'], 'IMAGE' | 'VIDEO' | 'DOCUMENT'>
  ) => {
    const trimmedUrl = url?.trim() || '';
    if (!trimmedUrl) {
      throw new Error('Template is missing a header media URL.');
    }

    const headers = buildAuthHeaders();
    if ('Content-Type' in headers) {
      delete headers['Content-Type'];
    }

    const formData = new FormData();
    formData.append('media_type', mediaType);
    formData.append('file_url', trimmedUrl);

    const uploadResponse = await fetch('/api/whatsapp/media/upload', {
      method: 'POST',
      headers,
      body: formData
    });

    const uploadResult = await uploadResponse.json().catch(() => ({}));
    if (!uploadResponse.ok || !uploadResult?.mediaHandle) {
      throw new Error(uploadResult?.error || 'Failed to upload header media to WhatsApp.');
    }

    return uploadResult.mediaHandle as string;
  };

  const prepareTemplatePayload = async (templateData: TemplateEditFormData) => {
    const isLimitedTimeOfferButtonType = templateData.buttonType === 'Limited Time Offer';
    const isCarouselButtonType = templateData.buttonType === 'Carousel';
    const headerType =
      templateData.headerType && templateData.headerType !== 'NONE' ? templateData.headerType : undefined;

    const normalizedHeader =
      headerType === 'TEXT'
        ? normalizePlaceholders((templateData.headerText || '').trim())
        : null;

    const normalizedBody = normalizePlaceholders(templateData.bodyText.trim());
    const footerRaw = isLimitedTimeOfferButtonType || isCarouselButtonType ? '' : templateData.footerText?.trim() || '';
    const normalizedFooter = footerRaw ? normalizePlaceholders(footerRaw) : null;
    const footerExampleRaw = templateData.footerExampleText?.trim() || '';
    const headerExampleValues = parseExampleValues(templateData.headerExampleText || '');
    const bodyExampleValues = parseExampleValues(templateData.bodyExampleText || '');
    let headerSamples: string[] | undefined;

    const components: any[] = [];

    if (headerType && !isCarouselButtonType) {
      const headerComponent: any = { type: 'HEADER', format: headerType };

      if (headerType === 'TEXT') {
        headerComponent.format = 'TEXT';
        headerComponent.text = normalizedHeader?.text || '';
        headerSamples =
          normalizedHeader?.order?.length
            ? normalizedHeader.order.map((token, index) => {
                if (headerExampleValues[index] && headerExampleValues[index]?.trim()) {
                  return headerExampleValues[index].trim();
                }
                return generateSampleValue(token, index);
              })
            : headerExampleValues.length
            ? headerExampleValues
            : [];
        if (headerSamples.length) {
          headerComponent.example = {
            header_text: headerSamples
          };
        }
      } else {
        const mediaUrlRaw =
          headerType === 'IMAGE'
            ? templateData.previewImageUrl || templateData.headerImageUrl || ''
            : headerType === 'VIDEO'
            ? templateData.headerVideoUrl || ''
            : templateData.headerDocumentUrl || '';
        const mediaUrl = ensureAbsoluteUrl(mediaUrlRaw);
        const mediaHandle = await uploadHeaderMediaFromUrl(mediaUrl, headerType);
        headerComponent.example = {
          header_handle: [mediaHandle]
        };
      }

      components.push(headerComponent);
    }

    const bodyComponent: any = {
      type: 'BODY',
      text: normalizedBody.text
    };

    if (bodyExampleValues.length > 0) {
      bodyComponent.example = {
        body_text: [bodyExampleValues]
      };
    } else if (templateData.bodyExampleText && templateData.bodyExampleText.trim()) {
      bodyComponent.example = {
        body_text: [[templateData.bodyExampleText.trim()]]
      };
    }

    components.push(bodyComponent);

    if (normalizedFooter?.text) {
      const footerComponent: any = {
        type: 'FOOTER',
        text: normalizedFooter.text
      };
      if (footerExampleRaw) {
        footerComponent.example = {
          footer_text: [footerExampleRaw]
        };
      }
      components.push(footerComponent);
    }

    if (Array.isArray(templateData.buttons) && templateData.buttons.length > 0) {
      const buttonsForApi = templateData.buttons.map(button => {
        const base: any = {
          type: button.type,
          text: button.text?.trim() || ''
        };

        if (button.type === 'URL') {
          const url = (button as any).url || (button as any).buttonUrl || '';
          base.url = url.trim();
          const example = (button as any).example || (button as any).examples?.[0];
          if (example) {
            base.example = [String(example).trim()];
          }
        }

        if (button.type === 'PHONE_NUMBER') {
          const phoneNumber = (button as any).phone_number || (button as any).phoneNumber || '';
          base.phone_number = phoneNumber.trim();
        }

        return base;
      });

      if (buttonsForApi.length > 0) {
        components.push({
          type: 'BUTTONS',
          buttons: buttonsForApi
        });
      }
    }

    if (isLimitedTimeOfferButtonType && templateData.limitedTimeOffer) {
      components.push({
        type: 'LIMITED_TIME_OFFER',
        limited_time_offer: {
          text: templateData.limitedTimeOffer.offerHeading?.trim() || '',
          has_expiration: false
        }
      });
      components.push({
        type: 'BUTTONS',
        buttons: [
          {
            type: 'copy_code',
            example: templateData.limitedTimeOffer.offerCode?.trim() || ''
          },
          {
            type: 'URL',
            text: templateData.limitedTimeOffer.buttonLabel?.trim() || '',
            url: templateData.limitedTimeOffer.url?.trim() || ''
          }
        ]
      });
    }

    if (isCarouselButtonType && templateData.carousel) {
      components.push({
        type: 'CAROUSEL',
        cards: templateData.carousel.cards.map(card => ({
          components: [
            {
              type: 'HEADER',
              format: templateData.carousel?.mediaType || 'IMAGE',
              example: {
                header_handle: [card.mediaHandle || card.mediaUrl || '']
              }
            },
            {
              type: 'BODY',
              text: card.bodyText?.trim() || ''
            },
            {
              type: 'BUTTONS',
              buttons: card.buttons.map(button => ({
                type: button.type,
                text: button.text?.trim() || '',
                ...(button.type === 'URL'
                  ? { url: button.url?.trim() || '' }
                  : button.type === 'PHONE_NUMBER'
                  ? { phone_number: button.phone_number?.trim() || '' }
                  : {})
              }))
            }
          ]
        }))
      });
    }

    const variableValuesInput = Array.isArray(templateData.variables)
      ? templateData.variables
      : extractTemplateVariables(templateData.bodyText);
    const orderedVariables = reorderVariables(
      normalizedBody.order.length ? normalizedBody.order : variableValuesInput,
      variableValuesInput
    );

    const graphPayload = {
      name: templateData.name.trim(),
      category: (isLimitedTimeOfferButtonType || isCarouselButtonType ? 'MARKETING' : templateData.category || 'MARKETING').toUpperCase(),
      buttonType:
        (typeof templateData.buttonType === 'string' && templateData.buttonType.trim()) || 'None',
      language: templateData.language || 'en_US',
      components
    };

    const localDraft: CreateTemplateRequest = {
      name: templateData.name.trim(),
      category: templateData.category,
      buttonType:
        (typeof templateData.buttonType === 'string' && templateData.buttonType.trim()) || 'None',
      language: templateData.language || 'en_US',
      headerType,
      headerText: !isCarouselButtonType && headerType === 'TEXT' ? normalizedHeader?.text : undefined,
      headerImageUrl: !isCarouselButtonType && headerType === 'IMAGE' ? templateData.headerImageUrl : undefined,
      headerVideoUrl: !isCarouselButtonType && headerType === 'VIDEO' ? templateData.headerVideoUrl : undefined,
      headerDocumentUrl: !isCarouselButtonType && headerType === 'DOCUMENT' ? templateData.headerDocumentUrl : undefined,
      bodyText: normalizedBody.text,
      footerText: isLimitedTimeOfferButtonType || isCarouselButtonType ? undefined : normalizedFooter?.text,
      buttons: isLimitedTimeOfferButtonType || isCarouselButtonType ? undefined : templateData.buttons,
      variables: orderedVariables.map(value => value.trim()),
      limitedTimeOffer: templateData.limitedTimeOffer,
      carousel: templateData.carousel,
      examples: {
        headerText:
          headerType === 'TEXT' && headerSamples && headerSamples.length ? headerSamples : undefined,
        footerText: isLimitedTimeOfferButtonType || isCarouselButtonType ? undefined : footerExampleRaw ? [footerExampleRaw] : undefined,
        body:
          templateData.bodyExampleText && templateData.bodyExampleText.trim()
            ? [templateData.bodyExampleText.trim()]
            : undefined
      }
    };

    return {
      graphPayload,
      localDraft
    };
  };

  const handleSavePredefinedTemplate = async (templateData: TemplateEditFormData) => {
    if (savingTemplate) {
      return;
    }

    try {
      setSavingTemplate(true);

      const { graphPayload, localDraft } = await prepareTemplatePayload(templateData);

      const createResponse = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        body: JSON.stringify(graphPayload)
      });

      const createResult = await createResponse.json().catch(() => ({}));
      if (!createResponse.ok || !createResult?.success) {
        const apiError = createResult?.details?.error;
        const userMessage =
          (typeof apiError?.error_user_msg === 'string' && apiError.error_user_msg.trim()) ||
          (typeof apiError?.message === 'string' && apiError.message.trim()) ||
          (typeof createResult?.error === 'string' && createResult.error.trim()) ||
          'Failed to create template draft with WhatsApp.';

        const errorToThrow = new Error(userMessage);
        (errorToThrow as any).details = createResult;
        throw errorToThrow;
      }

      await templateService.createTemplate(localDraft);
      await loadTemplates();
      closeTemplateModal();
      toast({
        title: 'Template created',
        description: 'Template draft saved successfully.'
      });
  } catch (error) {
    console.error('Error saving template draft:', error);
    const rawMessage =
      error instanceof Error ? error.message : 'Failed to save template. Please try again.';
    alert(makeTemplateErrorMessage(rawMessage));
  } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      {!showCreateModal && (
      <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h3 className="text-xl font-semibold text-gray-900">Create &amp; Manage Campaigning Templates</h3>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            disabled={savingTemplate || templateActionLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates..."
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categoryOptions.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={selectedOccasion}
              onChange={event => setSelectedOccasion(event.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Occasions</option>
              {occasionOptions.map(occasion => (
                <option key={occasion} value={occasion}>
                  {occasion}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {templatesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading templates...</span>
          </div>
        ) : (
          <>
            {/* Predefined Templates Section */}
            {predefinedVisible && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Predefined Templates</h2>
                  <button
                    onClick={() => setPredefinedVisible(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {predefinedLoading ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                    Loading predefined templates…
                  </div>
                ) : predefinedError ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {predefinedError}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPredefinedTemplates.map(template => {
                      const previewImage =
                        template.previewImageUrl ||
                        template.headerImageUrl ||
                        (template.headerType === 'IMAGE' ? template.headerText : null) ||
                        '';
                      const summary = template.description || template.bodyText || '';
                      const categoryLabel = template.industryCategory || 'Uncategorized';

                      return (
                        <div
                          key={template.id}
                          onClick={() => handlePredefinedTemplateClick(template)}
                          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                        >
                          <div className="aspect-video relative bg-gray-100">
                            {previewImage ? (
                              <img
                                src={previewImage}
                                alt={template.name}
                                className="w-full h-full object-cover"
                                onError={(event) => {
                                  const target = event.target as HTMLImageElement;
                                  target.src =
                                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSI+SW1hZ2U8L3RleHQ+PC9zdmc+';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Image className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                              {template.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 capitalize">
                              {categoryLabel}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-3">
                              {summary}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {filteredPredefinedTemplates.length === 0 && (
                      <div className="col-span-full text-center rounded-md border border-gray-200 bg-white py-10 text-sm text-gray-500">
                        No predefined templates available right now.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Your Templates Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Your Templates</h2>
                {!predefinedVisible && (
                  <button
                    onClick={() => setPredefinedVisible(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Show Predefined Templates
                  </button>
                )}
              </div>
              <div className="rounded-xl border border-gray-100 overflow-hidden bg-white">
                {templatesLoading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    Loading templates…
                  </div>
                ) : templatesError ? (
                  <div className="py-12 text-center text-sm text-red-600">{templatesError}</div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-500">
                    No templates yet. Create your first template draft to get started.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Updated
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredTemplates.map(template => (
                        <tr key={template.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {template.name}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize',
                                template.status === 'approved'
                                  ? 'bg-green-100 text-green-700'
                                  : template.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : template.status === 'pending'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              )}
                            >
                              {template.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 uppercase">
                            {(template.category || 'GENERAL').toUpperCase()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 uppercase">
                            {(template.headerType || 'TEXT').toUpperCase()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {template.updatedAt
                              ? new Date(template.updatedAt).toLocaleString()
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={templateActionLoading}
                                onClick={() => handleOpenCustomTemplateEdit(template)}
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700',
                                  templateActionLoading && 'cursor-not-allowed opacity-60 hover:bg-blue-600'
                                )}
                              >
                                <Edit className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={templateActionLoading}
                                onClick={() => handleDeleteTemplate(template)}
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:text-red-700',
                                  templateActionLoading && 'cursor-not-allowed opacity-60'
                                )}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <TemplateCreationModal
        open={showCreateModal}
        mode={editingTemplate ? 'edit' : 'create'}
        editContext={editContext}
        initialTemplate={editingTemplate ? buildFormDataFromTemplate(editingTemplate) : undefined}
        isBusy={editingTemplate ? savingTemplate : undefined}
        onSubmit={
          editingTemplate
            ? editContext === 'custom'
              ? handleUpdateExistingTemplate
              : handleSavePredefinedTemplate
            : undefined
        }
        onClose={closeTemplateModal}
        onMetaTemplateCreated={
          editingTemplate
            ? undefined
            : async () => {
                await loadTemplates();
              }
        }
        onStoreTemplateDraft={
          editingTemplate
            ? undefined
            : async request => {
                try {
                  await templateService.createTemplate(request);
                } catch (error) {
                  console.error('Error saving template draft:', error);
                  const message =
                    error instanceof Error
                      ? error.message
                      : 'Failed to store template draft locally.';
                  toast({
                    title: 'Template stored only on WhatsApp',
                    description: message,
                    variant: 'destructive'
                  });
                }
              }
        }
      />
    </div>
  );
};

export default TemplateLibrary;
