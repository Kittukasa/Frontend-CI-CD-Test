import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Building,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe,
  MessageSquare,
  UserCircle2,
  Store,
  Settings,
  HelpCircle,
  ImagePlus,
  Trash2,
  UploadCloud,
  RefreshCw
} from 'lucide-react';

const runtimeOnboardingLink = (
  ((import.meta.env as Record<string, string | undefined>)?.VITE_ONBOARDING_LINK ??
    (import.meta.env as Record<string, string | undefined>)?.ONBOARDING_LINK ??
    '') || ''
).trim();

interface AuditHistoryEntry {
  time?: string | null;
  location?: string | null;
  system?: string | null;
}

interface NormalizedAuditEntry {
  timestamp: string | null;
  location: string;
  userAgent: string;
}

interface StoreProfileResponse {
  store_id: string;
  franchise_id: string | null;
  store_name: string | null;
  brand_name: string | null;
  business_type: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  vendor_name: string | null;
  street_name: string | null;
  verified_name: string | null;
  waba_mobile_number: string | null;
  template_name: string | null;
  template_language: string | null;
  onboarding_status: string | null;
  created_at: string | null;
  updated_at: string | null;
  whatsapp_api_url: string | null;
  smart_header_text?: string | null;
  smart_footer_text?: string | null;
  smart_address_text?: string | null;
  smart_img_urls?: string[];
  smart_header_images?: string[];
  smart_bottom_banner?: string | null;
  audit_history?: AuditHistoryEntry[];
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

const MAX_SMART_HEADER_IMAGES = 7;
const HARD_CODED_PIN = '000000';

const defaultOnboardingConfig: OnboardingConfig = {
  wabaId: '',
  phoneNumberId: '',
  businessPhone: '',
  businessId: '',
  appId: '',
  verifiedName: '',
  lastUpdatedAt: null,
  onboardingLink: runtimeOnboardingLink
};

const StoreProfile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const getAuthToken = useCallback(
    () => (typeof window !== 'undefined' ? localStorage.getItem('bb_token') : null),
    []
  );
  const buildAuthHeaders = useCallback(
    (includeJson = false) => {
      const token = getAuthToken();
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
    },
    [getAuthToken]
  );
  const [profile, setProfile] = useState<StoreProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<
    'profile' | 'store' | 'settings' | 'smart-ebill' | 'help'
  >('profile');
  const [streetNameInput, setStreetNameInput] = useState('');
  const [streetNameSaving, setStreetNameSaving] = useState(false);
  const [streetNameStatus, setStreetNameStatus] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);
  const [storeNameInput, setStoreNameInput] = useState('');
  const [storeNameSaving, setStoreNameSaving] = useState(false);
  const [storeNameStatus, setStoreNameStatus] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);
  const [auditHistory, setAuditHistory] = useState<NormalizedAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState('');
  const [pinStatus, setPinStatus] = useState<{ hasPin: boolean; updatedAt: string | null } | null>(
    null
  );
  const [pinStatusLoading, setPinStatusLoading] = useState(true);
  const [pinStatusError, setPinStatusError] = useState('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [createPinLoading, setCreatePinLoading] = useState(false);
  const [updatePinLoading, setUpdatePinLoading] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [updatedPinInput, setUpdatedPinInput] = useState('');
  const [confirmUpdatedPinInput, setConfirmUpdatedPinInput] = useState('');
  const [pinPasswordInput, setPinPasswordInput] = useState('');
  const [updatePinPasswordInput, setUpdatePinPasswordInput] = useState('');
  const [forgotPinMode, setForgotPinMode] = useState(false);
  const [resetPinLoading, setResetPinLoading] = useState(false);
  const [forgotPinInput, setForgotPinInput] = useState('');
  const [confirmForgotPinInput, setConfirmForgotPinInput] = useState('');
  const [resetPinPasswordInput, setResetPinPasswordInput] = useState('');
  const securitySectionRef = useRef<HTMLDivElement | null>(null);
  const securityHighlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [securityHighlight, setSecurityHighlight] = useState(false);
  const [onboardingConfig, setOnboardingConfig] =
    useState<OnboardingConfig>(defaultOnboardingConfig);
  const [onboardingForm, setOnboardingForm] = useState<OnboardingFormValues>({
    wabaId: '',
    phoneNumberId: '',
    businessPhone: '',
    businessId: '',
    appId: '',
    verifiedName: ''
  });
  const [onboardingLinkUrl, setOnboardingLinkUrl] = useState<string>(runtimeOnboardingLink);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [pollingOnboarding, setPollingOnboarding] = useState(false);
  const [latestWebhookSnapshot, setLatestWebhookSnapshot] =
    useState<OnboardingWebhookSnapshot | null>(null);
  const [registerStatus, setRegisterStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [registeringNumber, setRegisteringNumber] = useState(false);
  const onboardingPollAttemptsRef = useRef(0);
  const latestSnapshotTimestampRef = useRef<string | null>(null);
  const phoneLookupPerformedRef = useRef<Set<string>>(new Set());
  const [phoneLookupLoading, setPhoneLookupLoading] = useState(false);
  const [phoneLookupError, setPhoneLookupError] = useState<string | null>(null);
  const [phoneLookupResult, setPhoneLookupResult] = useState<PhoneNumbersResponse | null>(null);
  const [smartHeaderText, setSmartHeaderText] = useState('');
  const [smartFooterText, setSmartFooterText] = useState('');
  const [smartAddressText, setSmartAddressText] = useState('');
  const [smartImages, setSmartImages] = useState<string[]>([]);
  const [headerImages, setHeaderImages] = useState<string[]>([]);
  const [bottomBanner, setBottomBanner] = useState<string | null>(null);
  const [smartStatus, setSmartStatus] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);
  const [smartSaving, setSmartSaving] = useState(false);
  const [smartUploading, setSmartUploading] = useState(false);

  const hasOnboardingLink = onboardingLinkUrl.trim().length > 0;
  const onboardingLastUpdatedDisplay = onboardingConfig.lastUpdatedAt
    ? new Date(onboardingConfig.lastUpdatedAt).toLocaleString()
    : 'Not saved yet';
  const latestWebhookCapturedDisplay = latestWebhookSnapshot?.capturedAt
    ? new Date(latestWebhookSnapshot.capturedAt).toLocaleString()
    : null;
  const candidateWabaIdForLookup = (onboardingForm.wabaId || latestWebhookSnapshot?.wabaId || '').trim();

  const handleOpenOnboarding = () => {
    if (!hasOnboardingLink) return;
    if (typeof window !== 'undefined') {
      window.open(onboardingLinkUrl, '_blank', 'noopener,noreferrer');
    }
    onboardingPollAttemptsRef.current = 0;
    setPollingOnboarding(true);
  };

  const loadOnboardingConfig = useCallback(async () => {
    setOnboardingLoading(true);
    setOnboardingError(null);

    try {
      const response = await fetch('/api/whatsapp/config/onboarding', {
        headers: buildAuthHeaders()
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
        onboardingLink: onboardingUrl
      };

      setOnboardingConfig(nextConfig);
      setOnboardingForm({
        wabaId: nextConfig.wabaId,
        phoneNumberId: nextConfig.phoneNumberId,
        businessPhone: nextConfig.businessPhone,
        businessId: nextConfig.businessId,
        appId: nextConfig.appId,
        verifiedName: nextConfig.verifiedName
      });
      setOnboardingLinkUrl(onboardingUrl);
    } catch (error: any) {
      const message = error?.message || 'Unable to load onboarding configuration';
      setOnboardingError(message);
    } finally {
      setOnboardingLoading(false);
    }
  }, [buildAuthHeaders]);

  const loadLatestOnboardingSnapshot = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp/onboarding/latest-webhook', {
        headers: buildAuthHeaders()
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
        capturedAt: captureTimestamp
      };

      setLatestWebhookSnapshot(normalizedSnapshot);

      setOnboardingForm(prev => ({
        wabaId: normalizedSnapshot.wabaId ?? prev.wabaId,
        phoneNumberId: normalizedSnapshot.phoneNumberId ?? prev.phoneNumberId,
        businessPhone: normalizedSnapshot.businessPhone ?? prev.businessPhone,
        businessId: normalizedSnapshot.businessId ?? prev.businessId,
        appId: normalizedSnapshot.appId ?? prev.appId,
        verifiedName: normalizedSnapshot.verifiedName ?? prev.verifiedName
      }));

      if (captureTimestamp && captureTimestamp !== latestSnapshotTimestampRef.current) {
        toast({
          title: 'Meta onboarding data detected',
          description: 'Latest webhook payload prefilled the onboarding form.'
        });
        latestSnapshotTimestampRef.current = captureTimestamp;
      }
    } catch (error) {
      console.error('Failed to load onboarding snapshot', error);
    }
  }, [buildAuthHeaders]);

  const fetchPhoneNumbersFromMeta = useCallback(
    async (wabaId: string, options: { silent?: boolean } = {}) => {
      const trimmedWabaId = wabaId.trim();
      if (!trimmedWabaId) {
        setPhoneLookupError('Provide a WABA ID before fetching phone numbers.');
        if (!options.silent) {
          toast({
            title: 'WABA ID missing',
            description: 'Enter or detect a WABA ID first.',
            variant: 'destructive'
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
            headers: buildAuthHeaders()
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
            verifiedName: firstNumber.verified_name || prev.verifiedName
          }));
        }

        if (!options.silent) {
          toast({
            title: 'Phone numbers retrieved',
            description: firstNumber
              ? `Found ${payload.phoneNumbers.length} number(s); using ${firstNumber.display_phone_number || firstNumber.id}.`
              : 'Fetched phone numbers. Review the list below.'
          });
        }
      } catch (error: any) {
        const message = error?.message || 'Unable to fetch phone numbers.';
        setPhoneLookupError(message);
        if (!options.silent) {
          toast({
            title: 'Meta fetch failed',
            description: message,
            variant: 'destructive'
          });
        }
      } finally {
        setPhoneLookupLoading(false);
      }
    },
    [buildAuthHeaders]
  );

  const handleOnboardingInputChange =
    (field: keyof OnboardingFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setOnboardingForm(prev => ({
        ...prev,
        [field]: event.target.value
      }));
      setOnboardingError(null);
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
        title: 'Onboarding details required',
        description: 'Both WABA ID and Phone Number ID are required to save onboarding details.',
        variant: 'destructive'
      });
      return;
    }

    setOnboardingSaving(true);
    setOnboardingError(null);

    try {
      const response = await fetch('/api/whatsapp/config/onboarding', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        body: JSON.stringify({
          wabaId: trimmedWabaId,
          phoneNumberId: trimmedPhoneId,
          businessPhone: trimmedBusinessPhone,
          businessId: trimmedBusinessId,
          appId: trimmedAppId,
          verifiedName: trimmedVerifiedName
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Unable to update onboarding configuration');
      }

      const updatedConfig = result.config || result;
      const updatedLinkValue =
        typeof updatedConfig.onboardingLink === 'string'
          ? updatedConfig.onboardingLink.trim()
          : onboardingLinkUrl || runtimeOnboardingLink;

      const nextConfig: OnboardingConfig = {
        wabaId: trimmedWabaId,
        phoneNumberId: trimmedPhoneId,
        businessPhone: trimmedBusinessPhone,
        businessId: trimmedBusinessId,
        appId: trimmedAppId,
        verifiedName: trimmedVerifiedName,
        lastUpdatedAt: updatedConfig.lastUpdatedAt || new Date().toISOString(),
        onboardingLink: updatedLinkValue
      };

      setOnboardingConfig(nextConfig);
      setOnboardingForm({
        wabaId: nextConfig.wabaId,
        phoneNumberId: nextConfig.phoneNumberId,
        businessPhone: nextConfig.businessPhone,
        businessId: nextConfig.businessId,
        appId: nextConfig.appId,
        verifiedName: nextConfig.verifiedName
      });
      setOnboardingLinkUrl(updatedLinkValue);

      toast({
        title: 'Onboarding details saved',
        description: 'WhatsApp Business information was stored successfully.'
      });
    } catch (error: any) {
      const message = error?.message || 'Unable to save onboarding configuration';
      setOnboardingError(message);
      toast({
        title: 'Save failed',
        description: message,
        variant: 'destructive'
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
        variant: 'destructive'
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
          pin: HARD_CODED_PIN
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Failed to connect phone number');
      }

      const successMessage = 'The WhatsApp number was registered successfully.';
      toast({
        title: 'Number connected',
        description: successMessage
      });
      setRegisterStatus({ type: 'success', message: successMessage });
    } catch (error: any) {
      const message = error?.message || 'Unable to register the phone number';
      toast({
        title: 'Connection failed',
        description: message,
        variant: 'destructive'
      });
      setRegisterStatus({ type: 'error', message });
    } finally {
      setRegisteringNumber(false);
    }
  };

  useEffect(() => {
    loadOnboardingConfig().finally(() => {
      loadLatestOnboardingSnapshot();
    });
  }, [loadOnboardingConfig, loadLatestOnboardingSnapshot]);

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
    latestWebhookSnapshot
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
    fetchPhoneNumbersFromMeta
  ]);
  const smartFileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewHeaderIndex, setPreviewHeaderIndex] = useState(0);


  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }
        const response = await fetch('/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || 'Unable to load profile');
        }
        setProfile(data);
        setStreetNameInput(typeof data.street_name === 'string' ? data.street_name : '');
        setStreetNameStatus(null);
        setStoreNameInput(typeof data.store_name === 'string' ? data.store_name : '');
        setStoreNameStatus(null);
        setSmartHeaderText(
          typeof data.smart_header_text === 'string' ? data.smart_header_text : ''
        );
        setSmartFooterText(
          typeof data.smart_footer_text === 'string' ? data.smart_footer_text : ''
        );
        setSmartAddressText(
          typeof data.smart_address_text === 'string' ? data.smart_address_text : ''
        );
        const imgs = Array.isArray(data.smart_img_urls) ? data.smart_img_urls : [];
        setSmartImages(imgs);
        const savedHeaderImages = Array.isArray(data.smart_header_images)
          ? data.smart_header_images.slice(0, MAX_SMART_HEADER_IMAGES)
          : [];
        const savedBottomBanner =
          typeof data.smart_bottom_banner === 'string' ? data.smart_bottom_banner : null;
        if (imgs.length > 0) {
          setHeaderImages(prev => {
            if (prev.length) {
              return prev.slice(0, MAX_SMART_HEADER_IMAGES);
            }
            if (savedHeaderImages.length) {
              return savedHeaderImages;
            }
            return imgs.slice(0, Math.min(MAX_SMART_HEADER_IMAGES, imgs.length));
          });
          setBottomBanner(prev => prev || savedBottomBanner || imgs[0]);
        } else {
          setHeaderImages(savedHeaderImages);
          setBottomBanner(savedBottomBanner);
        }
        setSmartStatus(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [getAuthToken]);

  useEffect(() => {
    if (headerImages.some(img => !smartImages.includes(img))) {
      setHeaderImages(prev => prev.filter(img => smartImages.includes(img)));
    }
    if (smartImages.length > 0 && headerImages.length === 0) {
      setHeaderImages(smartImages.slice(0, Math.min(MAX_SMART_HEADER_IMAGES, smartImages.length)));
    } else if (headerImages.length > MAX_SMART_HEADER_IMAGES) {
      setHeaderImages(prev => prev.slice(0, MAX_SMART_HEADER_IMAGES));
    }
    if (bottomBanner && !smartImages.includes(bottomBanner)) {
      setBottomBanner(smartImages[0] || null);
    } else if (!bottomBanner && smartImages.length > 0) {
      setBottomBanner(smartImages[0]);
    }
  }, [smartImages, headerImages, bottomBanner]);

  useEffect(() => {
    if (headerImages.length === 0) {
      setPreviewHeaderIndex(0);
      return;
    }
    if (previewHeaderIndex >= headerImages.length) {
      setPreviewHeaderIndex(0);
    }
    if (headerImages.length <= 1) {
      return;
    }
    const interval = setInterval(() => {
      setPreviewHeaderIndex(prev => (prev + 1) % headerImages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [headerImages, previewHeaderIndex]);

  useEffect(() => {
    const fetchAuditHistory = async () => {
      setAuditLoading(true);
      setAuditError('');
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }
        const response = await fetch('/api/auth/profile/audit-history', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || 'Unable to load audit history');
        }
        const normalized: NormalizedAuditEntry[] = Array.isArray(data.audit_history)
          ? data.audit_history
              .filter(entry => entry && typeof entry === 'object')
              .slice(0, 10)
              .map((entry: AuditHistoryEntry) => ({
                timestamp: entry.time || null,
                location: entry.location || 'Unknown location',
                userAgent: entry.system || 'Not recorded'
              }))
          : [];
        setAuditHistory(normalized);
      } catch (err) {
        setAuditHistory([]);
        setAuditError(err instanceof Error ? err.message : 'Unable to load audit history');
      } finally {
        setAuditLoading(false);
      }
    };
    fetchAuditHistory();
  }, [getAuthToken]);

  const loadPinStatus = useCallback(async () => {
    setPinStatusLoading(true);
    setPinStatusError('');
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await fetch('/api/auth/revenue-pin/status', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load PIN status');
      }
      setPinStatus({
        hasPin: Boolean(data?.has_pin),
        updatedAt: typeof data?.updated_at === 'string' ? data.updated_at : null
      });
    } catch (err) {
      setPinStatus(null);
      setPinStatusError(err instanceof Error ? err.message : 'Unable to load PIN status');
    } finally {
      setPinStatusLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    loadPinStatus();
  }, [loadPinStatus]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sectionParam = params.get('section');
    if (sectionParam === 'settings') {
      setActiveSection('settings');
    }
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('focus') === 'security') {
      const scrollTimer = setTimeout(() => {
        securitySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setSecurityHighlight(true);
        if (securityHighlightTimeout.current) {
          clearTimeout(securityHighlightTimeout.current);
        }
        securityHighlightTimeout.current = setTimeout(() => {
          setSecurityHighlight(false);
          securityHighlightTimeout.current = null;
        }, 4000);
      }, 200);
      return () => {
        clearTimeout(scrollTimer);
        if (securityHighlightTimeout.current) {
          clearTimeout(securityHighlightTimeout.current);
          securityHighlightTimeout.current = null;
        }
      };
    }
    return undefined;
  }, [location.search]);

  const handleSetRevenuePin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createPinLoading) {
      return;
    }
    setPinMessage(null);
    const nextPin = newPinInput.trim();
    const confirmPin = confirmNewPinInput.trim();
    if (!/^\d{4,6}$/.test(nextPin)) {
      setPinMessage({ type: 'error', text: 'PIN must be 4-6 digits.' });
      return;
    }
    if (nextPin !== confirmPin) {
      setPinMessage({ type: 'error', text: 'PIN confirmation does not match.' });
      return;
    }
    const password = pinPasswordInput.trim();
    if (!password) {
      setPinMessage({ type: 'error', text: 'Enter your store password to verify ownership.' });
      return;
    }
    setCreatePinLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await fetch('/api/auth/revenue-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pin: nextPin, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to save PIN.');
      }
      setNewPinInput('');
      setConfirmNewPinInput('');
      setPinPasswordInput('');
      setPinMessage({ type: 'success', text: 'Revenue PIN has been created.' });
      loadPinStatus();
    } catch (err) {
      setPinMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save PIN right now.'
      });
    } finally {
      setCreatePinLoading(false);
    }
  };

  const handleUpdateRevenuePin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (updatePinLoading) {
      return;
    }
    setPinMessage(null);
    const current = currentPinInput.trim();
    const nextPin = updatedPinInput.trim();
    const confirmPin = confirmUpdatedPinInput.trim();
    const password = updatePinPasswordInput.trim();
    if (!/^\d{4,6}$/.test(current)) {
      setPinMessage({ type: 'error', text: 'Current PIN must be 4-6 digits.' });
      return;
    }
    if (!/^\d{4,6}$/.test(nextPin)) {
      setPinMessage({ type: 'error', text: 'New PIN must be 4-6 digits.' });
      return;
    }
    if (nextPin === current) {
      setPinMessage({ type: 'error', text: 'New PIN must be different from the current PIN.' });
      return;
    }
    if (nextPin !== confirmPin) {
      setPinMessage({ type: 'error', text: 'PIN confirmation does not match.' });
      return;
    }
    if (!password) {
      setPinMessage({ type: 'error', text: 'Enter your password to update the PIN.' });
      return;
    }
    setUpdatePinLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await fetch('/api/auth/revenue-pin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPin: current, newPin: nextPin, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to update PIN.');
      }
      setCurrentPinInput('');
      setUpdatedPinInput('');
      setConfirmUpdatedPinInput('');
      setUpdatePinPasswordInput('');
      setPinMessage({ type: 'success', text: 'Revenue PIN has been updated.' });
      loadPinStatus();
    } catch (err) {
      setPinMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to update PIN right now.'
      });
    } finally {
      setUpdatePinLoading(false);
    }
  };


  const handleResetRevenuePin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (resetPinLoading) {
      return;
    }
    setPinMessage(null);
    const nextPin = forgotPinInput.trim();
    const confirmPin = confirmForgotPinInput.trim();
    if (!/^\d{4,6}$/.test(nextPin)) {
      setPinMessage({ type: 'error', text: 'New PIN must be 4-6 digits.' });
      return;
    }
    if (nextPin !== confirmPin) {
      setPinMessage({ type: 'error', text: 'PIN confirmation does not match.' });
      return;
    }
    const password = resetPinPasswordInput.trim();
    if (!password) {
      setPinMessage({ type: 'error', text: 'Enter your password to reset the PIN.' });
      return;
    }
    setResetPinLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await fetch('/api/auth/revenue-pin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPin: nextPin, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to reset PIN.');
      }
      setForgotPinInput('');
      setConfirmForgotPinInput('');
      setResetPinPasswordInput('');
      setForgotPinMode(false);
      setPinMessage({ type: 'success', text: 'Revenue PIN has been reset.' });
      loadPinStatus();
    } catch (err) {
      setPinMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to reset PIN right now.'
      });
    } finally {
      setResetPinLoading(false);
    }
  };

  const infoBlock = (
    label: string,
    value: string | null,
    Icon: React.ElementType,
    fallback = 'Not available'
  ) => (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/80 p-4">
      <div className="rounded-md bg-slate-100 p-2 text-slate-700">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value || fallback}</p>
      </div>
    </div>
  );

  const handleStreetNameSave = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (streetNameSaving) {
      return;
    }
    const trimmed = streetNameInput.trim();
    if (!trimmed) {
      setStreetNameStatus({ type: 'error', message: 'Street name is required.' });
      return;
    }
    setStreetNameSaving(true);
    setStreetNameStatus(null);
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('bb_token') : null;
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await fetch('/api/auth/profile/street-name', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ streetName: trimmed })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to update street name');
      }
      const updatedStreet = typeof result?.street_name === 'string' ? result.street_name : trimmed;
      setStreetNameInput(updatedStreet);
      setProfile(prev =>
        prev
          ? {
              ...prev,
              street_name: updatedStreet,
              updated_at: result?.updated_at || prev.updated_at
            }
          : prev
      );
      setStreetNameStatus({ type: 'success', message: 'Street name updated.' });
    } catch (err) {
      setStreetNameStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to update street name.'
      });
    } finally {
      setStreetNameSaving(false);
    }
  };

  const mergeHeaderImages = (current: string[], nextImages: string[]) => {
    const retained = current.filter(url => nextImages.includes(url));
    const toAdd = nextImages.filter(url => !retained.includes(url));
    return [...retained, ...toAdd].slice(0, MAX_SMART_HEADER_IMAGES);
  };

  const uploadSmartImages = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    const remainingSlots = Math.max(0, MAX_SMART_HEADER_IMAGES - smartImages.length);
    if (remainingSlots === 0) {
      setSmartStatus({
        type: 'error',
        message: `You can upload up to ${MAX_SMART_HEADER_IMAGES} header images.`
      });
      return;
    }
    if (files.length > remainingSlots) {
      setSmartStatus({
        type: 'error',
        message: `You can upload ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'}.`
      });
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('bb_token') : null;
    if (!token) {
      setSmartStatus({ type: 'error', message: 'Authentication required.' });
      return;
    }
    setSmartUploading(true);
    setSmartStatus(null);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('images', file));
      const response = await fetch('/api/auth/profile/smart-ebill/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to upload Smart E-bill images.');
      }
      const nextImages = Array.isArray(result?.images) ? result.images : [];
      setSmartImages(nextImages);
      if (nextImages.length > 0) {
        setHeaderImages(prev => mergeHeaderImages(prev, nextImages));
        setBottomBanner(prev => prev || nextImages[0]);
      }
      setSmartStatus({ type: 'success', message: 'Images uploaded successfully.' });
      setProfile(prev =>
        prev
          ? {
              ...prev,
              smart_img_urls: nextImages
            }
          : prev
      );
    } catch (err) {
      setSmartStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to upload Smart E-bill images.'
      });
    } finally {
      setSmartUploading(false);
    }
  };

  const handleSmartFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    uploadSmartImages(event.target.files);
    event.target.value = '';
  };

  const triggerSmartUpload = () => {
    smartFileInputRef.current?.click();
  };

  const toggleHeaderImage = (url: string) => {
    setHeaderImages(prev => {
      if (prev.includes(url)) {
        return prev.filter(item => item !== url);
      }
      if (prev.length >= MAX_SMART_HEADER_IMAGES) {
        return prev;
      }
      return [...prev, url];
    });
    setSmartStatus(null);
  };

  const moveHeaderImage = (index: number, direction: -1 | 1) => {
    setHeaderImages(prev => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const handleRemoveSmartImage = (index: number) => {
    setSmartImages(prev => {
      const updated = prev.filter((_, idx) => idx !== index);
      setHeaderImages(current => current.filter(url => updated.includes(url)));
      setBottomBanner(current => (current && updated.includes(current) ? current : updated[0] || null));
      return updated;
    });
    setSmartStatus(null);
  };

  const handleSmartEbillSave = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (smartSaving) {
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('bb_token') : null;
    if (!token) {
      setSmartStatus({ type: 'error', message: 'Authentication required.' });
      return;
    }
    setSmartSaving(true);
    setSmartStatus(null);
    try {
      const response = await fetch('/api/auth/profile/smart-ebill', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          headerText: smartHeaderText,
          footerText: smartFooterText,
          addressText: smartAddressText,
          images: smartImages,
          headerImages,
          bottomBanner
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to save Smart E-bill settings.');
      }
      const nextImages = Array.isArray(result?.smart_img_urls) ? result.smart_img_urls : smartImages;
      setSmartImages(nextImages);
      setSmartStatus({ type: 'success', message: 'Smart E-bill settings saved.' });
      setProfile(prev =>
        prev
          ? {
              ...prev,
              smart_header_text:
                typeof result?.smart_header_text === 'string'
                  ? result.smart_header_text
                  : smartHeaderText,
              smart_footer_text:
                typeof result?.smart_footer_text === 'string'
                  ? result.smart_footer_text
                  : smartFooterText,
              smart_address_text:
                typeof result?.smart_address_text === 'string'
                  ? result.smart_address_text
                  : smartAddressText,
              smart_header_images: Array.isArray(result?.smart_header_images)
                ? result.smart_header_images
                : headerImages,
              smart_bottom_banner:
                typeof result?.smart_bottom_banner === 'string'
                  ? result.smart_bottom_banner
                  : bottomBanner,
              smart_img_urls: nextImages
            }
          : prev
      );
    } catch (err) {
      setSmartStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to save Smart E-bill settings.'
      });
    } finally {
      setSmartSaving(false);
    }
  };

  const handleStoreNameSave = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (storeNameSaving) {
      return;
    }
    const trimmed = storeNameInput.trim();
    if (!trimmed) {
      setStoreNameStatus({ type: 'error', message: 'Store name is required.' });
      return;
    }
    setStoreNameSaving(true);
    setStoreNameStatus(null);
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('bb_token') : null;
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await fetch('/api/auth/profile/store-name', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ storeName: trimmed })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to update store name');
      }
      const updatedName = typeof result?.store_name === 'string' ? result.store_name : trimmed;
      setStoreNameInput(updatedName);
      setProfile(prev =>
        prev
          ? {
              ...prev,
              store_name: updatedName,
              updated_at: result?.updated_at || prev.updated_at
            }
          : prev
      );
      setStoreNameStatus({ type: 'success', message: 'Store name updated.' });
    } catch (err) {
      setStoreNameStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to update store name.'
      });
    } finally {
      setStoreNameSaving(false);
    }
  };

  const renderProfileSummary = () => {
    if (!profile) {
      return null;
    }
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {profile.brand_name || profile.store_name || 'Store'}
              </h2>
              <p className="text-sm text-slate-600">
                #{profile.store_id} · {profile.business_type || 'General business'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {infoBlock('Brand name', profile.brand_name, Building)}
          {infoBlock('Business type', profile.business_type, Building)}
          {infoBlock('Contact phone', profile.contact_phone, Phone, 'Phone unavailable')}
          {infoBlock('Contact email', profile.contact_email, Mail, 'Email not provided')}
          {infoBlock('Account created by', profile.vendor_name, MessageSquare, 'Not recorded')}
          {infoBlock(
            'WhatsApp number',
            profile.waba_mobile_number,
            Phone,
            'WhatsApp number not configured'
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-3">
                <Store className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-sm font-semibold">Store identity</p>
                  <p className="text-xs text-slate-500">Keep the store name and address current.</p>
                </div>
              </div>
              <form className="mt-4 space-y-3" onSubmit={handleStoreNameSave}>
                <label className="text-xs uppercase tracking-wide text-slate-500">Store name</label>
                <input
                  type="text"
                  value={storeNameInput}
                  onChange={event => {
                    setStoreNameInput(event.target.value);
                    setStoreNameStatus(null);
                  }}
                  placeholder="e.g. BTM Layout - Main"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  maxLength={150}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={storeNameSaving}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
                  >
                    {storeNameSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save store name'
                    )}
                  </button>
                  {storeNameStatus && (
                    <span
                      className={`text-xs font-semibold ${
                        storeNameStatus.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {storeNameStatus.message}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Current value:{' '}
                  <span className="font-semibold">
                    {profile.store_name ? profile.store_name : 'Not captured yet'}
                  </span>
                </p>
              </form>
            </div>
            <div>
              <form className="space-y-3" onSubmit={handleStreetNameSave}>
                <label className="text-xs uppercase tracking-wide text-slate-500">Street name</label>
                <input
                  type="text"
                  value={streetNameInput}
                  onChange={event => {
                    setStreetNameInput(event.target.value);
                    setStreetNameStatus(null);
                  }}
                  placeholder="e.g. 4th Block, Commercial Street"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  maxLength={150}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={streetNameSaving}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
                  >
                    {streetNameSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save street name'
                    )}
                  </button>
                  {streetNameStatus && (
                    <span
                      className={`text-xs font-semibold ${
                        streetNameStatus.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {streetNameStatus.message}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Current value:{' '}
                  <span className="font-semibold">
                    {profile.street_name ? profile.street_name : 'Not captured yet'}
                  </span>
                </p>
              </form>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold">Template configuration</p>
                <p className="text-xs text-slate-500">
                  Default template and language for campaigns.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-sm text-slate-700">
              <p>
                Template name:{' '}
                <span className="font-semibold">{profile.template_name || 'Not set'}</span>
              </p>
              <p>
                Language:{' '}
                <span className="font-semibold">{profile.template_language || 'Not set'}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-semibold">Franchise details</p>
              <p className="text-xs text-slate-500">Linked franchise context for this store.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {infoBlock('Franchise ID', profile.franchise_id, Building)}
            {infoBlock('Onboarding status', profile.onboarding_status, AlertTriangle, 'Not recorded')}
            {infoBlock('Verified name', profile.verified_name, CheckCircle2, 'Verification pending')}
          </div>
        </div>
      </div>
    );
  };

  const renderStoreDetails = () => {
    if (!profile) {
      return null;
    }
    const detailRows = [
      { label: 'Store ID', value: profile.store_id },
      { label: 'Franchise ID', value: profile.franchise_id },
      { label: 'Brand name', value: profile.brand_name },
      { label: 'Business type', value: profile.business_type },
      { label: 'Account created by', value: profile.vendor_name },
      { label: 'Street name', value: profile.street_name },
      { label: 'Store name', value: profile.store_name },
      { label: 'Onboarding status', value: profile.onboarding_status },
      { label: 'Created at', value: profile.created_at ? new Date(profile.created_at).toLocaleString() : null },
      { label: 'Updated at', value: profile.updated_at ? new Date(profile.updated_at).toLocaleString() : null }
    ];
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Store details</h3>
        <dl className="divide-y divide-slate-100 text-sm">
          {detailRows.map(row => (
            <div key={row.label} className="flex items-center justify-between py-3 text-slate-700">
              <dt className="font-medium text-slate-500">{row.label}</dt>
              <dd className="text-right text-slate-900">{row.value || 'Not available'}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Preferences</h3>
        <p className="text-sm text-slate-600">
          Manage notification preferences and alert contacts from the WhatsApp tab inside Analytics.
        </p>
      </div>
      <div
        ref={securitySectionRef}
        className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition ${
          securityHighlight ? 'ring-2 ring-indigo-400 ring-offset-2' : ''
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Security</h3>
            <p className="text-sm text-slate-600">
              Lock or unlock revenue KPIs with a store-specific PIN shared over your registered WhatsApp number.
            </p>
          </div>
          {pinStatus?.updatedAt && (
            <p className="text-xs text-slate-500">
              Updated {new Date(pinStatus.updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="mt-4 space-y-4">
          {pinStatusLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking revenue PIN status…
            </div>
          ) : pinStatusError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 flex items-center justify-between">
              <span>{pinStatusError}</span>
              <button
                type="button"
                onClick={loadPinStatus}
                className="text-rose-700 underline decoration-dotted text-xs"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {pinMessage && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    pinMessage.type === 'success'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  {pinMessage.text}
                </div>
              )}
              {!pinStatus?.hasPin ? (
                <form onSubmit={handleSetRevenuePin} className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Create revenue PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      minLength={4}
                      maxLength={6}
                      pattern="\d*"
                      required
                      value={newPinInput}
                      disabled={createPinLoading}
                      onChange={(event) => setNewPinInput(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                      placeholder="Enter 4-6 digit PIN"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Confirm revenue PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      minLength={4}
                      maxLength={6}
                      pattern="\d*"
                      required
                      value={confirmNewPinInput}
                      disabled={createPinLoading}
                      onChange={(event) => setConfirmNewPinInput(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                      placeholder="Re-enter PIN"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Verify with account password
                    </label>
                    <input
                      type="password"
                      required
                      value={pinPasswordInput}
                      disabled={createPinLoading}
                      onChange={(event) => setPinPasswordInput(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                      placeholder="Enter store login password"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      This is the same password used on the login screen.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={createPinLoading}
                    className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {createPinLoading ? 'Saving…' : 'Save PIN'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Forgot the current PIN?</p>
                      <p className="text-xs text-slate-600">
                        Reset it using your account password. We will notify the registered WhatsApp number about the change.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPinMode(prev => !prev);
                        setPinMessage(null);
                      }}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      {forgotPinMode ? 'Hide reset form' : 'Reset PIN without current PIN'}
                    </button>
                  </div>

                  {forgotPinMode && (
                    <form onSubmit={handleResetRevenuePin} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-slate-700">New PIN</label>
                          <input
                            type="password"
                            inputMode="numeric"
                            minLength={4}
                            maxLength={6}
                            pattern="\d*"
                            required
                            value={forgotPinInput}
                            disabled={resetPinLoading}
                            onChange={(event) => setForgotPinInput(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                            placeholder="Enter new PIN"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">Confirm new PIN</label>
                          <input
                            type="password"
                            inputMode="numeric"
                            minLength={4}
                            maxLength={6}
                            pattern="\d*"
                            required
                            value={confirmForgotPinInput}
                            disabled={resetPinLoading}
                            onChange={(event) => setConfirmForgotPinInput(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                            placeholder="Re-enter new PIN"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Verify with password</label>
                        <input
                          type="password"
                          required
                          value={resetPinPasswordInput}
                          disabled={resetPinLoading}
                          onChange={(event) => setResetPinPasswordInput(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                          placeholder="Enter store login password"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Use this option when the current PIN is forgotten.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                          WhatsApp notifications go to{' '}
                          {profile?.contact_phone ? `+${profile.contact_phone}` : 'your registered number'}.
                        </p>
                        <button
                          type="submit"
                          disabled={resetPinLoading}
                          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                        >
                          {resetPinLoading ? 'Resetting…' : 'Reset PIN'}
                        </button>
                      </div>
                    </form>
                  )}

                  <form onSubmit={handleUpdateRevenuePin} className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Current PIN</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        minLength={4}
                        maxLength={6}
                        pattern="\d*"
                        required
                        value={currentPinInput}
                        disabled={updatePinLoading || resetPinLoading}
                        onChange={(event) => setCurrentPinInput(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                        placeholder="Enter current PIN"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-slate-700">New PIN</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          minLength={4}
                          maxLength={6}
                          pattern="\d*"
                          required
                          value={updatedPinInput}
                          disabled={updatePinLoading || resetPinLoading}
                          onChange={(event) => setUpdatedPinInput(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                          placeholder="Enter new PIN"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Confirm new PIN
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          minLength={4}
                          maxLength={6}
                          pattern="\d*"
                          required
                          value={confirmUpdatedPinInput}
                          disabled={updatePinLoading || resetPinLoading}
                          onChange={(event) => setConfirmUpdatedPinInput(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                          placeholder="Re-enter new PIN"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Verify with password</label>
                      <input
                        type="password"
                        required
                        value={updatePinPasswordInput}
                        disabled={updatePinLoading || resetPinLoading}
                        onChange={(event) => setUpdatePinPasswordInput(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                        placeholder="Enter store login password"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Protects against unauthorized staff changing the PIN.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-500">
                        WhatsApp notifications go to{' '}
                        {profile?.contact_phone ? `+${profile.contact_phone}` : 'your registered number'}.
                      </p>
                      <button
                        type="submit"
                        disabled={updatePinLoading || resetPinLoading}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                      >
                        {updatePinLoading ? 'Updating…' : 'Update PIN'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
          <p className="text-xs text-slate-500">
            To reset your account password, log out and use the "Forgot password" option on the sign-in screen.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Audit history</h3>
            <p className="text-sm text-slate-600">
              Tracks the most recent logins recorded on this device (up to 10 entries).
            </p>
          </div>
          {auditHistory.length > 0 && !auditLoading && !auditError && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {auditHistory.length} {auditHistory.length === 1 ? 'session' : 'sessions'}
            </span>
          )}
        </div>
        <div className="mt-4 space-y-3">
          {auditLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading audit history…
            </div>
          ) : auditError ? (
            <p className="text-sm text-red-500">{auditError}</p>
          ) : auditHistory.length === 0 ? (
            <p className="text-sm text-slate-500">No login activity captured yet for this store.</p>
          ) : (
            auditHistory.map((entry, index) => (
              <div
                key={`${entry.timestamp || 'unknown'}-${index}`}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown time'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {entry.location}
                    </p>
                  </div>
                  {index === 0 && (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      Active session
                    </span>
                  )}
                </div>
                <p className="mt-2 break-all text-xs text-slate-500">{entry.userAgent}</p>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              WhatsApp onboarding
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-2">Connect your WhatsApp Business account</h3>
            <p className="text-sm text-slate-600 mt-2">
              Kick off onboarding with Meta and keep the WABA details up to date for this store.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Button onClick={handleOpenOnboarding} disabled={!hasOnboardingLink}>
              Start onboarding
            </Button>
            {!hasOnboardingLink && (
              <span className="text-xs text-slate-500">
                Set ONBOARDING_LINK in the backend environment to expose the guided setup.
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h4 className="text-base font-semibold text-slate-900">WhatsApp Business onboarding</h4>
              <p className="mt-1 text-sm text-slate-600">
                Provide your Meta WhatsApp Business account identifiers so we can connect API calls for this store.
              </p>
            </div>
            <div className="text-sm text-slate-500">
              <p>
                Last updated:{' '}
                <span className="font-medium text-slate-700">{onboardingLastUpdatedDisplay}</span>
              </p>
              {latestWebhookCapturedDisplay && (
                <p className="mt-1">
                  Latest webhook:{' '}
                  <span className="font-medium text-slate-700">
                    {latestWebhookCapturedDisplay}
                  </span>
                  {latestWebhookSnapshot?.eventType ? (
                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-blue-700">
                      {latestWebhookSnapshot.eventType}
                    </span>
                  ) : null}
                </p>
              )}
            </div>
          </div>

          {onboardingError && (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {onboardingError}
            </div>
          )}

          {onboardingLoading ? (
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white px-4 py-10 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              <span>Loading onboarding details…</span>
            </div>
          ) : (
            <form onSubmit={handleOnboardingSave} className="mt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    WhatsApp Business Account ID<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={onboardingForm.wabaId}
                    onChange={handleOnboardingInputChange('wabaId')}
                    placeholder="Enter WABA ID"
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    You can find this in Meta Business Manager under WhatsApp Manager.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Button
                      type="button"
                      variant="outline"
                      className="text-sm"
                      onClick={() =>
                        fetchPhoneNumbersFromMeta(
                          candidateWabaIdForLookup || onboardingForm.wabaId || '',
                          { silent: false }
                        )
                      }
                      disabled={phoneLookupLoading}
                    >
                      {phoneLookupLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Fetching…
                        </>
                      ) : (
                        'Fetch phone numbers from Meta'
                      )}
                    </Button>
                    <span>
                      Uses the WABA ID to retrieve the connected business phone numbers and verified name.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Phone Number ID<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={onboardingForm.phoneNumberId}
                    onChange={handleOnboardingInputChange('phoneNumberId')}
                    placeholder="Enter Phone Number ID"
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    This is the unique ID Meta assigns to your WhatsApp-enabled phone number.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Meta Business ID</label>
                  <input
                    type="text"
                    value={onboardingForm.businessId}
                    onChange={handleOnboardingInputChange('businessId')}
                    placeholder="Enter Meta Business ID"
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Returned by Meta after onboarding; used for account-level support.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Meta App ID</label>
                  <input
                    type="text"
                    value={onboardingForm.appId}
                    onChange={handleOnboardingInputChange('appId')}
                    placeholder="Enter Meta App ID"
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    The Meta app configured for WhatsApp Cloud API access.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">WhatsApp Phone Number</label>
                  <input
                    type="text"
                    value={onboardingForm.businessPhone}
                    onChange={handleOnboardingInputChange('businessPhone')}
                    placeholder="Enter phone number (E.164)"
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Example: +919876543210. This helps cross-check the correct number is connected.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Verified business name</label>
                  <input
                    type="text"
                    value={onboardingForm.verifiedName}
                    onChange={handleOnboardingInputChange('verifiedName')}
                    placeholder="Enter the verified display name (optional)"
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    This name appears to customers in WhatsApp conversations once Meta verifies it.
                  </p>
                </div>
              </div>

              {phoneLookupError && (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {phoneLookupError}
                </div>
              )}

              {phoneLookupResult?.phoneNumbers?.length ? (
                <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  <h4 className="text-sm font-semibold text-blue-900">Phone numbers from Meta</h4>
                  <ul className="mt-2 space-y-2">
                    {phoneLookupResult.phoneNumbers.map(number => (
                      <li
                        key={number.id}
                        className="rounded-md border border-blue-100 bg-white px-3 py-2 shadow-sm"
                      >
                        <div className="font-medium text-blue-900">
                          {number.display_phone_number || 'Unknown number'}
                        </div>
                        <div className="text-xs text-blue-700">
                          ID: {number.id}
                          {number.verified_name ? ` • Verified name: ${number.verified_name}` : ''}
                          {number.status ? ` • Status: ${number.status}` : ''}
                          {number.quality_rating ? ` • Quality: ${number.quality_rating}` : ''}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="space-y-3 rounded-lg border border-dashed border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-semibold text-slate-900">Connect your phone number</h4>
                  <p className="text-xs text-slate-500">
                    After Meta onboarding completes, click connect to register your WhatsApp number with the PIN configured during onboarding.
                  </p>
                </div>
                <Button type="button" onClick={handleRegisterNumber} disabled={registeringNumber}>
                  {registeringNumber ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting…
                    </>
                  ) : (
                    'Connect number'
                  )}
                </Button>
                {registerStatus && (
                  <p
                    className={`text-xs font-semibold ${
                      registerStatus.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {registerStatus.message}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={onboardingSaving}>
                  {onboardingSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save onboarding details'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    loadOnboardingConfig();
                    loadLatestOnboardingSnapshot();
                  }}
                  disabled={onboardingLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  const renderSmartEbill = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Smart E-bill studio</h3>
              <p className="text-sm text-slate-600">
                Create branded Smart E-bills with a rotating header and a single bottom banner.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={triggerSmartUpload}
            disabled={smartUploading || smartImages.length >= MAX_SMART_HEADER_IMAGES}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {smartUploading ? 'Uploading…' : 'Upload images'}
          </Button>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSmartEbillSave}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Messaging</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Header text</label>
                  <textarea
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    rows={3}
                    value={smartHeaderText}
                    onChange={event => setSmartHeaderText(event.target.value)}
                    placeholder="Store address: 123 MG Road | Follow us @brand"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Address line</label>
                  <textarea
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    rows={2}
                    value={smartAddressText}
                    onChange={event => setSmartAddressText(event.target.value)}
                    placeholder="Address: 123 MG Road, Bengaluru"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Footer text</label>
                  <textarea
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    rows={3}
                    value={smartFooterText}
                    onChange={event => setSmartFooterText(event.target.value)}
                    placeholder="Address: 123 MG Road | Scan to pay and earn loyalty points"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Selections</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">Header slider</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                  {smartImages.length}/{MAX_SMART_HEADER_IMAGES}
                </span>
              </div>
              {headerImages.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                  No header images yet. Pick up to {MAX_SMART_HEADER_IMAGES} from the library.
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {headerImages.map((url, index) => {
                    const name = `IMG-${smartImages.indexOf(url) + 1}`;
                    return (
                      <div
                        key={`${url}-sel`}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <img src={url} alt={name} className="h-12 w-16 rounded-md object-cover" />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{name}</p>
                            <p className="text-xs text-slate-500">Header banner</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
                            onClick={() => moveHeaderImage(index, -1)}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
                            onClick={() => moveHeaderImage(index, 1)}
                            disabled={index === headerImages.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-500 hover:text-rose-600"
                            onClick={() => toggleHeaderImage(url)}
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-sm font-semibold text-slate-900">Bottom banner</p>
                {bottomBanner ? (
                  <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <img
                      src={bottomBanner}
                      alt="Bottom banner"
                      className="h-12 w-20 rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {`IMG-${smartImages.indexOf(bottomBanner) + 1}`}
                      </p>
                      <p className="text-xs text-slate-500">Bottom banner</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
                    Choose one image from the library as the bottom banner.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Mobile preview</p>
                <p className="text-xs text-slate-500">Live preview based on your selections.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                Customer view
              </span>
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Image tips for mobile</p>
              <p className="mt-1">
                Use wide, landscape banners. The preview crops to a wide frame, so keep logos and
                important text centered.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">
                  Recommended ratio: ~3:1
                </span>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">
                  Avoid tall or square images
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <div className="w-full max-w-[360px] rounded-[36px] border border-slate-200 bg-slate-100 p-4 shadow-sm">
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-2xl bg-slate-200">
                    {headerImages.length > 0 ? (
                      <img
                        src={headerImages[previewHeaderIndex]}
                        alt="Header banner preview"
                        className="h-32 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-32 items-center justify-center text-xs text-slate-500">
                        Header banner preview
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute inset-0 border border-white/40" />
                    </div>
                    {headerImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewHeaderIndex(prev =>
                              prev === 0 ? headerImages.length - 1 : prev - 1
                            )
                          }
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-600"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewHeaderIndex(prev => (prev + 1) % headerImages.length)
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-600"
                        >
                          ›
                        </button>
                      </>
                    )}
                    <div className="absolute bottom-2 left-2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-600">
                      {headerImages.length > 1
                        ? `Slider ${previewHeaderIndex + 1}/${headerImages.length}`
                        : 'Header'}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">
                      {smartHeaderText || 'Thanks for shopping with us'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">{profile?.store_name || 'BillBox Store'}</p>
                    <p className="text-xs text-slate-500">
                      {smartAddressText || 'Your store address appears here'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-white px-4 py-4 text-center shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">How much do you like us?</p>
                    <div className="mt-2 flex justify-center gap-1 text-slate-300">
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                    </div>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-1 text-xs font-semibold text-slate-900"
                    >
                      Submit
                    </button>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
                    <p className="font-semibold text-slate-800">{profile?.brand_name || 'BillBox Store'}</p>
                    <p className="mt-1">{smartFooterText || 'Smart E-bill powered by BillBox'}</p>
                  </div>

                  {bottomBanner ? (
                    <div className="relative overflow-hidden rounded-2xl shadow-sm">
                      <img
                        src={bottomBanner}
                        alt="Bottom banner preview"
                        className="h-28 w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-0 border border-white/40" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs text-slate-400">
                      Bottom banner preview
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <input
            ref={smartFileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleSmartFileChange}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Asset library</p>
                <p className="text-xs text-slate-500">Tap an image to mark it as header or bottom.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {smartImages.length} assets
              </span>
            </div>

            {smartImages.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No assets uploaded yet. Use the upload button to add banner images.
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {smartImages.map((url, index) => {
                  const inHeader = headerImages.includes(url);
                  const isBottom = bottomBanner === url;
                  return (
                    <div
                      key={url}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                        <img src={url} alt={`Asset ${index + 1}`} className="h-full w-full object-cover" />
                        <div className="absolute left-3 top-3 flex gap-2">
                          {inHeader && (
                            <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white">
                              Header
                            </span>
                          )}
                          {isBottom && (
                            <span className="rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white">
                              Bottom
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-800">IMG-{index + 1}</p>
                          <button
                            type="button"
                            className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                            onClick={() => handleRemoveSmartImage(index)}
                          >
                            Delete
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant={inHeader ? 'default' : 'outline'}
                            size="sm"
                            className={
                              inHeader
                                ? 'bg-slate-900 text-white hover:bg-slate-800'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }
                            onClick={() => toggleHeaderImage(url)}
                            disabled={!inHeader && headerImages.length >= MAX_SMART_HEADER_IMAGES}
                          >
                            {inHeader ? 'In header' : 'Add to header'}
                          </Button>
                          <Button
                            type="button"
                            variant={isBottom ? 'default' : 'outline'}
                            size="sm"
                            className={
                              isBottom
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                : 'bg-emerald-600 text-white hover:bg-emerald-500'
                            }
                            onClick={() => setBottomBanner(url)}
                          >
                            {isBottom ? 'Bottom selected' : 'Set bottom'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {smartStatus && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                smartStatus.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {smartStatus.message}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={smartSaving || smartUploading}
              className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
            >
              {smartSaving ? 'Saving…' : 'Save Smart E-bill'}
            </Button>
            <p className="text-xs text-slate-500">
              Assets are stored securely with your store profile.
            </p>
          </div>
        </form>
      </div>
    </div>
  );

const renderHelp = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 text-sm text-slate-700">
      <h3 className="text-lg font-semibold text-slate-900">Help center</h3>
      <p>
        Need assistance? Reach out to your franchise administrator or contact BillBox support at{' '}
        <a href="mailto:support@billbox.co.in" className="text-blue-600 underline">
          support@billbox.co.in
        </a>
        .
      </p>
      <p>
        For onboarding or template issues, share your details from this profile page so we can track your request.
      </p>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSummary();
      case 'store':
        return renderStoreDetails();
      case 'settings':
        return renderSettings();
      case 'smart-ebill':
        return renderSmartEbill();
      case 'help':
        return renderHelp();
      default:
        return null;
    }
  };

  const navigation = [
    { id: 'profile', label: 'Profile overview', icon: UserCircle2 },
    { id: 'store', label: 'Store details', icon: Store },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'smart-ebill', label: 'Smart E-bill', icon: UploadCloud },
    { id: 'help', label: 'Help center', icon: HelpCircle }
  ] as const;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-semibold text-slate-900">Store profile</h1>
            {profile?.store_name && (
              <p className="text-sm text-slate-500">{profile.store_name}</p>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="w-full">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Sections
              </p>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
                {navigation.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex min-w-[180px] items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition lg:min-w-0 ${
                      activeSection === item.id
                        ? 'bg-slate-900 text-white shadow'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            {loading && (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 py-20">
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {!loading && profile && <div className="space-y-6">{renderActiveSection()}</div>}
          </main>
        </div>
      </div>
    </div>
  );
};

export default StoreProfile;
