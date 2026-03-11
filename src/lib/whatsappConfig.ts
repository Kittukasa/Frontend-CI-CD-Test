export interface StoredWhatsAppConfig {
  whatsappApiUrl: string | null;
  accessToken: string | null;
  wabaId: string | null;
  phoneNumberId: string | null;
  wabaMobileNumber: string | null;
  templateName: string | null;
  templateLanguage: string | null;
  vendorName: string | null;
  verifiedName: string | null;
  storeName: string | null;
  webhookConfig: Record<string, unknown> | null;
}

const readJson = <T>(key: string): T | null => {
  const value = localStorage.getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const getStoredWhatsAppConfig = (): StoredWhatsAppConfig => ({
  whatsappApiUrl: localStorage.getItem('bb_whatsapp_api_url'),
  accessToken: localStorage.getItem('bb_access_token'),
  wabaId: localStorage.getItem('bb_waba_id'),
  phoneNumberId: localStorage.getItem('bb_phone_number_id'),
  wabaMobileNumber: localStorage.getItem('bb_waba_mobile_number'),
  templateName: localStorage.getItem('bb_template_name'),
  templateLanguage: localStorage.getItem('bb_template_language'),
  vendorName: localStorage.getItem('bb_vendor_name'),
  verifiedName: localStorage.getItem('bb_verified_name'),
  storeName: localStorage.getItem('bb_store_name'),
  webhookConfig: readJson<Record<string, unknown>>('bb_webhook_config'),
});

export const clearStoredWhatsAppConfig = () => {
  [
    'bb_whatsapp_api_url',
    'bb_access_token',
    'bb_waba_id',
    'bb_phone_number_id',
    'bb_waba_mobile_number',
    'bb_template_name',
    'bb_template_language',
    'bb_vendor_name',
    'bb_verified_name',
    'bb_store_name',
    'bb_webhook_config',
  ].forEach(key => localStorage.removeItem(key));
};
