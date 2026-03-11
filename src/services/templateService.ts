export interface Template {
  id: string;
  storeId?: string;
  name: string;
  category: string;
  buttonType?: string;
  industryCategory?: string | null;
  occasionCategory?: string | null;
  language: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  headerType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  headerText?: string;
  headerImageUrl?: string;
  headerVideoUrl?: string;
  headerDocumentUrl?: string;
  bodyText: string;
  footerText?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
  variables: string[];
  isPredefined?: boolean;
  previewImageUrl?: string;
  description?: string;
  limitedTimeOffer?: {
    offerHeading?: string;
    offerCode?: string;
    urlType?: 'Static' | 'Dynamic';
    url?: string;
    buttonLabel?: string;
    addUtmParameters?: boolean;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
  };
  carousel?: {
    mediaType: 'IMAGE' | 'VIDEO';
    buttonLayout: 'URL' | 'PHONE' | 'URL_PHONE' | 'QUICK_REPLY' | 'QUICK_REPLY_2';
    cards: Array<{
      id?: string;
      mediaHandle?: string;
      mediaUrl?: string;
      bodyText: string;
      buttons: Array<{
        type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
        text: string;
        url?: string;
        urlType?: 'Static' | 'Dynamic';
        phone_number?: string;
        utmSource?: string;
        utmMedium?: string;
        utmCampaign?: string;
        utmTerm?: string;
        utmContent?: string;
      }>;
    }>;
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  examples?: {
    body?: string[];
    headerText?: string[];
    footerText?: string[];
  };
}

export interface CreateTemplateRequest {
  name: string;
  category: string;
  buttonType?: string;
  language?: string;
  headerType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  headerText?: string;
  headerImageUrl?: string;
  headerVideoUrl?: string;
  headerDocumentUrl?: string;
  bodyText: string;
  footerText?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
  variables?: string[];
  examples?: {
    body?: string[];
    headerText?: string[];
    footerText?: string[];
  };
  limitedTimeOffer?: Template['limitedTimeOffer'];
  carousel?: Template['carousel'];
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {
  id: string;
}

class TemplateService {
  private baseUrl = '/api/templates';

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('bb_token') || localStorage.getItem('token');
    const storeId =
      localStorage.getItem('selectedStore') || localStorage.getItem('bb_store_id') || '';
    const baseUrl = `${this.baseUrl}${endpoint}`;
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = storeId ? `${baseUrl}${separator}storeId=${storeId}` : baseUrl;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getTemplates(): Promise<Template[]> {
    try {
      const response = await this.makeRequest<{ success: boolean; data: Template[] }>('');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  async getPredefinedTemplates(): Promise<Template[]> {
    try {
      const response = await this.makeRequest<{ success: boolean; data: Template[] }>('/predefined');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching predefined templates:', error);
      return [];
    }
  }

  async getTemplate(id: string): Promise<Template | null> {
    try {
      const response = await this.makeRequest<{ success: boolean; data: Template }>(`/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  async createTemplate(template: CreateTemplateRequest): Promise<Template | null> {
    try {
      const response = await this.makeRequest<{ success: boolean; data: Template }>('', {
        method: 'POST',
        body: JSON.stringify(template),
      });
      return response.data || null;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(template: UpdateTemplateRequest): Promise<Template | null> {
    try {
      const { id, ...updateData } = template;
      const response = await this.makeRequest<{ success: boolean; data: Template }>(`/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      return response.data || null;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string, templateName?: string): Promise<boolean> {
    try {
      await this.makeRequest<{ success: boolean }>(`/${id}`, {
        method: 'DELETE',
        body: JSON.stringify(
          templateName
            ? {
                templateName
              }
            : {}
        )
      });
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }

  async requestVerification(id: string): Promise<boolean> {
    try {
      await this.makeRequest<{ success: boolean }>(`/${id}/request-verification`, {
        method: 'POST',
      });
      return true;
    } catch (error) {
      console.error('Error requesting verification:', error);
      return false;
    }
  }

  async approveTemplate(id: string): Promise<boolean> {
    try {
      await this.makeRequest<{ success: boolean }>(`/${id}/approve`, {
        method: 'POST',
      });
      return true;
    } catch (error) {
      console.error('Error approving template:', error);
      return false;
    }
  }

  async rejectTemplate(id: string, reason: string): Promise<boolean> {
    try {
      await this.makeRequest<{ success: boolean }>(`/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return true;
    } catch (error) {
      console.error('Error rejecting template:', error);
      return false;
    }
  }
}

export const templateService = new TemplateService();
