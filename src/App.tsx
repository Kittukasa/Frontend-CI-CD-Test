import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { getAdminToken } from '@/utils/adminAuth';
import ComingSoon from '@/pages/ComingSoon';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Index from './pages/Index';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Signup from './pages/Signup';
import FranchiseDashboard from './pages/FranchiseDashboard';
import FranchisePortal from './pages/FranchisePortal';
import StoreProfile from './pages/StoreProfile';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import DataDeletionPolicy from './pages/DataDeletionPolicy';
import EBillProduct from './pages/EBillProduct';
import CustomerAnalyticsProduct from './pages/CustomerAnalyticsProduct';
import MultiStoreProduct from './pages/MultiStoreProduct';
import CampaignsProduct from './pages/CampaignsProduct';
import TemplatesProduct from './pages/TemplatesProduct';
import FeedbacksProduct from './pages/FeedbacksProduct';
import CampaignProgress from './pages/CampaignProgress';
import DemoAccess from './pages/DemoAccess';
import AdminPanelLayout from './pages/AdminPanel/AdminPanelLayout';
import AdminOverviewPage from './pages/AdminPanel/AdminOverviewPage';
import AdminStoresPage from './pages/AdminPanel/AdminStoresPage';
import AdminStoreDetailsPage from './pages/AdminPanel/AdminStoreDetailsPage';
import AdminSettingsPage from './pages/AdminPanel/AdminSettingsPage';
import AdminLoginPage from './pages/AdminPanel/AdminLoginPage';
import AdminFranchiseDetailsPage from './pages/AdminPanel/AdminFranchiseDetailsPage';
import AdminWalletsPage from './pages/AdminPanel/AdminWalletsPage';
import AdminLeadsPage from './pages/AdminPanel/AdminLeadsPage';
import CatalogBrowser from './pages/CatalogBrowser';

const RequireAuth = ({ children }: { children: ReactElement }) => {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('bb_token') : null;

  if (!token) {
    const redirectFrom = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ from: redirectFrom }} />;
  }

  return children;
};

const RequireAdminAuth = ({ children }: { children: ReactElement }) => {
  const location = useLocation();
  const token = getAdminToken();

  if (!token) {
    const redirectFrom = `${location.pathname}${location.search}`;
    return <Navigate to="/admin/login" replace state={{ from: redirectFrom }} />;
  }

  return children;
};

const ScrollToHash = () => {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) {
      return;
    }
    const id = hash.replace('#', '');
    if (!id) {
      return;
    }
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    const scroll = () => {
      el.scrollIntoView({ behavior: 'auto', block: 'start' });
    };
    if (document.readyState === 'complete') {
      requestAnimationFrame(scroll);
      return;
    }
    window.addEventListener('load', scroll, { once: true });
    return () => window.removeEventListener('load', scroll);
  }, [hash, pathname]);

  return null;
};

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/franchise" element={<FranchiseDashboard />} />
        <Route path="/franchise/dashboard" element={<FranchisePortal />} />
        <Route path="/demo" element={<DemoAccess />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/analytics"
          element={
            <RequireAuth>
              <Analytics />
            </RequireAuth>
          }
        />
        <Route
          path="/campaigns/:campaignId/progress"
          element={
            <RequireAuth>
              <CampaignProgress />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <StoreProfile />
            </RequireAuth>
          }
        />
        <Route
          path="/contacts"
          element={
            <RequireAuth>
              <ContactsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/catalog"
          element={
            <RequireAuth>
              <CatalogBrowser />
            </RequireAuth>
          }
        />
        <Route
          path="/loyalty"
          element={
            <RequireAuth>
              {FEATURE_FLAGS.analytics.loyalty ? (
                <Navigate to="/analytics?tab=loyalty" replace />
              ) : (
                <ComingSoon featureName="Loyalty" />
              )}
            </RequireAuth>
          }
        />
        <Route
          path="/stores"
          element={
            <RequireAuth>
              {FEATURE_FLAGS.analytics.stores ? (
                <Navigate to="/analytics?tab=stores" replace />
              ) : (
                <ComingSoon featureName="Stores" />
              )}
            </RequireAuth>
          }
        />
        <Route
          path="/cdp"
          element={
            <RequireAuth>
              {FEATURE_FLAGS.analytics.cdp ? (
                <Navigate to="/analytics?tab=cdp" replace />
              ) : (
                <ComingSoon featureName="CDP" />
              )}
            </RequireAuth>
          }
        />
        {/* Product Pages */}
        <Route path="/products/ebill" element={<EBillProduct />} />
        <Route path="/products/analytics" element={<CustomerAnalyticsProduct />} />
        <Route path="/products/multi-store" element={<MultiStoreProduct />} />
        <Route path="/products/campaigns" element={<CampaignsProduct />} />
        <Route path="/products/templates" element={<TemplatesProduct />} />
        <Route path="/products/feedbacks" element={<FeedbacksProduct />} />

        {/* Admin Panel */}
        <Route
          path="/admin-panel"
          element={
            <RequireAdminAuth>
              <AdminPanelLayout />
            </RequireAdminAuth>
          }
        >
          <Route index element={<AdminOverviewPage stats={[]} />} />
          <Route path="stores" element={<AdminStoresPage />} />
          <Route path="stores/:storeId" element={<AdminStoreDetailsPage />} />
          <Route path="franchises/:franchiseId" element={<AdminFranchiseDetailsPage />} />
          <Route path="leads" element={<AdminLeadsPage />} />
          <Route path="wallets" element={<AdminWalletsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Legal Pages */}
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/data-deletion-policy" element={<DataDeletionPolicy />} />
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
import ContactsPage from './pages/Contacts';
