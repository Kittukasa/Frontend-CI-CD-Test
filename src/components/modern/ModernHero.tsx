import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  Zap,
  TrendingUp,
  Users,
  Building2,
  FileText,
  MessageCircle,
} from 'lucide-react';

const ModernHero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <section
        className="relative min-h-[100svh] lg:min-h-screen flex items-center justify-center overflow-hidden pt-0 sm:pt-4 lg:pt-6"
        style={{ backgroundColor: '#0B1020' }}
      >
        {/* Maze Bank Breathing Light-Wave Aura Background */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ background: 'linear-gradient(180deg,#0B1020 0%,#0E1328 55%,#0B1020 100%)' }}
        >
          {/* Base breathing glow - White to soft pink luminous wave */}
          <div
            className="absolute right-[25%] top-[40%] w-[60rem] h-[60rem] rounded-full blur-[300px] animate-breath-glow mix-blend-screen"
            style={{
              background:
                'radial-gradient(circle at center, rgba(255, 255, 255, 0.25) 0%, rgba(255, 192, 203, 0.08) 60%, transparent 100%)',
            }}
          />

          {/* Subtle magenta tint overlay - Adds warmth and depth */}
          <div
            className="absolute right-[20%] top-[35%] w-[65rem] h-[65rem] rounded-full blur-[320px] animate-breath-glow-slow mix-blend-lighten"
            style={{
              background:
                'radial-gradient(circle at center, rgba(255, 102, 255, 0.08) 0%, rgba(11, 15, 29, 0) 70%)',
            }}
          />

          {/* Subtle grid pattern overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div
              className={`transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
              }`}
            >
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-6">
                <Zap className="w-4 h-4 text-blue-400 mr-2" />
                <span className="text-sm font-medium text-blue-300">
                  Transform Your Business Today
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
                <span className="block">
                  Turn Every
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {' '}
                    Bill{' '}
                  </span>
                  Into
                </span>
                <span className="block">an Endless Connection...</span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl lg:text-2xl text-gray-300 mb-4 leading-relaxed">
                The AI-powered platform that transforms paper bills into digital experiences,
                customer insights, and revenue growth for modern businesses.
              </p>

              {/* USP Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <div className="inline-flex items-center px-3 py-2 rounded-full bg-white/5 border border-white/15">
                  <FileText className="w-4 h-4 text-violet-300 mr-2" />
                  <span className="text-sm text-gray-200">Smart E-Bills</span>
                </div>
                <div className="inline-flex items-center px-3 py-2 rounded-full bg-white/5 border border-white/15">
                  <Building2 className="w-4 h-4 text-cyan-300 mr-2" />
                  <span className="text-sm text-gray-200">Multi-Store Analytics</span>
                </div>
                <div className="inline-flex items-center px-3 py-2 rounded-full bg-white/5 border border-white/15">
                  <MessageCircle className="w-4 h-4 text-fuchsia-300 mr-2" />
                  <span className="text-sm text-gray-200">WhatsApp Campaigns</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-8 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">100+</div>
                  <div className="text-sm text-gray-400">Businesses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">1M+</div>
                  <div className="text-sm text-gray-400">Bills Digitized</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">45%</div>
                  <div className="text-sm text-gray-400">Revenue Increase</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 group shadow-2xl shadow-blue-500/25"
                >
                  <Link to="/signup">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/20 text-white bg-white/5 hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 group"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
              </div>
            </div>

            {/* Right Visual - 3 Billbox Phone Interfaces */}
            <div
              className={`relative w-full flex items-center justify-center overflow-visible transition-all duration-1000 delay-300 ease-out ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
            >
              {/* Breathing Aura Layers */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute right-[35%] top-[20%] w-[600px] h-[600px] rounded-full blur-[170px] opacity-30 animate-hero-glow"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(255,255,255,0.25), rgba(255,192,203,0.08))',
                  }}
                />
                <div
                  className="absolute right-[25%] top-[30%] w-[500px] h-[500px] rounded-full blur-[200px] opacity-40 animate-hero-glow"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,102,255,0.08), transparent)',
                    animationDelay: '1s',
                  }}
                />
              </div>

              <div className="relative flex items-center justify-center h-full w-full">
                {/* Left Phone - Campaign Manager */}
                <div
                  className="absolute left-[6%] top-[10%] hidden md:block rotate-[-12deg] z-10 animate-phone-float"
                  style={{ animationDelay: '0.3s' }}
                >
                  <div className="w-[200px] md:w-[220px] lg:w-[240px] bg-gradient-to-br from-[#16192B] to-[#101425] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-20" />
                    <div className="pt-10 px-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white text-base font-bold">Today's Performance</h3>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                        <p className="text-gray-400 text-xs mb-1">Revenue</p>
                        <p className="text-3xl font-bold text-white">11.2L</p>
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 text-xs">+23% from yesterday</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                          <p className="text-gray-400 text-xs">Bills Sent</p>
                          <p className="text-white text-2xl font-bold">847</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                          <p className="text-gray-400 text-xs">Delivered</p>
                          <p className="text-emerald-400 text-2xl font-bold">832</p>
                        </div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                        <p className="text-gray-400 text-xs mb-2">Hourly Activity</p>
                        <div className="flex items-end gap-1 h-16">
                          {[30, 45, 60, 80, 65, 90, 75].map((h, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-gradient-to-t from-[#4E9FFF] to-[#37EDB2] rounded-t"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Peak: 7-9 PM</p>
                      </div>
                      <div className="text-center">
                        <span className="inline-block px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400 text-xs">
                          Live Analytics
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center Phone - Analytics Dashboard */}
                <div className="relative z-20 scale-100 sm:scale-105 animate-floatPhone w-[72vw] max-w-[320px] sm:w-[52vw] sm:max-w-[360px] lg:w-[30vw] lg:max-w-[320px]">
                  <div className="w-full bg-gradient-to-br from-[#16192B] to-[#101425] rounded-[3rem] border-[3px] border-white/15 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-[2rem] z-30" />
                    <div className="relative pt-10 px-6 pb-4 bg-gradient-to-b from-[#1F2437] to-transparent">
                      <div className="flex items-center justify-between text-white/60 text-xs">
                        <span>9:41 AM</span>
                        <div className="flex items-center gap-1">
                          <span>87%</span>
                          <div className="w-4 h-3 border border-white/40 rounded-sm relative">
                            <div className="absolute inset-0 w-2/3 bg-white/60" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">A</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">Pharmacy</p>
                          <p className="text-gray-400 text-xs">Via Billbox › Just now</p>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 text-xs font-semibold">
                          Delivered on WhatsApp
                        </span>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">Invoice</span>
                          <span className="text-white/80 font-mono text-xs">#INV-4321</span>
                        </div>
                        <div className="text-center py-3">
                          <p className="text-gray-400 text-xs mb-1">Amount Paid</p>
                          <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            1842.00
                          </p>
                          <div className="flex items-center justify-center gap-1.5 mt-1.5">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                            <span className="text-green-400 text-xs">Payment Confirmed</span>
                          </div>
                        </div>
                        <div className="border-t border-white/10 pt-2 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Items</span>
                            <span className="text-white">5 products</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Date</span>
                            <span className="text-white">Nov 10, 2025</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-3 border border-purple-500/20">
                        <p className="text-white/90 text-xs text-center">
                          Thank you for shopping!
                          <br />
                          Your digital bill is ready.
                        </p>
                      </div>
                      <div className="space-y-2.5">
                        <button className="w-full py-3 rounded-xl border-2 border-[#25D366]/50 text-[#25D366] font-semibold text-sm flex items-center justify-center gap-2">
                          Download Bill
                        </button>
                        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4E9FFF] to-[#37EDB2] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg">
                          View Offers
                        </button>
                      </div>
                      <div className="flex items-center justify-center gap-3 text-xs text-gray-500 pt-1">
                        <span>0.8s</span>
                        <span></span>
                        <span>Read</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Phone - E-Bill Delivery */}
                <div
                  className="absolute right-[6%] top-[10%] hidden md:block rotate-[12deg] z-10 animate-phone-float"
                  style={{ animationDelay: '0.6s' }}
                >
                  <div className="w-[200px] md:w-[220px] lg:w-[240px] bg-gradient-to-br from-[#181A2D] to-[#0E1120] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-20" />
                    <div className="pt-10 px-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white text-base font-bold">Campaign Results</h3>
                        <div className="px-2 py-0.5 bg-[#FF5CDE]/20 border border-[#FF5CDE]/30 rounded-full">
                          <span className="text-[#FF5CDE] text-xs">Live</span>
                        </div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-2">
                        <p className="text-white text-sm font-semibold">Diwali Offer Blast</p>
                        <div className="flex justify-between text-xs">
                          <div>
                            <p className="text-gray-400">Sent</p>
                            <p className="text-blue-400 font-bold text-lg">2,400</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Delivered</p>
                            <p className="text-green-400 font-bold text-lg">2,120</p>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full w-[88%] bg-gradient-to-r from-blue-500 to-green-500 rounded-full" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                          <p className="text-gray-400 text-xs">Read Rate</p>
                          <p className="text-cyan-400 text-2xl font-bold">76%</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                          <p className="text-gray-400 text-xs">Orders</p>
                          <p className="text-emerald-400 text-2xl font-bold">312</p>
                        </div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">Revenue Impact</span>
                          <span className="text-white text-sm font-bold">142,680</span>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <p className="text-gray-400 text-xs">
                          Template: <span className="text-white">Festive_Sale_2025</span>
                        </p>
                      </div>
                      <div className="flex justify-center pt-2">
                        <span className="inline-block px-3 py-1 bg-[#FF5CDE]/20 border border-[#FF5CDE]/30 rounded-full text-[#FF5CDE] text-xs font-semibold">
                          Rewards &amp; Coupons Campaign Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Divider to next section (preview) */}
      <div className="relative mt-6" style={{ backgroundColor: '#0E1328' }}>
        <div className="mx-auto max-w-6xl px-4 md:px-8 flex flex-col items-center gap-3 text-center py-6">
          <div
            role="heading"
            tabIndex={0}
            className="font-semibold text-[18px] text-white"
            style={{ fontFamily: 'area-variable, sans-serif' }}
          >
            Trusted by <span style={{ color: '#FFFFFF' }}>100+</span> Billing Businesses
          </div>
          <div className="w-full rounded-xl border border-white/10 bg-[#141A33]">
            <div className="overflow-hidden">
              <div className="flex gap-10 sm:gap-12 min-w-max items-center justify-center animate-[hero-marquee_26s_linear_infinite] hover:[animation-play-state:paused] px-8 py-4 md:py-5">
                {Array.from({ length: 2 }).flatMap((_, loopIdx) =>
                  [
                    'logo1.png',
                    'logo2.png',
                    'logo3.png',
                    'logo4.png',
                    'logo5.png',
                    'logo6.png',
                    'logo7.png',
                    'logo8.png',
                    'logo9.png',
                    'logo10.png',
                  ].map((file, idx) => (
                    <div
                      key={`${loopIdx}-${file}-${idx}`}
                      className="flex items-center justify-center"
                    >
                      <img
                        src={`/logos/${file}`}
                        alt="Trusted brand logo"
                        className="h-16 sm:h-18 md:h-20 w-auto object-contain opacity-95"
                        loading="lazy"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModernHero;
