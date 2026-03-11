import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Image,
  FileText,
  Loader2,
  MessageCircle,
  PenSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smile,
  XCircle,
  MapPin,
  Download,
  X,
  MoreHorizontal,
  Reply,
  Zap,
  LayoutGrid,
  Paperclip,
} from 'lucide-react';
import { getStoredWhatsAppConfig } from '@/lib/whatsappConfig';

const runtimeOnboardingLink = (
  ((import.meta.env as Record<string, string | undefined>)?.VITE_ONBOARDING_LINK ??
    (import.meta.env as Record<string, string | undefined>)?.ONBOARDING_LINK ??
    '') ||
  ''
).trim();
const notificationSoundPath = '/tones/tone1.mp3';
const orderRingSoundPath = '/tones/tone1.mp3';
const ORDER_RING_DURATION_MS = 10_000;
const ORDER_RING_PULSE_MS = 350;
const QUICK_EMOJIS = [
  '😀',
  '😁',
  '😂',
  '😍',
  '😎',
  '🥳',
  '🤝',
  '🙏',
  '👍',
  '👏',
  '🎉',
  '❤️',
  '🔥',
  '💡',
  '📣',
  '✅',
];

const normalizePhoneKey = (value?: string | null) => {
  if (!value) return '';
  const digits = value.toString().replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
};

const normalizeDigits = (value?: string | null) => (value ? value.replace(/\D/g, '') : '');

const getContactDisplayName = (contact: Contact) => {
  const name = (contact.name || '').trim();
  const phone = contact.phone?.trim();
  const normalizedPhone = normalizeDigits(phone);
  const normalizedNameDigits = normalizeDigits(name);

  const looksMasked =
    !name ||
    name.toLowerCase().startsWith('customer') ||
    name.includes('*') ||
    (normalizedNameDigits && normalizedNameDigits === normalizedPhone);

  if (looksMasked) {
    return phone || name || 'Unknown contact';
  }

  return name;
};

const preferPhoneNumber = (current?: string | null, candidate?: string | null) => {
  if (!candidate || !candidate.trim()) return current ?? '';
  if (!current || !current.trim()) return candidate;
  const trimmedCurrent = current.trim();
  const trimmedCandidate = candidate.trim();
  const candidateHasPlus = trimmedCandidate.startsWith('+');
  const currentHasPlus = trimmedCurrent.startsWith('+');

  if (candidateHasPlus && !currentHasPlus) {
    return trimmedCandidate;
  }

  if (candidateHasPlus === currentHasPlus && trimmedCandidate.length > trimmedCurrent.length) {
    return trimmedCandidate;
  }

  return trimmedCurrent;
};

const getConversationKey = (contact?: {
  normalizedPhone?: string;
  phone?: string;
  id?: string;
}) => {
  if (!contact) {
    return '';
  }
  return contact.normalizedPhone || normalizePhoneKey(contact.phone) || contact.id || '';
};

interface Contact {
  id: string;
  phone: string;
  name: string;
  normalizedPhone?: string;
  allPhones?: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  segment?: string;
  lastStatus?: string;
  messagesReceived?: number;
  messagesSent?: number;
  hasInbound?: boolean;
  lastInboundTime?: string | null;
}

interface ChatMedia {
  id: string;
  url?: string | null;
  caption?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  sha256?: string | null;
}

interface ChatLocation {
  latitude?: number | null;
  longitude?: number | null;
  name?: string | null;
  address?: string | null;
  url?: string | null;
}

interface OrderItem {
  product_retailer_id?: string | null;
  item_id?: string | null;
  name?: string | null;
  quantity?: number | string | null;
  item_price?: number | string | null;
  currency?: string | null;
}

interface OrderMetadata {
  catalog_id?: string | null;
  text?: string | null;
  product_items?: OrderItem[] | null;
}

interface ChatMessage {
  id: string;
  type: 'received' | 'sent' | 'system';
  text: string;
  timestamp: string;
  from: 'customer' | 'vendor' | 'system';
  status?: string | null;
  statusHistory?: Array<{ status: string; timestamp?: string }>;
  campaignName?: string | null;
  campaignId?: string | null;
  isCampaign?: boolean;
  templateName?: string | null;
  mediaId?: string | null;
  messageType?: string | null;
  media?: ChatMedia | null;
  location?: ChatLocation | null;
  orderMetadata?: OrderMetadata | null;
}

interface WebhookConfig {
  webhookUrl: string;
  verifyTokenSet: boolean;
  appSecretSet: boolean;
  lastUpdatedAt: string | null;
  lastValidatedAt: string | null;
}

interface OnboardingConfig {
  wabaId: string;
  phoneNumberId: string;
  businessPhone: string;
  businessId: string;
  appId: string;
  verifiedName: string;
  lastUpdatedAt: string | null;
  onboardingLink: string;
}

interface TemplateListItem {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  updatedAt: string;
  rejectedReason?: string;
  subCategory?: string;
  qualityScore?: string;
  components?: unknown;
}

type TemplateCategory = 'UTILITY' | 'MARKETING' | 'PROMOTIONAL';
type TemplateHeaderType = 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
type TemplateButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';

interface TemplateButtonDraft {
  id: string;
  type: TemplateButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
  example?: string;
}

interface TemplateFormState {
  name: string;
  category: TemplateCategory;
  language: string;
  headerType: TemplateHeaderType;
  headerText: string;
  headerMediaHandle: string;
  headerExampleText: string;
  bodyText: string;
  bodyExamples: string[];
  footerText: string;
  footerExample: string;
  buttons: TemplateButtonDraft[];
}

interface WebhookFormValues {
  webhookUrl: string;
  verifyToken: string;
  appSecret: string;
}

interface OnboardingFormValues {
  wabaId: string;
  phoneNumberId: string;
  businessPhone: string;
  businessId: string;
  appId: string;
  verifiedName: string;
}

interface OnboardingWebhookSnapshot {
  wabaId?: string | null;
  phoneNumberId?: string | null;
  businessId?: string | null;
  appId?: string | null;
  verifiedName?: string | null;
  businessPhone?: string | null;
  displayPhoneNumber?: string | null;
  webhookVerifyToken?: string | null;
  accessToken?: string | null;
  eventType?: string | null;
  capturedAt?: string | null;
}

interface PhoneNumberRecord {
  id: string;
  display_phone_number?: string;
  verified_name?: string;
  status?: string;
  quality_rating?: string;
  search_visibility?: string;
  platform_type?: string;
  code_verification_status?: string;
  country_dial_code?: string;
  cc?: string;
}

interface PhoneNumbersResponse {
  wabaId: string;
  phoneNumbers: PhoneNumberRecord[];
  paging?: unknown;
}

const defaultWebhookConfig: WebhookConfig = {
  webhookUrl: '',
  verifyTokenSet: false,
  appSecretSet: false,
  lastUpdatedAt: null,
  lastValidatedAt: null,
};

const defaultOnboardingConfig: OnboardingConfig = {
  wabaId: '',
  phoneNumberId: '',
  businessPhone: '',
  businessId: '',
  appId: '',
  verifiedName: '',
  lastUpdatedAt: null,
  onboardingLink: runtimeOnboardingLink,
};

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

const initialsFromName = (name: string, fallback: string) => {
  if (!name) return fallback.slice(-2).toUpperCase();
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return fallback.slice(-2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatListTimestamp = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString();
};

const formatMessageTimestamp = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const formatStatusTimestamp = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const resolveMessageStatus = (message: ChatMessage) => {
  if (message.status) {
    return message.status;
  }
  const history = message.statusHistory || [];
  if (history.length === 0) {
    return null;
  }
  const last = history[history.length - 1];
  return last?.status || null;
};

const resolveMediaUrl = (media?: ChatMedia | null) => {
  if (!media) {
    return null;
  }
  if (media.url) {
    return media.url;
  }
  if (media.id) {
    return `/api/whatsapp/media/${encodeURIComponent(media.id)}`;
  }
  return null;
};

const shouldAttachAuthHeaders = (url: string) => {
  if (!url) {
    return false;
  }
  if (url.startsWith('/')) {
    return true;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/');
  } catch {
    return false;
  }
};

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'mkv', 'avi']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac']);
const DOCUMENT_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'csv',
]);

const resolveMediaKind = (message: ChatMessage) => {
  const rawType = (message.messageType || '').toLowerCase();
  if (rawType === 'sticker') {
    return 'image';
  }
  if (['image', 'video', 'audio', 'document'].includes(rawType)) {
    return rawType;
  }
  const mimeType = (message.media?.mimeType || '').toLowerCase();
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType) return 'document';

  const rawName = message.media?.fileName || message.media?.id || '';
  const extension = rawName.split('.').pop()?.toLowerCase() || '';
  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  if (AUDIO_EXTENSIONS.has(extension)) return 'audio';
  if (DOCUMENT_EXTENSIONS.has(extension)) return 'document';

  return message.media ? 'image' : rawType;
};

const isPlaceholderMediaText = (value?: string | null) => {
  const trimmed = (value || '').trim().toLowerCase();
  if (!trimmed) {
    return true;
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return true;
  }
  if (trimmed.startsWith('document:')) {
    return true;
  }
  return false;
};

const getStatusAppearance = (
  status?: string | null
): {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
} => {
  if (!status) {
    return { icon: null, label: '', colorClass: '' };
  }

  const normalized = status.toLowerCase();
  if (normalized === 'pending' || normalized === 'sending') {
    return {
      icon: <Loader2 className="h-3 w-3 animate-spin text-slate-300" />,
      label: 'Sending',
      colorClass: 'text-slate-300',
    };
  }
  if (normalized === 'queued' || normalized === 'accepted') {
    return {
      icon: <Clock className="h-3 w-3 text-slate-300" />,
      label: 'Queued',
      colorClass: 'text-slate-300',
    };
  }
  if (normalized === 'sent') {
    return {
      icon: <Check className="h-3 w-3 text-slate-300" />,
      label: 'Sent',
      colorClass: 'text-slate-300',
    };
  }
  if (normalized === 'delivered') {
    return {
      icon: <CheckCheck className="h-3 w-3 text-slate-300" />,
      label: 'Delivered',
      colorClass: 'text-slate-300',
    };
  }
  if (normalized === 'read') {
    return {
      icon: <CheckCheck className="h-3 w-3 text-sky-400" />,
      label: 'Read',
      colorClass: 'text-sky-300',
    };
  }
  if (normalized === 'failed' || normalized === 'undelivered') {
    return {
      icon: <XCircle className="h-3 w-3 text-red-400" />,
      label: 'Failed',
      colorClass: 'text-red-300',
    };
  }
  return {
    icon: <Clock className="h-3 w-3 text-slate-300" />,
    label: status,
    colorClass: 'text-slate-300',
  };
};

const isOrderAlertMessage = (message: ChatMessage | null | undefined) => {
  if (!message) {
    return false;
  }
  const messageType = (message.messageType || '').toString().toLowerCase();
  if (messageType === 'order') {
    return true;
  }
  if (message.orderMetadata) {
    return true;
  }
  return /order\s*received/i.test((message.text || '').toString());
};

const isOrderPreviewText = (value?: string | null) => {
  const text = (value || '').toString().trim().toLowerCase();
  if (!text) {
    return false;
  }
  return text.includes('order received') || text.includes('new order');
};

const WhatsApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'onboarding' | 'templates'>('chat');
  const location = useLocation();
  const navigate = useNavigate();
  const storedWhatsAppConfig = useMemo(() => getStoredWhatsAppConfig(), []);
  const storeDisplayName =
    storedWhatsAppConfig.storeName ||
    storedWhatsAppConfig.verifiedName ||
    storedWhatsAppConfig.vendorName ||
    null;
  const storeNumberLabel = storedWhatsAppConfig.wabaMobileNumber || null;
  const [onboardingLinkUrl, setOnboardingLinkUrl] = useState<string>(runtimeOnboardingLink);

  const hasOnboardingLink = onboardingLinkUrl.trim().length > 0;
  const handleOpenOnboarding = () => {
    if (!hasOnboardingLink) return;
    if (typeof window !== 'undefined') {
      window.open(onboardingLinkUrl, '_blank', 'noopener,noreferrer');
    }
    onboardingPollAttemptsRef.current = 0;
    setPollingOnboarding(true);
  };

  // Chat state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [sendingNewChat, setSendingNewChat] = useState(false);
  const [showSaveContactForm, setShowSaveContactForm] = useState(false);
  const [saveContactPhone, setSaveContactPhone] = useState('');
  const [saveContactName, setSaveContactName] = useState('');
  const [saveContactTag, setSaveContactTag] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [saveContactError, setSaveContactError] = useState('');
  const [showInboundOnly, setShowInboundOnly] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [isDesktopChatLayout, setIsDesktopChatLayout] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleViewportChange = () => {
      setIsDesktopChatLayout(mediaQuery.matches);
    };
    handleViewportChange();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleViewportChange);
      return () => mediaQuery.removeEventListener('change', handleViewportChange);
    }
    mediaQuery.addListener(handleViewportChange);
    return () => mediaQuery.removeListener(handleViewportChange);
  }, []);

  const resetSaveContactForm = () => {
    setSaveContactPhone('');
    setSaveContactName('');
    setSaveContactTag('');
    setSaveContactError('');
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<'image' | 'document' | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentsInputRef = useRef<HTMLInputElement | null>(null);
  const [skipNextConversationLoad, setSkipNextConversationLoad] = useState(false);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<Record<string, string>>({});
  const mediaPreviewUrlsRef = useRef<Record<string, string>>({});
  const [activeMediaPreview, setActiveMediaPreview] = useState<{
    src: string;
    type: string;
    caption?: string;
    fileName?: string | null;
  } | null>(null);
  const closeMediaPreview = useCallback(() => {
    setActiveMediaPreview(null);
  }, []);
  const resetAttachment = useCallback(() => {
    setAttachmentFile(null);
    setAttachmentType(null);
    setAttachmentPreviewUrl(null);
    setAttachmentError(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
    if (attachmentsInputRef.current) {
      attachmentsInputRef.current.value = '';
    }
  }, []);
  const incomingMessageAudioRef = useRef<HTMLAudioElement | null>(null);
  const orderRingAudioRef = useRef<HTMLAudioElement | null>(null);
  const incomingMessageAudioStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orderRingAudioContextRef = useRef<AudioContext | null>(null);
  const orderRingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderRingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const contactsRef = useRef<Contact[]>([]);
  const contactsInitializedRef = useRef(false);
  const loadingContactsRef = useRef(false);
  const stopIncomingMessageAudio = useCallback(() => {
    if (incomingMessageAudioStopRef.current) {
      clearTimeout(incomingMessageAudioStopRef.current);
      incomingMessageAudioStopRef.current = null;
    }
    const audioElement = incomingMessageAudioRef.current;
    if (!audioElement) {
      return;
    }
    audioElement.loop = false;
    audioElement.pause();
    audioElement.currentTime = 0;
  }, []);
  const playIncomingMessageAudio = useCallback(
    (durationMs = 0) => {
      const audioElement = incomingMessageAudioRef.current;
      if (!audioElement) {
        return;
      }
      if (incomingMessageAudioStopRef.current) {
        clearTimeout(incomingMessageAudioStopRef.current);
        incomingMessageAudioStopRef.current = null;
      }
      audioElement.loop = durationMs > 0;
      audioElement.currentTime = 0;
      audioElement
        .play()
        .then(() => {
          if (durationMs > 0) {
            incomingMessageAudioStopRef.current = setTimeout(() => {
              stopIncomingMessageAudio();
            }, durationMs);
          }
        })
        .catch(() => {
          audioElement.loop = false;
        });
    },
    [stopIncomingMessageAudio]
  );
  const stopOrderRing = useCallback(() => {
    if (orderRingIntervalRef.current) {
      clearInterval(orderRingIntervalRef.current);
      orderRingIntervalRef.current = null;
    }
    if (orderRingStopRef.current) {
      clearTimeout(orderRingStopRef.current);
      orderRingStopRef.current = null;
    }
    const ringAudio = orderRingAudioRef.current;
    if (ringAudio) {
      ringAudio.loop = false;
      ringAudio.pause();
      ringAudio.currentTime = 0;
    }
  }, []);
  const playBackgroundOrderRing = useCallback(
    async (durationMs = ORDER_RING_DURATION_MS) => {
      stopOrderRing();
      try {
        const ringAudio = orderRingAudioRef.current;
        if (ringAudio) {
          ringAudio.loop = true;
          ringAudio.volume = 1;
          ringAudio.currentTime = 0;
          await ringAudio.play();
          orderRingStopRef.current = setTimeout(() => {
            stopOrderRing();
          }, durationMs);
          return;
        }

        const AudioContextClass =
          (window as Window & { webkitAudioContext?: typeof AudioContext }).AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextClass) {
          playIncomingMessageAudio(durationMs);
          return;
        }

        if (!orderRingAudioContextRef.current) {
          orderRingAudioContextRef.current = new AudioContextClass();
        }
        const context = orderRingAudioContextRef.current;
        if (context.state === 'suspended') {
          await context.resume();
        }

        let pulseStep = 0;
        const pulse = () => {
          const now = context.currentTime;
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = 'square';
          oscillator.frequency.value = pulseStep % 2 === 0 ? 980 : 740;
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          pulseStep += 1;
        };

        pulse();
        orderRingIntervalRef.current = setInterval(pulse, ORDER_RING_PULSE_MS);
        orderRingStopRef.current = setTimeout(() => {
          stopOrderRing();
        }, durationMs);
      } catch (error) {
        console.warn('Failed to play background order ring; falling back to default tone', error);
        playIncomingMessageAudio(durationMs);
      }
    },
    [playIncomingMessageAudio, stopOrderRing]
  );
  const [notificationsSupported] = useState(
    () => typeof window !== 'undefined' && 'Notification' in window
  );
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    () => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'denied';
      }
      return Notification.permission;
    }
  );
  const requestNotificationPermission = useCallback(async () => {
    if (!notificationsSupported) {
      return;
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      toast({
        title: 'Notifications blocked',
        description:
          'Enable notifications in your browser settings for this site, then refresh the page.',
      });
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);

      const audioElement = incomingMessageAudioRef.current;
      if (audioElement && result === 'granted') {
        const previousVolume = audioElement.volume;
        audioElement.volume = 0;
        audioElement
          .play()
          .then(() => {
            audioElement.pause();
            audioElement.currentTime = 0;
            audioElement.volume = previousVolume;
          })
          .catch(() => {
            audioElement.volume = previousVolume;
          });
      }
      const ringAudio = orderRingAudioRef.current;
      if (ringAudio && result === 'granted') {
        const previousVolume = ringAudio.volume;
        ringAudio.volume = 0;
        ringAudio
          .play()
          .then(() => {
            ringAudio.pause();
            ringAudio.currentTime = 0;
            ringAudio.volume = previousVolume;
          })
          .catch(() => {
            ringAudio.volume = previousVolume;
          });
      }
    } catch (error) {
      console.warn('Unable to request notification permission', error);
    }
  }, [notificationsSupported]);

  useEffect(() => {
    resetAttachment();
    setEmojiPickerOpen(false);
  }, [selectedContact, resetAttachment]);

  useEffect(() => {
    if (!attachmentFile || !attachmentFile.type.startsWith('image/')) {
      setAttachmentPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(attachmentFile);
    setAttachmentPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [attachmentFile]);
  useEffect(() => {
    if (!notificationsSupported || notificationPermission !== 'granted') {
      return;
    }
    const audioElement = incomingMessageAudioRef.current;
    if (audioElement) {
      const previousVolume = audioElement.volume;
      audioElement.volume = 0;
      audioElement
        .play()
        .then(() => {
          audioElement.pause();
          audioElement.currentTime = 0;
          audioElement.volume = previousVolume;
        })
        .catch(() => {
          audioElement.volume = previousVolume;
        });
    }
  }, [notificationPermission, notificationsSupported]);
  useEffect(() => {
    const unlockAudio = () => {
      const ringAudio = orderRingAudioRef.current;
      if (ringAudio) {
        const previousVolume = ringAudio.volume;
        ringAudio.volume = 0;
        ringAudio
          .play()
          .then(() => {
            ringAudio.pause();
            ringAudio.currentTime = 0;
            ringAudio.volume = previousVolume;
          })
          .catch(() => {
            ringAudio.volume = previousVolume;
          });
      }
      const context = orderRingAudioContextRef.current;
      if (context && context.state === 'suspended') {
        context.resume().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);
  const showBrowserNotification = useCallback(
    (contact: Contact, message: ChatMessage) => {
      if (!notificationsSupported || notificationPermission !== 'granted') {
        return;
      }
      const shouldNotify =
        typeof document === 'undefined' || document.hidden || !document.hasFocus();
      if (!shouldNotify) {
        return;
      }
      try {
        const title = `New message from ${getContactDisplayName(contact)}`;
        const body =
          message.text ||
          message.media?.caption ||
          (message.media ? '[Media message]' : 'New WhatsApp message');
        const notification = new Notification(title, {
          body,
          tag: `${contact.phone}-${message.id}`,
          data: { phone: contact.phone },
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.warn('Failed to show notification', error);
      }
    },
    [notificationPermission, notificationsSupported]
  );

  useEffect(() => {
    mediaPreviewUrlsRef.current = mediaPreviewUrls;
  }, [mediaPreviewUrls]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);
  useEffect(
    () => () => {
      stopIncomingMessageAudio();
      stopOrderRing();
    },
    [stopIncomingMessageAudio, stopOrderRing]
  );
  useEffect(() => {
    if (!activeMediaPreview) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveMediaPreview(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMediaPreview]);
  const storeSessionId = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'store';
    }
    return localStorage.getItem('bb_store_id') || 'store';
  }, []);
  const lastReadStorageKey = useMemo(
    () => `bb_whatsapp_last_read_${storeSessionId}`,
    [storeSessionId]
  );
  const [lastReadMap, setLastReadMap] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') {
      return {};
    }
    try {
      const raw = localStorage.getItem(`bb_whatsapp_last_read_${storeSessionId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const lastReadMapRef = useRef(lastReadMap);
  useEffect(() => {
    lastReadMapRef.current = lastReadMap;
  }, [lastReadMap]);

  useEffect(() => {
    const controller = new AbortController();
    const loadMediaPreviews = async () => {
      const updates: Record<string, string> = {};
      for (const message of messages) {
        const media = message.media;
        const mediaUrl = resolveMediaUrl(media);
        if (!media?.id || !mediaUrl) {
          continue;
        }
        if (mediaPreviewUrlsRef.current[media.id] !== undefined) {
          continue;
        }
        try {
          const response = await fetch(mediaUrl, {
            headers: shouldAttachAuthHeaders(mediaUrl) ? buildAuthHeaders() : undefined,
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error('Failed to download media');
          }
          const blob = await response.blob();
          updates[media.id] = URL.createObjectURL(blob);
        } catch (error) {
          console.error('Failed to load WhatsApp media preview', error);
          updates[media.id] = '';
        }
      }
      if (Object.keys(updates).length > 0) {
        setMediaPreviewUrls(prev => ({ ...prev, ...updates }));
      }
    };
    loadMediaPreviews();
    return () => {
      controller.abort();
    };
  }, [messages]);

  useEffect(() => {
    return () => {
      Object.values(mediaPreviewUrlsRef.current || {}).forEach(url => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(lastReadStorageKey, JSON.stringify(lastReadMap));
    } catch {
      // ignore storage errors
    }
  }, [lastReadMap, lastReadStorageKey]);
  const [activeUnreadAnchor, setActiveUnreadAnchor] = useState<string | null>(null);

  // Webhook state
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(defaultWebhookConfig);
  const [webhookForm, setWebhookForm] = useState<WebhookFormValues>({
    webhookUrl: '',
    verifyToken: '',
    appSecret: '',
  });
  const [webhookLoading, setWebhookLoading] = useState(true);
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookValidating, setWebhookValidating] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);

  // Onboarding state
  const [onboardingConfig, setOnboardingConfig] =
    useState<OnboardingConfig>(defaultOnboardingConfig);
  const [onboardingForm, setOnboardingForm] = useState<OnboardingFormValues>({
    wabaId: '',
    phoneNumberId: '',
    businessPhone: '',
    businessId: '',
    appId: '',
    verifiedName: '',
  });
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [pollingOnboarding, setPollingOnboarding] = useState(false);
  const [latestWebhookSnapshot, setLatestWebhookSnapshot] =
    useState<OnboardingWebhookSnapshot | null>(null);
  const HARD_CODED_PIN = '000000';
  const [registerStatus, setRegisterStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [registeringNumber, setRegisteringNumber] = useState(false);
  const onboardingPollAttemptsRef = useRef(0);
  const latestSnapshotTimestampRef = useRef<string | null>(null);
  const phoneLookupPerformedRef = useRef<Set<string>>(new Set());
  const [phoneLookupLoading, setPhoneLookupLoading] = useState(false);
  const [phoneLookupError, setPhoneLookupError] = useState<string | null>(null);
  const [phoneLookupResult, setPhoneLookupResult] = useState<PhoneNumbersResponse | null>(null);

  const connectionReady = useMemo(
    () => Boolean(webhookConfig.webhookUrl && webhookConfig.verifyTokenSet),
    [webhookConfig.webhookUrl, webhookConfig.verifyTokenSet]
  );

  const lastUpdatedDisplay = useMemo(() => {
    if (!webhookConfig.lastUpdatedAt) return 'Never saved';
    return new Date(webhookConfig.lastUpdatedAt).toLocaleString();
  }, [webhookConfig.lastUpdatedAt]);

  const lastValidatedDisplay = useMemo(() => {
    if (!webhookConfig.lastValidatedAt) return 'Not validated yet';
    return new Date(webhookConfig.lastValidatedAt).toLocaleString();
  }, [webhookConfig.lastValidatedAt]);

  const onboardingLastUpdatedDisplay = useMemo(() => {
    if (!onboardingConfig.lastUpdatedAt) return 'Not saved yet';
    return new Date(onboardingConfig.lastUpdatedAt).toLocaleString();
  }, [onboardingConfig.lastUpdatedAt]);

  const latestWebhookCapturedDisplay = useMemo(() => {
    if (!latestWebhookSnapshot?.capturedAt) {
      return null;
    }
    const captureDate = new Date(latestWebhookSnapshot.capturedAt);
    if (Number.isNaN(captureDate.getTime())) {
      return latestWebhookSnapshot.capturedAt;
    }
    return captureDate.toLocaleString();
  }, [latestWebhookSnapshot?.capturedAt]);

  const candidateWabaIdForLookup = useMemo(
    () => (onboardingForm.wabaId || latestWebhookSnapshot?.wabaId || '').trim(),
    [onboardingForm.wabaId, latestWebhookSnapshot?.wabaId]
  );

  const filteredContacts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return contacts.filter(contact => {
      const termDigits = term.replace(/[^0-9]/g, '');

      if (showInboundOnly && !(contact.hasInbound || (contact.messagesReceived || 0) > 0)) {
        return false;
      }
      if (showUnreadOnly) {
        const key = getConversationKey(contact);
        if (!key || !contact.lastInboundTime) {
          return false;
        }
        const lastRead = lastReadMap[key];
        if (lastRead) {
          const inboundTime = new Date(contact.lastInboundTime).getTime();
          const readTime = new Date(lastRead).getTime();
          if (
            !Number.isFinite(inboundTime) ||
            !Number.isFinite(readTime) ||
            inboundTime <= readTime
          ) {
            return false;
          }
        }
      }

      if (!term) {
        return true;
      }

      const displayName = getContactDisplayName(contact).toLowerCase();
      if (displayName.includes(term)) {
        return true;
      }

      if ((contact.name || '').toLowerCase().includes(term)) {
        return true;
      }

      const phone = (contact.phone || '').toLowerCase();
      if (phone.includes(term)) {
        return true;
      }

      if (termDigits) {
        const phoneDigits = normalizeDigits(contact.phone || '');
        if (phoneDigits.includes(termDigits)) {
          return true;
        }
      }

      if (contact.segment && contact.segment.toLowerCase().includes(term)) {
        return true;
      }

      if (termDigits && contact.normalizedPhone && contact.normalizedPhone.includes(termDigits)) {
        return true;
      }

      if (Array.isArray(contact.allPhones)) {
        const match = contact.allPhones.some(candidate => {
          const value = candidate.toLowerCase();
          if (value.includes(term)) {
            return true;
          }
          if (termDigits) {
            return normalizeDigits(candidate).includes(termDigits);
          }
          return false;
        });
        if (match) {
          return true;
        }
      }

      return false;
    });
  }, [contacts, searchTerm, showInboundOnly, showUnreadOnly, lastReadMap]);

  // Templates state
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const normalizeTemplatePlaceholders = (text: string, order: string[]) => {
    if (!text) return { text, order, examples: [] };
    const nameToIndex = new Map<string, number>();
    const indexToExampleIndex = new Map<number, number>();
    let maxIndex = 0;

    const normalized = text.replace(/{{\s*([\w.-]+)\s*}}/g, (_, token: string) => {
      if (/^\d+$/.test(token)) {
        const num = Number(token);
        if (num > maxIndex) maxIndex = num;
        return `{{${num}}}`;
      }
      let assigned = nameToIndex.get(token);
      if (!assigned) {
        assigned = maxIndex + 1;
        maxIndex = assigned;
        nameToIndex.set(token, assigned);
        indexToExampleIndex.set(assigned, order.indexOf(token));
      }
      return `{{${assigned}}}`;
    });

    const variables = [] as string[];
    for (let index = 1; index <= maxIndex; index += 1) {
      const exampleIndex = indexToExampleIndex.get(index);
      const name =
        exampleIndex !== undefined && exampleIndex >= 0
          ? order[exampleIndex]
          : order[index - 1] || String(index);
      variables.push(name);
    }

    return { text: normalized, variables };
  };
  const [templateSearch, setTemplateSearch] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateActionLoading, setTemplateActionLoading] = useState(false);
  const [templateForm, setTemplateForm] = useState<TemplateFormState>({
    name: '',
    category: 'MARKETING',
    language: 'en_US',
    headerType: 'NONE',
    headerText: '',
    headerMediaHandle: '',
    headerExampleText: '',
    bodyText: '',
    bodyExamples: [''],
    footerText: '',
    footerExample: '',
    buttons: [],
  });
  const headerMediaInputRef = useRef<HTMLInputElement | null>(null);
  const [headerUploadLoading, setHeaderUploadLoading] = useState(false);
  const [headerUploadError, setHeaderUploadError] = useState<string | null>(null);
  const [headerUploadSuccess, setHeaderUploadSuccess] = useState<string | null>(null);

  const loadWebhookConfig = useCallback(async () => {
    setWebhookLoading(true);
    setWebhookError(null);

    try {
      const response = await fetch('/api/whatsapp/config/webhook', {
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Failed to load onboarding configuration');
      }

      const data = await response.json();
      const nextConfig: WebhookConfig = {
        webhookUrl: data.webhookUrl ?? '',
        verifyTokenSet: Boolean(data.verifyTokenSet),
        appSecretSet: Boolean(data.appSecretSet),
        lastUpdatedAt: data.lastUpdatedAt || null,
        lastValidatedAt: data.lastValidatedAt || null,
      };

      setWebhookConfig(nextConfig);
      setWebhookForm(prev => ({
        ...prev,
        webhookUrl: nextConfig.webhookUrl,
        verifyToken: '',
        appSecret: '',
      }));
    } catch (error: any) {
      const message = error?.message || 'Unable to load onboarding configuration';
      setWebhookError(message);
    } finally {
      setWebhookLoading(false);
    }
  }, []);

  const loadOnboardingConfig = useCallback(async () => {
    setOnboardingLoading(true);
    setOnboardingError(null);

    try {
      const response = await fetch('/api/whatsapp/config/onboarding', {
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Failed to load onboarding configuration');
      }

      const data = await response.json();
      const onboardingUrl =
        typeof data.onboardingLink === 'string'
          ? data.onboardingLink.trim()
          : runtimeOnboardingLink;
      const nextConfig: OnboardingConfig = {
        wabaId: data.wabaId ?? '',
        phoneNumberId: data.phoneNumberId ?? '',
        businessPhone: data.businessPhone ?? '',
        businessId: data.businessId ?? '',
        appId: data.appId ?? '',
        verifiedName: data.verifiedName ?? '',
        lastUpdatedAt: data.lastUpdatedAt || null,
        onboardingLink: onboardingUrl,
      };

      setOnboardingConfig(nextConfig);
      setOnboardingForm({
        wabaId: nextConfig.wabaId,
        phoneNumberId: nextConfig.phoneNumberId,
        businessPhone: nextConfig.businessPhone,
        businessId: nextConfig.businessId,
        appId: nextConfig.appId,
        verifiedName: nextConfig.verifiedName,
      });
      setOnboardingLinkUrl(onboardingUrl);
    } catch (error: any) {
      const message = error?.message || 'Unable to load onboarding configuration';
      setOnboardingError(message);
    } finally {
      setOnboardingLoading(false);
    }
  }, []);

  const loadLatestOnboardingSnapshot = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp/onboarding/latest-webhook', {
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const snapshotRaw: OnboardingWebhookSnapshot | null = payload?.latest ?? null;

      if (!snapshotRaw) {
        setLatestWebhookSnapshot(null);
        return;
      }

      const normalize = (value?: string | null): string | null => {
        if (value === undefined || value === null) {
          return null;
        }
        const trimmed = value.toString().trim();
        if (!trimmed || trimmed.toLowerCase() === 'null') {
          return null;
        }
        return trimmed;
      };

      const captureTimestamp =
        typeof snapshotRaw.capturedAt === 'string' ? snapshotRaw.capturedAt : null;

      const normalizedSnapshot: OnboardingWebhookSnapshot = {
        wabaId: normalize(snapshotRaw.wabaId),
        phoneNumberId: normalize(snapshotRaw.phoneNumberId),
        businessId: normalize(snapshotRaw.businessId),
        appId: normalize(snapshotRaw.appId),
        verifiedName: normalize(snapshotRaw.verifiedName),
        businessPhone: normalize(snapshotRaw.businessPhone),
        displayPhoneNumber: normalize(snapshotRaw.displayPhoneNumber),
        webhookVerifyToken: normalize(snapshotRaw.webhookVerifyToken),
        accessToken: normalize(snapshotRaw.accessToken),
        eventType: normalize(snapshotRaw.eventType),
        capturedAt: captureTimestamp,
      };

      setLatestWebhookSnapshot(normalizedSnapshot);

      setOnboardingForm(prev => ({
        wabaId: normalizedSnapshot.wabaId ?? prev.wabaId,
        phoneNumberId: normalizedSnapshot.phoneNumberId ?? prev.phoneNumberId,
        businessPhone: normalizedSnapshot.businessPhone ?? prev.businessPhone,
        businessId: normalizedSnapshot.businessId ?? prev.businessId,
        appId: normalizedSnapshot.appId ?? prev.appId,
        verifiedName: normalizedSnapshot.verifiedName ?? prev.verifiedName,
      }));

      if (captureTimestamp && captureTimestamp !== latestSnapshotTimestampRef.current) {
        toast({
          title: 'Meta onboarding data detected',
          description: 'Latest webhook payload prefilled the onboarding form.',
        });
        latestSnapshotTimestampRef.current = captureTimestamp;
      }
    } catch (error) {
      console.error('Failed to load onboarding snapshot', error);
    }
  }, []);

  const fetchPhoneNumbersFromMeta = useCallback(
    async (wabaId: string, options: { silent?: boolean } = {}) => {
      const trimmedWabaId = wabaId.trim();
      if (!trimmedWabaId) {
        setPhoneLookupError('Provide a WABA ID before fetching phone numbers.');
        if (!options.silent) {
          toast({
            title: 'WABA ID missing',
            description: 'Enter or detect a WABA ID first.',
            variant: 'destructive',
          });
        }
        return;
      }

      phoneLookupPerformedRef.current.add(trimmedWabaId);

      try {
        setPhoneLookupLoading(true);
        setPhoneLookupError(null);

        const response = await fetch(
          `/api/whatsapp/onboarding/phone-numbers?wabaId=${encodeURIComponent(trimmedWabaId)}`,
          {
            headers: buildAuthHeaders(),
          }
        );

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          const errorMessage = result.error || 'Failed to fetch phone numbers from Meta.';
          throw new Error(errorMessage);
        }

        const payload: PhoneNumbersResponse = await response.json();
        setPhoneLookupResult(payload);

        const firstNumber = payload.phoneNumbers?.[0];
        if (firstNumber) {
          setOnboardingForm(prev => ({
            ...prev,
            phoneNumberId: firstNumber.id || prev.phoneNumberId,
            businessPhone: firstNumber.display_phone_number || prev.businessPhone,
            verifiedName: firstNumber.verified_name || prev.verifiedName,
          }));
        }

        if (!options.silent) {
          toast({
            title: 'Phone numbers retrieved',
            description: firstNumber
              ? `Found ${payload.phoneNumbers.length} number(s); using ${
                  firstNumber.display_phone_number || firstNumber.id
                }.`
              : 'Fetched phone numbers. Review the list below.',
          });
        }
      } catch (error: any) {
        const message = error?.message || 'Unable to fetch phone numbers.';
        setPhoneLookupError(message);
        if (!options.silent) {
          toast({
            title: 'Meta fetch failed',
            description: message,
            variant: 'destructive',
          });
        }
      } finally {
        setPhoneLookupLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadWebhookConfig();
    loadOnboardingConfig().finally(() => {
      loadLatestOnboardingSnapshot();
    });
  }, [loadWebhookConfig, loadOnboardingConfig, loadLatestOnboardingSnapshot]);

  useEffect(() => {
    if (!pollingOnboarding) {
      return;
    }

    const pollOnce = () => {
      onboardingPollAttemptsRef.current += 1;
      loadOnboardingConfig();
      loadLatestOnboardingSnapshot();
      if (onboardingPollAttemptsRef.current >= 12) {
        setPollingOnboarding(false);
      }
    };

    pollOnce();
    const interval = setInterval(pollOnce, 8000);
    return () => clearInterval(interval);
  }, [pollingOnboarding, loadOnboardingConfig, loadLatestOnboardingSnapshot]);

  useEffect(() => {
    if (!pollingOnboarding) {
      return;
    }

    const snapshotHasIdentifiers = Boolean(
      latestWebhookSnapshot?.wabaId ||
        latestWebhookSnapshot?.businessId ||
        latestWebhookSnapshot?.phoneNumberId
    );

    if (
      onboardingConfig.wabaId ||
      onboardingConfig.businessId ||
      onboardingConfig.phoneNumberId ||
      snapshotHasIdentifiers
    ) {
      setPollingOnboarding(false);
    }
  }, [
    pollingOnboarding,
    onboardingConfig.wabaId,
    onboardingConfig.businessId,
    onboardingConfig.phoneNumberId,
    latestWebhookSnapshot,
  ]);

  useEffect(() => {
    if (!candidateWabaIdForLookup) {
      return;
    }

    if (onboardingForm.phoneNumberId) {
      return;
    }

    if (phoneLookupPerformedRef.current.has(candidateWabaIdForLookup)) {
      return;
    }

    phoneLookupPerformedRef.current.add(candidateWabaIdForLookup);
    fetchPhoneNumbersFromMeta(candidateWabaIdForLookup, { silent: true });
  }, [
    onboardingForm.wabaId,
    onboardingForm.phoneNumberId,
    candidateWabaIdForLookup,
    fetchPhoneNumbersFromMeta,
  ]);

  useEffect(() => {
    if (!selectedContact) {
      setMessages([]);
      return;
    }

    if (skipNextConversationLoad) {
      setSkipNextConversationLoad(false);
      return;
    }

    const controller = new AbortController();
    loadConversation(selectedContact, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContact?.id]);

  useEffect(() => {
    if (!selectedContact) {
      return;
    }
    const interval = setInterval(() => {
      loadConversation(selectedContact, undefined, { silent: true });
    }, 7000);
    return () => clearInterval(interval);
  }, [selectedContact]);

  useEffect(() => {
    if (activeTab !== 'chat') {
      return;
    }
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [messages, activeTab]);

  useEffect(() => {
    if (!selectedContact) {
      setActiveUnreadAnchor(null);
      return;
    }
    const key = getConversationKey(selectedContact);
    setActiveUnreadAnchor(lastReadMapRef.current[key] || null);
  }, [selectedContact]);

  useEffect(() => {
    if (!selectedContact || messages.length === 0) {
      return;
    }
    const key = getConversationKey(selectedContact);
    if (!key) {
      return;
    }
    const latestInbound = [...messages].filter(message => message.from === 'customer').pop();
    if (!latestInbound) {
      return;
    }
    if (isOrderAlertMessage(latestInbound)) {
      // Keep fresh order messages unread until user explicitly handles them.
      return;
    }
    const latestTimestamp = latestInbound.timestamp;
    setLastReadMap(prev => {
      if (prev[key] && new Date(prev[key]).getTime() >= new Date(latestTimestamp).getTime()) {
        return prev;
      }
      return { ...prev, [key]: latestTimestamp };
    });
  }, [messages, selectedContact]);

  const handleTabChange = (tab: 'chat' | 'onboarding' | 'templates') => {
    if (tab === 'templates') {
      return;
    }
    setActiveTab(tab);
  };

  const loadContacts = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);
      if (loadingContactsRef.current) {
        return;
      }
      loadingContactsRef.current = true;
      if (!silent) {
        setContactsLoading(true);
        setContactsError(null);
      }

      try {
        const headers = buildAuthHeaders();
        const [analyticsResponse, savedResponse] = await Promise.all([
          fetch('/api/whatsapp/analytics?format=json', { headers }),
          fetch('/api/whatsapp/contacts', { headers }),
        ]);

        const analyticsPayload = await analyticsResponse.json().catch(() => ({}));
        if (!analyticsResponse.ok) {
          throw new Error(analyticsPayload?.error || 'Unable to load WhatsApp analytics');
        }

        const savedPayload = await savedResponse.json().catch(() => ({}));
        if (!savedResponse.ok) {
          throw new Error(savedPayload?.error || 'Unable to load saved contacts');
        }

        const dataset = Array.isArray(analyticsPayload)
          ? analyticsPayload
          : analyticsPayload?.data || [];
        const savedDataset = Array.isArray(savedPayload?.contacts)
          ? savedPayload.contacts
          : Array.isArray(savedPayload)
          ? savedPayload
          : [];

        const mapped = dataset.map((item: any) => {
          const primaryPhone = item.primary_phone || item.user || item.phone || item.id || '';
          const normalizedPhone = normalizePhoneKey(item.normalized_phone || primaryPhone);
          const phonesArray = Array.isArray(item.phones)
            ? item.phones.filter(
                (value: unknown) => typeof value === 'string' && value.trim().length > 0
              )
            : [];

          if (primaryPhone && !phonesArray.includes(primaryPhone)) {
            phonesArray.unshift(primaryPhone);
          }

          const contactName = (item.name || item.display_name || primaryPhone || 'Unknown').trim();

          const contact: Contact = {
            id: normalizedPhone || primaryPhone || item.id || Math.random().toString(36).slice(2),
            phone: primaryPhone || phonesArray[0] || 'Unknown',
            name: contactName,
            normalizedPhone: normalizedPhone || undefined,
            allPhones: phonesArray.length ? phonesArray : undefined,
            lastMessage: item.last_message_text,
            lastMessageTime: item.last_message_time || item.last_message_timestamp,
            lastInboundTime: item.last_inbound_time || null,
            segment: item.segment,
            lastStatus: item.last_status,
            messagesReceived: item.messages_received || 0,
            messagesSent: item.messages_sent || 0,
            hasInbound:
              typeof item.has_inbound === 'boolean'
                ? item.has_inbound
                : (item.messages_received || 0) > 0,
          };

          return contact;
        });

        const savedContactLookup = new Map<string, { name: string; tag?: string | null }>();

        savedDataset.filter(Boolean).forEach((entry: any) => {
          const normalizedPhone = normalizePhoneKey(
            entry?.normalized_phone ||
              entry?.customer_phone ||
              entry?.phone ||
              entry?.display_phone ||
              ''
          );
          const displayName = (entry?.display_name || entry?.customer_name || entry?.name || '')
            .toString()
            .trim();

          if (!normalizedPhone || !displayName) {
            return;
          }

          savedContactLookup.set(normalizedPhone, {
            name: displayName,
            tag: entry?.tag || entry?.customer_tag || null,
          });
        });

        const dedupedMap = new Map<string, Contact>();
        mapped.forEach(contact => {
          const normalizedKey =
            (contact.normalizedPhone && normalizePhoneKey(contact.normalizedPhone)) || undefined;
          const key = normalizedKey || normalizePhoneKey(contact.phone) || contact.id;

          if (!dedupedMap.has(key)) {
            const saved = key ? savedContactLookup.get(key) : undefined;
            const resolvedName = saved?.name?.trim() || contact.name;
            const resolvedSegment = saved?.tag || contact.segment || undefined;
            dedupedMap.set(key, {
              ...contact,
              name: resolvedName,
              segment: resolvedSegment,
              normalizedPhone: key || contact.normalizedPhone,
            });
            return;
          }

          const existing = dedupedMap.get(key)!;

          const saved = key ? savedContactLookup.get(key) : undefined;
          const mergedPhones = new Set<string>(
            [
              ...(existing.allPhones || []),
              ...(contact.allPhones || []),
              existing.phone,
              contact.phone,
            ].filter(Boolean)
          );

          existing.allPhones = Array.from(mergedPhones);
          existing.phone = preferPhoneNumber(existing.phone, contact.phone);

          if (saved?.name) {
            existing.name = saved.name;
          } else if (
            contact.name &&
            (!existing.name || existing.name.toLowerCase().startsWith('customer '))
          ) {
            existing.name = contact.name;
          }

          if (saved?.tag) {
            existing.segment = saved.tag;
          } else if (contact.segment && !existing.segment) {
            existing.segment = contact.segment;
          }

          const existingTime = existing.lastMessageTime
            ? new Date(existing.lastMessageTime).getTime()
            : 0;
          const candidateTime = contact.lastMessageTime
            ? new Date(contact.lastMessageTime).getTime()
            : 0;
          if (candidateTime > existingTime) {
            existing.lastMessageTime = contact.lastMessageTime;
            existing.lastMessage = contact.lastMessage;
            existing.lastStatus = contact.lastStatus;
          }

          existing.messagesReceived =
            (existing.messagesReceived || 0) + (contact.messagesReceived || 0);
          existing.messagesSent = (existing.messagesSent || 0) + (contact.messagesSent || 0);
          if (contact.segment && !existing.segment) {
            existing.segment = contact.segment;
          }
          if (contact.hasInbound) {
            existing.hasInbound = true;
          }
          const existingInboundTime = existing.lastInboundTime
            ? new Date(existing.lastInboundTime).getTime()
            : 0;
          const candidateInboundTime = contact.lastInboundTime
            ? new Date(contact.lastInboundTime).getTime()
            : 0;
          if (candidateInboundTime > existingInboundTime) {
            existing.lastInboundTime = contact.lastInboundTime;
          }
        });

        const deduped = Array.from(dedupedMap.values()).sort((a, b) => {
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return timeB - timeA;
        });

        const isFirstContactsLoad = !contactsInitializedRef.current;
        if (!isFirstContactsLoad) {
          const previousByKey = new Map<string, Contact>();
          contactsRef.current.forEach(contact => {
            const key = getConversationKey(contact);
            if (key) {
              previousByKey.set(key, contact);
            }
          });
          const selectedKey = selectedContact ? getConversationKey(selectedContact) : null;

          deduped.forEach(contact => {
            const key = getConversationKey(contact);
            if (!key || (selectedKey && key === selectedKey)) {
              return;
            }
            const previous = previousByKey.get(key);
            if (!previous) {
              return;
            }
            const previousTime = previous.lastMessageTime
              ? new Date(previous.lastMessageTime).getTime()
              : 0;
            const currentTime = contact.lastMessageTime
              ? new Date(contact.lastMessageTime).getTime()
              : 0;
            if (!Number.isFinite(currentTime) || currentTime <= previousTime) {
              return;
            }
            if (!isOrderPreviewText(contact.lastMessage)) {
              return;
            }

            playBackgroundOrderRing(ORDER_RING_DURATION_MS);
            toast({
              title: 'New order received',
              description: `${getContactDisplayName(contact)}: ${
                contact.lastMessage || 'Order received'
              }`,
            });
            showBrowserNotification(contact, {
              id: `${key}-${contact.lastMessageTime || Date.now()}`,
              type: 'received',
              from: 'customer',
              text: contact.lastMessage || 'Order received',
              timestamp: contact.lastMessageTime || new Date().toISOString(),
              status: null,
            });
          });
        }

        setContacts(deduped);
        setContactsLoaded(true);
        contactsInitializedRef.current = true;
        setSelectedContact(prev => {
          if (deduped.length === 0) return null;
          if (!prev) return isDesktopChatLayout ? deduped[0] : null;
          const previousKey =
            (prev.normalizedPhone && normalizePhoneKey(prev.normalizedPhone)) ||
            normalizePhoneKey(prev.phone) ||
            prev.id;
          return (
            deduped.find(contact => {
              const key = contact.normalizedPhone || normalizePhoneKey(contact.phone) || contact.id;
              return key === previousKey;
            }) || deduped[0]
          );
        });
      } catch (error: any) {
        const message = error?.message || 'Unable to load WhatsApp analytics';
        if (!silent) {
          setContactsError(message);
          toast({
            title: 'Failed to load chats',
            description: message,
            variant: 'destructive',
          });
        }
      } finally {
        loadingContactsRef.current = false;
        if (!silent) {
          setContactsLoading(false);
        }
      }
    },
    [playBackgroundOrderRing, selectedContact, showBrowserNotification]
  );

  useEffect(() => {
    if (activeTab === 'chat' && !contactsLoaded) {
      loadContacts();
    }
    if (activeTab === 'templates') {
      loadTemplates();
    }
  }, [activeTab, contactsLoaded, loadContacts]);

  useEffect(() => {
    if (activeTab !== 'chat' || !contactsLoaded) {
      return;
    }
    const interval = setInterval(() => {
      loadContacts({ silent: true });
    }, 7000);
    return () => clearInterval(interval);
  }, [activeTab, contactsLoaded, loadContacts]);

  const handleSaveContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingContact) {
      return;
    }
    if (!saveContactName.trim()) {
      setSaveContactError('Contact name is required.');
      return;
    }
    setSaveContactError('');
    setSavingContact(true);
    try {
      const response = await fetch('/api/whatsapp/contacts', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        body: JSON.stringify({
          phone: saveContactPhone.trim(),
          name: saveContactName.trim(),
          tag: saveContactTag.trim(),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to save contact');
      }
      toast({
        title: 'Contact saved',
        description: saveContactName.trim() || saveContactPhone.trim(),
      });
      resetSaveContactForm();
      setShowSaveContactForm(false);
      await loadContacts();
    } catch (error: any) {
      const message = error?.message || 'Unable to save contact';
      setSaveContactError(message);
      toast({
        title: 'Save failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSavingContact(false);
    }
  };

  const loadConversation = async (
    contact: Contact,
    signal?: AbortSignal,
    options?: { silent?: boolean }
  ) => {
    const silent = Boolean(options?.silent);
    if (!silent) {
      setMessagesLoading(true);
      setMessageError(null);
    }

    try {
      const params = new URLSearchParams();
      const phoneVariants = new Set<string>(
        [...(contact.allPhones || []), contact.phone].filter(Boolean)
      );

      phoneVariants.forEach(variant => params.append('phones', variant));

      const normalized = contact.normalizedPhone || normalizePhoneKey(contact.phone);
      if (normalized) {
        params.set('normalized', normalized);
      }

      const queryString = params.toString();
      const response = await fetch(
        `/api/whatsapp/chat/${encodeURIComponent(contact.phone)}${
          queryString ? `?${queryString}` : ''
        }`,
        {
          headers: buildAuthHeaders(),
          signal,
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Unable to load chat history');
      }

      const data = await response.json();
      const payload = Array.isArray(data) ? data : data?.data || [];
      const history: ChatMessage[] = payload.map((entry: any) => {
        const rawType = entry.type || (entry.from === 'system' ? 'system' : undefined);
        const type: ChatMessage['type'] =
          rawType === 'system'
            ? 'system'
            : rawType === 'sent' || rawType === 'received'
            ? rawType
            : entry.from === 'vendor'
            ? 'sent'
            : entry.from === 'system'
            ? 'system'
            : 'received';

        const from: ChatMessage['from'] =
          entry.from === 'vendor' ? 'vendor' : entry.from === 'system' ? 'system' : 'customer';

        return {
          id: entry.id,
          type,
          text: entry.text ?? entry.body ?? entry.message ?? '',
          timestamp: entry.timestamp,
          from,
          status: entry.status ?? null,
          campaignName: entry.campaignName ?? entry.campaign_name ?? null,
          campaignId: entry.campaignId ?? entry.campaign_id ?? null,
          isCampaign: entry.isCampaign ?? entry.is_campaign ?? false,
          templateName: entry.templateName ?? entry.template_name ?? null,
          mediaId: entry.mediaId ?? entry.media_id ?? null,
          messageType: entry.messageType ?? entry.message_type ?? null,
          media: entry.media ?? null,
          location: entry.location ?? null,
          orderMetadata: entry.orderMetadata ?? entry.order_metadata ?? null,
          statusHistory: Array.isArray(entry.statusHistory ?? entry.status_history)
            ? entry.statusHistory ?? entry.status_history
            : [],
        };
      });
      history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const previousLast = messagesRef.current[messagesRef.current.length - 1] || null;
      const latest = history[history.length - 1] || null;
      const isNewMessage = Boolean(
        options?.silent &&
          latest?.from === 'customer' &&
          (!previousLast || previousLast.id !== latest?.id)
      );
      messagesRef.current = history;
      setMessages(history);
      if (isNewMessage && latest) {
        const shouldRingForOrder = isOrderAlertMessage(latest);
        if (shouldRingForOrder) {
          playBackgroundOrderRing(ORDER_RING_DURATION_MS);
          toast({
            title: 'New order received',
            description: `${getContactDisplayName(contact)}: ${latest.text || 'Order received'}`,
          });
        } else {
          playIncomingMessageAudio(0);
        }
        showBrowserNotification(contact, latest);
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      const message = error?.message || 'Unable to load chat history';
      if (!silent) {
        setMessageError(message);
      }
    } finally {
      if (!silent) {
        setMessagesLoading(false);
      }
    }
  };
  const hasUnreadMessages = useCallback(
    (contact: Contact) => {
      if (!contact.lastInboundTime) {
        return false;
      }
      const key = getConversationKey(contact);
      if (!key) {
        return false;
      }
      const lastRead = lastReadMap[key];
      if (!lastRead) {
        return true;
      }
      return new Date(contact.lastInboundTime).getTime() > new Date(lastRead).getTime();
    },
    [lastReadMap]
  );

  const handleDeleteChatConversation = async () => {
    if (!selectedContact || deletingChat) {
      return;
    }

    const confirmed =
      typeof window !== 'undefined'
        ? window.confirm(
            `Delete chat history for ${getContactDisplayName(
              selectedContact
            )}? This cannot be undone.`
          )
        : false;

    if (!confirmed) {
      return;
    }

    try {
      setDeletingChat(true);
      const params = new URLSearchParams();
      const phoneVariants = new Set<string>(
        [...(selectedContact.allPhones || []), selectedContact.phone].filter(Boolean)
      );
      phoneVariants.forEach(phone => params.append('phones', phone));

      const normalized =
        selectedContact.normalizedPhone || normalizePhoneKey(selectedContact.phone);
      if (normalized) {
        params.set('normalized', normalized);
      }

      const queryString = params.toString();
      const response = await fetch(
        `/api/whatsapp/chat/${encodeURIComponent(selectedContact.phone)}${
          queryString ? `?${queryString}` : ''
        }`,
        {
          method: 'DELETE',
          headers: buildAuthHeaders(),
        }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to delete chat history');
      }

      toast({
        title: 'Chat deleted',
        description: `Deleted ${Number(result?.deleted || 0).toLocaleString()} messages.`,
      });

      setMessages([]);
      setSelectedContact(null);
      await loadContacts();
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error?.message || 'Unable to delete chat history',
        variant: 'destructive',
      });
    } finally {
      setDeletingChat(false);
    }
  };

  const buildStatusTooltip = (message: ChatMessage, fallback?: string) => {
    if (!message.statusHistory || message.statusHistory.length === 0) {
      return fallback || '';
    }
    return message.statusHistory
      .map(entry => {
        const ts = formatStatusTimestamp(entry.timestamp);
        if (entry.status && ts) {
          return `${entry.status} • ${ts}`;
        }
        return entry.status || ts || '';
      })
      .filter(Boolean)
      .join('\n');
  };

  const resolveMediaDisplay = (media?: ChatMedia | null) => {
    if (!media) {
      return { src: null, pending: false, failed: false };
    }
    const resolvedUrl = resolveMediaUrl(media);
    if (media.id) {
      const cached = mediaPreviewUrlsRef.current[media.id];
      if (cached === '') {
        return { src: null, pending: false, failed: true };
      }
      if (cached) {
        return { src: cached, pending: false, failed: false };
      }
      return { src: null, pending: true, failed: false };
    }
    return { src: resolvedUrl || null, pending: false, failed: false };
  };

  const renderMessageBody = (message: ChatMessage, isVendor: boolean) => {
    const type = resolveMediaKind(message);
    const accentClasses = isVendor
      ? 'border-white/30 bg-white/10 text-white'
      : 'border-gray-200 bg-gray-50 text-gray-900';
    const mediaUrl = resolveMediaUrl(message.media);
    const messageText = (message.text || '').trim();
    const captionText = (message.media?.caption || '').trim();
    const primaryText = captionText || (!isPlaceholderMediaText(messageText) ? messageText : '');
    const secondaryText =
      captionText &&
      messageText &&
      captionText !== messageText &&
      !isPlaceholderMediaText(messageText)
        ? messageText
        : '';

    if (message.messageType?.toLowerCase() === 'order' && message.orderMetadata) {
      const items = Array.isArray(message.orderMetadata.product_items)
        ? message.orderMetadata.product_items
        : [];
      const total = items.reduce((sum, item) => {
        const qty = Number(item?.quantity || 0) || 0;
        const price = Number(item?.item_price || 0) || 0;
        return sum + qty * price;
      }, 0);
      const currency = items.find(item => item?.currency)?.currency || 'INR';
      const formatMoney = (value: number) => {
        try {
          return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency,
          }).format(value);
        } catch {
          return `${currency} ${value}`;
        }
      };
      return (
        <div className="space-y-2 rounded-lg border-l-4 border-emerald-500 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm">
          <div className="font-semibold">
            Order received ({items.length} item{items.length === 1 ? '' : 's'})
          </div>
          <div className="text-xs text-gray-600">Estimated total: {formatMoney(total)}</div>
          <div className="space-y-1 text-xs text-gray-700">
            {items.map((item, idx) => {
              const qty = Number(item?.quantity || 0) || 1;
              const price = Number(item?.item_price || 0) || 0;
              const name = item?.name || item?.product_retailer_id || item?.item_id || 'Item';
              return (
                <div key={`${name}-${idx}`}>
                  - {qty} x {name}
                  {price ? ` @ ${formatMoney(price)}` : ''}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (message.location) {
      const lat = message.location.latitude;
      const lng = message.location.longitude;
      const link =
        typeof lat === 'number' && typeof lng === 'number'
          ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
          : message.location.url || null;

      return (
        <div className={cn('space-y-2 rounded-lg border px-3 py-2 text-sm', accentClasses)}>
          <div className="flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4" />
            <span>{message.location.name || 'Shared location'}</span>
          </div>
          {message.location.address && (
            <p className="text-xs opacity-80">{message.location.address}</p>
          )}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold underline',
                isVendor ? 'text-white' : 'text-teal-700'
              )}
            >
              Open in Maps
            </a>
          )}
        </div>
      );
    }

    if (message.media && mediaUrl) {
      const mediaDisplay = resolveMediaDisplay(message.media);
      if (mediaDisplay.failed) {
        return (
          <div
            className={cn('rounded-lg border px-3 py-2 text-xs italic opacity-70', accentClasses)}
          >
            Unable to load media.
          </div>
        );
      }
      if (mediaDisplay.pending && message.media?.id) {
        return (
          <div className={cn('flex items-center gap-2 text-xs opacity-80', accentClasses)}>
            <Loader2 className="h-3 w-3 animate-spin" />
            Downloading media…
          </div>
        );
      }
      const mediaSource = mediaDisplay.src;
      if (!mediaSource) {
        return (
          <p className="whitespace-pre-line break-words">{message.text || '[Media message]'}</p>
        );
      }

      const renderMediaActions = (fallbackName: string, enablePreview = false) => (
        <div className="flex flex-wrap gap-2 text-xs">
          {enablePreview && mediaSource && (
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold shadow',
                isVendor ? 'bg-white/30 text-white' : 'bg-white text-teal-600'
              )}
              onClick={() =>
                setActiveMediaPreview({
                  src: mediaSource,
                  type,
                  caption: primaryText || '',
                  fileName: message.media?.fileName || fallbackName,
                })
              }
            >
              Preview
            </button>
          )}
          <a
            href={mediaSource}
            download={message.media?.fileName || fallbackName}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold shadow',
              isVendor ? 'bg-white/30 text-white' : 'bg-white text-teal-600'
            )}
          >
            <Download className="h-3 w-3" />
            Download
          </a>
        </div>
      );

      if (type === 'image') {
        return (
          <div className="space-y-3">
            <img
              src={mediaSource}
              alt={message.media.caption || 'WhatsApp image'}
              className="max-h-72 w-full rounded-xl object-cover"
              loading="lazy"
            />
            {primaryText && <p className="whitespace-pre-line break-words">{primaryText}</p>}
            {secondaryText && <p className="whitespace-pre-line break-words">{secondaryText}</p>}
            {renderMediaActions('image.jpg', true)}
          </div>
        );
      }
      if (type === 'video') {
        return (
          <div className="space-y-3">
            <video
              controls
              className="max-h-72 w-full overflow-hidden rounded-xl"
              src={mediaSource}
            >
              Your browser does not support video playback.
            </video>
            {primaryText && <p className="whitespace-pre-line break-words">{primaryText}</p>}
            {secondaryText && <p className="whitespace-pre-line break-words">{secondaryText}</p>}
            {renderMediaActions('video.mp4', true)}
          </div>
        );
      }
      if (type === 'audio') {
        return (
          <div className="space-y-2">
            <audio controls className="w-full">
              <source src={mediaSource} type={message.media.mimeType || 'audio/mpeg'} />
              Your browser does not support audio playback.
            </audio>
            {primaryText && (
              <p className="whitespace-pre-line break-words text-xs">{primaryText}</p>
            )}
            {secondaryText && (
              <p className="whitespace-pre-line break-words text-xs">{secondaryText}</p>
            )}
          </div>
        );
      }
      if (type === 'document') {
        const docExtraText = captionText ? secondaryText : primaryText;
        return (
          <div className="space-y-2">
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm',
                accentClasses
              )}
            >
              <FileText className="h-5 w-5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{message.media.fileName || 'Document'}</p>
                {message.media.caption && (
                  <p className="truncate text-xs opacity-80">{message.media.caption}</p>
                )}
              </div>
              {mediaSource ? (
                <a
                  href={mediaSource}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={message.media.fileName || undefined}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold',
                    isVendor ? 'bg-white/20 text-white' : 'bg-teal-600 text-white'
                  )}
                >
                  <Download className="h-3 w-3" />
                  Download
                </a>
              ) : null}
            </div>
            {docExtraText && (
              <p className="whitespace-pre-line break-words text-xs">{docExtraText}</p>
            )}
          </div>
        );
      }
      return (
        <div className="space-y-2">
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm',
              accentClasses
            )}
          >
            <FileText className="h-5 w-5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{message.media.fileName || 'Attachment'}</p>
              {primaryText && <p className="truncate text-xs opacity-80">{primaryText}</p>}
            </div>
            {mediaSource ? (
              <a
                href={mediaSource}
                target="_blank"
                rel="noopener noreferrer"
                download={message.media.fileName || undefined}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold',
                  isVendor ? 'bg-white/20 text-white' : 'bg-teal-600 text-white'
                )}
              >
                <Download className="h-3 w-3" />
                Download
              </a>
            ) : null}
          </div>
          {secondaryText && (
            <p className="whitespace-pre-line break-words text-xs">{secondaryText}</p>
          )}
        </div>
      );
    }

    return <p className="whitespace-pre-line break-words">{message.text}</p>;
  };
  const unreadAnchorTime = useMemo(() => {
    if (!activeUnreadAnchor) {
      return null;
    }
    const parsed = new Date(activeUnreadAnchor).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }, [activeUnreadAnchor]);

  const handleSendMessage = async () => {
    if (!selectedContact || sending) return;
    if (!canSendWithinWindow) {
      toast({
        title: '24-hour window closed',
        description: 'You can message this customer only within 24 hours of their last reply.',
        variant: 'destructive',
      });
      return;
    }

    const trimmed = newMessage.trim();
    if (!trimmed && !attachmentFile) return;

    if (attachmentFile) {
      const optimisticMessage: ChatMessage = {
        id: `temp_${Date.now()}`,
        type: 'sent',
        text: trimmed,
        timestamp: new Date().toISOString(),
        from: 'vendor',
        status: 'pending',
        messageType: attachmentType === 'document' ? 'document' : 'image',
        media: {
          id: '',
          url: attachmentPreviewUrl || '',
          caption: trimmed || null,
          mimeType: attachmentFile.type || null,
          fileName: attachmentFile.name || null,
        },
        location: null,
        statusHistory: [],
      };

      setNewMessage('');
      setSending(true);
      setMessageError(null);
      setMessages(prev => [...prev, optimisticMessage]);

      try {
        const formData = new FormData();
        formData.append('file', attachmentFile);
        formData.append('caption', trimmed);
        formData.append('media_type', attachmentType === 'document' ? 'DOCUMENT' : 'IMAGE');

        const response = await fetch(
          `/api/whatsapp/chat/${encodeURIComponent(selectedContact.phone)}/send-media`,
          {
            method: 'POST',
            headers: buildAuthHeaders(),
            body: formData,
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to send media message');
        }

        setMessages(prev =>
          prev.map(message =>
            message.id === optimisticMessage.id
              ? {
                  ...message,
                  id: result.messageId || message.id,
                  timestamp: result.timestamp || message.timestamp,
                  status: result.status || 'sent',
                  media: {
                    ...message.media,
                    id: result.mediaId || message.media?.id || '',
                  },
                  statusHistory: [
                    ...(message.statusHistory || []),
                    {
                      status: result.status || 'sent',
                      timestamp: result.timestamp || message.timestamp,
                    },
                  ],
                }
              : message
          )
        );

        setSelectedContact(current => {
          if (!current) {
            return current;
          }
          const currentKey =
            current.normalizedPhone || normalizePhoneKey(current.phone) || current.id;
          const selectedKey =
            selectedContact.normalizedPhone ||
            normalizePhoneKey(selectedContact.phone) ||
            selectedContact.id;
          if (currentKey !== selectedKey) {
            return current;
          }
          return {
            ...current,
            lastMessage: trimmed || (attachmentType === 'document' ? '📄 Document' : '📷 Photo'),
            lastMessageTime:
              result.timestamp || current.lastMessageTime || new Date().toISOString(),
            lastStatus: result.status || 'sent',
          };
        });

        await loadContacts();
        resetAttachment();
      } catch (error: any) {
        setMessages(prev => prev.filter(message => message.id !== optimisticMessage.id));
        const message = error?.message || 'Failed to send media message';
        setMessageError(message);
        toast({
          title: 'Send failed',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setSending(false);
      }
      return;
    }

    const optimisticMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      type: 'sent',
      text: trimmed,
      timestamp: new Date().toISOString(),
      from: 'vendor',
      status: 'pending',
      messageType: 'text',
      media: null,
      location: null,
      statusHistory: [],
    };

    setNewMessage('');
    setSending(true);
    setMessageError(null);
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const response = await fetch(
        `/api/whatsapp/chat/${encodeURIComponent(selectedContact.phone)}/send`,
        {
          method: 'POST',
          headers: buildAuthHeaders(true),
          body: JSON.stringify({ message: trimmed, name: selectedContact.name }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      setMessages(prev =>
        prev.map(message =>
          message.id === optimisticMessage.id
            ? {
                ...message,
                id: result.messageId || message.id,
                timestamp: result.timestamp || message.timestamp,
                status: result.status || 'sent',
                statusHistory: [
                  ...(message.statusHistory || []),
                  {
                    status: result.status || 'sent',
                    timestamp: result.timestamp || message.timestamp,
                  },
                ],
              }
            : message
        )
      );

      setSelectedContact(current => {
        if (!current) {
          return current;
        }
        const currentKey =
          current.normalizedPhone || normalizePhoneKey(current.phone) || current.id;
        const selectedKey =
          selectedContact.normalizedPhone ||
          normalizePhoneKey(selectedContact.phone) ||
          selectedContact.id;
        if (currentKey !== selectedKey) {
          return current;
        }
        return {
          ...current,
          lastMessage: trimmed,
          lastMessageTime: result.timestamp || current.lastMessageTime || new Date().toISOString(),
          lastStatus: result.status || 'sent',
        };
      });

      await loadContacts();
    } catch (error: any) {
      setMessages(prev => prev.filter(message => message.id !== optimisticMessage.id));
      const message = error?.message || 'Failed to send message';
      setMessageError(message);
      toast({
        title: 'Send failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleStartNewChat = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sendingNewChat) return;

    const phoneRaw = newChatPhone.trim();
    const messageText = newChatMessage.trim();
    if (!phoneRaw || !messageText) {
      toast({
        title: 'Missing details',
        description: 'Please provide both a phone number and a message.',
        variant: 'destructive',
      });
      return;
    }

    const sanitizedPhone = phoneRaw.replace(/[^\d+]/g, '');
    if (!sanitizedPhone) {
      toast({
        title: 'Invalid number',
        description: 'Phone number must contain digits (and an optional leading +).',
        variant: 'destructive',
      });
      return;
    }

    const normalizedKey = normalizePhoneKey(sanitizedPhone) || normalizePhoneKey(phoneRaw);

    setSendingNewChat(true);
    setMessageError(null);

    try {
      const response = await fetch(
        `/api/whatsapp/chat/${encodeURIComponent(sanitizedPhone)}/send`,
        {
          method: 'POST',
          headers: buildAuthHeaders(true),
          body: JSON.stringify({
            message: messageText,
            name: newChatName.trim() || sanitizedPhone,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      const timestamp = result.timestamp || new Date().toISOString();
      const contactEntry: Contact = {
        id: normalizedKey || sanitizedPhone,
        phone: sanitizedPhone,
        name: newChatName.trim() || sanitizedPhone,
        normalizedPhone: normalizedKey || undefined,
        allPhones: [sanitizedPhone],
        lastMessage: messageText,
        lastMessageTime: timestamp,
        lastStatus: result.status || 'sent',
        messagesSent: 1,
        messagesReceived: 0,
      };

      setContacts(prev => {
        const key = normalizedKey || normalizePhoneKey(sanitizedPhone) || sanitizedPhone;
        const existingIndex = prev.findIndex(contact => {
          const contactKey =
            contact.normalizedPhone || normalizePhoneKey(contact.phone) || contact.id;
          return contactKey === key;
        });
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...contactEntry,
            allPhones: Array.from(
              new Set([...(updated[existingIndex].allPhones || []), sanitizedPhone])
            ),
          };
          return updated;
        }
        return [contactEntry, ...prev];
      });
      setContactsLoaded(true);
      setSkipNextConversationLoad(true);
      setSelectedContact(contactEntry);
      setMessages([
        {
          id: result.messageId || `temp_${Date.now()}`,
          type: 'sent',
          text: messageText,
          timestamp,
          from: 'vendor',
          status: result.status || 'sent',
        },
      ]);

      setShowNewChatForm(false);
      setNewChatPhone('');
      setNewChatName('');
      setNewChatMessage('');

      await loadContacts();

      toast({
        title: 'Message sent',
        description: `Started a new conversation with ${contactEntry.phone}.`,
      });
    } catch (error: any) {
      const message = error?.message || 'Failed to send message';
      toast({
        title: 'Send failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSendingNewChat(false);
    }
  };

  const handleMessageKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => `${prev}${emoji}`);
  };

  const handleAttachmentPick = (file: File | null, type: 'image' | 'document' | 'any') => {
    if (!file) {
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setAttachmentError('File too large. Max 5MB.');
      return;
    }
    if (type === 'image' && !file.type.startsWith('image/')) {
      setAttachmentError('Please select an image file.');
      return;
    }
    if (type === 'document' && file.type.startsWith('image/')) {
      setAttachmentError('Please select a document file.');
      return;
    }
    const resolvedType =
      type === 'any' ? (file.type.startsWith('image/') ? 'image' : 'document') : type;
    setAttachmentError(null);
    setAttachmentFile(file);
    setAttachmentType(resolvedType);
  };

  const handleImageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleAttachmentPick(event.target.files?.[0] || null, 'image');
  };

  const handleDocumentInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleAttachmentPick(event.target.files?.[0] || null, 'document');
  };

  const handleAnyAttachmentInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleAttachmentPick(event.target.files?.[0] || null, 'any');
  };

  const handleWebhookInputChange =
    (field: keyof WebhookFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setWebhookForm(prev => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleOnboardingInputChange =
    (field: keyof OnboardingFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setOnboardingForm(prev => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleWebhookSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUrl = webhookForm.webhookUrl.trim();
    if (!trimmedUrl) {
      toast({
        title: 'Onboarding URL required',
        description: 'Please provide the secure callback URL before saving.',
        variant: 'destructive',
      });
      return;
    }

    const payload: Record<string, string> = {
      webhookUrl: trimmedUrl,
    };

    if (webhookForm.verifyToken.trim()) {
      payload.verifyToken = webhookForm.verifyToken.trim();
    }

    if (webhookForm.appSecret.trim()) {
      payload.appSecret = webhookForm.appSecret.trim();
    }

    setWebhookSaving(true);
    setWebhookError(null);

    try {
      const response = await fetch('/api/whatsapp/config/webhook', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to update onboarding configuration');
      }

      const updatedConfig = result.config || {};
      const nextConfig: WebhookConfig = {
        webhookUrl: updatedConfig.webhookUrl ?? trimmedUrl,
        verifyTokenSet: Boolean(
          updatedConfig.verifyTokenSet ?? payload.verifyToken ?? webhookConfig.verifyTokenSet
        ),
        appSecretSet: Boolean(
          updatedConfig.appSecretSet ?? (payload.appSecret ? true : webhookConfig.appSecretSet)
        ),
        lastUpdatedAt: updatedConfig.lastUpdatedAt || new Date().toISOString(),
        lastValidatedAt: updatedConfig.lastValidatedAt || webhookConfig.lastValidatedAt,
      };

      setWebhookConfig(nextConfig);
      setWebhookForm(prev => ({
        ...prev,
        verifyToken: '',
        appSecret: '',
      }));

      toast({
        title: 'Onboarding configuration saved',
        description: 'Your WhatsApp onboarding settings were updated successfully.',
      });
    } catch (error: any) {
      const message = error?.message || 'Unable to update onboarding configuration';
      setWebhookError(message);
      toast({
        title: 'Save failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setWebhookSaving(false);
    }
  };

  const handleOnboardingSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedWabaId = onboardingForm.wabaId.trim();
    const trimmedPhoneId = onboardingForm.phoneNumberId.trim();
    const trimmedVerifiedName = onboardingForm.verifiedName.trim();
    const trimmedBusinessPhone = onboardingForm.businessPhone.trim();
    const trimmedBusinessId = onboardingForm.businessId.trim();
    const trimmedAppId = onboardingForm.appId.trim();

    if (!trimmedWabaId || !trimmedPhoneId) {
      toast({
        title: 'Missing required details',
        description: 'Both WABA ID and Phone Number ID are required to save onboarding details.',
        variant: 'destructive',
      });
      return;
    }

    const payload: Record<string, string> = {
      wabaId: trimmedWabaId,
      phoneNumberId: trimmedPhoneId,
      verifiedName: trimmedVerifiedName,
      businessPhone: trimmedBusinessPhone,
      businessId: trimmedBusinessId,
      appId: trimmedAppId,
    };

    setOnboardingSaving(true);
    setOnboardingError(null);

    try {
      const response = await fetch('/api/whatsapp/config/onboarding', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to save onboarding configuration');
      }

      const updatedConfig = result.config || {};
      const updatedLinkValue =
        typeof updatedConfig.onboardingLink === 'string'
          ? updatedConfig.onboardingLink.trim()
          : onboardingLinkUrl || runtimeOnboardingLink;
      const nextConfig: OnboardingConfig = {
        wabaId: updatedConfig.wabaId ?? trimmedWabaId,
        phoneNumberId: updatedConfig.phoneNumberId ?? trimmedPhoneId,
        businessPhone: updatedConfig.businessPhone ?? trimmedBusinessPhone,
        businessId: updatedConfig.businessId ?? trimmedBusinessId,
        appId: updatedConfig.appId ?? trimmedAppId,
        verifiedName: updatedConfig.verifiedName ?? trimmedVerifiedName,
        lastUpdatedAt: updatedConfig.lastUpdatedAt || new Date().toISOString(),
        onboardingLink: updatedLinkValue,
      };

      setOnboardingConfig(nextConfig);
      setOnboardingForm({
        wabaId: nextConfig.wabaId,
        phoneNumberId: nextConfig.phoneNumberId,
        businessPhone: nextConfig.businessPhone,
        businessId: nextConfig.businessId,
        appId: nextConfig.appId,
        verifiedName: nextConfig.verifiedName,
      });
      setOnboardingLinkUrl(updatedLinkValue);

      toast({
        title: 'Onboarding details saved',
        description: 'WhatsApp Business information was stored successfully.',
      });
    } catch (error: any) {
      const message = error?.message || 'Unable to save onboarding configuration';
      setOnboardingError(message);
      toast({
        title: 'Save failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setOnboardingSaving(false);
    }
  };

  const handleRegisterNumber = async () => {
    const phoneNumberId = onboardingForm.phoneNumberId.trim();
    if (!phoneNumberId) {
      toast({
        title: 'Phone number ID required',
        description: 'Enter and save the phone number ID before connecting.',
        variant: 'destructive',
      });
      return;
    }

    setRegisteringNumber(true);
    setRegisterStatus(null);

    try {
      const response = await fetch('/api/whatsapp/register-number', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        body: JSON.stringify({
          phoneNumberId,
          pin: HARD_CODED_PIN,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Failed to connect phone number');
      }

      const successMessage = 'The WhatsApp number was registered successfully.';
      toast({
        title: 'Number connected',
        description: successMessage,
      });
      setRegisterStatus({ type: 'success', message: successMessage });
    } catch (error: any) {
      const message = error?.message || 'Unable to register the phone number';
      toast({
        title: 'Connection failed',
        description: message,
        variant: 'destructive',
      });
      setRegisterStatus({ type: 'error', message });
    } finally {
      setRegisteringNumber(false);
    }
  };

  const handleWebhookValidate = async () => {
    setWebhookValidating(true);
    setWebhookError(null);

    try {
      const payload: Record<string, string> = {};
      if (webhookForm.verifyToken.trim()) {
        payload.verifyToken = webhookForm.verifyToken.trim();
      }

      const response = await fetch('/api/whatsapp/config/webhook/validate', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Validation request failed');
      }

      if (!result.valid) {
        setWebhookConfig({
          webhookUrl: result.config?.webhookUrl ?? webhookConfig.webhookUrl,
          verifyTokenSet: Boolean(result.config?.verifyTokenSet ?? webhookConfig.verifyTokenSet),
          appSecretSet: Boolean(result.config?.appSecretSet ?? webhookConfig.appSecretSet),
          lastUpdatedAt: result.config?.lastUpdatedAt || webhookConfig.lastUpdatedAt,
          lastValidatedAt: result.config?.lastValidatedAt || webhookConfig.lastValidatedAt,
        });

        toast({
          title: 'Validation failed',
          description: 'The provided verify token does not match the stored value.',
          variant: 'destructive',
        });
        return;
      }

      const updatedConfig = result.config || {};
      const nextConfig: WebhookConfig = {
        webhookUrl: updatedConfig.webhookUrl ?? webhookConfig.webhookUrl,
        verifyTokenSet: Boolean(updatedConfig.verifyTokenSet ?? webhookConfig.verifyTokenSet),
        appSecretSet: Boolean(updatedConfig.appSecretSet ?? webhookConfig.appSecretSet),
        lastUpdatedAt: updatedConfig.lastUpdatedAt || webhookConfig.lastUpdatedAt,
        lastValidatedAt: updatedConfig.lastValidatedAt || new Date().toISOString(),
      };

      setWebhookConfig(nextConfig);

      toast({
        title: 'Onboarding validated',
        description:
          result.matchesEnvironment === false
            ? 'Stored verify token is valid but does not match the server environment variable.'
            : 'Onboarding token validated successfully.',
      });
    } catch (error: any) {
      const message = error?.message || 'Validation request failed';
      setWebhookError(message);
      toast({
        title: 'Validation error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setWebhookValidating(false);
    }
  };

  const statusClasses = connectionReady
    ? 'border border-green-200 bg-green-50 text-green-700'
    : 'border border-amber-200 bg-amber-50 text-amber-700';

  const filteredTemplates = useMemo(() => {
    const term = templateSearch.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter(
      template =>
        template.name.toLowerCase().includes(term) ||
        template.category.toLowerCase().includes(term) ||
        template.language.toLowerCase().includes(term)
    );
  }, [templates, templateSearch]);

  const createButtonDraft = (type: TemplateButtonType = 'QUICK_REPLY'): TemplateButtonDraft => ({
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `btn_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type,
    text: '',
    url: '',
    phoneNumber: '',
    example: '',
  });

  const handleTemplateFormChange = <K extends keyof TemplateFormState>(
    field: K,
    value: TemplateFormState[K]
  ) => {
    setTemplateForm(prev => ({
      ...prev,
      [field]: value,
    }));

    if (field === 'headerType') {
      setHeaderUploadError(null);
      if (value === 'NONE' || value === 'TEXT') {
        setHeaderUploadSuccess(null);
      }
    }

    if (field === 'headerMediaHandle') {
      setHeaderUploadError(null);
      if (typeof value === 'string' && value.trim().length > 0) {
        setHeaderUploadSuccess(value.trim());
      } else {
        setHeaderUploadSuccess(null);
      }
    }
  };

  const addBodyExampleRow = () => {
    handleTemplateFormChange('bodyExamples', [...templateForm.bodyExamples, '']);
  };

  const updateBodyExampleRow = (index: number, value: string) => {
    handleTemplateFormChange(
      'bodyExamples',
      templateForm.bodyExamples.map((row, rowIndex) => (rowIndex === index ? value : row))
    );
  };

  const removeBodyExampleRow = (index: number) => {
    if (templateForm.bodyExamples.length <= 1) {
      handleTemplateFormChange('bodyExamples', ['']);
      return;
    }
    handleTemplateFormChange(
      'bodyExamples',
      templateForm.bodyExamples.filter((_, rowIndex) => rowIndex !== index)
    );
  };

  const addTemplateButton = () => {
    if (templateForm.buttons.length >= 3) return;
    handleTemplateFormChange('buttons', [...templateForm.buttons, createButtonDraft()]);
  };

  const updateTemplateButton = (index: number, updates: Partial<TemplateButtonDraft>) => {
    handleTemplateFormChange(
      'buttons',
      templateForm.buttons.map((button, buttonIndex) =>
        buttonIndex === index
          ? {
              ...button,
              ...updates,
            }
          : button
      )
    );
  };

  const removeTemplateButton = (index: number) => {
    handleTemplateFormChange(
      'buttons',
      templateForm.buttons.filter((_, buttonIndex) => buttonIndex !== index)
    );
  };

  const firstBodyExampleValues = useMemo(() => {
    const first = templateForm.bodyExamples.find(example => example.trim().length > 0);
    if (!first) {
      return [] as string[];
    }
    return first
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
  }, [templateForm.bodyExamples]);

  const bodyPreview = useMemo(() => {
    if (!templateForm.bodyText.trim()) {
      return '';
    }
    let rendered = templateForm.bodyText;
    firstBodyExampleValues.forEach((value, index) => {
      const placeholderRegex = new RegExp(`{{\\s*${index + 1}\\s*}}`, 'g');
      rendered = rendered.replace(placeholderRegex, value || `{{${index + 1}}}`);
    });
    return rendered;
  }, [templateForm.bodyText, firstBodyExampleValues]);

  const headerPreviewLabel = useMemo(() => {
    switch (templateForm.headerType) {
      case 'TEXT':
        return templateForm.headerText.trim() || 'Header text';
      case 'IMAGE':
        return templateForm.headerMediaHandle
          ? `Image handle: ${templateForm.headerMediaHandle}`
          : 'Image header';
      case 'VIDEO':
        return templateForm.headerMediaHandle
          ? `Video handle: ${templateForm.headerMediaHandle}`
          : 'Video header';
      case 'DOCUMENT':
        return templateForm.headerMediaHandle
          ? `Document handle: ${templateForm.headerMediaHandle}`
          : 'Document header';
      default:
        return '';
    }
  }, [templateForm.headerType, templateForm.headerText]);

  const hasMediaHeader = templateForm.headerType !== 'NONE' && templateForm.headerType !== 'TEXT';
  const headerFileAccept = useMemo(() => {
    switch (templateForm.headerType) {
      case 'IMAGE':
        return 'image/*';
      case 'VIDEO':
        return 'video/*';
      case 'DOCUMENT':
        return '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt';
      default:
        return '';
    }
  }, [templateForm.headerType]);

  const handleHeaderUploadClick = () => {
    setHeaderUploadError(null);
    headerMediaInputRef.current?.click();
  };

  const handleHeaderFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (templateForm.headerType === 'NONE' || templateForm.headerType === 'TEXT') {
      setHeaderUploadError('Select an image, video, or document header type before uploading.');
      event.target.value = '';
      return;
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
      formData.append('media_type', templateForm.headerType);

      const response = await fetch('/api/whatsapp/media/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to upload media');
      }

      const mediaHandle = result.mediaHandle || '';
      handleTemplateFormChange('headerMediaHandle', mediaHandle);
      setHeaderUploadSuccess(mediaHandle);

      toast({
        title: 'Header media uploaded',
        description: 'Media handle inserted into the template automatically.',
      });
    } catch (error: any) {
      const message = error?.message || 'Failed to upload media';
      setHeaderUploadError(message);
      toast({
        title: 'Upload failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setHeaderUploadLoading(false);
      if (headerMediaInputRef.current) {
        headerMediaInputRef.current.value = '';
      }
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      category: 'UTILITY',
      language: 'en_US',
      headerType: 'NONE',
      headerText: '',
      headerMediaHandle: '',
      headerExampleText: '',
      bodyText: '',
      bodyExamples: [''],
      footerText: '',
      footerExample: '',
      buttons: [],
    });
    setHeaderUploadError(null);
    setHeaderUploadSuccess(null);
    if (headerMediaInputRef.current) {
      headerMediaInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openTemplateModal') === '1') {
      setActiveTab('templates');
      resetTemplateForm();
      setShowTemplateModal(true);
      params.delete('openTemplateModal');
      const nextSearch = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : '',
        },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatTarget = params.get('chat');
    if (!chatTarget || contactsLoading || !contactsLoaded) {
      return;
    }
    const normalizedTarget = normalizePhoneKey(chatTarget);
    if (!normalizedTarget) {
      params.delete('chat');
      const nextSearch = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : '',
        },
        { replace: true }
      );
      return;
    }
    const match = contacts.find(contact => {
      const phoneCandidates = [
        contact.normalizedPhone,
        contact.phone,
        ...(contact.allPhones || []),
      ].filter(Boolean) as string[];
      return phoneCandidates.some(value => normalizePhoneKey(value) === normalizedTarget);
    });
    if (match) {
      setActiveTab('chat');
      setShowNewChatForm(false);
      setSelectedContact(match);
    } else {
      toast({
        title: 'Chat not found',
        description: 'Start a conversation from the WhatsApp tab to message this contact.',
      });
    }
    params.delete('chat');
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true }
    );
  }, [contacts, contactsLoading, contactsLoaded, location.pathname, location.search, navigate]);

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    try {
      const params = new URLSearchParams({
        limit: '50',
      });
      const response = await fetch(`/api/whatsapp/templates?${params.toString()}`, {
        headers: buildAuthHeaders(),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to load templates');
      }
      const data = await response.json();
      const rawTemplates = Array.isArray(data) ? data : data?.templates || [];
      const list: TemplateListItem[] = rawTemplates.map((item: any) => ({
        id: item.id || item.name,
        name: item.name,
        status: (item.status || 'draft').toLowerCase(),
        category: (item.category || 'unknown').toUpperCase(),
        language: item.language || 'en_US',
        updatedAt: item.last_updated_time || item.updatedAt || new Date().toISOString(),
        rejectedReason: item.rejected_reason || null,
        subCategory: item.sub_category || null,
        qualityScore: item.quality_score?.score || item.quality_score || null,
        components: item.components || null,
      }));
      setTemplates(list);
    } catch (error: any) {
      const message = error?.message || 'Unable to load templates';
      setTemplatesError(message);
      toast({
        title: 'Failed to load templates',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleCreateTemplate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (templateActionLoading) return;

    if (!templateForm.name.trim() || !templateForm.bodyText.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Template name and body are required.',
        variant: 'destructive',
      });
      return;
    }

    const placeholderMatches = templateForm.bodyText.match(/{{\s*(\d+)\s*}}/g) || [];
    const uniquePlaceholders = Array.from(
      new Set(placeholderMatches.map(token => token.replace(/[^0-9]/g, '')).filter(Boolean))
    );

    const bodyExampleRows = templateForm.bodyExamples
      .map(row =>
        row
          .split(',')
          .map(value => value.trim())
          .filter(Boolean)
      )
      .filter(example => example.length > 0);

    const normalizedBodyExampleRows =
      bodyExampleRows.length <= 1 || bodyExampleRows.some(row => row.length > 1)
        ? bodyExampleRows
        : [bodyExampleRows.flat()];

    if (uniquePlaceholders.length > 0) {
      if (bodyExampleRows.length === 0) {
        toast({
          title: 'Add example values',
          description:
            'Provide sample values for the body placeholders (e.g. “John, Order #1234”).',
          variant: 'destructive',
        });
        return;
      }

      if ((normalizedBodyExampleRows[0] ?? []).length < uniquePlaceholders.length) {
        toast({
          title: 'Incomplete body examples',
          description: `Expected ${
            uniquePlaceholders.length
          } value(s) for the first example row but found ${
            (normalizedBodyExampleRows[0] ?? []).length
          }.`,
          variant: 'destructive',
        });
        return;
      }
    }

    if (templateForm.headerType === 'TEXT' && !templateForm.headerText.trim()) {
      toast({
        title: 'Header text required',
        description: 'Provide header text or switch header type to none.',
        variant: 'destructive',
      });
      return;
    }

    if (
      (templateForm.headerType === 'IMAGE' ||
        templateForm.headerType === 'VIDEO' ||
        templateForm.headerType === 'DOCUMENT') &&
      !templateForm.headerMediaHandle.trim()
    ) {
      toast({
        title: 'Header media handle required',
        description: 'Provide the uploaded media handle for the header.',
        variant: 'destructive',
      });
      return;
    }

    const invalidButton = templateForm.buttons.find(button => {
      if (!button.text.trim()) return true;
      if (button.type === 'URL' && !button.url?.trim()) return true;
      if (button.type === 'PHONE_NUMBER' && !button.phoneNumber?.trim()) return true;
      return false;
    });

    if (invalidButton) {
      toast({
        title: 'Incomplete button details',
        description: 'Each button needs text and any required URL or phone number.',
        variant: 'destructive',
      });
      return;
    }

    setTemplateActionLoading(true);
    try {
      const components: any[] = [];

      if (templateForm.headerType !== 'NONE') {
        const headerComponent: any = {
          type: 'HEADER',
        };

        if (templateForm.headerType === 'TEXT') {
          headerComponent.format = 'TEXT';
          headerComponent.text = templateForm.headerText.trim();
          if (templateForm.headerExampleText.trim()) {
            headerComponent.example = {
              header_text: [templateForm.headerExampleText.trim()],
            };
          }
        } else {
          headerComponent.format = templateForm.headerType;
          if (templateForm.headerMediaHandle.trim()) {
            headerComponent.example = {
              header_handle: [templateForm.headerMediaHandle.trim()],
            };
          }
        }

        components.push(headerComponent);
      }

      const bodyComponent: any = {
        type: 'BODY',
        text: templateForm.bodyText.trim(),
      };

      if (normalizedBodyExampleRows.length > 0) {
        bodyComponent.example = {
          body_text: normalizedBodyExampleRows,
        };
      }

      components.push(bodyComponent);

      if (templateForm.footerText.trim()) {
        const footerComponent: any = {
          type: 'FOOTER',
          text: templateForm.footerText.trim(),
        };
        if (templateForm.footerExample.trim()) {
          footerComponent.example = {
            footer_text: [templateForm.footerExample.trim()],
          };
        }
        components.push(footerComponent);
      }

      if (templateForm.buttons.length > 0) {
        const buttonsForApi = templateForm.buttons.map(button => {
          const base = {
            type: button.type,
            text: button.text.trim(),
          } as any;

          if (button.type === 'URL') {
            base.url = button.url?.trim();
            if (button.example?.trim()) {
              base.example = [button.example.trim()];
            }
          }

          if (button.type === 'PHONE_NUMBER') {
            base.phone_number = button.phoneNumber?.trim();
          }

          return base;
        });

        components.push({
          type: 'BUTTONS',
          buttons: buttonsForApi,
        });
      }

      const payload = {
        name: templateForm.name.trim(),
        category: templateForm.category,
        language: templateForm.language,
        components,
      };

      const response = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create template');
      }

      toast({
        title: 'Template draft created',
        description: 'The template has been saved. Submit it for review when ready.',
      });
      resetTemplateForm();
      setShowTemplateModal(false);
      await loadTemplates();
    } catch (error: any) {
      const message = error?.message || 'Unable to create template';
      toast({
        title: 'Create failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setTemplateActionLoading(false);
    }
  };

  const handleSubmitTemplate = async (templateId: string) => {
    if (!templateId) return;
    setTemplateActionLoading(true);
    try {
      const response = await fetch('/api/whatsapp/templates/submit', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        body: JSON.stringify({ templateId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit template');
      }
      toast({
        title: 'Template submitted',
        description: 'The template has been submitted to Meta for approval.',
      });
      await loadTemplates();
    } catch (error: any) {
      const message = error?.message || 'Unable to submit template';
      toast({
        title: 'Submit failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setTemplateActionLoading(false);
    }
  };

  const handleDeleteTemplate = async (template: TemplateListItem) => {
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
          headers: buildAuthHeaders(),
        }
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete template');
      }

      toast({
        title: 'Template deleted',
        description: 'The template has been removed.',
      });
      await loadTemplates();
    } catch (error: any) {
      const message = error?.message || 'Unable to delete template';
      toast({
        title: 'Delete failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setTemplateActionLoading(false);
    }
  };

  const showChatPanel = Boolean(selectedContact);
  const latestInboundTimestamp = useMemo(() => {
    const inboundMessages = messages.filter(message => message.from === 'customer');
    const latestInbound = inboundMessages[inboundMessages.length - 1];
    if (latestInbound?.timestamp) {
      return latestInbound.timestamp;
    }
    return selectedContact?.lastInboundTime || null;
  }, [messages, selectedContact?.lastInboundTime]);
  const canSendWithinWindow = useMemo(() => {
    if (!latestInboundTimestamp) {
      return false;
    }
    const inboundTime = new Date(latestInboundTimestamp).getTime();
    if (!Number.isFinite(inboundTime)) {
      return false;
    }
    return Date.now() - inboundTime <= 24 * 60 * 60 * 1000;
  }, [latestInboundTimestamp]);

  return (
    <div className="w-screen h-[100dvh] overflow-hidden bg-slate-50/80 p-0 m-0 rounded-none space-y-0 sm:w-auto sm:h-auto sm:overflow-visible sm:bg-transparent sm:space-y-6">
      <div className="hidden items-center justify-between flex-wrap gap-3 px-0 sm:flex sm:px-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">WhatsApp Control Center</h1>
          {storeDisplayName && (
            <div className="text-xs sm:text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{storeDisplayName}</span>
              {storeNumberLabel ? (
                <span className="ml-2 text-gray-400">WA: {storeNumberLabel}</span>
              ) : null}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/contacts')}
          className="hidden rounded-full border-teal-200 bg-slate-900 text-sm font-semibold text-white sm:inline-flex"
        >
          View contacts
        </Button>
      </div>

      {activeTab === 'chat' ? (
        <section className="h-full w-full p-0 m-0 space-y-0">
          {notificationsSupported && notificationPermission !== 'granted' && (
            <div className="w-full rounded-none border-x-0 border-t-0 border-b border-amber-200 px-4 py-3 text-sm text-amber-900 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:rounded-lg sm:border sm:border-amber-200">
              <span>Allow browser notifications in browser settings to receive alerts.</span>
              <Button
                type="button"
                size="sm"
                variant="link"
                onClick={requestNotificationPermission}
                className="h-auto p-0 text-amber-900"
              >
                Enable notifications
              </Button>
            </div>
          )}
          {contactsError && (
            <div className="w-full rounded-none border-x-0 border-t-0 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:rounded-md sm:border sm:border-red-200">
              {contactsError}
            </div>
          )}

          <div className="flex h-[100dvh] min-h-0 flex-col gap-0 overflow-hidden lg:h-[70vh] lg:min-h-[400px] lg:flex-row lg:gap-4">
            <aside
              className={cn(
                'h-full min-h-0 flex-col overflow-hidden rounded-none border border-gray-100 bg-white shadow-sm lg:w-80 lg:flex-none lg:rounded-xl',
                showChatPanel ? 'hidden lg:flex' : 'flex'
              )}
            >
              <div className="border-b border-gray-100 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-gray-900">Chats</h2>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setShowSaveContactForm(prev => {
                          const next = !prev;
                          resetSaveContactForm();
                          if (next) {
                            setShowNewChatForm(false);
                          }
                          return next;
                        })
                      }
                      className={cn(
                        'h-8 gap-2 rounded-full px-3 text-xs font-semibold shadow',
                        'border border-teal-200 bg-white text-teal-700 hover:bg-teal-50'
                      )}
                    >
                      <PenSquare className="h-3.5 w-3.5" />
                      {showSaveContactForm ? 'Close' : 'Save contact'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={loadContacts}
                      disabled={contactsLoading}
                      className="h-8 w-8 border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      title="Refresh chats"
                    >
                      {contactsLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={event => setSearchTerm(event.target.value)}
                    placeholder="Search by name or number"
                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInboundOnly(prev => !prev)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition',
                      showInboundOnly
                        ? 'bg-indigo-600 text-white shadow'
                        : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Inbound replies
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUnreadOnly(prev => !prev)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition',
                      showUnreadOnly
                        ? 'bg-[#66A3FF] text-white shadow'
                        : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    Unread
                  </button>
                </div>
                {showNewChatForm && (
                  <form
                    onSubmit={handleStartNewChat}
                    className="mt-4 space-y-3 rounded-xl border border-teal-100 bg-teal-50/70 p-3 shadow-sm"
                  >
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-teal-900">
                        Phone number
                      </label>
                      <input
                        type="tel"
                        value={newChatPhone}
                        onChange={event => setNewChatPhone(event.target.value)}
                        placeholder="e.g. +911234567890"
                        className="mt-1 w-full rounded-md border border-teal-200 px-3 py-2 text-sm text-teal-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                        disabled={sendingNewChat}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-teal-900">
                        Display name (optional)
                      </label>
                      <input
                        type="text"
                        value={newChatName}
                        onChange={event => setNewChatName(event.target.value)}
                        placeholder="Customer name"
                        className="mt-1 w-full rounded-md border border-teal-200 px-3 py-2 text-sm text-teal-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                        disabled={sendingNewChat}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-teal-900">
                        Message
                      </label>
                      <textarea
                        value={newChatMessage}
                        onChange={event => setNewChatMessage(event.target.value)}
                        placeholder="Write your first message…"
                        rows={3}
                        className="mt-1 w-full rounded-md border border-teal-200 px-3 py-2 text-sm text-teal-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                        disabled={sendingNewChat}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="submit" disabled={sendingNewChat}>
                        {sendingNewChat ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send message
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          if (sendingNewChat) return;
                          setShowNewChatForm(false);
                          setNewChatPhone('');
                          setNewChatName('');
                          setNewChatMessage('');
                        }}
                        disabled={sendingNewChat}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
                {showSaveContactForm && (
                  <form
                    onSubmit={handleSaveContactSubmit}
                    className="mt-4 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 shadow-sm"
                  >
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-indigo-900">
                        Phone number
                      </label>
                      <input
                        type="tel"
                        value={saveContactPhone}
                        onChange={event => setSaveContactPhone(event.target.value)}
                        placeholder="e.g. +911234567890"
                        className="mt-1 w-full rounded-md border border-indigo-200 px-3 py-2 text-sm text-indigo-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        disabled={savingContact}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-indigo-900">
                        Contact name
                      </label>
                      <input
                        type="text"
                        value={saveContactName}
                        onChange={event => setSaveContactName(event.target.value)}
                        placeholder="Customer name"
                        className="mt-1 w-full rounded-md border border-indigo-200 px-3 py-2 text-sm text-indigo-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        disabled={savingContact}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-indigo-900">
                        Tag
                      </label>
                      <input
                        type="text"
                        value={saveContactTag}
                        onChange={event => setSaveContactTag(event.target.value)}
                        placeholder="e.g. VIP, Partner"
                        className="mt-1 w-full rounded-md border border-indigo-200 px-3 py-2 text-sm text-indigo-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        disabled={savingContact}
                      />
                    </div>
                    {saveContactError && (
                      <p className="text-xs font-semibold text-red-600">{saveContactError}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button type="submit" disabled={savingContact}>
                        {savingContact ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Save contact
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        className="bg-indigo-600 text-white hover:bg-indigo-500 border-indigo-600"
                        onClick={() => {
                          if (savingContact) return;
                          resetSaveContactForm();
                          setShowSaveContactForm(false);
                        }}
                        disabled={savingContact}
                      >
                        Close
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                {contactsLoading ? (
                  <div className="flex flex-col gap-4 p-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="animate-pulse space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200" />
                          <div className="flex-1">
                            <div className="h-3 w-1/3 rounded bg-gray-200" />
                            <div className="mt-2 h-3 w-2/3 rounded bg-gray-100" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center text-sm text-gray-500">
                    <MessageCircle className="h-6 w-6 text-gray-300" />
                    <p>
                      {showInboundOnly
                        ? 'No customers have responded yet.'
                        : 'No conversations yet. Trigger a test message to start chatting.'}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {filteredContacts.map(contact => {
                      const isActive =
                        selectedContact?.id === contact.id ||
                        (!!selectedContact?.normalizedPhone &&
                          selectedContact.normalizedPhone === contact.normalizedPhone);
                      const unread = hasUnreadMessages(contact);
                      return (
                        <li key={contact.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedContact(contact)}
                            className={cn(
                              'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                              isActive ? 'bg-teal-50' : 'hover:bg-gray-50'
                            )}
                          >
                            <div className="relative">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white">
                                {initialsFromName(getContactDisplayName(contact), contact.phone)}
                              </div>
                              {unread && (
                                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#66A3FF] shadow" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-medium text-gray-900">
                                  {getContactDisplayName(contact)}
                                </p>
                                <span
                                  className={cn(
                                    'shrink-0 text-xs',
                                    unread ? 'font-semibold text-[#66A3FF]' : 'text-gray-400'
                                  )}
                                >
                                  {formatListTimestamp(contact.lastMessageTime)}
                                </span>
                              </div>
                              {contact.segment && (
                                <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
                                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                                    {contact.segment}
                                  </span>
                                </div>
                              )}
                              <p
                                className={cn(
                                  'truncate text-xs',
                                  unread ? 'text-gray-900 font-semibold' : 'text-gray-500'
                                )}
                              >
                                {contact.lastMessage || 'No messages yet'}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </aside>

            <section
              className={cn(
                'h-full w-full flex-1 min-h-0 flex-col overflow-hidden rounded-none border-0 bg-white shadow-none',
                showChatPanel ? 'flex' : 'hidden lg:flex'
              )}
            >
              {selectedContact ? (
                <>
                  {/* UI polish: compact Interakt-style header */}
                  <div className="w-full sticky top-0 left-0 right-0 z-10 flex flex-col gap-2 border-b border-slate-100 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <button
                          type="button"
                          onClick={() => setSelectedContact(null)}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 lg:hidden"
                        >
                          <span aria-hidden="true">&lt;-</span>
                          Back to chats
                        </button>
                        <p className="mt-2 text-[15px] font-semibold text-slate-900 lg:mt-0 sm:text-base sm:text-gray-900">
                          {getContactDisplayName(selectedContact)}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-slate-500 sm:text-xs sm:text-gray-500">
                          <Phone className="h-3 w-3" />
                          {selectedContact.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 lg:hidden">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-teal-600"
                          onClick={() => loadConversation(selectedContact)}
                          aria-label="Refresh chat"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-700"
                          onClick={() => {
                            setShowSaveContactForm(true);
                            setShowNewChatForm(false);
                            setSaveContactPhone(selectedContact.phone);
                            setSaveContactName(
                              selectedContact.name &&
                                selectedContact.name.toLowerCase().startsWith('customer')
                                ? ''
                                : selectedContact.name
                            );
                            setSaveContactTag(selectedContact.segment || '');
                          }}
                          aria-label="Edit contact"
                        >
                          <PenSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={handleDeleteChatConversation}
                          disabled={deletingChat}
                          aria-label="Delete chat"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="hidden flex-wrap items-center gap-2 text-xs text-gray-500 lg:flex">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="hidden h-7 px-2 text-[12px] font-semibold text-teal-600 sm:inline-flex"
                        onClick={() => loadConversation(selectedContact)}
                      >
                        Refresh chat
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="hidden h-7 px-2 text-[12px] font-semibold text-slate-700 sm:inline-flex"
                        onClick={() => {
                          setShowSaveContactForm(true);
                          setShowNewChatForm(false);
                          setSaveContactPhone(selectedContact.phone);
                          setSaveContactName(
                            selectedContact.name &&
                              selectedContact.name.toLowerCase().startsWith('customer')
                              ? ''
                              : selectedContact.name
                          );
                          setSaveContactTag(selectedContact.segment || '');
                        }}
                      >
                        Edit contact
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="hidden h-7 px-2 text-[12px] font-semibold text-red-600 hover:text-red-700 sm:inline-flex"
                        onClick={handleDeleteChatConversation}
                        disabled={deletingChat}
                      >
                        {deletingChat ? 'Deleting…' : 'Delete chat'}
                      </Button>
                      <div className="items-center gap-2 lg:flex text-[11px] text-slate-500 sm:text-xs sm:text-gray-500">
                        {selectedContact.lastStatus && (
                          <span className="inline-flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                            {selectedContact.lastStatus}
                          </span>
                        )}
                        {selectedContact.lastMessageTime && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatListTimestamp(selectedContact.lastMessageTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* UI polish: airy message list + refined bubbles */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 w-full min-h-0 space-y-5 overflow-y-auto overscroll-contain bg-slate-50/80 px-4 py-6"
                  >
                    {messagesLoading ? (
                      <div className="flex items-center justify-center py-12 text-sm text-gray-500">
                        Loading messages…
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-gray-500">
                        <MessageCircle className="h-8 w-8 text-gray-300" />
                        <p>No messages yet. Start the conversation below.</p>
                      </div>
                    ) : (
                      (() => {
                        let insertedUnreadDivider = false;
                        return messages.map(message => {
                          const isSystem = message.type === 'system' || message.from === 'system';
                          const isVendor = message.from === 'vendor';
                          const timestampLabel = formatMessageTimestamp(message.timestamp);
                          const resolvedStatus = isVendor ? resolveMessageStatus(message) : null;
                          const statusInfo = isVendor ? getStatusAppearance(resolvedStatus) : null;
                          const statusTooltip = isVendor
                            ? buildStatusTooltip(message, statusInfo?.label)
                            : '';
                          const messageTime = message.timestamp
                            ? new Date(message.timestamp).getTime()
                            : null;
                          const showUnreadDivider =
                            Boolean(
                              unreadAnchorTime !== null &&
                                !insertedUnreadDivider &&
                                messageTime !== null &&
                                messageTime > unreadAnchorTime
                            ) && !isSystem;

                          if (showUnreadDivider) {
                            insertedUnreadDivider = true;
                          }

                          if (isSystem) {
                            return (
                              <div key={message.id} className="flex justify-center">
                                <div className="max-w-[75%] rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-center text-[11px] font-medium text-slate-500 shadow-sm sm:max-w-md sm:rounded-xl sm:border-dashed sm:border-gray-300 sm:bg-white sm:px-4 sm:py-2 sm:text-xs sm:text-gray-600 sm:shadow-sm">
                                  <div className="flex items-center justify-center gap-1 text-[12px] text-slate-600 sm:text-sm sm:text-gray-700">
                                    {message.campaignName ? '📢' : null}
                                    <span>
                                      {message.campaignName
                                        ? `Campaign: ${message.campaignName}`
                                        : message.text}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-[11px] text-slate-400 sm:text-[11px] sm:text-gray-400">
                                    {timestampLabel}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          const messageBody = renderMessageBody(message, isVendor);
                          const showCampaignBadge =
                            isVendor &&
                            (message.isCampaign || message.campaignName || message.templateName);

                          return (
                            <React.Fragment key={message.id}>
                              {showUnreadDivider && (
                                <div className="flex justify-center">
                                  <div className="mb-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-700 sm:text-xs sm:shadow">
                                    New messages
                                  </div>
                                </div>
                              )}
                              <div
                                className={cn('flex', isVendor ? 'justify-end' : 'justify-start')}
                              >
                                <div
                                  className={cn(
                                    'max-w-[75%] rounded-[18px] px-4 py-2.5 text-[14px] leading-relaxed md:max-w-xl space-y-2 shadow-sm sm:max-w-[85%] sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm',
                                    isVendor
                                      ? 'rounded-br-[6px] border border-emerald-100 bg-emerald-50 text-slate-800 sm:rounded-br-none sm:border-0 sm:bg-teal-500 sm:text-white'
                                      : 'rounded-bl-[6px] border border-slate-200 bg-white text-slate-800 sm:rounded-bl-none sm:border sm:border-gray-200 sm:text-gray-900 sm:shadow-sm'
                                  )}
                                >
                                  {showCampaignBadge && (
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[10px] sm:text-white/80">
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 sm:bg-white/20">
                                        Campaign
                                      </span>
                                      {message.campaignName && (
                                        <span className="normal-case font-medium text-slate-500 sm:text-white/90">
                                          {message.campaignName}
                                        </span>
                                      )}
                                      {message.templateName && (
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 sm:bg-white/20">
                                          {message.templateName}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {messageBody}
                                  {isVendor ? (
                                    <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-500 sm:text-[11px] sm:text-white/80">
                                      <span>{timestampLabel}</span>
                                      {statusInfo?.icon && (
                                        <span
                                          title={statusTooltip || statusInfo.label}
                                          className={statusInfo.colorClass}
                                        >
                                          {statusInfo.icon}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="mt-1 block text-[11px] text-slate-400 sm:text-[11px] sm:text-gray-400">
                                      {timestampLabel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        });
                      })()
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {!canSendWithinWindow && (
                    <div className="border-t border-amber-200 bg-amber-50 px-2 py-2 text-sm text-amber-800 sm:px-4">
                      Messaging is available only within 24 hours of the customer's last reply.
                    </div>
                  )}
                  {messageError && (
                    <div className="border-t border-red-200 bg-red-50 px-2 py-2 text-sm text-red-600 sm:px-4">
                      {messageError}
                    </div>
                  )}

                  {/* UI polish: composer with safe-area padding */}
                  <div className="w-full sticky bottom-0 left-0 right-0 border-t border-slate-100 bg-white/95 backdrop-blur p-0 pb-[calc(env(safe-area-inset-bottom)+64px)] sm:static sm:pb-0 sm:px-4 sm:py-3">
                    {attachmentFile && (
                      <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                        <div className="flex items-center gap-3">
                          {attachmentType === 'image' && attachmentPreviewUrl ? (
                            <img
                              src={attachmentPreviewUrl}
                              alt="Attachment preview"
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                              <FileText className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-gray-900">
                              {attachmentFile.name}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {attachmentType === 'image' ? 'Image ready' : 'Document ready'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={resetAttachment}
                          className="rounded-full border border-gray-200 bg-white p-1 text-gray-500 hover:bg-gray-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {attachmentError && (
                      <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {attachmentError}
                      </div>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <div className="relative flex items-center gap-2 px-4 pt-3 sm:px-0 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="hidden h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 sm:flex"
                          aria-label="Attach image"
                          disabled={!canSendWithinWindow}
                        >
                          <Image className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => documentInputRef.current?.click()}
                          className="hidden h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 sm:flex"
                          aria-label="Attach document"
                          disabled={!canSendWithinWindow}
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageInputChange}
                        />
                        <input
                          ref={documentInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                          className="hidden"
                          onChange={handleDocumentInputChange}
                        />
                        <input
                          ref={attachmentsInputRef}
                          type="file"
                          accept="*/*"
                          className="hidden"
                          onChange={handleAnyAttachmentInputChange}
                        />
                      </div>
                      <div className="flex items-center gap-2 px-4 pb-3 sm:px-0 sm:pb-0 sm:flex-1">
                        <div className="relative flex-1">
                          {emojiPickerOpen && (
                            <div className="absolute bottom-12 left-0 z-20 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
                              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                                Quick emojis
                              </p>
                              <div className="mt-2 grid grid-cols-8 gap-2 text-lg">
                                {QUICK_EMOJIS.map(emoji => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {actionMenuOpen && (
                            <div className="absolute bottom-12 right-0 z-20 w-[min(320px,85vw)] rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
                              <div className="grid grid-cols-3 gap-3 text-center text-[11px] font-semibold text-gray-700">
                                {[
                                  { label: 'Reply', icon: Reply },
                                  { label: 'Quick Reply', icon: Zap },
                                  { label: 'Templates', icon: LayoutGrid },
                                  { label: 'Notes', icon: FileText },
                                  {
                                    label: 'Attachments',
                                    icon: Paperclip,
                                    onClick: () => {
                                      attachmentsInputRef.current?.click();
                                      setActionMenuOpen(false);
                                    },
                                  },
                                ].map(item => (
                                  <button
                                    key={item.label}
                                    type="button"
                                    onClick={item.onClick}
                                    className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-2 py-3 text-gray-700 hover:bg-gray-100"
                                  >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-teal-600 shadow-sm">
                                      <item.icon className="h-4 w-4" />
                                    </span>
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
                            <button
                              type="button"
                              onClick={() => setEmojiPickerOpen(prev => !prev)}
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full border text-gray-600',
                                emojiPickerOpen
                                  ? 'border-teal-300 bg-teal-50 text-teal-700'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              )}
                              aria-label="Add emoji"
                              disabled={!canSendWithinWindow}
                            >
                              <Smile className="h-4 w-4" />
                            </button>
                            <input
                              type="text"
                              value={newMessage}
                              onChange={event => setNewMessage(event.target.value)}
                              onKeyDown={handleMessageKeyDown}
                              placeholder="Type a message…"
                              disabled={sending || !canSendWithinWindow}
                              className="w-full bg-transparent text-sm text-gray-900 focus:outline-none disabled:text-gray-400"
                            />
                            <button
                              type="button"
                              onClick={() => setActionMenuOpen(prev => !prev)}
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full border text-gray-600',
                                actionMenuOpen
                                  ? 'border-teal-300 bg-teal-50 text-teal-700'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              )}
                              aria-label="Open quick actions"
                              disabled={!canSendWithinWindow}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={
                            sending ||
                            !canSendWithinWindow ||
                            (!newMessage.trim() && !attachmentFile)
                          }
                          className="h-10 w-10 sm:w-auto sm:px-4 rounded-full bg-teal-600 text-white hover:bg-teal-500 shadow-md"
                          aria-label="Send message"
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              <span className="hidden sm:inline">Send</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center text-sm text-gray-500">
                  <MessageCircle className="h-10 w-10 text-gray-300" />
                  <p>Select a conversation to view the chat history.</p>
                </div>
              )}
            </section>
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900">Message Templates</h2>
            <p className="mt-2 text-sm text-gray-600">
              Template management now lives in the Template Library. Switch to Analytics → Template
              Library to create, edit, or submit WhatsApp templates.
            </p>
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                onClick={() => navigate('/analytics?tab=templates')}
                className="px-4"
              >
                Open Template Library
              </Button>
            </div>
          </div>
          {false && (
            <>
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Message Templates</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage your WhatsApp template drafts, submit them for approval, and monitor
                      their status.
                    </p>
                  </div>
                  <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={templateSearch}
                        onChange={event => setTemplateSearch(event.target.value)}
                        placeholder="Search templates"
                        className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        resetTemplateForm();
                        setShowTemplateModal(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Create Template
                    </Button>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-gray-100 overflow-hidden">
                  {templatesLoading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
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
                            Language
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
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                                  template.status === 'approved'
                                    ? 'bg-green-100 text-green-700'
                                    : template.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : template.status === 'submitted'
                                    ? 'bg-blue-100 text-[#66A3FF]'
                                    : 'bg-yellow-100 text-yellow-700'
                                )}
                              >
                                {template.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{template.category}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {template.language.toUpperCase()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(template.updatedAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  disabled={templateActionLoading || template.status !== 'draft'}
                                  onClick={() => handleSubmitTemplate(template.id)}
                                >
                                  <PenSquare className="h-3.5 w-3.5" />
                                  Submit
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={templateActionLoading}
                                  onClick={() => handleDeleteTemplate(template)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {showTemplateModal && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                  role="presentation"
                  onClick={() => {
                    if (templateActionLoading) return;
                    setShowTemplateModal(false);
                  }}
                >
                  <div
                    role="dialog"
                    aria-modal="true"
                    className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
                    onClick={event => event.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Create Template Draft
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Provide the required fields and preview content before submitting to Meta.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (templateActionLoading) return;
                          setShowTemplateModal(false);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>

                    <form className="mt-6 space-y-6" onSubmit={handleCreateTemplate}>
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-5">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Template Name
                              </label>
                              <input
                                type="text"
                                value={templateForm.name}
                                onChange={event =>
                                  handleTemplateFormChange('name', event.target.value)
                                }
                                placeholder="limited_time_offer"
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Category
                              </label>
                              <select
                                value={templateForm.category}
                                onChange={event =>
                                  handleTemplateFormChange(
                                    'category',
                                    event.target.value as TemplateCategory
                                  )
                                }
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              >
                                <option value="MARKETING">MARKETING</option>
                                <option value="UTILITY" disabled>
                                  UTILITY (disabled)
                                </option>
                                <option value="PROMOTIONAL" disabled>
                                  PROMOTIONAL (disabled)
                                </option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Language
                              </label>
                              <input
                                type="text"
                                value={templateForm.language}
                                onChange={event =>
                                  handleTemplateFormChange('language', event.target.value)
                                }
                                placeholder="en_US"
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                          </div>

                          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">Header</p>
                                <p className="text-xs text-gray-500">
                                  Optional text or rich media shown at the top.
                                </p>
                              </div>
                            </div>
                            <select
                              value={templateForm.headerType}
                              onChange={event => {
                                const nextType = event.target.value as TemplateHeaderType;
                                handleTemplateFormChange('headerType', nextType);
                                if (nextType === 'TEXT') {
                                  handleTemplateFormChange('headerMediaHandle', '');
                                } else if (nextType === 'NONE') {
                                  handleTemplateFormChange('headerText', '');
                                  handleTemplateFormChange('headerMediaHandle', '');
                                  handleTemplateFormChange('headerExampleText', '');
                                } else {
                                  handleTemplateFormChange('headerText', '');
                                  handleTemplateFormChange('headerExampleText', '');
                                  handleTemplateFormChange('headerMediaHandle', '');
                                }
                              }}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                              <option value="NONE">No header</option>
                              <option value="TEXT">Text</option>
                              <option value="IMAGE">Image</option>
                              <option value="VIDEO">Video</option>
                              <option value="DOCUMENT">Document</option>
                            </select>

                            {templateForm.headerType === 'TEXT' && (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={templateForm.headerText}
                                  onChange={event =>
                                    handleTemplateFormChange('headerText', event.target.value)
                                  }
                                  placeholder="Title or short sentence"
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <input
                                  type="text"
                                  value={templateForm.headerExampleText}
                                  onChange={event =>
                                    handleTemplateFormChange(
                                      'headerExampleText',
                                      event.target.value
                                    )
                                  }
                                  placeholder="Example value (optional)"
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                              </div>
                            )}

                            {templateForm.headerType !== 'TEXT' &&
                              templateForm.headerType !== 'NONE' && (
                                <div className="space-y-3">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={handleHeaderUploadClick}
                                      disabled={headerUploadLoading}
                                      className={cn(
                                        'inline-flex items-center rounded-md border border-blue-500 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50',
                                        headerUploadLoading && 'cursor-not-allowed opacity-75'
                                      )}
                                    >
                                      {headerUploadLoading ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Uploading…
                                        </>
                                      ) : (
                                        <>
                                          <Image className="mr-2 h-4 w-4" />
                                          Upload media
                                        </>
                                      )}
                                    </button>
                                    <input
                                      type="text"
                                      value={templateForm.headerMediaHandle}
                                      onChange={event =>
                                        handleTemplateFormChange(
                                          'headerMediaHandle',
                                          event.target.value
                                        )
                                      }
                                      placeholder="Paste uploaded media handle"
                                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                  </div>
                                  <input
                                    ref={headerMediaInputRef}
                                    type="file"
                                    accept={headerFileAccept}
                                    onChange={handleHeaderFileChange}
                                    hidden
                                  />
                                  <p className="text-xs text-gray-500">
                                    Upload media via the WhatsApp Business API or provide an
                                    existing handle. Supported size up to 5&nbsp;MB.
                                  </p>
                                  {headerUploadSuccess && (
                                    <p className="text-xs font-medium text-green-600">
                                      Media uploaded successfully. Handle: {headerUploadSuccess}
                                    </p>
                                  )}
                                  {headerUploadError && (
                                    <p className="text-xs font-medium text-red-600">
                                      {headerUploadError}
                                    </p>
                                  )}
                                </div>
                              )}
                          </div>

                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Body</label>
                            <textarea
                              value={templateForm.bodyText}
                              onChange={event =>
                                handleTemplateFormChange('bodyText', event.target.value)
                              }
                              placeholder="Hi {{1}}, your order {{2}} has been shipped!"
                              rows={5}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">
                                Body variable examples
                              </span>
                              <button
                                type="button"
                                onClick={addBodyExampleRow}
                                className="text-sm font-medium text-blue-600 hover:text-[#66A3FF]"
                              >
                                + Add example
                              </button>
                            </div>
                            <p className="text-xs text-gray-500">
                              Provide sample values to demonstrate how numbered placeholders will
                              render. Separate variables with commas.
                            </p>
                            {templateForm.bodyExamples.map((example, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={example}
                                  onChange={event =>
                                    updateBodyExampleRow(index, event.target.value)
                                  }
                                  placeholder="e.g. John Doe, Order #1234"
                                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                {templateForm.bodyExamples.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeBodyExampleRow(index)}
                                    className="rounded-full border border-gray-200 bg-white p-1 text-gray-400 hover:text-red-500"
                                    aria-label="Remove example"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Footer
                            </label>
                            <input
                              type="text"
                              value={templateForm.footerText}
                              onChange={event =>
                                handleTemplateFormChange('footerText', event.target.value)
                              }
                              placeholder="Optional footer text"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <input
                              type="text"
                              value={templateForm.footerExample}
                              onChange={event =>
                                handleTemplateFormChange('footerExample', event.target.value)
                              }
                              placeholder="Footer example (optional)"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Buttons</span>
                              <button
                                type="button"
                                onClick={addTemplateButton}
                                disabled={templateForm.buttons.length >= 3}
                                className="text-sm font-medium text-blue-600 hover:text-[#66A3FF] disabled:cursor-not-allowed disabled:text-gray-400"
                              >
                                + Add button
                              </button>
                            </div>
                            <p className="text-xs text-gray-500">
                              Add up to 3 buttons. URL buttons can include a dynamic parameter via{' '}
                              <code>{'{{1}}'}</code>.
                            </p>

                            {templateForm.buttons.map((button, index) => (
                              <div
                                key={button.id}
                                className="space-y-2 rounded-lg border border-gray-200 bg-white p-3"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <select
                                    value={button.type}
                                    onChange={event => {
                                      const nextType = event.target.value as TemplateButtonType;
                                      updateTemplateButton(index, {
                                        type: nextType,
                                        url: nextType === 'URL' ? button.url : '',
                                        phoneNumber:
                                          nextType === 'PHONE_NUMBER' ? button.phoneNumber : '',
                                        example: nextType === 'URL' ? button.example : '',
                                      });
                                    }}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-40"
                                  >
                                    <option value="QUICK_REPLY">Quick Reply</option>
                                    <option value="URL">Call-to-Action URL</option>
                                    <option value="PHONE_NUMBER">Call Phone Number</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={button.text}
                                    onChange={event =>
                                      updateTemplateButton(index, { text: event.target.value })
                                    }
                                    placeholder="Button label"
                                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    required
                                  />
                                </div>

                                {button.type === 'URL' && (
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    <input
                                      type="text"
                                      value={button.url}
                                      onChange={event =>
                                        updateTemplateButton(index, { url: event.target.value })
                                      }
                                      placeholder="https://example.com"
                                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    <input
                                      type="text"
                                      value={button.example}
                                      onChange={event =>
                                        updateTemplateButton(index, { example: event.target.value })
                                      }
                                      placeholder="Example parameter (optional)"
                                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                  </div>
                                )}

                                {button.type === 'PHONE_NUMBER' && (
                                  <input
                                    type="text"
                                    value={button.phoneNumber}
                                    onChange={event =>
                                      updateTemplateButton(index, {
                                        phoneNumber: event.target.value,
                                      })
                                    }
                                    placeholder="e.g. +15551234567"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                  />
                                )}

                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => removeTemplateButton(index)}
                                    className="text-xs font-medium text-red-500 hover:text-red-600"
                                  >
                                    Remove button
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Live preview</h4>
                          <div className="mx-auto w-full max-w-[260px] rounded-[2.2rem] border-[6px] border-gray-900 bg-black">
                            <div className="relative h-[520px] overflow-hidden rounded-[1.6rem] bg-[#ece5dd]">
                              <div className="flex items-center gap-2 bg-[#075e54] px-3 py-2 text-white">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                                  {(templateForm.name || 'TM').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-white">
                                    {templateForm.name
                                      ? templateForm.name.replace(/_/g, ' ')
                                      : 'Template draft'}
                                  </p>
                                  <p className="text-[10px] text-white/70">
                                    WhatsApp template preview
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col gap-3 px-3 py-4 text-sm text-gray-800">
                                {templateForm.headerType !== 'NONE' &&
                                  (hasMediaHeader ? (
                                    <div className="flex h-32 items-center justify-center rounded-xl bg-gray-300 text-xs font-medium text-gray-600">
                                      {headerPreviewLabel}
                                    </div>
                                  ) : (
                                    <div className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow">
                                      {headerPreviewLabel}
                                    </div>
                                  ))}

                                <div className="rounded-xl rounded-tl-none bg-white px-3 py-3 shadow">
                                  {bodyPreview ? (
                                    bodyPreview.split('\n').map((line, index) => (
                                      <p key={index} className={index > 0 ? 'mt-2' : undefined}>
                                        {line}
                                      </p>
                                    ))
                                  ) : (
                                    <p className="text-gray-400">Body content will appear here</p>
                                  )}
                                </div>

                                {templateForm.footerText.trim() && (
                                  <p className="text-xs text-gray-500">
                                    {templateForm.footerText.trim()}
                                  </p>
                                )}

                                {templateForm.buttons.length > 0 && (
                                  <div className="space-y-2">
                                    {templateForm.buttons.map(button => (
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
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            if (templateActionLoading) return;
                            setShowTemplateModal(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={templateActionLoading}>
                          {templateActionLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Submitting…
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4" />
                              Submit
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
      {activeMediaPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeMediaPreview}
        >
          <div
            className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-slate-900 text-white shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {activeMediaPreview.fileName || 'WhatsApp media'}
                </p>
                {activeMediaPreview.caption ? (
                  <p className="mt-0.5 truncate text-xs text-white/70">
                    {activeMediaPreview.caption}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closeMediaPreview}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close preview</span>
              </button>
            </div>
            <div className="flex-1 bg-black/40 p-4">
              {(() => {
                const previewType = (activeMediaPreview.type || '').toLowerCase();
                if (previewType === 'video') {
                  return (
                    <video
                      controls
                      autoPlay
                      className="max-h-[70vh] w-full rounded-xl bg-black"
                      src={activeMediaPreview.src}
                    >
                      Your browser does not support video playback.
                    </video>
                  );
                }
                if (previewType === 'audio') {
                  return (
                    <div className="flex flex-col items-center gap-3 rounded-xl bg-black/30 p-6">
                      <audio controls autoPlay className="w-full">
                        <source src={activeMediaPreview.src} />
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  );
                }
                if (previewType === 'document') {
                  return (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-6 text-center">
                      <FileText className="h-10 w-10 text-white/70" />
                      <p className="text-sm font-medium">
                        {activeMediaPreview.fileName || 'Document'}
                      </p>
                      <p className="text-xs text-white/70">
                        Preview is unavailable. Use the download button below to open the file.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center justify-center">
                    <img
                      src={activeMediaPreview.src}
                      alt={
                        activeMediaPreview.caption ||
                        activeMediaPreview.fileName ||
                        'WhatsApp media'
                      }
                      className="max-h-[70vh] w-full rounded-xl object-contain"
                    />
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/80 px-5 py-3 text-xs text-white/70">
              <span>{activeMediaPreview.fileName}</span>
              <div className="flex items-center gap-3">
                <a
                  href={activeMediaPreview.src}
                  download={activeMediaPreview.fileName || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      <audio
        ref={incomingMessageAudioRef}
        src={notificationSoundPath}
        preload="auto"
        className="hidden"
      />
      <audio ref={orderRingAudioRef} src={orderRingSoundPath} preload="auto" className="hidden" />
    </div>
  );
};

export default WhatsApp;
