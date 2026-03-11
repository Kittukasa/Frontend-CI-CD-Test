import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { clearAdminSession, withAdminAuthHeaders } from "@/utils/adminAuth";

type StoreConfig = {
  store_id?: string;
  "smartE-bill"?: string | boolean | null;
  smart_ebill?: string | boolean | null;
  trial_period?: number | string | null;
  trial_started?: string | null;
  template_name?: string | null;
  template_language?: string | null;
  brand_name?: string | null;
  campaign_messages_count?: number | string | null;
  email?: string | null;
  franchise_id?: string | null;
  mobile_number?: string | null;
  vendor_name?: string | null;
  store_name?: string | null;
  updated_at?: string | null;
  smart_address_text?: string | null;
  smart_bottom_banner?: string | null;
  smart_footer_text?: string | null;
  smart_header_images?: string[];
  smart_header_text?: string | null;
  verified_name?: string | null;
  waba_id?: string | null;
  waba_mobile_number?: string | null;
  whatsapp_api_url?: string | null;
  onboarding_updated_at?: string | null;
  phone_number_id?: string | null;
};

type StoreFormState = {
  "smartE-bill": string;
  trial_period: string;
  trial_started: string;
  template_name: string;
  template_language: string;
  brand_name: string;
  campaign_messages_count: string;
};

