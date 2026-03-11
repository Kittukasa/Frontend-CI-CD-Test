import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

type TriggerType = 'keyword' | 'webhook' | 'form_submit' | 'api_event';
type MessageType = 'plain' | 'buttons' | 'list' | 'image' | 'video' | 'template' | 'product_list';
type WorkflowStatus = 'Draft' | 'Live' | 'Paused';
type ConditionLeftType = 'field' | 'tag' | 'last_reply';

type WorkflowRecord = {
  workflow_id: string;
  store_id: string;
  name: string;
  description?: string;
  status?: string;
  spec?: Record<string, unknown>;
  updated_at?: string;
  created_at?: string;
  published_at?: string | null;
};

type ButtonConfig = { title: string; payload: string };
type ListRowConfig = { title: string; description: string; payload: string };
type WebhookPayloadItem = { key: string; value_source: string };

type WorkflowLibraryItem = {
  id: string;
  name: string;
  status: WorkflowStatus;
  updatedAt: string;
  triggerLabel: string;
  raw: WorkflowRecord;
};

const statusStyles: Record<WorkflowStatus, string> = {
  Draft: 'bg-amber-100 text-amber-700',
  Live: 'bg-emerald-100 text-emerald-700',
  Paused: 'bg-gray-100 text-gray-600',
};

const triggerTypeLabels: Record<TriggerType, string> = {
  keyword: 'Keyword',
  webhook: 'Webhook',
  form_submit: 'Form Submit',
  api_event: 'API Event',
};

const messageTypeLabels: Record<MessageType, string> = {
  plain: 'Plain',
  buttons: 'Buttons',
  list: 'List',
  product_list: 'Multi Product',
  image: 'Image',
  video: 'Video',
  template: 'Template',
};

type ProductItem = {
  id: string;
  name: string;
  price: string;
  image: string;
  product_retailer_id: string;
};

const emptyProducts: ProductItem[] = [];

const conditionOperators = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'exists',
  'not_exists',
  'in',
  'not_in',
  'greater_than',
  'less_than',
] as const;

type ConditionOperator = (typeof conditionOperators)[number];

type ValueSource = 'static' | 'last_user_message' | 'button_payload' | 'list_payload';

type AssignStrategy = 'round_robin' | 'specific';

type TagOperation = 'add' | 'remove';

type WorkflowResponse = { success?: boolean; data?: WorkflowRecord[] | WorkflowRecord };

type VariableOption = 'id' | 'user_id' | 'phone' | 'email';
type VariableRow = {
  id: string;
  token: string;
  value: VariableOption | 'select';
  fallback: string;
};

const buildPayloadFromTitle = (title: string) => {
  if (!title) {
    return '';
  }
  return title
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
};

const getStoredStoreId = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  return (
    window.localStorage.getItem('selectedStore') || window.localStorage.getItem('bb_store_id') || ''
  );
};

const getAuthToken = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.localStorage.getItem('bb_token') || window.localStorage.getItem('token') || '';
};

const buildAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as HeadersInit;
};

const parseIsoDate = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

const toUiStatus = (status?: string): WorkflowStatus => {
  if (status === 'live') {
    return 'Live';
  }
  if (status === 'paused') {
    return 'Paused';
  }
  return 'Draft';
};

