import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Zap, BarChart3, Users, Eye, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const FuturisticNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { role, token, setRole, setToken } = useAuth();
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = () => {
    setRole("");
    setToken(null);
    navigate('/');
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const navItems = [
    { label: 'Features', action: () => scrollToSection('vendor-benefits'), icon: Zap },
    { label: 'How It Works', action: () => scrollToSection('how-it-works'), icon: BarChart3 },
    { label: 'Dashboard Demo', action: () => scrollToSection('dashboard-preview'), icon: Eye },
    { label: 'Customers', action: () => scrollToSection('trusted-vendors'), icon: Users },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/20' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Billbox
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={item.action}
                    className="group flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white transition-all duration-300 hover:bg-white/5 hover:backdrop-blur-sm"
                  >
                    <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              
              <button
                onClick={() => scrollToSection('modern-cta')}
                className="px-4 py-2 rounded-xl text-gray-300 hover:text-white transition-all duration-300 hover:bg-white/5 font-medium"
              >
                Pricing
              </button>
            </div>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              {role && token ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300 text-sm">Welcome back</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium"
                  >
                    Log in
                  </Button>
                  <Button
                    onClick={() => navigate('/signup')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 group shadow-lg shadow-blue-500/25"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsMobileMenuOpen(false)} />
          
          {/* Mobile Menu Content */}
          <div className="fixed top-20 left-0 right-0 bg-gradient-to-b from-slate-900/95 to-black/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
            <div className="container mx-auto px-6 py-8">
              {/* Mobile Navigation Items */}
              <div className="space-y-4 mb-8">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={item.action}
                      className="w-full flex items-center space-x-4 p-4 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-lg">{item.label}</span>
                    </button>
                  );
                })}
                
                <button
                  onClick={() => scrollToSection('modern-cta')}
                  className="w-full flex items-center space-x-4 p-4 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-lg">Pricing</span>
                </button>
              </div>

              {/* Mobile Auth Buttons */}
              <div className="space-y-4 pt-8 border-t border-white/10">
                {role && token ? (
                  <div className="space-y-4">
                    <div className="text-center text-gray-300">Welcome back</div>
                    <Button
                      onClick={handleSignOut}
                      variant="ghost"
                      className="w-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 py-3"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        navigate('/login');
                        setIsMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 py-3"
                    >
                      Log in
                    </Button>
                    <Button
                      onClick={() => {
                        navigate('/signup');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25"
                    >
                      Start Free Trial
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FuturisticNavbar;
