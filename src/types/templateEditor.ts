import { Template } from '@/services/templateService';

export const TEMPLATE_CATEGORY_OPTIONS = ['MARKETING', 'UTILITY'] as const;
export const TEMPLATE_BUTTON_TYPE_OPTIONS = [
  'None',
  'Copy Code, URL, Quick Replies etc',
  'Send Products',
  'Limited Time Offer',
  'Carousel'
] as const;

export type TemplateCategoryValue = typeof TEMPLATE_CATEGORY_OPTIONS[number];
export type TemplateButtonTypeValue = typeof TEMPLATE_BUTTON_TYPE_OPTIONS[number];

export interface TemplateEditFormData {
  name: string;
  category: TemplateCategoryValue;
  buttonType?: string;
  language: string;
  headerType?: Template['headerType'] | 'NONE';
  headerText?: string;
  headerImageUrl?: string;
  headerVideoUrl?: string;
  headerDocumentUrl?: string;
  bodyText: string;
  footerText?: string;
  buttons?: Template['buttons'];
  variables?: string[];
  previewImageUrl?: string;
  headerExampleText?: string;
  bodyExampleText?: string;
  footerExampleText?: string;
  limitedTimeOffer?: Template['limitedTimeOffer'];
  carousel?: Template['carousel'];
}
