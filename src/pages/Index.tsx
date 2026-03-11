import { GlobalNavbar } from '@/components/layout/GlobalNavbar';
import ModernHero from '@/components/modern/ModernHero';
import ProblemSolutionFlow from '@/components/modern/ProblemSolutionFlow';
import VendorBenefits from '@/components/modern/VendorBenefits';
import DashboardPreview from '@/components/modern/DashboardPreview';
import HowItWorksSteps from '@/components/modern/HowItWorksSteps';
import ModernCTA from '@/components/modern/ModernCTA';
import Footer from '@/components/Footer';

const Index = () => {
  const whatsappNumber = '918008407999';
  const whatsappMessage = 'Hi! I am interested in Billbox. Please share more details.';
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <div className="min-h-screen">
      <GlobalNavbar />
      <ModernHero />
      <ProblemSolutionFlow />
      <VendorBenefits />
      <DashboardPreview />
      <HowItWorksSteps />
      <ModernCTA />
      <Footer />
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="group fixed bottom-6 right-6 z-50 inline-flex h-15 w-15 items-center justify-center transition-transform hover:scale-[1.06] md:h-16 md:w-16"
      >
        <span className="pointer-events-none absolute inset-0 rounded-[20px] bg-emerald-400/15 blur-[14px] transition-all duration-200 group-hover:bg-emerald-400/25 group-hover:blur-[18px]" />
        <span className="pointer-events-none absolute inset-0 rounded-[20px] shadow-[0_18px_38px_rgba(2,6,23,0.55)] transition-all duration-200 group-hover:shadow-[0_22px_44px_rgba(2,6,23,0.65)]" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          className="relative h-15 w-15 drop-shadow-[0_10px_24px_rgba(16,185,129,0.25)] md:h-16 md:w-16"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="wa-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#25D366" />
              <stop offset="100%" stopColor="#1DB954" />
            </linearGradient>
          </defs>
          <rect x="16" y="16" width="224" height="224" rx="48" fill="url(#wa-bg)" />
          <path
            fill="#FFFFFF"
            d="M128 58c-38.7 0-70 31.3-70 70 0 12.3 3.2 24 9.2 34.4L58 198l36.2-9c9.9 5.4 21.1 8.3 32.6 8.3h.1c38.7 0 70-31.3 70-70 0-18.8-7.3-36.4-20.6-49.7C164.4 65.3 146.8 58 128 58zm0 126c-10.6 0-20.9-2.9-29.9-8.4l-2.1-1.2-21.5 5.4 5.7-20.9-1.3-2.2C72.5 148.9 69 138.6 69 128c0-32.6 26.4-59 59-59 15.8 0 30.6 6.1 41.8 17.2 11.2 11.2 17.2 26 17.2 41.8 0 32.6-26.4 59-59 59z"
          />
          <path
            fill="#FFFFFF"
            d="M163.9 143.5c-1.9-.9-11.2-5.5-12.9-6.1-1.7-.6-2.9-.9-4.1.9-1.2 1.7-4.7 6.1-5.8 7.4-1.1 1.3-2.1 1.4-4 0.5-1.9-.9-8-3-15.3-9.6-5.6-5-9.3-11.2-10.4-13.1-1.1-1.9-0.1-2.9 0.8-3.8 0.8-0.8 1.9-2.1 2.9-3.1 1-1.2 1.3-2.1 1.9-3.4 0.6-1.3 0.3-2.6-0.1-3.7-0.4-0.9-4.1-9.8-5.6-13.4-1.5-3.6-3-3.1-4.1-3.2-1.1-0.1-2.4-0.1-3.7-0.1s-3.4 0.5-5.2 2.6c-1.7 2.1-6.7 6.6-6.7 16 0 9.4 6.8 18.5 7.7 19.7 0.9 1.2 13.3 20.3 32.3 28.5 4.5 1.9 8 3.1 10.7 4 4.5 1.4 8.6 1.2 11.8 0.7 3.6-0.5 11.2-4.6 12.7-9.1 1.5-4.5 1.5-8.3 1.1-9.1-0.5-0.7-1.7-1.2-3.6-2.1z"
          />
        </svg>
      </a>
    </div>
  );
};

export default Index;
