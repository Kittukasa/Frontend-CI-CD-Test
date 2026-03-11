import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

type CommerceStep = {
  id: string;
  title: string;
  badge?: string;
  disabled?: boolean;
};

const steps: CommerceStep[] = [
  { id: 'add-products', title: 'Add products to your Whatsapp Store' },
  { id: 'send-campaigns', title: 'Send out Catalogs in Campaigns' },
  { id: 'send-auto-replies', title: 'Send out Catalogs in Auto Replies', disabled: true },
  {
    id: 'autocheckout',
    title: "Help customers place orders with Interakt's Autocheckout Workflow!",
    disabled: true,
  },
  { id: 'enquiries', title: 'See all enquiries & orders you get from customers', disabled: true },
];

const WhatsAppCommerce: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<'overview' | 'compliance'>('overview');
  const [logoHandle, setLogoHandle] = useState('');
  const [description, setDescription] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [aboutText, setAboutText] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [websiteOne, setWebsiteOne] = useState('');
  const [websiteTwo, setWebsiteTwo] = useState('');
  const [legalBusinessName, setLegalBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [isRegistered, setIsRegistered] = useState<'yes' | 'no'>('yes');
  const [customerCareEmail, setCustomerCareEmail] = useState('');
  const [customerCarePhone, setCustomerCarePhone] = useState('');
  const [grievanceOfficerName, setGrievanceOfficerName] = useState('');
  const [grievanceOfficerPhone, setGrievanceOfficerPhone] = useState('');
  const [grievanceOfficerAltPhone, setGrievanceOfficerAltPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [catalogId, setCatalogId] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);
  const [catalogConnected, setCatalogConnected] = useState(false);
  const [openSection, setOpenSection] = useState<
    'logo' | 'description' | 'contact' | 'compliance' | null
  >('logo');

  const websiteList = useMemo(
    () => [websiteOne.trim(), websiteTwo.trim()].filter(Boolean),
    [websiteOne, websiteTwo]
  );

  const buildAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(typeof window !== 'undefined'
      ? { Authorization: `Bearer ${localStorage.getItem('bb_token') || ''}` }
      : {}),
  });

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await fetch('/api/whatsapp/catalog', {
          headers: buildAuthHeaders(),
        });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        const value = typeof data?.catalogId === 'string' ? data.catalogId : '';
        setCatalogId(value);
        setCatalogConnected(Boolean(value));
      } catch {
        // ignore load errors
      }
    };

    loadCatalog();
  }, []);

  useEffect(() => {
    if (view !== 'compliance') {
      return;
    }

    const loadBusinessProfile = async () => {
      setLoadingProfile(true);
      setSaveMessage(null);
      try {
        const response = await fetch('/api/whatsapp/business-profile', {
          headers: buildAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error('Unable to load WhatsApp business profile.');
        }
        const data = await response.json();
        const profile = data?.profile || {};
        const compliance = data?.compliance || {};
        const websites = Array.isArray(profile?.websites) ? profile.websites : [];

        setLogoHandle(profile?.profile_picture_handle || compliance?.logo_handle || '');
        setDescription(profile?.description || '');
        setBusinessCategory(profile?.vertical || '');
        setAboutText(profile?.about || '');
        setBusinessAddress(profile?.address || '');
        setBusinessEmail(profile?.email || '');
        setWebsiteOne(websites[0] || '');
        setWebsiteTwo(websites[1] || '');

        setLegalBusinessName(compliance?.legal_business_name || '');
        setBusinessType(compliance?.business_type || '');
        setIsRegistered(compliance?.is_registered ? 'yes' : 'no');
        setCustomerCareEmail(compliance?.customer_care_email || '');
        setCustomerCarePhone(compliance?.customer_care_phone || '');
        setGrievanceOfficerName(compliance?.grievance_officer_name || '');
        setGrievanceOfficerPhone(compliance?.grievance_officer_phone || '');
        setGrievanceOfficerAltPhone(compliance?.grievance_officer_alt_phone || '');
      } catch (error) {
        setSaveMessage((error as Error).message || 'Unable to load profile settings.');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadBusinessProfile();
  }, [view]);

  const renderAddProductsContent = () => (
    <div className="space-y-6 border-t border-gray-200 px-4 py-5 text-sm text-gray-600">
      <div className="flex flex-wrap items-center justify-between gap-4 opacity-60">
        <div>
          <div className="text-sm font-semibold text-gray-900">Create your catalog</div>
          <div className="text-xs text-gray-500">
            Add your products to the CSV and upload it here
          </div>
          <div className="mt-1 text-xs font-semibold text-gray-400">Coming Soon</div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-gray-400">OR</span>
          <Button variant="outline" size="sm" disabled>
            Upload CSV
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">A. Provide Compliance Info</div>
            <div className="text-xs text-gray-500">This will appear in your WhatsApp Profile</div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              className="text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-gray-400"
              disabled
            >
              Update Info
            </button>
            <Button variant="outline" size="sm" disabled>
              Open
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              B. Set up FB Catalog & Collections
            </div>
            <div className="text-xs text-gray-500">via Google Sheets | Shopify</div>
          </div>
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700" size="sm" asChild>
            <a
              href="https://business.facebook.com/business/loginpage/new/?next=https%3A%2F%2Fbusiness.facebook.com%2Flatest%2Fbusiness_home%3Fnav_ref%3Dbm_home_redirect%26bm_redirect_migration%3Dtrue%26business_id%3D1772495910020423&login_options%5B0%5D=FB&login_options%5B1%5D=IG&login_options%5B2%5D=SSO&config_ref=biz_login_tool_flavor_mbs"
              target="_blank"
              rel="noreferrer"
            >
              Go to FB
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              C. Give Catalog Access to Billbox
            </div>
            <div className="text-xs text-gray-500">
              Add Billbox (91894461757738) as Catalog Partner
            </div>
          </div>
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700" size="sm" asChild>
            <a
              href="https://business.facebook.com/business/loginpage/new/?next=https%3A%2F%2Fbusiness.facebook.com%2Flatest%2Fbusiness_home%3Fnav_ref%3Dbm_home_redirect%26bm_redirect_migration%3Dtrue%26business_id%3D1772495910020423&login_options%5B0%5D=FB&login_options%5B1%5D=IG&login_options%5B2%5D=SSO&config_ref=biz_login_tool_flavor_mbs"
              target="_blank"
              rel="noreferrer"
            >
              Go to FB
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              D. Connect your Catalog to your WhatsApp account
            </div>
            <div className="text-xs text-gray-500">
              Go here and follow the steps shown in the video
            </div>
          </div>
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700" size="sm" asChild>
            <a
              href="https://business.facebook.com/business/loginpage/new/?next=https%3A%2F%2Fbusiness.facebook.com%2Flatest%2Fbusiness_home%3Fnav_ref%3Dbm_home_redirect%26bm_redirect_migration%3Dtrue%26business_id%3D1772495910020423&login_options%5B0%5D=FB&login_options%5B1%5D=IG&login_options%5B2%5D=SSO&config_ref=biz_login_tool_flavor_mbs"
              target="_blank"
              rel="noreferrer"
            >
              Go to FB
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">E. Enter Facebook Catalog ID</div>
            <div className="text-xs text-gray-500">We will fetch products from this catalog</div>
          </div>
          <div className="flex items-center gap-3">
            <input
              className="w-40 rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-700"
              placeholder="Catalog ID"
              value={catalogId}
              onChange={event => setCatalogId(event.target.value)}
            />
            {catalogConnected ? (
              <Button
                variant="outline"
                size="sm"
                disabled={catalogLoading}
                onClick={async () => {
                  setCatalogLoading(true);
                  setCatalogMessage(null);
                  try {
                    const response = await fetch('/api/whatsapp/catalog', {
                      method: 'DELETE',
                      headers: buildAuthHeaders(),
                    });
                    if (!response.ok) {
                      throw new Error('Failed to disconnect catalog');
                    }
                    setCatalogConnected(false);
                    setCatalogMessage('Catalog disconnected.');
                  } catch (error) {
                    setCatalogMessage((error as Error).message || 'Unable to disconnect catalog.');
                  } finally {
                    setCatalogLoading(false);
                  }
                }}
              >
                {catalogLoading ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            ) : (
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                size="sm"
                disabled={catalogLoading}
                onClick={async () => {
                  setCatalogLoading(true);
                  setCatalogMessage(null);
                  try {
                    const response = await fetch('/api/whatsapp/catalog', {
                      method: 'POST',
                      headers: buildAuthHeaders(),
                      body: JSON.stringify({ catalogId }),
                    });
                    if (!response.ok) {
                      throw new Error('Failed to connect catalog');
                    }
                    setCatalogConnected(true);
                    setCatalogMessage('Catalog connected to Billbox.');
                  } catch (error) {
                    setCatalogMessage((error as Error).message || 'Unable to connect catalog.');
                  } finally {
                    setCatalogLoading(false);
                  }
                }}
              >
                {catalogLoading ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>
        </div>

        {catalogConnected && (
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Great! Your FB catalog is now connected to Billbox!
          </div>
        )}
        {catalogMessage && <div className="text-xs text-gray-500">{catalogMessage}</div>}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <div className="text-sm font-semibold text-gray-900">View your catalog here</div>
        <Button
          variant="outline"
          size="sm"
          disabled={!catalogConnected}
          onClick={() => {
            if (!catalogConnected) {
              return;
            }
            window.open('/catalog', '_blank', 'noopener,noreferrer');
          }}
        >
          Open Catalog
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-140px)] space-y-8 rounded-2xl border border-blue-100 bg-[#eef4ff] p-6 shadow-sm">
      {view === 'overview' && (
        <>
          <div className="border-b border-blue-100 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">Commerce Settings</h2>
            <p className="mt-1 text-sm text-gray-600">
              Set up WhatsApp Catalog Messages for your account
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-white/70 p-6 shadow-sm">
            <h3 className="text-4xl font-semibold text-gray-900">Start Selling on WhatsApp!</h3>
            <p className="mt-3 text-sm text-gray-600">
              You can send Catalogs to customers as part of campaigns &amp; autoreplies. They can
              then place orders via Carts.
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => {
              const isOpen = openId === step.id;
              const isDisabled = Boolean(step.disabled);
              return (
                <div
                  key={step.id}
                  className={`rounded-xl border border-blue-100 bg-white shadow-sm ${
                    isDisabled ? 'opacity-70' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                    onClick={() => {
                      if (isDisabled) return;
                      setOpenId(prev => (prev === step.id ? null : step.id));
                    }}
                    disabled={isDisabled}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{step.title}</span>
                      {step.badge && (
                        <span className="rounded-md bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">
                          {step.badge}
                        </span>
                      )}
                    </div>
                    {isDisabled ? (
                      <span className="text-xs font-semibold text-gray-400">Coming Soon</span>
                    ) : (
                      <ChevronDown
                        className={`h-4 w-4 text-gray-500 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                  {isOpen &&
                    (step.id === 'add-products' ? (
                      renderAddProductsContent()
                    ) : (
                      <div className="border-t border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-gray-600">
                        Configure this step for your catalog messaging workflow.
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        </>
      )}

      {view === 'compliance' && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Your Business Account Appearance
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Easily configure your WhatsApp Business Profile appearance. (Note: WhatsApp Business
                number and display name can not be changed once approved)
              </p>
            </div>
            <Button
              className="bg-gray-900 text-white hover:bg-gray-800"
              onClick={() => setView('overview')}
            >
              Back
            </Button>
          </div>

          <div className="mt-6">
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-900"
                  onClick={() => setOpenSection(prev => (prev === 'logo' ? null : 'logo'))}
                >
                  Business Logo
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      openSection === 'logo' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSection === 'logo' && (
                  <div className="border-t border-gray-100 px-4 py-4 text-sm text-gray-600">
                    <div className="text-sm font-semibold text-gray-900">Upload your logo</div>
                    <p className="mt-1 text-xs text-gray-500">
                      Square image with max edge of 640px and max size 5mb is recommended.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                        Upload your logo
                      </Button>
                      <input
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                        placeholder="Enter Image Handle ID"
                        value={logoHandle}
                        onChange={event => setLogoHandle(event.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-900"
                  onClick={() =>
                    setOpenSection(prev => (prev === 'description' ? null : 'description'))
                  }
                >
                  Description
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      openSection === 'description' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSection === 'description' && (
                  <div className="border-t border-gray-100 px-4 py-4 text-sm text-gray-600">
                    <div className="text-sm font-semibold text-gray-900">Your Business Bio</div>
                    <textarea
                      className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                      rows={4}
                      value={description}
                      onChange={event => setDescription(event.target.value)}
                      placeholder="Add description for your business"
                    />
                    <div className="mt-3 text-sm font-semibold text-gray-900">About</div>
                    <input
                      className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                      value={aboutText}
                      onChange={event => setAboutText(event.target.value)}
                      placeholder="Short about text shown on WhatsApp profile"
                    />
                    <div className="mt-3 text-sm font-semibold text-gray-900">Category</div>
                    <select
                      className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                      value={businessCategory}
                      onChange={event => setBusinessCategory(event.target.value)}
                    >
                      <option value="">None</option>
                      <option value="retail">Retail</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="services">Services</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-900"
                  onClick={() => setOpenSection(prev => (prev === 'contact' ? null : 'contact'))}
                >
                  Contact Information
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      openSection === 'contact' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSection === 'contact' && (
                  <div className="border-t border-gray-100 px-4 py-4 text-sm text-gray-600">
                    <div className="text-sm font-semibold text-gray-900">Your Business Address</div>
                    <textarea
                      className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                      rows={3}
                      value={businessAddress}
                      onChange={event => setBusinessAddress(event.target.value)}
                    />
                    <div className="mt-3 text-sm font-semibold text-gray-900">
                      Your Business Email Address
                    </div>
                    <input
                      className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                      value={businessEmail}
                      onChange={event => setBusinessEmail(event.target.value)}
                    />
                    <div className="mt-3 text-sm font-semibold text-gray-900">
                      Your Business Website
                    </div>
                    <input
                      className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                      value={websiteOne}
                      onChange={event => setWebsiteOne(event.target.value)}
                    />
                    <input
                      className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                      value={websiteTwo}
                      onChange={event => setWebsiteTwo(event.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-900"
                  onClick={() =>
                    setOpenSection(prev => (prev === 'compliance' ? null : 'compliance'))
                  }
                >
                  Provide Compliance Info
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      openSection === 'compliance' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openSection === 'compliance' && (
                  <div className="border-t border-gray-100 px-4 py-4 text-sm text-gray-600">
                    <div className="text-sm font-semibold text-gray-900">
                      Legal name of Business
                    </div>
                    <input
                      className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                      value={legalBusinessName}
                      onChange={event => setLegalBusinessName(event.target.value)}
                      placeholder="Enter full legal name"
                    />
                    <div className="mt-3 text-sm font-semibold text-gray-900">Business Type</div>
                    <select
                      className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                      value={businessType}
                      onChange={event => setBusinessType(event.target.value)}
                    >
                      <option value="">Select Option</option>
                      <option value="private_limited">Private Limited</option>
                      <option value="proprietorship">Proprietorship</option>
                      <option value="partnership">Partnership</option>
                    </select>
                    <div className="mt-3 text-sm font-semibold text-gray-900">
                      Is your business registered?
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={isRegistered === 'yes'}
                          onChange={() => setIsRegistered('yes')}
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={isRegistered === 'no'}
                          onChange={() => setIsRegistered('no')}
                        />
                        No
                      </label>
                    </div>
                    <div className="mt-4 text-sm font-semibold text-gray-900">
                      Customer Care Information
                    </div>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <input
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                        placeholder="Email ID"
                        value={customerCareEmail}
                        onChange={event => setCustomerCareEmail(event.target.value)}
                      />
                      <input
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                        placeholder="Phone Number"
                        value={customerCarePhone}
                        onChange={event => setCustomerCarePhone(event.target.value)}
                      />
                    </div>
                    <div className="mt-4 text-sm font-semibold text-gray-900">
                      Grievance Officer Information
                    </div>
                    <input
                      className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                      placeholder="Officer Name"
                      value={grievanceOfficerName}
                      onChange={event => setGrievanceOfficerName(event.target.value)}
                    />
                    <div className="mt-3 text-sm font-semibold text-gray-900">Contact Info</div>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <input
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                        placeholder="Phone Number"
                        value={grievanceOfficerPhone}
                        onChange={event => setGrievanceOfficerPhone(event.target.value)}
                      />
                      <input
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm"
                        placeholder="Phone Number"
                        value={grievanceOfficerAltPhone}
                        onChange={event => setGrievanceOfficerAltPhone(event.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            {loadingProfile ? (
              <span className="text-xs text-gray-500">Loading profile...</span>
            ) : (
              saveMessage && <span className="text-xs text-gray-500">{saveMessage}</span>
            )}
            <Button
              className="h-11 px-6 bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
              disabled={savingProfile || loadingProfile}
              onClick={async () => {
                setSavingProfile(true);
                setSaveMessage(null);
                try {
                  const response = await fetch('/api/whatsapp/business-profile', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(typeof window !== 'undefined'
                        ? { Authorization: `Bearer ${localStorage.getItem('bb_token') || ''}` }
                        : {}),
                    },
                    body: JSON.stringify({
                      address: businessAddress,
                      description,
                      vertical: businessCategory,
                      about: aboutText,
                      email: businessEmail,
                      websites: websiteList,
                      profile_picture_handle: logoHandle,
                      legal_business_name: legalBusinessName,
                      business_type: businessType,
                      is_registered: isRegistered === 'yes',
                      customer_care_email: customerCareEmail,
                      customer_care_phone: customerCarePhone,
                      grievance_officer_name: grievanceOfficerName,
                      grievance_officer_phone: grievanceOfficerPhone,
                      grievance_officer_alt_phone: grievanceOfficerAltPhone,
                      logo_handle: logoHandle,
                    }),
                  });
                  if (!response.ok) {
                    throw new Error('Failed to update business profile');
                  }
                  setSaveMessage('Saved successfully');
                } catch (error) {
                  setSaveMessage((error as Error).message || 'Unable to save');
                } finally {
                  setSavingProfile(false);
                }
              }}
            >
              {savingProfile ? 'Saving...' : 'Save & Set Live'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppCommerce;
