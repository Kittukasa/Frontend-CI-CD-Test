/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL;

  return {
    root: __dirname,
    server: {
      host: '::',
      port: 8080,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      minify: 'terser' as const,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary', 'html'],
        include: [
          'src/components/**',
          'src/lib/**',
          'src/utils/**',
          'src/config/**',
          'src/pages/NotFound.tsx',
          'src/pages/ComingSoon.tsx',
          'src/pages/PrivacyPolicy.tsx',
          'src/pages/TermsAndConditions.tsx',
          'src/pages/DemoAccess.tsx',
          'src/pages/Index.tsx',
          // Pages
          'src/pages/AdminPanel/**',
          'src/pages/Login.tsx',
          'src/pages/Campaigns.tsx',
          'src/pages/WhatsApp.tsx',
          'src/pages/WhatsAppCommerce.tsx',
          'src/pages/StoreProfile.tsx',
          'src/pages/FranchisePortal.tsx',
          'src/pages/FranchiseDashboard.tsx',
          'src/pages/Loyalty.tsx',
          'src/pages/Contacts.tsx',
          'src/pages/Customers.tsx',
          'src/pages/Invoices.tsx',
          'src/pages/Analytics.tsx',
          'src/pages/Automation.tsx',
          'src/pages/Signup.tsx',
          'src/pages/TemplateLibrary.tsx',
          // Low branch coverage pages
          'src/pages/DemoAccess.tsx',
          // Components with 0% or low coverage
          'src/components/templates/**',
          'src/components/skeletons/**',
          'src/components/ChatDrawer.tsx',
          'src/components/KPICards.tsx',
          'src/components/SessionMonitor.tsx',
          'src/components/admin/**',
          'src/components/layout/**',
          // Low branch coverage components
          'src/components/Footer.tsx',
          'src/components/modern/DashboardPreview.tsx',
          'src/components/modern/HowItWorksSteps.tsx',
          'src/components/modern/ModernCTA.tsx',
          'src/components/modern/FuturisticNavbar.tsx',
          'src/components/modern/ProblemSolutionFlow.tsx',
          'src/components/modern/VendorBenefits.tsx',
          // UI components with low branch/function coverage
          'src/components/ui/card.tsx',
          'src/components/ui/label.tsx',
          'src/components/ui/separator.tsx',
          'src/components/ui/use-toast.ts',
          'src/components/ui/toaster.tsx',
          'src/components/ui/toast.tsx',
          'src/components/ui/dialog.tsx',
          // Lib files with 0% coverage
          'src/lib/auth.ts',
          'src/lib/queryClient.ts',
          'src/lib/theme.ts',
          'src/lib/whatsappConfig.ts',
          'src/lib/customerTypes.ts',
          'src/lib/date.ts',
          // Utils with low coverage
          'src/utils/formatCurrency.ts',
          'src/utils/dateRanges.ts',
          'src/utils/adminAuth.ts',
          // Config with 0% functions
          'src/config/featureFlags.ts',
          // Services & node_modules
          'src/services/**',
          'node_modules/**',
        ],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  };
});