const Automation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [library, setLibrary] = useState<WorkflowLibraryItem[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<WorkflowStatus>('Draft');
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkflowLibraryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingWorkflowId, setPendingWorkflowId] = useState<string | null>(null);
  const [triggerSearch, setTriggerSearch] = useState('');

  const [workflowName, setWorkflowName] = useState('New Auto Reply');
  const [workflowDescription, setWorkflowDescription] = useState(
    'Auto reply customers based on their inbound message and context.'
  );
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [responseType, setResponseType] = useState<
    'custom' | 'multi_product' | 'workflow' | 'product_collection' | 'whatsapp_form'
  >('custom');

  const [triggerType, setTriggerType] = useState<TriggerType>('keyword');
  const [triggerValue, setTriggerValue] = useState('hi, hello, help');
  const [keywordMatch, setKeywordMatch] = useState<'equals' | 'any' | 'contains'>('equals');

  const [messageType, setMessageType] = useState<MessageType>('plain');
  const [messageText, setMessageText] = useState(
    'Hi! Thanks for reaching out. How can we help you today?'
  );
  const messageTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const collectionPickerRef = useRef<HTMLDivElement | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState('');
  const [attachmentFileName, setAttachmentFileName] = useState('');
  const [attachmentDataUrl, setAttachmentDataUrl] = useState('');
  const [attachmentMimeType, setAttachmentMimeType] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [variables, setVariables] = useState<VariableRow[]>([]);
  const [buttons, setButtons] = useState<ButtonConfig[]>([
    { title: 'Track order', payload: 'TRACK_ORDER' },
  ]);
  const [listTitle, setListTitle] = useState('Choose an option');
  const [listButtonText, setListButtonText] = useState('Pick one');
  const [listRows, setListRows] = useState<ListRowConfig[]>([
    { title: 'Delivery update', description: 'Get live ETA', payload: 'DELIVERY_UPDATE' },
    { title: 'Refund request', description: 'Start a return', payload: 'REFUND_REQUEST' },
  ]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [templateName, setTemplateName] = useState('support_quick_reply');
  const [templateLanguage, setTemplateLanguage] = useState('en_US');
  const [catalogId, setCatalogId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const [collectionSearch, setCollectionSearch] = useState('');
  const [catalogCollections, setCatalogCollections] = useState<
    { id: string; name: string; product_count?: number | null }[]
  >([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState('all');
  const [activeCollectionId, setActiveCollectionId] = useState('all');

  const [logicEnabled, setLogicEnabled] = useState(false);
  const [conditionLeftType, setConditionLeftType] = useState<ConditionLeftType>('field');
  const [conditionLeftValue, setConditionLeftValue] = useState('purchase_total');
  const [conditionOperator, setConditionOperator] = useState<ConditionOperator>('greater_than');
  const [conditionRightValue, setConditionRightValue] = useState('5000');
  const [defaultReplyText, setDefaultReplyText] = useState(
    'Let us know if you need anything else.'
  );
  const [applyActionsOnDefault, setApplyActionsOnDefault] = useState(false);

  const [updateFieldEnabled, setUpdateFieldEnabled] = useState(false);
  const [updateFieldName, setUpdateFieldName] = useState('last_intent');
  const [updateFieldSource, setUpdateFieldSource] = useState<ValueSource>('static');
  const [updateFieldValue, setUpdateFieldValue] = useState('support');

  const [setTagEnabled, setSetTagEnabled] = useState(true);
  const [tagOperation, setTagOperation] = useState<TagOperation>('add');
  const [tagValue, setTagValue] = useState('auto_reply');

  const [assignAgentEnabled, setAssignAgentEnabled] = useState(false);
  const [assignStrategy, setAssignStrategy] = useState<AssignStrategy>('round_robin');
  const [assignAgentId, setAssignAgentId] = useState('');

  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookId, setWebhookId] = useState('');
  const [webhookPayload, setWebhookPayload] = useState<WebhookPayloadItem[]>([
    { key: 'customer_phone', value_source: 'last_user_message' },
  ]);

  const [handoffEnabled, setHandoffEnabled] = useState(false);
  const [handoffReason, setHandoffReason] = useState('Customer asked for help');

  const updateButton = (index: number, next: ButtonConfig) => {
    setButtons(buttons.map((item, idx) => (idx === index ? next : item)));
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, idx) => idx !== index));
  };

  const addButtonField = () => {
    if (buttons.length >= 3) {
      return;
    }
    setButtons([...buttons, { title: '', payload: '' }]);
  };

  const addVariableRow = () => {
    const nextIndex = variables.length + 1;
    const token = `{{${nextIndex}}}`;
    setVariables([
      ...variables,
      {
        id: `${Date.now()}_${nextIndex}`,
        token,
        value: 'select',
        fallback: '',
      },
    ]);
    setMessageText(prev => `${prev}${prev ? ' ' : ''}${token}`);
  };

  const addKeyword = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    if (keywords.some(keyword => keyword.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    setKeywords([...keywords, trimmed]);
  };

  const removeKeyword = (value: string) => {
    setKeywords(keywords.filter(keyword => keyword !== value));
  };

  const updateVariableRow = (rowId: string, updates: Partial<VariableRow>) => {
    setVariables(variables.map(row => (row.id === rowId ? { ...row, ...updates } : row)));
  };

  const removeVariableRow = (rowId: string) => {
    setVariables(variables.filter(row => row.id !== rowId));
  };

  const addListRow = () => {
    setListRows([...listRows, { title: '', description: '', payload: '' }]);
  };

  const updateListRow = (index: number, next: ListRowConfig) => {
    setListRows(listRows.map((item, idx) => (idx === index ? next : item)));
  };

  const removeListRow = (index: number) => {
    setListRows(listRows.filter((_, idx) => idx !== index));
  };

  const addWebhookPayloadRow = () => {
    setWebhookPayload([...webhookPayload, { key: '', value_source: 'static' }]);
  };

  const updateWebhookPayloadRow = (index: number, next: WebhookPayloadItem) => {
    setWebhookPayload(webhookPayload.map((item, idx) => (idx === index ? next : item)));
  };

  const removeWebhookPayloadRow = (index: number) => {
    setWebhookPayload(webhookPayload.filter((_, idx) => idx !== index));
  };

  useEffect(() => {
    return () => {
      if (attachmentPreviewUrl) {
        URL.revokeObjectURL(attachmentPreviewUrl);
      }
    };
  }, [attachmentPreviewUrl]);

  const loadCatalogConfig = async () => {
    try {
      const response = await fetch('/api/whatsapp/catalog', {
        headers: buildAuthHeaders(),
      });
      if (!response.ok) {
        return '';
      }
      const data = await response.json();
      const value = typeof data?.catalogId === 'string' ? data.catalogId : '';
      if (value) {
        setCatalogId(value);
        return value;
      }
      return '';
    } catch {
      return '';
    }
  };

  useEffect(() => {
    loadCatalogConfig();
  }, []);

  const loadCatalogProducts = async (targetCatalogId: string, collectionId?: string) => {
    if (!targetCatalogId.trim()) {
      setCatalogProducts(emptyProducts);
      return;
    }
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const query = new URLSearchParams({
        catalogId: targetCatalogId.trim(),
      });
      if (collectionId && collectionId !== 'all') {
        query.set('collectionId', collectionId);
      }
      const response = await fetch(`/api/whatsapp/catalog/products?${query.toString()}`, {
        headers: buildAuthHeaders(),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to load catalog products.');
      }
      const data = await response.json();
      const items = Array.isArray(data?.products) ? data.products : [];
      const normalized = items.map((item: ProductItem) => ({
        id: item.id || item.product_retailer_id,
        name: item.name,
        price: item.price,
        image: item.image,
        product_retailer_id: item.product_retailer_id || item.id,
      }));
      setCatalogProducts(normalized);
    } catch (error) {
      setCatalogProducts(emptyProducts);
      setCatalogError((error as Error).message || 'Unable to load catalog products.');
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadCatalogCollections = async (targetCatalogId: string) => {
    if (!targetCatalogId.trim()) {
      setCatalogCollections([]);
      setCollectionError('Catalog ID is required to load collections.');
      return;
    }
    setCollectionLoading(true);
    setCollectionError(null);
    try {
      const response = await fetch(
        `/api/whatsapp/catalog/collections?catalogId=${encodeURIComponent(targetCatalogId.trim())}`,
        { headers: buildAuthHeaders() }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to load catalog collections.');
      }
      const data = await response.json();
      const items = Array.isArray(data?.collections) ? data.collections : [];
      const normalized = items
        .map((item: { id?: string; name?: string; product_count?: number | null }) => ({
          id: item.id || '',
          name: item.name || 'Untitled collection',
          product_count: typeof item.product_count === 'number' ? item.product_count : null,
        }))
        .filter(item => item.id);
      setCatalogCollections(normalized);
    } catch (error) {
      setCatalogCollections([]);
      setCollectionError((error as Error).message || 'Unable to load catalog collections.');
    } finally {
      setCollectionLoading(false);
    }
  };

  useEffect(() => {
    if (!productModalOpen) {
      return;
    }

    const bootstrapCatalog = async () => {
      let effectiveCatalogId = catalogId.trim();
      if (!effectiveCatalogId) {
        const loaded = await loadCatalogConfig();
        effectiveCatalogId = loaded.trim();
      }

      if (!effectiveCatalogId) {
        setCatalogProducts(emptyProducts);
        setCatalogCollections([]);
        setCatalogError('Catalog ID is required to load products.');
        setCollectionError('Catalog ID is required to load collections.');
        return;
      }

      loadCatalogProducts(effectiveCatalogId, activeCollectionId);
      loadCatalogCollections(effectiveCatalogId);
    };

    bootstrapCatalog();
  }, [productModalOpen, catalogId, activeCollectionId]);

  useEffect(() => {
    if (!collectionPickerOpen) {
      return;
    }
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (collectionPickerRef.current && target && !collectionPickerRef.current.contains(target)) {
        setCollectionPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [collectionPickerOpen]);

  const insertIntoMessage = (value: string) => {
    const textarea = messageTextareaRef.current;
    if (!textarea) {
      setMessageText(prev => `${prev}${value}`);
      return;
    }
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    setMessageText(prev => `${prev.slice(0, start)}${value}${prev.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      const nextPos = start + value.length;
      textarea.setSelectionRange(nextPos, nextPos);
    });
  };

  const emojiOptions = ['😀', '🙂', '👍', '🙏', '🎉', '✨', '❤️', '✅'];

  const handleAttachmentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setAttachmentPreviewUrl(nextUrl);
    setAttachmentFileName(file.name);
    setAttachmentMimeType(file.type || '');
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setAttachmentDataUrl(result);
    };
    reader.readAsDataURL(file);
  };
  const buildWorkflowSpec = () => {
    const warnings: string[] = [];
    const nodes: Array<Record<string, unknown>> = [];
    const edges: Array<Record<string, unknown>> = [];

    const triggerId = 'trigger_1';
    const logicId = 'logic_1';
    const messageMatchId = 'message_match';
    const messageDefaultId = 'message_default';
    const endId = 'end_1';

    const addEdge = (
      from: string,
      to: string,
      condition: Record<string, unknown> = { type: 'always' }
    ) => {
      edges.push({ from, to, condition });
    };

    const triggerConfig = () => {
      if (triggerType === 'keyword') {
        if (keywordMatch !== 'any' && keywords.length === 0) {
          warnings.push(
            keywordMatch === 'contains'
              ? 'Add at least one Contains keyword to activate this flow.'
              : 'Add at least one Exact Match keyword to trigger this flow.'
          );
        }
        return {
          trigger_type: 'keyword',
          keywords,
          match: keywordMatch,
          case_sensitive: false,
        };
      }
      if (!triggerValue.trim()) {
        warnings.push('Trigger value is empty. Add keywords or IDs.');
      }
      if (triggerType === 'webhook') {
        return { trigger_type: 'webhook', webhook_id: triggerValue.trim() || 'webhook_id' };
      }
      if (triggerType === 'form_submit') {
        return { trigger_type: 'wa_form_submit', form_id: triggerValue.trim() || 'form_id' };
      }
      return { trigger_type: 'api_event', event_name: triggerValue.trim() || 'event_name' };
    };

    const buildMessageConfig = () => {
      const variablePayload = variables
        .filter(row => row.token && row.token.trim())
        .map(row => ({
          token: row.token,
          value: row.value,
          fallback: row.fallback || '',
        }));
      const cleanedButtons = buttons
        .map(button => ({
          title: button.title.trim(),
          payload: button.payload.trim() || buildPayloadFromTitle(button.title),
        }))
        .filter(button => button.title && button.payload);
      const hasButtons = cleanedButtons.length > 0;
      const attachment =
        attachmentDataUrl && attachmentFileName
          ? {
              name: attachmentFileName,
              url: attachmentDataUrl,
              mime_type: attachmentMimeType || null,
            }
          : null;
      if (!messageText.trim()) {
        warnings.push('Reply message text is empty.');
      }
      if (messageType === 'buttons' || (messageType === 'plain' && hasButtons)) {
        if (cleanedButtons.length === 0) {
          warnings.push('Buttons reply needs at least one button with title and payload.');
        }
        if (buttons.length > 3) {
          warnings.push('Buttons exceed WhatsApp max of 3.');
        }
        return {
          message_type: 'buttons',
          text: messageText,
          buttons: cleanedButtons,
          variables: variablePayload,
          attachment,
        };
      }
      if (messageType === 'product_list') {
        if (!catalogId.trim()) {
          warnings.push('Catalog ID is required for Multi Product messages.');
        }
        if (selectedProducts.length === 0) {
          warnings.push('Select at least one product for Multi Product messages.');
        }
        return {
          message_type: 'product_list',
          text: messageText,
          catalog_id: catalogId.trim() || null,
          section_title: listTitle || 'All Products',
          product_items: selectedProducts.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            product_retailer_id: product.product_retailer_id,
          })),
          variables: variablePayload,
          attachment,
        };
      }
      if (messageType === 'list') {
        const cleanedRows = listRows.filter(row => row.title.trim() && row.payload.trim());
        if (cleanedRows.length === 0) {
          warnings.push('List reply needs at least one row with title and payload.');
        }
        return {
          message_type: 'list',
          text: messageText,
          button_text: listButtonText,
          sections: [
            {
              title: listTitle,
              rows: cleanedRows,
            },
          ],
          variables: variablePayload,
          attachment,
        };
      }
      if (messageType === 'image' || messageType === 'video') {
        if (!mediaUrl.trim()) {
          warnings.push('Media URL is empty for image/video message.');
        }
        return {
          message_type: messageType,
          text: messageText,
          media_url: mediaUrl.trim() || null,
          variables: variablePayload,
          attachment,
        };
      }
      if (messageType === 'template') {
        if (!templateName.trim()) {
          warnings.push('Template name is empty.');
        }
        return {
          message_type: 'template',
          template_id: templateName,
          language: templateLanguage,
          variables: {
            store_name: 'BillBox',
          },
          attachment,
        };
      }
      return {
        message_type: 'plain',
        text: messageText,
        variables: variablePayload,
        attachment,
      };
    };

    nodes.push({
      id: triggerId,
      type: 'TRIGGER',
      name: 'Inbound trigger',
      config: triggerConfig(),
    });

    if (logicEnabled) {
      const left =
        conditionLeftType === 'field'
          ? `field:${conditionLeftValue}`
          : conditionLeftType === 'tag'
          ? `tag:${conditionLeftValue}`
          : 'last_reply';
      if (conditionLeftType !== 'last_reply' && !conditionLeftValue.trim()) {
        warnings.push('Condition left value is empty.');
      }
      if (!conditionRightValue.trim()) {
        warnings.push('Condition right value is empty.');
      }
      const expression = {
        left,
        op: conditionOperator,
        right: conditionRightValue,
      };

      nodes.push({
        id: logicId,
        type: 'LOGIC',
        name: 'Condition',
        config: {
          logic_type: 'condition',
          branches: [{ key: 'match', expression }],
          default_branch: 'default',
        },
      });

      nodes.push({
        id: messageMatchId,
        type: 'MESSAGE',
        name: 'Matched reply',
        config: buildMessageConfig(),
      });

      nodes.push({
        id: messageDefaultId,
        type: 'MESSAGE',
        name: 'Default reply',
        config: {
          message_type: 'plain',
          text: defaultReplyText,
        },
      });

      addEdge(triggerId, logicId);
      addEdge(logicId, messageMatchId, {
        type: 'branch',
        branch_key: 'match',
        expression,
      });
      addEdge(logicId, messageDefaultId, {
        type: 'branch',
        branch_key: 'default',
      });
    } else {
      nodes.push({
        id: messageMatchId,
        type: 'MESSAGE',
        name: 'Auto reply',
        config: buildMessageConfig(),
      });
      addEdge(triggerId, messageMatchId);
    }

    const actionNodes: Array<{ id: string; node: Record<string, unknown> }> = [];

    if (updateFieldEnabled) {
      if (!updateFieldName.trim()) {
        warnings.push('Update field name is empty.');
      }
      actionNodes.push({
        id: 'action_update_field',
        node: {
          id: 'action_update_field',
          type: 'ACTION',
          name: 'Update field',
          config: {
            action_type: 'update_field',
            field: updateFieldName,
            value_source: updateFieldSource,
            value: updateFieldValue,
          },
        },
      });
    }

    if (setTagEnabled) {
      if (!tagValue.trim()) {
        warnings.push('Tag value is empty.');
      }
      actionNodes.push({
        id: 'action_set_tag',
        node: {
          id: 'action_set_tag',
          type: 'ACTION',
          name: 'Set tag',
          config: {
            action_type: 'set_tag',
            op: tagOperation,
            tag: tagValue,
          },
        },
      });
    }

    if (assignAgentEnabled) {
      if (assignStrategy === 'specific' && !assignAgentId.trim()) {
        warnings.push('Agent id is required for specific assignment.');
      }
      actionNodes.push({
        id: 'action_assign_agent',
        node: {
          id: 'action_assign_agent',
          type: 'ACTION',
          name: 'Assign agent',
          config: {
            action_type: 'assign_agent',
            strategy: assignStrategy,
            agent_id: assignStrategy === 'specific' ? assignAgentId : null,
          },
        },
      });
    }

    if (webhookEnabled) {
      if (!webhookId.trim()) {
        warnings.push('Webhook id is empty.');
      }
      const payloadMap = webhookPayload.reduce<Record<string, string>>((acc, item) => {
        if (!item.key.trim()) {
          return acc;
        }
        acc[item.key.trim()] = item.value_source || 'static';
        return acc;
      }, {});
      actionNodes.push({
        id: 'action_webhook',
        node: {
          id: 'action_webhook',
          type: 'ACTION',
          name: 'Trigger webhook',
          config: {
            action_type: 'trigger_webhook',
            webhook_id: webhookId,
            payload_map: payloadMap,
          },
        },
      });
    }

    if (handoffEnabled) {
      actionNodes.push({
        id: 'action_handoff',
        node: {
          id: 'action_handoff',
          type: 'ACTION',
          name: 'Handoff to human',
          config: {
            action_type: 'handoff_to_human',
            reason: handoffReason,
          },
        },
      });
    }

    actionNodes.forEach(item => nodes.push(item.node));

    const defaultMessageId = logicEnabled ? messageDefaultId : messageMatchId;
    const firstMessageId = messageMatchId;
    const firstActionId = actionNodes[0]?.id || null;

    if (firstActionId) {
      addEdge(firstMessageId, firstActionId);
      if (logicEnabled) {
        if (applyActionsOnDefault) {
          addEdge(defaultMessageId, firstActionId);
        } else {
          addEdge(defaultMessageId, endId);
        }
      }
      actionNodes.forEach((action, index) => {
        const next = actionNodes[index + 1];
        if (next) {
          addEdge(action.id, next.id);
        } else {
          addEdge(action.id, endId);
        }
      });
    } else {
      addEdge(firstMessageId, endId);
      if (logicEnabled) {
        addEdge(defaultMessageId, endId);
      }
    }

    nodes.push({
      id: endId,
      type: 'END',
      name: 'End',
      config: { end_type: 'stop' },
    });

    return {
      metadata: {
        tenant_id: 'billbox',
        name: workflowName || 'Untitled workflow',
        description: workflowDescription,
        version: '1.0',
        channel: {
          type: 'whatsapp',
          whatsapp_number_id: 'wa_primary',
        },
        entry_point: triggerId,
        tags_used: setTagEnabled && tagValue.trim() ? [tagValue.trim()] : [],
        fields_used: updateFieldEnabled && updateFieldName.trim() ? [updateFieldName.trim()] : [],
        assumptions: [],
      },
      nodes,
      edges,
      validation_warnings: warnings,
    };
  };

  const workflowSpec = useMemo(buildWorkflowSpec, [
    workflowName,
    workflowDescription,
    triggerType,
    triggerValue,
    keywordMatch,
    keywords,
    messageType,
    messageText,
    buttons,
    listTitle,
    listButtonText,
    listRows,
    mediaUrl,
    templateName,
    templateLanguage,
    catalogId,
    selectedProducts,
    logicEnabled,
    conditionLeftType,
    conditionLeftValue,
    conditionOperator,
    conditionRightValue,
    defaultReplyText,
    applyActionsOnDefault,
    updateFieldEnabled,
    updateFieldName,
    updateFieldSource,
    updateFieldValue,
    setTagEnabled,
    tagOperation,
    tagValue,
    assignAgentEnabled,
    assignStrategy,
    assignAgentId,
    webhookEnabled,
    webhookId,
    webhookPayload,
    handoffEnabled,
    handoffReason,
  ]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) {
      return catalogProducts;
    }
    return catalogProducts.filter(
      product =>
        product.name.toLowerCase().includes(query) ||
        (product.product_retailer_id || '').toLowerCase().includes(query)
    );
  }, [productSearch, catalogProducts]);

  const workflowStats = useMemo(() => {
    const stats = {
      total: library.length,
      live: 0,
      paused: 0,
      draft: 0,
    };
    library.forEach(item => {
      if (item.status === 'Live') stats.live += 1;
      if (item.status === 'Paused') stats.paused += 1;
      if (item.status === 'Draft') stats.draft += 1;
    });
    return stats;
  }, [library]);

  const toggleProductSelection = (product: ProductItem) => {
    if (!product.product_retailer_id) {
      toast({
        title: 'Product missing retailer ID',
        description: 'This product cannot be sent in a WhatsApp catalog message.',
      });
      return;
    }
    setSelectedProducts(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      }
      if (prev.length >= 30) {
        return prev;
      }
      return [...prev, product];
    });
  };

  const applyCollectionSelection = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setActiveCollectionId(collectionId);
    setCollectionPickerOpen(false);
    if (catalogId.trim()) {
      loadCatalogProducts(catalogId, collectionId);
    }
  };

  const filteredCollections = useMemo(() => {
    const query = collectionSearch.trim().toLowerCase();
    if (!query) {
      return catalogCollections;
    }
    return catalogCollections.filter(collection => collection.name.toLowerCase().includes(query));
  }, [catalogCollections, collectionSearch]);

  const responsePreview = useMemo(() => {
    if (messageType === 'template') {
      return `Template: ${templateName || 'template_name'} (${templateLanguage})`;
    }
    if (messageType === 'buttons') {
      return `${messageText}\nButtons: ${buttons
        .filter(button => button.title.trim())
        .map(button => button.title)
        .join(', ')}`;
    }
    if (messageType === 'list') {
      return `${messageText}\nList: ${listRows
        .filter(row => row.title.trim())
        .map(row => row.title)
        .join(', ')}`;
    }
    if (messageType === 'product_list') {
      return `${messageText}\nProducts: ${selectedProducts
        .map(product => product.name)
        .join(', ')}`;
    }
    if (messageType === 'image' || messageType === 'video') {
      return `${messageText}\nMedia: ${mediaUrl || 'media_url'}`;
    }
    return messageText;
  }, [
    messageType,
    messageText,
    templateName,
    templateLanguage,
    buttons,
    listRows,
    selectedProducts,
    mediaUrl,
  ]);

  const resetWorkflow = () => {
    setActiveWorkflowId(null);
    setActiveStatus('Draft');
    setWorkflowName('New Auto Reply');
    setWorkflowDescription('Auto reply customers based on their inbound message and context.');
    setKeywordInput('');
    setKeywords([]);
    setResponseType('custom');
    setTriggerType('keyword');
    setTriggerValue('hi, hello, help');
    setKeywordMatch('equals');
    setMessageType('plain');
    setMessageText('Hi! Thanks for reaching out. How can we help you today?');
    setVariables([]);
    setButtons([{ title: 'Track order', payload: 'TRACK_ORDER' }]);
    setListTitle('Choose an option');
    setListButtonText('Pick one');
    setListRows([
      { title: 'Delivery update', description: 'Get live ETA', payload: 'DELIVERY_UPDATE' },
      { title: 'Refund request', description: 'Start a return', payload: 'REFUND_REQUEST' },
    ]);
    setCatalogId('');
    setSelectedProducts([]);
    setProductSearch('');
    setMediaUrl('');
    setTemplateName('support_quick_reply');
    setTemplateLanguage('en_US');
    setLogicEnabled(false);
    setConditionLeftType('field');
    setConditionLeftValue('purchase_total');
    setConditionOperator('greater_than');
    setConditionRightValue('5000');
    setDefaultReplyText('Let us know if you need anything else.');
    setApplyActionsOnDefault(false);
    setUpdateFieldEnabled(false);
    setUpdateFieldName('last_intent');
    setUpdateFieldSource('static');
    setUpdateFieldValue('support');
    setSetTagEnabled(true);
    setTagOperation('add');
    setTagValue('auto_reply');
    setAssignAgentEnabled(false);
    setAssignStrategy('round_robin');
    setAssignAgentId('');
    setWebhookEnabled(false);
    setWebhookId('');
    setWebhookPayload([{ key: 'customer_phone', value_source: 'last_user_message' }]);
    setHandoffEnabled(false);
    setHandoffReason('Customer asked for help');
  };

  const extractTriggerLabel = (spec?: Record<string, unknown>) => {
    const nodes = Array.isArray(spec?.nodes) ? (spec?.nodes as Array<any>) : [];
    const trigger = nodes.find(node => node?.type === 'TRIGGER');
    const config = trigger?.config || {};
    const triggerType = String(config.trigger_type || '');
    if (triggerType === 'keyword') {
      return `Keyword: ${(config.keywords || []).join(', ')}`;
    }
    if (triggerType === 'webhook') {
      return `Webhook: ${config.webhook_id || 'webhook'}`;
    }
    if (triggerType === 'wa_form_submit') {
      return `Form submit: ${config.form_id || 'form'}`;
    }
    if (triggerType === 'api_event') {
      return `API event: ${config.event_name || 'event'}`;
    }
    return 'Trigger: unknown';
  };

  const extractMessagePreview = (spec?: Record<string, unknown>) => {
    const nodes = Array.isArray(spec?.nodes) ? (spec?.nodes as Array<any>) : [];
    const message = nodes.find(node => node?.type === 'MESSAGE');
    if (!message?.config) {
      return 'Auto reply';
    }
    const config = message.config || {};
    const messageType = String(config.message_type || 'plain');
    if (messageType === 'template') {
      return `Template: ${config.template_id || 'template'}`;
    }
    if (messageType === 'image' || messageType === 'video') {
      return config.text || `Media reply (${messageType})`;
    }
    if (messageType === 'buttons' || messageType === 'list' || messageType === 'product_list') {
      return config.text || 'Auto reply';
    }
    return config.text || 'Auto reply';
  };

  const trimPreview = (value: string, maxLength = 64) => {
    if (!value) {
      return '';
    }
    if (value.length <= maxLength) {
      return value;
    }
    return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
  };

  const hydrateFromSpec = (record: WorkflowRecord) => {
    const spec = record.spec || {};
    const nodes = Array.isArray(spec.nodes) ? (spec.nodes as Array<any>) : [];
    const trigger = nodes.find(node => node.type === 'TRIGGER');
    const triggerConfig = trigger?.config || {};
    const triggerTypeRaw = triggerConfig.trigger_type;

    if (triggerTypeRaw === 'keyword') {
      setTriggerType('keyword');
      const storedKeywords = Array.isArray(triggerConfig.keywords) ? triggerConfig.keywords : [];
      setKeywords(storedKeywords.length ? storedKeywords : []);
      setKeywordInput('');
      const matchValue = triggerConfig.match;
      setKeywordMatch(matchValue === 'any' || matchValue === 'contains' ? matchValue : 'equals');
    } else if (triggerTypeRaw === 'webhook') {
      setTriggerType('webhook');
      setTriggerValue(triggerConfig.webhook_id || '');
    } else if (triggerTypeRaw === 'wa_form_submit') {
      setTriggerType('form_submit');
      setTriggerValue(triggerConfig.form_id || '');
    } else if (triggerTypeRaw === 'api_event') {
      setTriggerType('api_event');
      setTriggerValue(triggerConfig.event_name || '');
    }

    const logic = nodes.find(node => node.type === 'LOGIC');
    if (logic?.config?.logic_type === 'condition') {
      setLogicEnabled(true);
      const branch = Array.isArray(logic.config.branches) ? logic.config.branches[0] : null;
      const expr = branch?.expression || {};
      const left = String(expr.left || '');
      if (left.startsWith('field:')) {
        setConditionLeftType('field');
        setConditionLeftValue(left.replace('field:', ''));
      } else if (left.startsWith('tag:')) {
        setConditionLeftType('tag');
        setConditionLeftValue(left.replace('tag:', ''));
      } else {
        setConditionLeftType('last_reply');
        setConditionLeftValue('');
      }
      setConditionOperator((expr.op as ConditionOperator) || 'equals');
      setConditionRightValue(String(expr.right || ''));
    } else {
      setLogicEnabled(false);
    }

    const messageNodes = nodes.filter(node => node.type === 'MESSAGE');
    const matchMessage =
      messageNodes.find(node => node.name?.includes('Matched')) || messageNodes[0];
    const defaultMessage = messageNodes.find(node => node.name?.includes('Default'));
    if (matchMessage?.config) {
      const config = matchMessage.config;
      const messageTypeRaw = config.message_type;
      const configVariables = Array.isArray(config.variables) ? config.variables : [];
      const recordButtons = Array.isArray(record.buttons) ? record.buttons : [];
      if (messageTypeRaw === 'buttons') {
        setMessageType('buttons');
        const configButtons = Array.isArray(config.buttons) ? config.buttons : [];
        setButtons(configButtons.length ? configButtons : recordButtons);
        setResponseType('custom');
      } else if (messageTypeRaw === 'product_list') {
        setMessageType('product_list');
        setResponseType('multi_product');
        setCatalogId(config.catalog_id || '');
        const items = Array.isArray(config.product_items) ? config.product_items : [];
        setSelectedProducts(
          items.map((item: any) => ({
            id: item.id || item.product_retailer_id || '',
            name: item.name || 'Product',
            price: item.price || '',
            image: item.image || '',
            product_retailer_id: item.product_retailer_id || item.id || '',
          }))
        );
      } else if (messageTypeRaw === 'list') {
        setMessageType('list');
        const section = Array.isArray(config.sections) ? config.sections[0] : null;
        setListTitle(section?.title || 'Choose an option');
        setListButtonText(config.button_text || 'Pick one');
        setListRows(section?.rows || []);
        setResponseType('product_collection');
      } else if (messageTypeRaw === 'image') {
        setMessageType('image');
        setMediaUrl(config.media_url || '');
        setResponseType('custom');
      } else if (messageTypeRaw === 'video') {
        setMessageType('video');
        setMediaUrl(config.media_url || '');
        setResponseType('custom');
      } else if (messageTypeRaw === 'template') {
        setMessageType('template');
        setTemplateName(config.template_id || '');
        setTemplateLanguage(config.language || 'en_US');
        setResponseType('workflow');
      } else {
        setMessageType(recordButtons.length ? 'buttons' : 'plain');
        setResponseType('custom');
      }
      if (recordButtons.length && messageTypeRaw !== 'buttons') {
        setButtons(recordButtons);
      }
      setMessageText(config.text || '');
      const recordVariables = Array.isArray(record.variables) ? record.variables : [];
      if (configVariables.length) {
        setVariables(
          configVariables.map((row: any, index: number) => ({
            id: row.id || `${Date.now()}_${index + 1}`,
            token: row.token || `{{${index + 1}}}`,
            value: row.value || 'select',
            fallback: row.fallback || '',
          }))
        );
      } else if (recordVariables.length) {
        setVariables(
          recordVariables.map((row: any, index: number) => ({
            id: row.id || `${Date.now()}_${index + 1}`,
            token: row.token || `{{${index + 1}}}`,
            value: row.value || 'select',
            fallback: row.fallback || '',
          }))
        );
      } else {
        setVariables([]);
      }
    }
    if (defaultMessage?.config?.text) {
      setDefaultReplyText(defaultMessage.config.text);
    }

    const actionNodes = nodes.filter(node => node.type === 'ACTION');
    const updateField = actionNodes.find(node => node.config?.action_type === 'update_field');
    setUpdateFieldEnabled(Boolean(updateField));
    if (updateField) {
      setUpdateFieldName(updateField.config.field || '');
      setUpdateFieldSource(updateField.config.value_source || 'static');
      setUpdateFieldValue(updateField.config.value || '');
    }

    const setTag = actionNodes.find(node => node.config?.action_type === 'set_tag');
    setSetTagEnabled(Boolean(setTag));
    if (setTag) {
      setTagOperation(setTag.config.op || 'add');
      setTagValue(setTag.config.tag || '');
    }

    const assign = actionNodes.find(node => node.config?.action_type === 'assign_agent');
    setAssignAgentEnabled(Boolean(assign));
    if (assign) {
      setAssignStrategy(assign.config.strategy || 'round_robin');
      setAssignAgentId(assign.config.agent_id || '');
    }

    const webhook = actionNodes.find(node => node.config?.action_type === 'trigger_webhook');
    setWebhookEnabled(Boolean(webhook));
    if (webhook) {
      setWebhookId(webhook.config.webhook_id || '');
      const payloadMap = webhook.config.payload_map || {};
      const payloadItems = Object.keys(payloadMap).map(key => ({
        key,
        value_source: payloadMap[key],
      }));
      setWebhookPayload(payloadItems.length ? payloadItems : [{ key: '', value_source: 'static' }]);
    }

    const handoff = actionNodes.find(node => node.config?.action_type === 'handoff_to_human');
    setHandoffEnabled(Boolean(handoff));
    if (handoff) {
      setHandoffReason(handoff.config.reason || '');
    }
  };

  const fetchWorkflows = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/automation/workflows?storeId=${encodeURIComponent(id)}`, {
        headers: buildAuthHeaders(),
      });
      const payload = (await response.json()) as WorkflowResponse;
      if (!response.ok) {
        throw new Error(payload?.data ? 'Failed to load workflows.' : 'Unable to load workflows.');
      }
      const items = Array.isArray(payload.data) ? payload.data : [];
      const nextLibrary = items.map(item => ({
        id: item.workflow_id,
        name: item.name,
        status: toUiStatus(item.status),
        updatedAt: parseIsoDate(item.updated_at || item.created_at || ''),
        triggerLabel: extractTriggerLabel(item.spec),
        raw: item,
      }));
      setLibrary(nextLibrary);
    } catch (err) {
      setError((err as Error).message || 'Failed to load workflows.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = getStoredStoreId();
    setStoreId(stored);
    if (stored) {
      fetchWorkflows(stored);
    }
  }, []);

  const displayedLibrary = useMemo(() => {
    const search = triggerSearch.trim().toLowerCase();
    const filtered = search
      ? library.filter(item => item.triggerLabel.toLowerCase().includes(search))
      : library.slice();
    filtered.sort((a, b) => a.triggerLabel.localeCompare(b.triggerLabel));
    return filtered;
  }, [library, triggerSearch]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get('automationView');
    const workflowIdParam = params.get('workflowId');
    if (viewParam === 'edit') {
      setViewMode('edit');
    } else {
      setViewMode('list');
    }
    if (workflowIdParam) {
      setPendingWorkflowId(workflowIdParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (!pendingWorkflowId || library.length === 0) {
      return;
    }
    const item = library.find(entry => entry.id === pendingWorkflowId);
    if (item) {
      setActiveWorkflowId(item.id);
      setActiveStatus(item.status);
      setWorkflowName(item.raw.name || 'Untitled workflow');
      setWorkflowDescription(item.raw.description || '');
      hydrateFromSpec(item.raw);
      setViewMode('edit');
    }
    setPendingWorkflowId(null);
  }, [pendingWorkflowId, library]);

  const saveWorkflow = async (mode: 'draft' | 'publish' | 'pause') => {
    if (!storeId) {
      setError('Select a store to save workflows.');
      return;
    }
    const invalidVariable = variables.find(row => row.value === 'select' || !row.fallback.trim());
    const invalidButton = buttons.find(button => !button.title.trim());
    if (invalidVariable || invalidButton) {
      window.alert('Fill all variable values/fallbacks and button text before saving.');
      updateAutomationInUrl({ view: 'edit', workflowId: activeWorkflowId });
      return;
    }
    if (keywordMatch !== 'any' && keywords.length === 0) {
      const label = keywordMatch === 'contains' ? 'Contains' : 'Exact Match';
      window.alert(`Add at least one ${label} keyword to save this workflow.`);
      updateAutomationInUrl({ view: 'edit', workflowId: activeWorkflowId });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const storedKeywords = keywords.map(value => value.trim()).filter(Boolean);
      const storedButtons = buttons
        .map(button => ({
          title: button.title.trim(),
          payload: button.payload.trim() || buildPayloadFromTitle(button.title),
        }))
        .filter(button => button.title && button.payload);
      const storedVariables = variables.map(variable => ({
        token: variable.token,
        value: variable.value,
        fallback: variable.fallback,
      }));
      const payload = {
        name: workflowName,
        description: workflowDescription,
        status: mode === 'pause' ? 'paused' : 'draft',
        spec: workflowSpec,
        storeId,
        input_text: storedKeywords[0] || '',
        input_variations: storedKeywords.slice(1),
        message_text: messageText,
        buttons: storedButtons,
        variables: storedVariables,
      };

      let workflowId = activeWorkflowId;
      if (!workflowId) {
        const createResponse = await fetch('/api/automation/workflows', {
          method: 'POST',
          headers: buildAuthHeaders(),
          body: JSON.stringify(payload),
        });
        const createData = (await createResponse.json()) as WorkflowResponse;
        if (!createResponse.ok || !createData.data || Array.isArray(createData.data)) {
          throw new Error('Failed to save workflow.');
        }
        workflowId = createData.data.workflow_id;
        setActiveWorkflowId(workflowId);
        setActiveStatus(toUiStatus(createData.data.status));
      } else {
        const updateResponse = await fetch(`/api/automation/workflows/${workflowId}`, {
          method: 'PUT',
          headers: buildAuthHeaders(),
          body: JSON.stringify(payload),
        });
        if (!updateResponse.ok) {
          throw new Error('Failed to update workflow.');
        }
      }

      if (mode === 'publish' && workflowId) {
        const publishResponse = await fetch(`/api/automation/workflows/${workflowId}/publish`, {
          method: 'POST',
          headers: buildAuthHeaders(),
        });
        if (!publishResponse.ok) {
          throw new Error('Failed to publish workflow.');
        }
        setActiveStatus('Live');
      }

      if (mode === 'pause' && workflowId) {
        const pauseResponse = await fetch(`/api/automation/workflows/${workflowId}/pause`, {
          method: 'POST',
          headers: buildAuthHeaders(),
        });
        if (!pauseResponse.ok) {
          throw new Error('Failed to pause workflow.');
        }
        setActiveStatus('Paused');
      }

      await fetchWorkflows(storeId);
      setViewMode('list');
      updateAutomationInUrl({ view: null, workflowId: null });
    } catch (err) {
      setError((err as Error).message || 'Failed to save workflow.');
    } finally {
      setSaving(false);
    }
  };

  function updateAutomationInUrl(
    params: { view?: 'list' | 'edit' | null; workflowId?: string | null },
    options?: { replace?: boolean }
  ) {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', 'automation');
    if (params.view) {
      searchParams.set('automationView', params.view);
    } else {
      searchParams.delete('automationView');
    }
    if (params.workflowId) {
      searchParams.set('workflowId', params.workflowId);
    } else if (params.workflowId !== undefined) {
      searchParams.delete('workflowId');
    }
    const searchString = searchParams.toString();
    navigate(
      {
        pathname: location.pathname,
        search: searchString ? `?${searchString}` : '',
      },
      { replace: options?.replace ?? false }
    );
  }

  const handleSelectWorkflow = (item: WorkflowLibraryItem) => {
    setActiveWorkflowId(item.id);
    setActiveStatus(item.status);
    setWorkflowName(item.raw.name || 'Untitled workflow');
    setWorkflowDescription(item.raw.description || '');
    hydrateFromSpec(item.raw);
    setViewMode('edit');
    updateAutomationInUrl({ view: 'edit', workflowId: item.id });
  };

  const handleAddNewReply = () => {
    resetWorkflow();
    setError(null);
    setViewMode('edit');
    updateAutomationInUrl({ view: 'edit', workflowId: null });
  };

  const handleBackToList = () => {
    setViewMode('list');
    updateAutomationInUrl({ view: null, workflowId: null });
  };

  const handleDeleteWorkflow = async () => {
    if (!deleteTarget || !storeId) {
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/automation/workflows/${deleteTarget.id}?storeId=${encodeURIComponent(storeId)}`,
        {
          method: 'DELETE',
          headers: buildAuthHeaders(),
        }
      );
      if (!response.ok) {
        throw new Error('Failed to delete workflow.');
      }
      setDeleteTarget(null);
      await fetchWorkflows(storeId);
    } catch (err) {
      setError((err as Error).message || 'Failed to delete workflow.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && null}

      {viewMode === 'list' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#5C5FC8]/20 bg-gradient-to-br from-white via-[#5C5FC8]/[0.08] to-[#5C5FC8]/[0.16] p-4 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center rounded-full bg-[#5C5FC8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#5C5FC8]">
                  Automation
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-gray-900 md:text-3xl">
                  Custom Auto Replies
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-gray-600">
                  Manage trigger-based WhatsApp replies in one place. Search by trigger to find and
                  edit flows faster.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
                <Button className="w-full md:w-auto" onClick={handleAddNewReply}>
                  Add New Custom Reply
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#5C5FC8] px-4 py-2 text-sm font-semibold text-white shadow">
                  WhatsApp
                </span>
              </div>
              <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                <span className="text-gray-400">⌕</span>
                <input
                  className="w-full bg-transparent text-sm text-gray-700 outline-none"
                  placeholder="Search by Trigger"
                  value={triggerSearch}
                  onChange={event => setTriggerSearch(event.target.value)}
                />
              </div>
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-gradient-to-r from-slate-50 via-white to-slate-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Trigger</th>
                    <th className="px-4 py-3">Action Type</th>
                    <th className="px-4 py-3">Action Preview</th>
                    <th className="px-4 py-3">Created/Updated</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td className="px-4 py-6 text-gray-500" colSpan={6}>
                        Loading workflows...
                      </td>
                    </tr>
                  )}
                  {!loading && displayedLibrary.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-gray-500" colSpan={6}>
                        No custom auto replies yet. Click "Add New Custom Reply" to create one.
                      </td>
                    </tr>
                  )}
                  {displayedLibrary.map(item => {
                    const createdAt = parseIsoDate(item.raw.created_at || '');
                    const updatedAt = parseIsoDate(item.raw.updated_at || '');
                    const preview = extractMessagePreview(item.raw.spec);
                    return (
                      <tr
                        key={item.id}
                        className="group cursor-pointer border-b last:border-b-0 hover:bg-slate-50/80"
                        onClick={() => handleSelectWorkflow(item)}
                      >
                        <td className="px-4 py-4 text-gray-900">
                          <div className="flex items-center gap-3">
                            <span className="hidden h-2 w-2 rounded-full bg-[#5C5FC8] md:inline-block" />
                            <span className="font-medium">{item.triggerLabel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            Auto replies
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {trimPreview(preview || '') || 'Auto reply'}
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-500">
                          <div>Created {createdAt || '--'}</div>
                          <div>Updated {updatedAt || '--'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              statusStyles[item.status]
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              className="rounded-md border border-gray-200 px-2 py-1 text-lg text-gray-600 hover:bg-gray-50"
                              onClick={event => {
                                event.stopPropagation();
                                setMenuOpenId(prev => (prev === item.id ? null : item.id));
                              }}
                            >
                              ⋮
                            </button>
                            {menuOpenId === item.id && (
                              <div
                                className="absolute right-0 bottom-full z-10 mb-2 w-40 rounded-md border border-gray-200 bg-white p-1 text-sm shadow"
                                onClick={event => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  className="w-full rounded px-3 py-2 text-left text-gray-700 hover:bg-gray-100"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    handleSelectWorkflow(item);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    setDeleteTarget(item);
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 md:hidden">
              {loading && (
                <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500">
                  Loading workflows...
                </div>
              )}
              {!loading && displayedLibrary.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                  No custom auto replies yet. Tap "Add New Custom Reply" to create one.
                </div>
              )}
              {displayedLibrary.map(item => {
                const createdAt = parseIsoDate(item.raw.created_at || '');
                const updatedAt = parseIsoDate(item.raw.updated_at || '');
                const preview = extractMessagePreview(item.raw.spec);
                return (
                  <div
                    key={`card-${item.id}`}
                    className="rounded-xl border border-gray-200 p-4 shadow-sm"
                    onClick={() => handleSelectWorkflow(item)}
                    role="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Trigger
                        </div>
                        <div className="mt-1 text-sm font-semibold text-gray-900">
                          {item.triggerLabel}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                          statusStyles[item.status]
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Action Preview
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      {trimPreview(preview || '', 120) || 'Auto reply'}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        <div className="font-semibold text-gray-400">Created</div>
                        <div>{createdAt || '--'}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-400">Updated</div>
                        <div>{updatedAt || '--'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {deleteTarget && (
            <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
              <div className="w-full max-w-lg rounded-lg bg-white shadow-lg">
                <div className="rounded-t-lg bg-emerald-700 px-6 py-4 text-center text-white">
                  Delete the Custom Auto Reply
                </div>
                <div className="px-6 py-6 text-center text-sm text-gray-600">
                  Are you sure you want to delete the Custom Auto Reply? You have the option to edit
                  and make changes as well. Once deleted, this Auto Reply would have to be set up
                  again.
                </div>
                <div className="flex items-center justify-center gap-4 px-6 pb-6">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleting}
                  >
                    No
                  </Button>
                  <Button onClick={handleDeleteWorkflow} disabled={deleting}>
                    {deleting ? 'Deleting...' : "Yes, I'm sure"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'edit' && (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center rounded-full bg-[#5C5FC8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#5C5FC8]">
                Customer Auto Replies
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-gray-900">Customer Auto Replies</h2>
              <p className="mt-2 text-sm text-gray-600">
                Configure customer triggers and auto replies. Add keywords to trigger this flow.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleBackToList}>
              Back to list
            </Button>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-semibold text-gray-700">Trigger</div>
            <p className="mt-2 text-xs text-gray-500">
              How would you like to trigger the automation?
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-700">
              {[
                { key: 'equals', label: 'Exact Match' },
                { key: 'any', label: 'Any Keyword' },
                { key: 'contains', label: 'Contains' },
              ].map(option => (
                <label key={option.key} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="keyword-match"
                    className="h-4 w-4"
                    checked={keywordMatch === option.key}
                    onChange={() => setKeywordMatch(option.key as typeof keywordMatch)}
                  />
                  {option.label}
                </label>
              ))}
            </div>

            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <label className="text-sm font-semibold text-gray-700">
                Enter the keywords that trigger this flow
              </label>
              <p className="mt-2 text-xs text-gray-500">
                {keywordMatch === 'any'
                  ? 'Any Keyword: automation runs for any inbound customer message.'
                  : keywordMatch === 'contains'
                  ? 'Contains: automation runs if customer message contains any listed keyword as text.'
                  : 'Exact Match: automation runs only when the full message exactly equals one listed keyword.'}
              </p>
              {keywordMatch !== 'any' && keywords.length === 0 && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {keywordMatch === 'contains'
                    ? 'Add at least one Contains keyword to activate this trigger.'
                    : 'Add at least one Exact Match keyword to activate this trigger.'}
                </div>
              )}
              <div className="relative mt-3">
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-40 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={keywordInput}
                  disabled={keywordMatch === 'any'}
                  maxLength={100}
                  onChange={event => setKeywordInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addKeyword(keywordInput);
                      setKeywordInput('');
                    }
                  }}
                  placeholder={
                    keywordMatch === 'any'
                      ? 'Disabled for Any Keyword mode'
                      : 'Type a keyword and press Enter'
                  }
                />
                <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-4 text-xs">
                  <span className="text-blue-600">&larr; Press Enter</span>
                  <span className="text-gray-400">{keywordInput.length}/100</span>
                </div>
              </div>
              {keywords.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {keywords.map(keyword => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      {keyword}
                      <button
                        type="button"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xl font-black leading-none text-emerald-700 hover:bg-emerald-200 hover:text-emerald-900"
                        onClick={() => removeKeyword(keyword)}
                        aria-label={`Remove ${keyword}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">Custom Auto Reply</h2>
            <p className="mt-2 text-sm text-gray-600">
              Configure the type of auto reply triggered when the keyword match fires.
            </p>

            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700">Select response type</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { key: 'custom', label: 'Custom Message' },
                  { key: 'multi_product', label: 'Multi Product Message' },
                ].map(option => (
                  <label key={option.key} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="response-type"
                      className="h-4 w-4"
                      checked={responseType === option.key}
                      onChange={() => {
                        setResponseType(option.key as typeof responseType);
                        if (option.key === 'custom') {
                          setMessageType('plain');
                        } else if (option.key === 'multi_product') {
                          setMessageType('product_list');
                        }
                      }}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 max-w-2xl">
              <label className="text-sm font-semibold text-gray-700">Message body</label>
              {attachmentPreviewUrl && (
                <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                  <img
                    src={attachmentPreviewUrl}
                    alt={attachmentFileName || 'Selected attachment'}
                    className="max-h-48 w-auto rounded"
                  />
                  {attachmentFileName && (
                    <div className="mt-2 text-xs text-gray-500">{attachmentFileName}</div>
                  )}
                </div>
              )}
              <div className="relative mt-3">
                <textarea
                  ref={messageTextareaRef}
                  className="h-40 w-full resize-none rounded-md border border-gray-300 px-3 py-2 pr-16 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={messageText}
                  maxLength={1024}
                  onChange={event => setMessageText(event.target.value)}
                />
                <span className="pointer-events-none absolute right-3 bottom-2 text-xs text-gray-400">
                  {messageText.length}/1024
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <button
                  type="button"
                  className="text-sm font-semibold text-emerald-600"
                  onClick={addVariableRow}
                >
                  + Add variable
                </button>
                <div className="relative flex items-center gap-2 text-gray-400">
                  <button
                    type="button"
                    className="rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700"
                    onClick={() => setEmojiPickerOpen(prev => !prev)}
                    aria-label="Add emoji"
                  >
                    😊
                  </button>
                  <button
                    type="button"
                    className="rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700"
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    Attach
                  </button>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAttachmentSelect}
                  />
                  {emojiPickerOpen && (
                    <div className="absolute right-0 top-8 z-10 grid w-40 grid-cols-4 gap-2 rounded-md border border-gray-200 bg-white p-2 text-base shadow">
                      {emojiOptions.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className="rounded p-1 hover:bg-gray-100"
                          onClick={() => {
                            insertIntoMessage(emoji);
                            setEmojiPickerOpen(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {variables.length > 0 && (
              <div className="mt-6 max-w-2xl space-y-4">
                {variables.map(row => (
                  <div key={row.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">Variable</span>
                      <button
                        type="button"
                        className="text-lg font-bold text-red-500 hover:text-red-600"
                        onClick={() => removeVariableRow(row.id)}
                        aria-label="Remove variable"
                      >
                        ×
                      </button>
                    </div>
                    <input
                      className="mt-2 w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700"
                      value={row.token}
                      readOnly
                    />
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-gray-600">Value</div>
                        <select
                          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          value={row.value}
                          onChange={event =>
                            updateVariableRow(row.id, {
                              value: event.target.value as VariableRow['value'],
                            })
                          }
                        >
                          <option value="select">Select option</option>
                          <option value="id">id</option>
                          <option value="user_id">User Id</option>
                          <option value="phone">Phone Number</option>
                          <option value="email">Email</option>
                        </select>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-600">Fallback value</div>
                        <input
                          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Fallback value"
                          value={row.fallback}
                          onChange={event =>
                            updateVariableRow(row.id, { fallback: event.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {responseType === 'multi_product' && (
              <div className="mt-6 max-w-3xl space-y-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-gray-600">
                    You can send upto 30 products in this message type
                  </p>
                  {selectedProducts.length === 0 ? (
                    <Button
                      className="w-fit bg-emerald-600 px-4 py-1 text-sm text-white hover:bg-emerald-700"
                      onClick={() => setProductModalOpen(true)}
                    >
                      + Select Products
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2 text-sm text-emerald-700">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          ✓
                        </span>
                        {selectedProducts.length} products selected
                      </span>
                      <button
                        type="button"
                        className="w-fit text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                        onClick={() => setProductModalOpen(true)}
                      >
                        Edit Products →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {responseType === 'custom' && (
              <div className="mt-6 max-w-lg">
                <label className="text-sm font-semibold text-gray-700">Buttons (Optional)</label>
                <div className="mt-3 space-y-3">
                  {buttons.slice(0, 3).map((button, index) => (
                    <div key={`btn-${index}`} className="relative">
                      <input
                        className="w-full rounded-md border border-gray-300 px-3 py-2 pr-16 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={button.title}
                        maxLength={20}
                        placeholder={`Button text ${index + 1}`}
                        onChange={event =>
                          updateButton(index, {
                            title: event.target.value,
                            payload: buildPayloadFromTitle(event.target.value),
                          })
                        }
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {button.title.length}/20
                      </span>
                      <button
                        type="button"
                        className="absolute right-12 top-1/2 -translate-y-1/2 text-lg font-bold text-red-500 hover:text-red-600"
                        onClick={() => removeButton(index)}
                        aria-label="Remove button"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addButtonField}
                    disabled={buttons.length >= 3}
                  >
                    + Add Button
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-end gap-3">
              <Button onClick={() => saveWorkflow('publish')} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {productModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 lg:p-6">
              <div className="flex h-[88vh] w-full max-w-[90vw] flex-col overflow-hidden rounded-xl bg-white shadow-xl lg:max-w-6xl">
                <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">Select Products</div>
                    <div className="text-xs text-gray-500">
                      You can only select upto 30 products
                    </div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-3xl font-black leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    onClick={() => setProductModalOpen(false)}
                    aria-label="Close product selector"
                  >
                    ×
                  </button>
                </div>

                <div className="grid flex-1 min-h-0 gap-0 overflow-hidden lg:grid-cols-[2.6fr_1fr]">
                  <div className="flex min-h-0 flex-col border-r border-gray-200 px-6 py-5">
                    <div className="text-sm font-semibold text-gray-900">
                      Browse products from your Facebook catalog
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Catalog ID: {catalogId ? catalogId : 'Not set'}
                    </div>
                    <div className="mt-6">
                      <div className="text-sm font-semibold text-gray-900">
                        Start by Browsing and Adding Collection(s) by Name
                      </div>
                      <div ref={collectionPickerRef} className="relative mt-3 w-full max-w-sm">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600"
                          onClick={() => setCollectionPickerOpen(prev => !prev)}
                        >
                          + Select Collection
                        </button>
                        {collectionPickerOpen && (
                          <div className="absolute left-0 top-8 z-30 flex max-h-[52vh] w-[min(24rem,calc(100vw-4rem))] flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                            <input
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              placeholder="Search a collection"
                              value={collectionSearch}
                              onChange={event => setCollectionSearch(event.target.value)}
                            />
                            <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1 text-sm text-gray-700">
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="collection"
                                  checked={selectedCollectionId === 'all'}
                                  onChange={() => applyCollectionSelection('all')}
                                />
                                All Products
                              </label>
                              {collectionLoading && (
                                <div className="text-xs text-gray-400">Loading collections...</div>
                              )}
                              {!collectionLoading && collectionError && (
                                <div className="text-xs text-red-500">{collectionError}</div>
                              )}
                              {!collectionLoading &&
                                !collectionError &&
                                filteredCollections.length === 0 && (
                                  <div className="text-xs text-gray-400">No collections found.</div>
                                )}
                              {!collectionLoading &&
                                !collectionError &&
                                filteredCollections.map(collection => (
                                  <label key={collection.id} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name="collection"
                                      checked={selectedCollectionId === collection.id}
                                      onChange={() => applyCollectionSelection(collection.id)}
                                    />
                                    <span className="flex-1">{collection.name}</span>
                                    {typeof collection.product_count === 'number' && (
                                      <span className="text-xs text-gray-400">
                                        {collection.product_count}
                                      </span>
                                    )}
                                  </label>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 text-xs font-semibold text-gray-600">Search by</div>
                    <input
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Enter the Product Name here"
                      value={productSearch}
                      onChange={event => setProductSearch(event.target.value)}
                    />

                    <div className="mt-5 flex-1 min-h-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-4">
                      {catalogLoading ? (
                        <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                          Loading catalog products...
                        </div>
                      ) : catalogError ? (
                        <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                          {catalogError}
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                          No products found for this catalog.
                        </div>
                      ) : (
                        <div className="h-full overflow-y-auto pr-2 pb-2">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                            {filteredProducts.map(product => {
                              const isSelected = selectedProducts.some(
                                item => item.id === product.id
                              );
                              return (
                                <button
                                  key={product.id}
                                  type="button"
                                  className={`relative rounded-md border bg-white p-2 text-left shadow-sm ${
                                    isSelected
                                      ? 'border-emerald-600 ring-2 ring-emerald-200'
                                      : 'border-gray-200'
                                  }`}
                                  onClick={() => toggleProductSelection(product)}
                                >
                                  <div className="relative h-24 w-full overflow-hidden rounded-md bg-white">
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                      decoding="async"
                                    />
                                    <span
                                      className={`absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded border text-xs ${
                                        isSelected
                                          ? 'border-emerald-600 bg-emerald-600 text-white'
                                          : 'border-gray-300 bg-white text-gray-400'
                                      }`}
                                    >
                                      ✓
                                    </span>
                                  </div>
                                  <div className="mt-2 text-xs font-semibold text-gray-800">
                                    {product.name}
                                  </div>
                                  <div className="text-xs text-gray-500">{product.price}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col px-6 py-5">
                    <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                      <span>Selected Products</span>
                      <span className="text-xs text-gray-500">{selectedProducts.length} / 30</span>
                    </div>
                    <div className="mt-4 flex-1 min-h-0 overflow-hidden">
                      {selectedProducts.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-gray-400">
                          <div className="text-2xl">[ ]</div>
                          <div>No products are selected to preview</div>
                        </div>
                      ) : (
                        <div className="h-full overflow-y-auto pr-2 pb-2">
                          <div className="grid gap-3">
                            {selectedProducts.map(product => (
                              <div
                                key={product.id}
                                className="flex items-center gap-3 rounded-md border border-gray-200 p-2"
                              >
                                <div className="h-12 w-12 overflow-hidden rounded-md bg-gray-100">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs font-semibold text-gray-800">
                                    {product.name}
                                  </div>
                                  <div className="text-xs text-gray-500">{product.price}</div>
                                </div>
                                <button
                                  type="button"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-200 text-xl font-black leading-none text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => toggleProductSelection(product)}
                                  aria-label={`Remove ${product.name}`}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end px-6 py-4">
                  <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => setProductModalOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Automation;