const toDateInputValue = (value: unknown) => {
  if (!value) return "";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return "";
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

const buildInitialForm = (store?: StoreConfig | null): StoreFormState => ({
  "smartE-bill":
    store?.["smartE-bill"] === null ||
    store?.["smartE-bill"] === undefined
      ? store?.smart_ebill === null || store?.smart_ebill === undefined
        ? ""
        : String(store.smart_ebill)
      : String(store["smartE-bill"]),
  trial_period:
    store?.trial_period === null || store?.trial_period === undefined
      ? ""
      : String(store.trial_period),
  trial_started: toDateInputValue(store?.trial_started),
  template_name: store?.template_name ? String(store.template_name) : "",
  template_language: store?.template_language ? String(store.template_language) : "",
  brand_name: store?.brand_name ? String(store.brand_name) : "",
  campaign_messages_count:
    store?.campaign_messages_count === null || store?.campaign_messages_count === undefined
      ? ""
      : String(store.campaign_messages_count)
});

const AdminStoreDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { storeId } = useParams<{ storeId: string }>();
  const [store, setStore] = useState<StoreConfig | null>(null);
  const [formState, setFormState] = useState<StoreFormState>(() => buildInitialForm(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setError("Store ID is missing.");
      setLoading(false);
      return;
    }

    const fetchStore = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/stores/${storeId}`, {
          headers: withAdminAuthHeaders()
        });
        if (response.status === 401 || response.status === 403) {
          clearAdminSession();
          const redirectFrom = `${location.pathname}${location.search}`;
          navigate("/admin/login", { replace: true, state: { from: redirectFrom } });
          return;
        }
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load store details.");
        }
        const storeData = (payload?.store || null) as StoreConfig | null;
        setStore(storeData);
        setFormState(buildInitialForm(storeData));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load store details.");
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeId]);

  const storeDisplayName =
    store && typeof store.store_name === "string" && store.store_name.trim()
      ? store.store_name
      : store && typeof store.brand_name === "string" && store.brand_name.trim()
      ? store.brand_name
      : null;

  const handleFieldChange = (key: keyof StoreFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
  };

  const handleSave = async () => {
    if (!storeId || saving) return;
    setSaving(true);
    setStatus(null);
    try {
      const payload = {
        "smartE-bill": formState["smartE-bill"] || null,
        trial_period: formState.trial_period || null,
        trial_started: formState.trial_started || null,
        template_name: formState.template_name || null,
        template_language: formState.template_language || null,
        brand_name: formState.brand_name || null,
        campaign_messages_count: formState.campaign_messages_count || null
      };
      const response = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...withAdminAuthHeaders()
        },
        body: JSON.stringify(payload)
      });
      if (response.status === 401 || response.status === 403) {
        clearAdminSession();
        const redirectFrom = `${location.pathname}${location.search}`;
        navigate("/admin/login", { replace: true, state: { from: redirectFrom } });
        return;
      }
      const payloadResponse = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payloadResponse?.error || "Unable to save store details.");
      }
      const updatedStore = (payloadResponse?.store || null) as StoreConfig | null;
      setStore(updatedStore);
      setFormState(buildInitialForm(updatedStore));
      setStatus("Saved successfully.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to save store details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate("/admin-panel/stores")}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 hover:bg-white/10 sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Stores
        </button>
        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
            Store Profile
          </p>
          <h1 className="text-2xl font-semibold text-white">{storeDisplayName || storeId}</h1>
          <p className="text-xs text-white/50">Store ID {storeId}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.65)]">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading store details…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
                Store Details
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  ["store_id", store?.store_id],
                  ["email", store?.email],
                  ["franchise_id", store?.franchise_id],
                  ["mobile_number", store?.mobile_number],
                  ["vendor_name", store?.vendor_name],
                  ["store_name", store?.store_name],
                  ["updated_at", store?.updated_at]
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                      {String(label).replace(/_/g, " ")}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-white/90">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
                Smart E-bill Section
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  ["smart_address_text", store?.smart_address_text],
                  ["smart_bottom_banner", store?.smart_bottom_banner],
                  ["smart_footer_text", store?.smart_footer_text],
                  ["smart_header_text", store?.smart_header_text]
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                      {String(label).replace(/_/g, " ")}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-white/90">{value || "—"}</p>
                  </div>
                ))}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)] md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    smart header images
                  </p>
                  {store?.smart_header_images && store.smart_header_images.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-xs text-white/80">
                      {store.smart_header_images.map((url, index) => (
                        <li key={`${url}-${index}`} className="break-all">
                          {url}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-white/70">—</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
                WhatsApp API Section
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  ["verified_name", store?.verified_name],
                  ["waba_id", store?.waba_id],
                  ["waba_mobile_number", store?.waba_mobile_number],
                  ["whatsapp_api_url", store?.whatsapp_api_url],
                  ["onboarding_updated_at", store?.onboarding_updated_at],
                  ["phone_number_id", store?.phone_number_id]
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                      {String(label).replace(/_/g, " ")}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-white/90">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
                Editable Fields
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Smart E-bill
                  </label>
                  <select
                    value={formState["smartE-bill"]}
                    onChange={(event) => handleFieldChange("smartE-bill", event.target.value)}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/50 focus:outline-none"
                  >
                    <option value="" className="bg-[#050816] text-white">
                      Select
                    </option>
                    <option value="yes" className="bg-[#050816] text-white">
                      Yes
                    </option>
                    <option value="no" className="bg-[#050816] text-white">
                      No
                    </option>
                  </select>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Trial period (days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.trial_period}
                    onChange={(event) => handleFieldChange("trial_period", event.target.value)}
                    placeholder="e.g. 30"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Trial started
                  </label>
                  <input
                    type="date"
                    value={formState.trial_started}
                    onChange={(event) => handleFieldChange("trial_started", event.target.value)}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Template name
                  </label>
                  <input
                    value={formState.template_name}
                    onChange={(event) => handleFieldChange("template_name", event.target.value)}
                    placeholder="template_name"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Template language
                  </label>
                  <input
                    value={formState.template_language}
                    onChange={(event) => handleFieldChange("template_language", event.target.value)}
                    placeholder="en_US"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Brand name
                  </label>
                  <input
                    value={formState.brand_name}
                    onChange={(event) => handleFieldChange("brand_name", event.target.value)}
                    placeholder="Brand name"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_40px_rgba(2,6,23,0.45)]">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                    Campaign messages count
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.campaign_messages_count}
                    onChange={(event) =>
                      handleFieldChange("campaign_messages_count", event.target.value)
                    }
                    placeholder="e.g. 120"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {status && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                {status}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(34,211,238,0.4)] transition hover:bg-cyan-400 disabled:opacity-60 sm:w-auto"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStoreDetailsPage;
