// Global navbar for landing page
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BillboxLogo } from '@/components/common/BillboxLogo';
import {
  Menu,
  X,
  ChevronDown,
  Gift,
  Building2,
  Database,
  BrainCircuit,
  Zap,
  MessageSquare,
  Megaphone,
  Star,
  ShoppingCart,
  Pill,
  Coffee,
  Shirt,
  Monitor,
  Scissors,
  Network,
  FileText,
  BarChart3,
  Bot,
  Rocket,
} from 'lucide-react';

interface GlobalNavbarProps {
  className?: string;
}

export function GlobalNavbar({ className }: GlobalNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const products = [
    {
      icon: FileText,
      name: 'E-Bill',
      description: 'Digitize every printed bill and send it instantly via WhatsApp, SMS, or Email.',
      href: '/products/ebill',
    },
    {
      icon: BarChart3,
      name: 'Customer Analytics',
      description:
        'Track customer behavior, spending patterns, and new vs. returning visits — all in one dashboard.',
      href: '/products/analytics',
    },
    {
      icon: Building2,
      name: 'Multi-Store Management',
      description: 'Compare performance and revenue across all locations from a unified dashboard.',
      href: '/products/multi-store',
    },
    {
      icon: Megaphone,
      name: 'Campaigns',
      description:
        'Create and send targeted promotions across WhatsApp, SMS, and Email effortlessly.',
      href: '/products/campaigns',
    },
    {
      icon: MessageSquare,
      name: 'Pre-Defined Templates',
      description:
        'Access 1000+ pre-approved message templates for offers, promotions, and reminders.',
      href: '/products/templates',
    },
    {
      icon: Star,
      name: 'Feedbacks',
      description:
        'Collect real-time customer reviews and insights directly through e-bills or WhatsApp links.',
      href: '/products/feedbacks',
    },
  ];

  const comingSoonProducts = [
    {
      icon: Database,
      name: 'CDP+ (Customer Data Platform Plus)',
      description:
        'A unified platform to consolidate, segment, and activate customer data in real time.',
      href: '/#products/cdp',
    },
    {
      icon: Gift,
      name: 'Rewards & Coupons',
      description:
        'Reward returning customers with cashback, points, and exclusive perks — automatically.',
      href: '/#products/rewards-coupons',
    },
    {
      icon: Bot,
      name: 'AI Features',
      description: 'AI-powered insights and campaign automation that drive smarter growth.',
      href: '/#products/ai',
    },
  ];

  const solutions = [
    {
      icon: ShoppingCart,
      name: 'Retail & Supermarkets',
      description:
        'Automate e-bills, rewards & coupons, and customer insights for chain stores and franchises.',
      href: '/#solutions/retail',
    },
    {
      icon: Pill,
      name: 'Pharmacies & Healthcare',
      description:
        'Send digital bills, refill reminders, and health campaign updates via WhatsApp.',
      href: '/#solutions/pharmacy',
    },
    {
      icon: Coffee,
      name: 'Restaurants & Cafes',
      description:
        'Replace printed bills with WhatsApp receipts, run table-specific offers, and gather reviews.',
      href: '/#solutions/restaurants',
    },
    {
      icon: Shirt,
      name: 'Fashion & Lifestyle Stores',
      description:
        'Track premium customers, launch festive sales, and reward repeat visits with rewards & coupons.',
      href: '/#solutions/fashion',
    },
    {
      icon: Monitor,
      name: 'Electronics & Appliances',
      description: 'Manage warranties, send digital invoices, and promote extended service offers.',
      href: '/#solutions/electronics',
    },
    {
      icon: Scissors,
      name: 'Salons & Wellness Centers',
      description:
        'Automate appointment reminders, rewards & coupons cashback, and feedback collection.',
      href: '/#solutions/salons',
    },
    {
      icon: Network,
      name: 'Franchise Chains & Multi-Store Brands',
      description:
        'Get unified analytics, chain-wide campaign tools, and region-level growth tracking.',
      href: '/#solutions/franchise',
    },
  ];

  const navLinks = [
    { label: 'Products', href: '/#products', hasDropdown: true, dropdownType: 'products' },
    { label: 'Solutions', href: '/#solutions', hasDropdown: true, dropdownType: 'solutions' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Contact', href: '/#contact' },
  ];

  const scrollToContact = () => {
    if (typeof window === 'undefined') {
      return;
    }
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-lg'
            : 'bg-gradient-to-b from-black/80 to-transparent backdrop-blur-md',
          className
        )}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 lg:h-20 items-center justify-between gap-6">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-6 lg:gap-10">
              <Link to="/" className="flex items-center z-50">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center"
                >
                  <BillboxLogo />
                </motion.div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
                {navLinks.map(link => (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => {
                      if (link.dropdownType === 'products') setProductsDropdownOpen(true);
                      if (link.dropdownType === 'solutions') setSolutionsDropdownOpen(true);
                    }}
                    onMouseLeave={() => {
                      if (link.dropdownType === 'products') setProductsDropdownOpen(false);
                      if (link.dropdownType === 'solutions') setSolutionsDropdownOpen(false);
                    }}
                  >
                    {link.hasDropdown ? (
                      <button className="relative px-4 py-2 text-sm lg:text-base font-medium text-white/70 hover:text-white transition-colors group flex items-center gap-1">
                        {link.label}
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            link.dropdownType === 'products' &&
                              productsDropdownOpen &&
                              'rotate-180',
                            link.dropdownType === 'solutions' &&
                              solutionsDropdownOpen &&
                              'rotate-180'
                          )}
                        />
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 group-hover:w-full transition-all duration-300" />
                      </button>
                    ) : (
                      <Link
                        to={link.href}
                        onClick={event => {
                          if (link.label === 'Contact') {
                            event.preventDefault();
                            scrollToContact();
                          }
                        }}
                        className="relative px-4 py-2 text-sm lg:text-base font-medium text-white/70 hover:text-white transition-colors group"
                      >
                        {link.label}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 group-hover:w-full transition-all duration-300" />
                      </Link>
                    )}

                    {/* Products Dropdown */}
                    {link.hasDropdown && link.dropdownType === 'products' && (
                      <AnimatePresence>
                        {productsDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 top-full mt-2 w-[600px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
                          >
                            {/* Dropdown Content - Bento Grid Layout */}
                            <div className="p-6">
                              <div className="flex gap-4">
                                {/* Left Grid - Main Products (Bento Style) */}
                                <div className="flex-1">
                                  <div className="grid grid-cols-2 gap-3">
                                    {products.map((product, index) => {
                                      const Icon = product.icon;
                                      // Create dynamic spanning for bento effect
                                      const spanClass = index === 0 ? 'col-span-2' : '';

                                      return (
                                        <Link
                                          key={index}
                                          to={product.href}
                                          className={cn(
                                            'group p-4 rounded-xl hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl border border-gray-100 bg-white',
                                            spanClass
                                          )}
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-md">
                                              <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <h4 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-cyan-600 transition-colors">
                                                {product.name}
                                              </h4>
                                              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                {product.description}
                                              </p>
                                            </div>
                                          </div>
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Right Grid - Coming Soon (Light & Highlighted Theme) */}
                                <div className="w-48 flex-shrink-0">
                                  <div className="relative">
                                    {/* Coming Soon Badge */}
                                    <div className="absolute -top-2 -right-2 z-10">
                                      <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                                        <Rocket className="w-3 h-3" />
                                        <span>COMING SOON</span>
                                      </div>
                                    </div>

                                    {/* Coming Soon Cards - Bright & Highlighted */}
                                    <div className="space-y-3 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200 shadow-lg">
                                      {comingSoonProducts.map((product, index) => {
                                        const Icon = product.icon;
                                        // Gradient colors for each card
                                        const gradients = [
                                          'from-blue-400 to-cyan-500',
                                          'from-purple-400 to-pink-500',
                                          'from-orange-400 to-red-500',
                                        ];
                                        return (
                                          <div
                                            key={index}
                                            className="group p-3 rounded-lg bg-white border-2 border-purple-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-not-allowed"
                                          >
                                            <div className="flex flex-col gap-2">
                                              <div className="flex items-center gap-2">
                                                <div
                                                  className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br ${gradients[index]} rounded-lg flex items-center justify-center shadow-md`}
                                                >
                                                  <Icon className="w-4 h-4 text-white" />
                                                </div>
                                                <h4 className="font-bold text-gray-800 text-xs leading-tight">
                                                  {product.name}
                                                </h4>
                                              </div>
                                              <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-3 font-medium">
                                                {product.description}
                                              </p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}

                    {/* Solutions Dropdown */}
                    {link.hasDropdown && link.dropdownType === 'solutions' && (
                      <AnimatePresence>
                        {solutionsDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 top-full mt-2 w-[600px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
                          >
                            {/* Dropdown Content */}
                            <div className="p-6">
                              <div className="mb-4">
                                <h3 className="text-sm font-semibold text-violet-600 uppercase tracking-wide">
                                  Industry Solutions
                                </h3>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {solutions.map((solution, index) => {
                                  const Icon = solution.icon;
                                  return (
                                    <Link
                                      key={index}
                                      to={solution.href}
                                      className="group p-3 rounded-lg hover:bg-gradient-to-br hover:from-violet-50 hover:to-purple-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                          <Icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-semibold text-gray-900 text-sm mb-0.5 group-hover:text-violet-600 transition-colors">
                                            {solution.name}
                                          </h4>
                                          <p className="text-xs text-gray-600 line-clamp-2">
                                            {solution.description}
                                          </p>
                                        </div>
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Bottom CTA */}
                            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                              <Link
                                to="/#solutions"
                                className="text-sm font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-2 group"
                              >
                                View all solutions
                                <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - CTA & Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Desktop CTA Buttons */}
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm lg:text-base font-medium text-white/80 border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Sign Up
                </Link>
                <div
                  className="relative"
                  onMouseEnter={() => setLoginMenuOpen(true)}
                  onMouseLeave={() => setLoginMenuOpen(false)}
                >
                  <button
                    onClick={() => setLoginMenuOpen(prev => !prev)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm lg:text-base font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                  >
                    Login
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        loginMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {loginMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-white/95 shadow-2xl backdrop-blur px-2 py-2 text-sm text-gray-900"
                      >
                        <Link
                          to="/login"
                          onClick={() => setLoginMenuOpen(false)}
                          className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 font-semibold text-gray-800 hover:bg-gray-100"
                        >
                          Store Login
                          <span className="text-xs font-normal text-gray-500">POS / Staff</span>
                        </Link>
                        <Link
                          to="/franchise"
                          onClick={() => setLoginMenuOpen(false)}
                          className="mt-1 flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 font-semibold text-gray-800 hover:bg-gray-100"
                        >
                          Owner Login
                          <span className="text-xs font-normal text-gray-500">Franchise</span>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-black/95 backdrop-blur-xl border-l border-white/10 z-50 md:hidden overflow-y-auto"
            >
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <BillboxLogo />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Mobile Navigation Links */}
                <div className="flex-1 px-6 py-8 space-y-2">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {link.hasDropdown ? (
                        <div className="space-y-2">
                          {/* Accordion Header */}
                          <button
                            onClick={() => {
                              if (link.dropdownType === 'products')
                                setMobileProductsOpen(!mobileProductsOpen);
                              if (link.dropdownType === 'solutions')
                                setMobileSolutionsOpen(!mobileSolutionsOpen);
                            }}
                            className="flex items-center justify-between w-full px-4 py-3 text-lg font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          >
                            {link.label}
                            <ChevronDown
                              className={cn(
                                'w-5 h-5 transition-transform duration-200',
                                link.dropdownType === 'products' &&
                                  mobileProductsOpen &&
                                  'rotate-180',
                                link.dropdownType === 'solutions' &&
                                  mobileSolutionsOpen &&
                                  'rotate-180'
                              )}
                            />
                          </button>

                          {/* Products Accordion Content */}
                          <AnimatePresence>
                            {link.dropdownType === 'products' && mobileProductsOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pl-4 space-y-1 pt-2">
                                  {/* Current Products */}
                                  {products.map((product, idx) => {
                                    const Icon = product.icon;
                                    return (
                                      <Link
                                        key={idx}
                                        to={product.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
                                      >
                                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                                          <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-white text-sm mb-0.5">
                                            {product.name}
                                          </h4>
                                          <p className="text-xs text-white/60 line-clamp-2">
                                            {product.description}
                                          </p>
                                        </div>
                                      </Link>
                                    );
                                  })}

                                  {/* Coming Soon Section */}
                                  <div className="pt-3 mt-3 border-t border-white/10">
                                    <div className="flex items-center gap-2 px-3 mb-2">
                                      <span className="text-xs font-semibold text-white/40 uppercase tracking-wide">
                                        Coming Soon
                                      </span>
                                      <Rocket className="w-3 h-3 text-white/30" />
                                    </div>
                                    {comingSoonProducts.map((product, idx) => {
                                      const Icon = product.icon;
                                      return (
                                        <div
                                          key={idx}
                                          className="flex items-start gap-3 px-3 py-2.5 rounded-lg opacity-50 cursor-not-allowed"
                                        >
                                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-white/20 to-white/10 rounded-lg flex items-center justify-center">
                                            <Icon className="w-4 h-4 text-white/60" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-white/70 text-sm mb-0.5 italic">
                                              {product.name}
                                            </h4>
                                            <p className="text-xs text-white/50 line-clamp-2 italic">
                                              {product.description}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Solutions Accordion Content */}
                          <AnimatePresence>
                            {link.dropdownType === 'solutions' && mobileSolutionsOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pl-4 space-y-1 pt-2">
                                  {solutions.map((solution, idx) => {
                                    const Icon = solution.icon;
                                    return (
                                      <Link
                                        key={idx}
                                        to={solution.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
                                      >
                                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                                          <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-white text-sm mb-0.5">
                                            {solution.name}
                                          </h4>
                                          <p className="text-xs text-white/60 line-clamp-2">
                                            {solution.description}
                                          </p>
                                        </div>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <Link
                          to={link.href}
                          onClick={event => {
                            if (link.label === 'Contact') {
                              event.preventDefault();
                              scrollToContact();
                            }
                            setMobileMenuOpen(false);
                          }}
                          className="block px-4 py-3 text-lg font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        >
                          {link.label}
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Mobile CTA Buttons */}
                <div className="p-6 border-t border-white/10 space-y-3">
                  <div className="grid gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full px-4 py-3 text-center text-base font-medium text-white border border-white/30 rounded-lg hover:bg-white/5 transition-all"
                    >
                      Store Login
                    </Link>
                    <Link
                      to="/franchise"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full px-4 py-3 text-center text-base font-medium text-white border border-white/30 rounded-lg hover:bg-white/5 transition-all"
                    >
                      Owner Login
                    </Link>
                  </div>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center text-base font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25"
                  >
                    Start Free Trial
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center text-base font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    Login
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
